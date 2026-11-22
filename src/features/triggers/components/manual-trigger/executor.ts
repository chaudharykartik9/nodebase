import type { NodeExecutor } from "@/features/executions/types";

type ManualTriggerData = Record<string, unknown>;

// A manual trigger has no work to do: it just passes the context on.
export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  context,
  step,
}) => {
  return await step.run("manual-trigger", async () => context);
};
