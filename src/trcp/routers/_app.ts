import { inngest } from "@/inngest/client";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/db";

export const appRouter = createTRPCRouter({
  getWorkflow: protectedProcedure.query(() => {
    return prisma.workflow.findMany();
  }),
  createWorkflow: protectedProcedure.mutation(async ({ ctx }) => {
    // Queues a background job; the Inngest function creates the workflow.
    await inngest.send({
      name: "app/task.created",
      data: { id: crypto.randomUUID(), userId: ctx.auth.user.id },
    });
    return { success: true, message: "job queued" };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
