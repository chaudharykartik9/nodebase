import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trcp/server";

type Input = inferInput<typeof trpc.workflows.getMany>;

/**
 * Prefetch the workflows list for the given page, page size and search
 */
export const prefetchWorkflows = (params: Input) => {
  return prefetch(trpc.workflows.getMany.queryOptions(params));
};
