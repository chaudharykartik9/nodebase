// src/inngest/functions.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NonRetriableError } from "inngest";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import type { NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import { workflowChannel } from "./channels";
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

    // Live updates for the editor (see channels.ts). Publishing is a durable
    // step, so each message is sent exactly once and is not repeated when
    // Inngest replays this function. One message carries several updates,
    // because every message costs one step.
    const channel = workflowChannel(workflowId);
    type StatusUpdate = {
      nodeId: string;
      status: "loading" | "success" | "error";
    };
    const publishStatus = (
      stepId: string,
      updates: StatusUpdate[],
      reset = false,
    ) => step.realtime.publish(stepId, channel.status, { reset, updates });

    const { userId, sortedNodes } = await step.run(
      "prepare-workflow",
      async () => {
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

        return {
          userId: workflow.userId,
          sortedNodes: topologicalSort(workflow.nodes, workflow.connections),
        };
      },
    );

    // Start with any initial data from the trigger
    let context = event.data.initialData || {};

    let previousNodeId: string | null = null;
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);

      // The previous node is done and this one starts: announce both at once.
      // The first message of a run also tells the editor to clear old colours.
      await publishStatus(
        `status-before-${node.id}`,
        [
          ...(previousNodeId
            ? [{ nodeId: previousNodeId, status: "success" as const }]
            : []),
          { nodeId: node.id, status: "loading" },
        ],
        previousNodeId === null,
      );

      try {
        context = await executor({
          data: node.data as Record<string, unknown>,
          nodeId: node.id,
          userId,
          context,
          step,
        });
      } catch (error) {
        await publishStatus(`status-error-${node.id}`, [
          { nodeId: node.id, status: "error" },
        ]);
        throw error;
      }

      previousNodeId = node.id;
    }

    if (previousNodeId) {
      await publishStatus("status-after-last", [
        { nodeId: previousNodeId, status: "success" },
      ]);
    }

    return {
      workflowId,
      result: context,
    };
  },
);
