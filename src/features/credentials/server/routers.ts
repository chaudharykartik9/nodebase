import { TRPCError } from "@trpc/server";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { CredentialType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trcp/init";

// The saved key (`value`) is never selected, so it can never reach the browser.
// Only the server-side executors read it, and they decrypt it right before use.
const publicFields = {
  id: true,
  name: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const;

const nameSchema = z.string().trim().min(1, "Name is required").max(100);
const typeSchema = z.enum(CredentialType);
// An API key is a short text. The limit only stops absurd input.
const valueSchema = z.string().trim().min(1, "API key is required").max(2000);

export const credentialsRouter = createTRPCRouter({
  create: premiumProcedure
    .input(z.object({ name: nameSchema, type: typeSchema, value: valueSchema }))
    .mutation(({ ctx, input }) => {
      return prisma.credential.create({
        data: {
          name: input.name,
          type: input.type,
          value: encrypt(input.value),
          userId: ctx.auth.user.id,
        },
        select: publicFields,
      });
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Throws when the credential does not exist or belongs to someone else.
      await prisma.credential.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: { id: true },
      });

      return prisma.credential.delete({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: publicFields,
      });
    }),
  // `value` is optional: leaving it out keeps the saved key, so editing a name
  // never needs the key (which the browser does not have).
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: nameSchema,
        type: typeSchema,
        value: valueSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.credential.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: { type: true },
      });

      // A key for one provider is useless for another one.
      if (input.type !== existing.type && !input.value) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Enter the new API key when you change the provider",
        });
      }

      return prisma.credential.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: {
          name: input.name,
          type: input.type,
          ...(input.value ? { value: encrypt(input.value) } : {}),
        },
        select: publicFields,
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.credential.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        select: publicFields,
      });
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
        prisma.credential.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where,
          orderBy: { updatedAt: "desc" },
          select: publicFields,
        }),
        prisma.credential.count({ where }),
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
  // Feeds the credential dropdown of the AI nodes (names only).
  getByType: protectedProcedure
    .input(z.object({ type: typeSchema }))
    .query(({ ctx, input }) => {
      return prisma.credential.findMany({
        where: { type: input.type, userId: ctx.auth.user.id },
        select: { id: true, name: true },
        orderBy: { updatedAt: "desc" },
      });
    }),
});
