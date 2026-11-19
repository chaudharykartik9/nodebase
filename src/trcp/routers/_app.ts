import { z } from "zod";
import {  createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/db";
import { log } from "node:console";

export const appRouter = createTRPCRouter({
  getWorkFlows: protectedProcedure.query(({ ctx }) => {
    // console.log({userId : ctx.auth.user.id})
    return prisma.workflow.findMany({
      where: {
        id: ctx.auth.user.id,
      },
    });
  }),
  createWorkflow : protectedProcedure.mutation(()=>{
    return prisma.workflow.create({
      data:{
        name:"test-workflow"
      }
    });
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
