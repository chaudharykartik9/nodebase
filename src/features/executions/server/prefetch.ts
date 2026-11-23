import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trcp/server";

type Input = inferInput<typeof trpc.executions.getMany>;

/**
 * Prefetch the executions list for the given page and page size
 */
export const prefetchExecutions = (params: Input) => {
  return prefetch(trpc.executions.getMany.queryOptions(params));
};

/**
 * Prefetch a single execution
 */
export const prefetchExecution = (id: string) => {
  return prefetch(trpc.executions.getOne.queryOptions({ id }));
};
