import type { NodeTypes } from "@xyflow/react";
import { InitialNode } from "@/components/initial-node";
import { NodeType } from "@/generated/prisma/enums";

// Maps each node type stored in the database to the component that draws it.
export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
