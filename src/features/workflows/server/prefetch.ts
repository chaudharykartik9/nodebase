import { prefetch, trpc } from "@/trcp/server";

/**
 * Prefetch all workflows
 */
export const prefetchWorkflows = () => {
  return prefetch(trpc.workflows.getMany.queryOptions());
};
