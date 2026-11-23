import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trcp/client";
import { useExecutionsParams } from "./use-executions-params";

// A run that has not finished yet changes by itself, so its page is refreshed
// every 2 seconds until it is done.
const POLL_WHILE_RUNNING_MS = 2000;

/**
 * Hook to fetch all executions using suspense
 */
export const useSuspenseExecutions = () => {
  const trpc = useTRPC();
  const [params] = useExecutionsParams();

  return useSuspenseQuery({
    ...trpc.executions.getMany.queryOptions(params),
    refetchInterval: (query) =>
      query.state.data?.items.some((item) => item.status === "RUNNING")
        ? POLL_WHILE_RUNNING_MS
        : false,
  });
};

/**
 * Hook to fetch a single execution using suspense
 */
export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC();

  return useSuspenseQuery({
    ...trpc.executions.getOne.queryOptions({ id }),
    refetchInterval: (query) =>
      query.state.data?.status === "RUNNING" ? POLL_WHILE_RUNNING_MS : false,
  });
};
