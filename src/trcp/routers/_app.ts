import { credentialsRouter } from "@/features/credentials/server/routers";
import { workflowsRouter } from "@/features/workflows/server/routers";
import { inngest } from "@/inngest/client";
import { createTRPCRouter, premiumProcedure } from "../init";

export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
  credentials: credentialsRouter,
  // Kept from the AI-provider chapter: queues the Gemini demo job. No button calls it for now.
  testAi: premiumProcedure.mutation(async () => {
    await inngest.send({
      name: "execute/ai",
    });
    return { success: true, message: "job queued" };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
