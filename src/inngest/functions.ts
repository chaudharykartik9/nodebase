// src/inngest/functions.ts
import { inngest } from "./client";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI();

export const execute = inngest.createFunction(
  { id: "execute-ai", triggers: { event: "execute/ai" } },
  async ({ step }) => {
    await step.sleep("pretend" , "5s");
    const { steps } = await step.ai.wrap("gemini-generate-text", generateText, {
      model: google("gemini-3.1-flash-lite"),
      system: "You are a helpful assistant.",
      prompt: "What is 2 + 2?",
      // Lets Sentry's Vercel AI integration record the prompt and the answer.
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    });

    return { steps };
  },
);
