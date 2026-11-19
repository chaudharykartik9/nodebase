"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trcp/client";

const WorkflowsScratch = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useQuery(trpc.getWorkFlows.queryOptions());
  const create = useMutation(
    trpc.createWorkflow.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.getWorkFlows.queryOptions());
      },
    }),
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <div data-testid="workflows-json">{JSON.stringify(data)}</div>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        createWorkflow
      </Button>
    </div>
  );
};

export default WorkflowsScratch;
