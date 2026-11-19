 "use client"

import { requireAuth } from "@/lib/auth-utils";
import { caller, trpc } from "@/trcp/server";
import { LogOut } from "lucide-react";
import LogOutbutton from "./Logout-button";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trcp/client";



const page =  () => {
const trcp = useTRPC() ;
  const {data} = useQuery(trpc.getWorkFlows.queryOptions());
  const create = useMutation(trpc.createWorkflow.mutationOptions()) ;
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      protechde server component
      <div>{JSON.stringify(data)}</div>
      <button disabled={create.isPending} onClick={() => create.mutate()}>
        createWorkflow
      </button>
      <LogOutbutton/>
    </div>
  );
};

export default page;
