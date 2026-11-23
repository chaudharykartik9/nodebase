"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { useNodeStatus } from "@/features/editor/hooks/use-workflow-status";
import { BaseExecutionNode } from "../base-execution-node";
import { MessageDialog, type MessageFormType } from "./dialog";
import { MESSAGE_PROVIDERS, type MessageProviderId } from "./providers";

type MessageNodeData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
  [key: string]: unknown;
};

type MessageNodeType = Node<MessageNodeData>;

const PREVIEW_LENGTH = 50;

const createMessageNode = (providerId: MessageProviderId) => {
  const provider = MESSAGE_PROVIDERS[providerId];

  const MessageNode = memo((props: NodeProps<MessageNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes, getNodes } = useReactFlow();

    // Live status while a workflow runs (loading, success or error).
    const nodeStatus = useNodeStatus(props.id);

    const handleOpenSettings = () => setDialogOpen(true);

    // Stores the settings in this node's data. It is saved with the workflow.
    const handleSubmit = (values: MessageFormType) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === props.id
            ? { ...node, data: { ...node.data, ...values } }
            : node,
        ),
      );
    };

    // Variable names used by the other nodes (checked when the dialog is saved).
    const getTakenNames = () =>
      getNodes()
        .filter((node) => node.id !== props.id)
        .map((node) => node.data?.variableName)
        .filter((name): name is string => typeof name === "string" && !!name);

    const nodeData = props.data;
    const message = nodeData?.content?.trim();
    // The webhook address is a secret, so it is never shown on the canvas.
    const description = message
      ? message.length > PREVIEW_LENGTH
        ? `${message.slice(0, PREVIEW_LENGTH)}...`
        : message
      : "Not configured";

    return (
      <>
        <MessageDialog
          provider={provider}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          getTakenNames={getTakenNames}
          defaultValues={nodeData}
        />
        <BaseExecutionNode
          {...props}
          icon={provider.icon}
          name={provider.label}
          status={nodeStatus}
          description={description}
          onSettings={handleOpenSettings}
          onDoubleClick={handleOpenSettings}
        />
      </>
    );
  });

  MessageNode.displayName = `${provider.label}Node`;
  return MessageNode;
};

export const DiscordNode = createMessageNode("DISCORD");
export const SlackNode = createMessageNode("SLACK");
