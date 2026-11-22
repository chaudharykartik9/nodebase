"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "inngest/react";
import { createContext, useContext, useMemo } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { WORKFLOW_CHANNEL_TOPICS, workflowChannel } from "@/inngest/channels";
import { useTRPC } from "@/trcp/client";

type NodeStatuses = Record<string, NodeStatus>;

const NodeStatusContext = createContext<NodeStatuses>({});

export const NodeStatusProvider = NodeStatusContext.Provider;

/**
 * Listens to the live updates of one workflow and returns the current status
 * of every node. A new run clears the statuses of the previous one.
 */
export const useWorkflowStatuses = (workflowId: string): NodeStatuses => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { messages } = useRealtime({
    channel: workflowChannel(workflowId),
    topics: [...WORKFLOW_CHANNEL_TOPICS],
    // The server checks that this workflow belongs to the signed-in user and
    // returns a short-lived token for this one channel only.
    token: () =>
      queryClient.fetchQuery({
        ...trpc.workflows.realtimeToken.queryOptions({ id: workflowId }),
        staleTime: 0,
      }),
    // The channel carries many runs, so do not close it when one run ends.
    autoCloseOnTerminal: false,
  });

  return useMemo(() => {
    const statuses: NodeStatuses = {};
    for (const message of messages.all) {
      if (message.kind !== "data" || message.topic !== "status") {
        continue;
      }
      // A new run starts: forget the colours of the previous run.
      if (message.data.reset) {
        for (const key of Object.keys(statuses)) {
          delete statuses[key];
        }
      }
      for (const { nodeId, status } of message.data.updates) {
        statuses[nodeId] = status;
      }
    }
    return statuses;
  }, [messages.all]);
};

/** The live status of one node (for use inside the editor canvas). */
export const useNodeStatus = (nodeId: string): NodeStatus => {
  const statuses = useContext(NodeStatusContext);
  return statuses[nodeId] ?? "initial";
};
