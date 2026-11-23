"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { useNodeStatus } from "@/features/editor/hooks/use-workflow-status";
import { BaseExecutionNode } from "../base-execution-node";
import { AiDialog, type AiFormType } from "./dialog";
import { AI_PROVIDERS, type AiProviderId } from "./providers";

type AiNodeData = {
  variableName?: string;
  credentialId?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
  [key: string]: unknown;
};

type AiNodeType = Node<AiNodeData>;

const PROMPT_PREVIEW_LENGTH = 50;

const createAiNode = (providerId: AiProviderId) => {
  const provider = AI_PROVIDERS[providerId];

  const AiNode = memo((props: NodeProps<AiNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes, getNodes } = useReactFlow();

    // Live status while a workflow runs (loading, success or error).
    const nodeStatus = useNodeStatus(props.id);

    const handleOpenSettings = () => setDialogOpen(true);

    // Stores the settings in this node's data. It is saved with the workflow.
    const handleSubmit = (values: AiFormType) => {
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
    const prompt = nodeData?.userPrompt?.trim();
    const description = prompt
      ? `${nodeData.model || provider.defaultModel}: ${
          prompt.length > PROMPT_PREVIEW_LENGTH
            ? `${prompt.slice(0, PROMPT_PREVIEW_LENGTH)}...`
            : prompt
        }`
      : "Not configured";

    return (
      <>
        <AiDialog
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

  AiNode.displayName = `${provider.label}Node`;
  return AiNode;
};

export const GeminiNode = createAiNode("GEMINI");
export const OpenAiNode = createAiNode("OPENAI");
export const AnthropicNode = createAiNode("ANTHROPIC");
