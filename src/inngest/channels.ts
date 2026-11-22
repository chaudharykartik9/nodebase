import { realtime } from "inngest/realtime";
import { z } from "zod";

export const NODE_RUN_STATUSES = ["loading", "success", "error"] as const;

// Live updates while a workflow runs. There is one channel per workflow, so a
// browser only ever receives the updates of the workflow it has open.
//
// A single `status` message can carry several node updates, because each
// message costs one Inngest step. `reset` is true when a new run starts, so the
// editor clears the colours of the previous run first.
export const workflowChannel = realtime.channel({
  name: (workflowId: string) => `workflow:${workflowId}`,
  topics: {
    status: {
      schema: z.object({
        reset: z.boolean().optional(),
        updates: z.array(
          z.object({
            nodeId: z.string(),
            status: z.enum(NODE_RUN_STATUSES),
          }),
        ),
      }),
    },
  },
});

export const WORKFLOW_CHANNEL_TOPICS = ["status"] as const;
