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
import { generateGoogleFormScript } from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoogleFormTriggerDialog = ({ open, onOpenChange }: Props) => {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const trpc = useTRPC();

  // The webhook address contains a secret token, so the server only gives it
  // to the owner of the workflow.
  const webhook = useQuery({
    ...trpc.workflows.googleFormWebhook.queryOptions({ id: workflowId }),
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
          <DialogTitle>Google Form Trigger Configuration</DialogTitle>
          <DialogDescription>
            Use this webhook URL in your Google Form's Apps Script to trigger
            this workflow when a form is submitted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {webhook.data && !webhook.data.isPublic && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
              This address points to localhost, which Google cannot reach. Set{" "}
              <code>NEXT_PUBLIC_APP_URL</code> in <code>.env</code> to a public
              HTTPS address (for example your ngrok address) and restart the app
              before you use the script.
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
              The address contains a secret. Anyone who has it can start this
              workflow, so do not share it.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Setup instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open your Google Form</li>
              <li>Click the three dots menu → Apps Script</li>
              <li>
                Replace the code with the script below (it already has your URL)
              </li>
              <li>Save, then open "Triggers" → Add Trigger</li>
              <li>Choose: From form → On form submit → Save</li>
              <li>Allow the permissions Google asks for</li>
            </ol>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-3">
            <h4 className="font-medium text-sm">Google Apps Script:</h4>
            <Button
              type="button"
              variant="outline"
              disabled={!webhookUrl}
              onClick={() =>
                copy(
                  generateGoogleFormScript(webhookUrl),
                  "Script copied to clipboard",
                )
              }
            >
              <CopyIcon className="size-4 mr-2" />
              Copy Google Apps Script
            </Button>
            <p className="text-xs text-muted-foreground">
              This script includes your webhook URL and handles form
              submissions.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Available Variables</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{googleForm.respondentEmail}}"}
                </code>{" "}
                - Respondent's email
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{googleForm.responses.Name}}"}
                </code>{" "}
                - The answer to the question titled "Name"
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{json googleForm.responses}}"}
                </code>{" "}
                - All answers as JSON
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              A question title with spaces needs another form:{" "}
              <code>{'{{lookup googleForm.responses "Your name"}}'}</code>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
