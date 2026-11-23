import z from "zod";
import { PAGINATION } from "@/config/constants";
import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trcp/init";

export const executionsRouter = createTRPCRouter({
  // An execution belongs to a workflow, so it is scoped to the user through the
  // workflow's owner. Someone else's execution is "not found", never returned.
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.execution.findFirstOrThrow({
        where: { id: input.id, workflow: { userId: ctx.auth.user.id } },
        include: { workflow: { select: { id: true, name: true } } },
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;
      const where = { workflow: { userId: ctx.auth.user.id } };

      const [items, totalCount] = await Promise.all([
        prisma.execution.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where,
          orderBy: { startedAt: "desc" },
          // The list does not need the (possibly large) output or the stack.
          select: {
            id: true,
            status: true,
            error: true,
            startedAt: true,
            completedAt: true,
            workflow: { select: { id: true, name: true } },
          },
        }),
        prisma.execution.count({ where }),
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
