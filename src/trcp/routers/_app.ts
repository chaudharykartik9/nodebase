import { inngest } from "@/inngest/client";
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
  // Temporary (T07): sends a test event to Inngest to prove background jobs work.
  testInngest: protectedProcedure.mutation(async ({ ctx }) => {
    await inngest.send({
      name: "test/hello.world",
      data: { email: ctx.auth.user.email },
    });
    return { success: true };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
