import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "../init";

export const appRouter = createTRPCRouter({
  getWorkFlows: protectedProcedure.query(({ ctx }) => {
    return prisma.workflow.findMany({
      where: {
        userId: ctx.auth.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
  createWorkflow: protectedProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: "test-workflow",
        userId: ctx.auth.user.id,
      },
    });
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
