"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

  const testInngest = useMutation(
    trpc.testInngest.mutationOptions({
      onSuccess: () => toast.success("Background job queued"),
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <div data-testid="workflows-json">{JSON.stringify(data)}</div>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        createWorkflow
      </Button>
      <Button
        variant="outline"
        disabled={testInngest.isPending}
        onClick={() => testInngest.mutate()}
      >
        Test background job
      </Button>
    </div>
  );
};

export default WorkflowsScratch;
