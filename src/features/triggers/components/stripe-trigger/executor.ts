import type { NodeExecutor } from "@/features/executions/types";

type StripeTriggerData = Record<string, unknown>;

// The Stripe event is already in the context (the webhook puts it there as
// `stripe`), so this node only passes the context on.
export const stripeTriggerExecutor: NodeExecutor<StripeTriggerData> = async ({
  context,
  step,
}) => {
  return await step.run("stripe-trigger", async () => context);
};
