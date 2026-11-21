import { inngest } from "@/inngest/client";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "../init";
import prisma from "@/lib/db";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const appRouter = createTRPCRouter({
  testAi: premiumProcedure.mutation(async () => {
    await inngest.send({
      name :"execute/ai"})
   return { success: true, message: "job queued" };
  }),
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
