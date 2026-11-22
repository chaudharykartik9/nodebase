import type { GetStepTools, Inngest } from "inngest";

// The data that flows from node to node while a workflow runs.
export type WorkflowContext = Record<string, unknown>;

export type StepTools = GetStepTools<Inngest.Any>;

export interface NodeExecutorParams<TData = Record<string, unknown>> {
  data: TData;
  nodeId: string;
  context: WorkflowContext;
  step: StepTools;
}

// Every node type has one executor: it receives the node's settings and the
// current context, does its work, and returns the (extended) context.
export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>,
) => Promise<WorkflowContext>;
