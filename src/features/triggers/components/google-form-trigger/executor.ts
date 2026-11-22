import type { NodeExecutor } from "@/features/executions/types";

type GoogleFormTriggerData = Record<string, unknown>;

// The form answers are already in the context (the webhook puts them there as
// `googleForm`), so this node only passes the context on.
export const googleFormTriggerExecutor: NodeExecutor<
  GoogleFormTriggerData
> = async ({ context, step }) => {
  return await step.run("google-form-trigger", async () => context);
};
