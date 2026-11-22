import { TRPCError } from "@trpc/server";
import type { Edge, Node } from "@xyflow/react";
import { getClientSubscriptionToken } from "inngest/react";
import { generateSlug } from "random-word-slugs";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@/generated/prisma/enums";
import { WORKFLOW_CHANNEL_TOPICS, workflowChannel } from "@/inngest/channels";
import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { signWorkflowWebhook } from "@/lib/webhook-token";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trcp/init";

export const workflowsRouter = createTRPCRouter({
  // A short-lived token that lets the browser listen to the live updates of one
  // workflow. Only the owner of the workflow gets one, and it only works for
  // that workflow's channel.
  realtimeToken: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: { id: true },
      });

      return getClientSubscriptionToken(inngest, {
        channel: workflowChannel(input.id),
        topics: [...WORKFLOW_CHANNEL_TOPICS],
      });
    }),
  // The webhook address for the Google Form trigger. It contains a secret token,
  // so only the owner of the workflow gets it.
  googleFormWebhook: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: { id: true },
      });

      const configured = process.env.NEXT_PUBLIC_APP_URL;
      const baseUrl = (configured || "http://localhost:3000").replace(
        /\/+$/,
        "",
      );
      const token = signWorkflowWebhook(input.id);

      return {
        url: `${baseUrl}/api/webhooks/google-form?workflowId=${encodeURIComponent(input.id)}&token=${token}`,
        // Google can only reach a public address, not localhost.
        isPublic: !!configured && !/localhost|127\.0\.0\.1/.test(configured),
      };
    }),
  // Starts a background run of a workflow that belongs to the current user.
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      await inngest.send({
        name: "workflows/execute.workflow",
        data: { workflowId: input.id },
      });

      return workflow;
    }),
  create: premiumProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3),
        userId: ctx.auth.user.id,
        // Every new workflow starts with the "add your first step" placeholder.
        nodes: {
          create: {
            type: NodeType.INITIAL,
            position: { x: 0, y: 0 },
            name: NodeType.INITIAL,
          },
        },
      },
    });
  }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });
    }),
  // Replaces the workflow's whole canvas (nodes and connections) in one transaction.
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            // Only known node types can be saved.
            type: z.enum(NodeType),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;

      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id, userId: ctx.auth.user.id },
      });

      const nodeIds = new Set(nodes.map((node) => node.id));
      if (nodeIds.size !== nodes.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicate node ids",
        });
      }

      // Connections must join nodes that are part of this same save.
      if (edges.some((e) => !nodeIds.has(e.source) || !nodeIds.has(e.target))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A connection points to a node that does not exist",
        });
      }

      // The same pair of handles can only be connected once.
      const uniqueEdges = [
        ...new Map(
          edges.map((edge) => [
            `${edge.source}|${edge.target}|${edge.sourceHandle}|${edge.targetHandle}`,
            edge,
          ]),
        ).values(),
      ];

      return await prisma.$transaction(async (tx) => {
        // Delete existing nodes (their connections are deleted with them)
        await tx.node.deleteMany({
          where: { workflowId: id },
        });

        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type,
            type: node.type,
            position: node.position,
            data: node.data || {},
          })),
        });

        await tx.connection.createMany({
          data: uniqueEdges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });

        // Bump the workflow's updatedAt
        await tx.workflow.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        return workflow;
      });
    }),
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { name: input.name },
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Throws when the workflow does not exist or belongs to someone else.
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        include: { nodes: true, connections: true },
      });

      // Convert database nodes to React Flow nodes
      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number },
        data: (node.data as Record<string, unknown>) || {},
      }));

      // Convert database connections to React Flow edges
      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      };
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const where = {
        userId: ctx.auth.user.id,
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      };

      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.workflow.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }),
});
