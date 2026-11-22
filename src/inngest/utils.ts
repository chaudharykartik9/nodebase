import { NonRetriableError } from "inngest";
import toposort from "toposort";
import type { Connection, Node } from "@/generated/prisma/client";

// Orders nodes so every node comes after the nodes that feed into it.
export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  // Without connections the nodes are independent: keep them as they are.
  if (connections.length === 0) {
    return nodes;
  }

  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  // toposort.array also places nodes that have no connections.
  let sortedNodeIds: string[];
  try {
    sortedNodeIds = toposort.array(
      nodes.map((node) => node.id),
      edges,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new NonRetriableError("Workflow contains a cycle");
    }
    throw error;
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return sortedNodeIds.map((id) => nodeMap.get(id)).filter((n) => !!n);
};
