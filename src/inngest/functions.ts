// src/inngest/functions.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NonRetriableError } from "inngest";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import type { NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import { inngest } from "./client";
import { topologicalSort } from "./utils";

const google = createGoogleGenerativeAI();

export const execute = inngest.createFunction(
  { id: "execute-ai", triggers: { event: "execute/ai" } },
  async ({ step }) => {
    await step.sleep("pretend", "5s");
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

// Runs a workflow: loads its nodes, orders them by their connections, and runs
// each node's executor in turn, passing the context from one node to the next.
export const executeWorkflow = inngest.createFunction(
  { id: "execute-workflow", triggers: { event: "workflows/execute.workflow" } },
  async ({ event, step }) => {
    const workflowId = event.data.workflowId;

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing");
    }

    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      // A missing workflow can never succeed, so do not retry.
      if (!workflow) {
        throw new NonRetriableError(`Workflow ${workflowId} not found`);
      }

      return topologicalSort(workflow.nodes, workflow.connections);
    });

    // Start with any initial data from the trigger
    let context = event.data.initialData || {};

    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,
      });
    }

    return {
      workflowId,
      result: context,
    };
  },
);
