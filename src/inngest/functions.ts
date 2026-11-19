import { inngest } from "./client";

/**
 * Demo background job (T07). Proves the pipeline works:
 * event -> Inngest -> our /api/inngest route -> this function.
 * Replaced by the real `execute-workflow` function in T14.
 */
export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [{ event: "test/hello.world" }],
  },
  async ({ event, step }) => {
    // Durable pause: Inngest resumes the function later, nothing blocks our server.
    await step.sleep("wait-a-moment", "2s");

    // Each step runs (and is retried) on its own; its result is saved.
    const message = await step.run("build-message", async () => {
      const who = event.data?.email ?? "world";
      return `Hello, ${who}!`;
    });

    return { message };
  },
);

// Every function must be listed here so the /api/inngest route can serve it.
export const functions = [helloWorld];
