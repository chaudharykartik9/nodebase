"use client";

import { useQuery } from "@tanstack/react-query";
import { CopyIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/trcp/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StripeTriggerDialog = ({ open, onOpenChange }: Props) => {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const trpc = useTRPC();

  // The webhook address contains a secret token, so the server only gives it
  // to the owner of the workflow.
  const webhook = useQuery({
    ...trpc.workflows.stripeWebhook.queryOptions({ id: workflowId }),
    enabled: open,
  });
  const webhookUrl = webhook.data?.url ?? "";

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stripe Trigger Configuration</DialogTitle>
          <DialogDescription>
            Add this webhook URL in Stripe to run this workflow when a Stripe
            event happens.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {webhook.data && !webhook.data.secretConfigured && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <code>STRIPE_WEBHOOK_SECRET</code> is not set in <code>.env</code>
              . Until it is set, every Stripe event is refused. Add the signing
              secret (it starts with <code>whsec_</code>) and restart the app.
            </div>
          )}
          {webhook.data && !webhook.data.isPublic && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
              This address points to localhost, so the Stripe dashboard cannot
              reach it. Use the Stripe CLI (<code>stripe listen</code>) or set{" "}
              <code>NEXT_PUBLIC_APP_URL</code> in <code>.env</code> to a public
              HTTPS address (for example your ngrok address).
            </div>
          )}
          {webhook.isError && (
            <p className="text-sm text-destructive">
              Could not load the webhook URL. Save the workflow and try again.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={webhookUrl}
                placeholder={webhook.isPending ? "Loading..." : ""}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Copy webhook URL"
                disabled={!webhookUrl}
                onClick={() =>
                  copy(webhookUrl, "Webhook URL copied to clipboard")
                }
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The address contains a secret. Anyone who has it can address this
              workflow, so do not share it. Events are only accepted when they
              carry a valid Stripe signature.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Setup instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open the Stripe dashboard in Test mode</li>
              <li>Go to Developers → Webhooks → Add endpoint</li>
              <li>Paste the webhook URL above as the endpoint URL</li>
              <li>
                Choose the events to listen for (for example{" "}
                <code>payment_intent.succeeded</code> or{" "}
                <code>checkout.session.completed</code>)
              </li>
              <li>
                Save, then copy the signing secret (<code>whsec_...</code>) into{" "}
                <code>STRIPE_WEBHOOK_SECRET</code> in <code>.env</code> and
                restart the app
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Every event you choose runs this workflow. Each Stripe endpoint
              has its own signing secret, so one app uses one endpoint (or the
              Stripe CLI) at a time.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-3">
            <h4 className="font-medium text-sm">
              Or test locally with the Stripe CLI:
            </h4>
            <p className="text-xs text-muted-foreground">
              Run this, copy the <code>whsec_...</code> secret it prints into{" "}
              <code>STRIPE_WEBHOOK_SECRET</code>, then in another terminal run{" "}
              <code>stripe trigger payment_intent.succeeded</code>.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={!webhookUrl}
              onClick={() =>
                copy(
                  `stripe listen --forward-to "${webhookUrl.replace(/^https?:\/\/[^/]+/, "http://localhost:3000")}"`,
                  "Command copied to clipboard",
                )
              }
            >
              <CopyIcon className="size-4 mr-2" />
              Copy stripe listen command
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Available Variables</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stripe.eventType}}"}
                </code>{" "}
                - The event type, for example payment_intent.succeeded
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stripe.eventId}}"}
                </code>{" "}
                - The event id
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stripe.object.amount}}"}
                </code>{" "}
                - A field of the object the event is about
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stripe.livemode}}"}
                </code>{" "}
                - true for live mode, false for test mode
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{json stripe.raw}}"}
                </code>{" "}
                - The whole event as JSON
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
