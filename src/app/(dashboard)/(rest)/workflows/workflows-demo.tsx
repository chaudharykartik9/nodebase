"use client";

// Temporary demo moved here from the old root page (src/app/page.tsx).
// It is replaced by the real workflows list in the workflows chapters.
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trcp/client";

export const WorkflowsDemo = () => {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.getWorkflow.queryOptions());
  const testAi = useMutation(
    trpc.testAi.mutationOptions({
      onSuccess: () => {
        toast.success(" AI Job queued");
      },
      onError: (error) => {
        toast.error(`Failed to queue AI job: ${error.message}`);
      },
    }),
  );
  const create = useMutation(
    trpc.createWorkflow.mutationOptions({
      onSuccess: () => {
        toast.success("Job queued");
      },
      onError: (error) => {
        toast.error(`Failed to create workflow: ${error.message}`);
      },
    }),
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-y-6 p-4 text-center">
      <p>Workflows</p>
      <div className="max-w-full break-all">{JSON.stringify(data)}</div>
      <Button disabled={testAi.isPending} onClick={() => testAi.mutate()}>
        TEST AI
      </Button>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create workflow
      </Button>
    </div>
  );
};
