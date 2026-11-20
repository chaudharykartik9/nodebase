"use client";

import { Button } from "@/components/ui/button";
import LogOutbutton from "./Logout-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trcp/client";
import { toast } from "sonner";

const page = () => {
  const trpc = useTRPC();
  const quieryCleint = useQueryClient() ;
  const { data } = useQuery(trpc.getWorkflow.queryOptions());
  const create = useMutation(trpc.createWorkflow.mutationOptions({
    onSuccess : ()=>{
      toast.success("Job queued");
      // The background job sleeps 5s before inserting, so refetch after it finishes.
      setTimeout(() => {
        quieryCleint.invalidateQueries(trpc.getWorkflow.queryOptions());
      }, 7000);
    }

    
  }));

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center gap-y-6 p-4 text-center">
      <p>protected server component</p>
      <div className="max-w-full break-all">{JSON.stringify(data)}</div>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create workflow
      </Button>
      <LogOutbutton />
    </div>
  );
};

export default page;
