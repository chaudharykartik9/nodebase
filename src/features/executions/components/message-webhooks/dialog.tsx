"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { checkWebhookUrl, type MessageProviderConfig } from "./providers";

// Names that would break (or pollute) the context object the results are stored in.
const RESERVED_NAMES = ["__proto__", "constructor", "prototype"];

const createFormSchema = (provider: MessageProviderConfig) =>
  z.object({
    variableName: z
      .string()
      .min(1, { message: "Variable name is required" })
      .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, {
        message:
          "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
      })
      .refine((name) => !RESERVED_NAMES.includes(name), {
        message: "This name is reserved, please choose another one",
      }),
    webhookUrl: z
      .string()
      .trim()
      .min(1, { message: "Webhook URL is required" })
      .superRefine((value, ctx) => {
        const problem = checkWebhookUrl(provider, value);
        if (problem) ctx.addIssue({ code: "custom", message: problem });
      }),
    content: z.string().min(1, { message: "Message is required" }),
    username: z.string().max(80).optional(),
  });

export type MessageFormType = z.infer<ReturnType<typeof createFormSchema>>;

interface Props {
  provider: MessageProviderConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MessageFormType) => void;
  // Variable names already used by the other nodes of the workflow.
  getTakenNames?: () => string[];
  defaultValues?: Partial<MessageFormType>;
}

export const MessageDialog = ({
  provider,
  open,
  onOpenChange,
  onSubmit,
  getTakenNames,
  defaultValues = {},
}: Props) => {
  const schema = useMemo(() => createFormSchema(provider), [provider]);

  const initial = {
    variableName: defaultValues.variableName ?? "",
    webhookUrl: defaultValues.webhookUrl ?? "",
    content: defaultValues.content ?? "",
    username: defaultValues.username ?? "",
  };

  const form = useForm<MessageFormType>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  // Reset form values when the dialog opens with new defaults
  // biome-ignore lint/correctness/useExhaustiveDependencies: `initial` is rebuilt on every render; its fields are listed instead
  useEffect(() => {
    if (open) form.reset(initial);
  }, [
    open,
    initial.variableName,
    initial.webhookUrl,
    initial.content,
    initial.username,
    form,
  ]);

  const watchVariableName = form.watch("variableName") || "myMessage";

  const handleSubmit = (values: MessageFormType) => {
    // Two nodes with the same name would overwrite each other's result.
    if (getTakenNames?.().includes(values.variableName)) {
      form.setError("variableName", {
        message: "Another node already uses this variable name",
      });
      return;
    }

    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{provider.label}</DialogTitle>
          <DialogDescription>
            Configure the {provider.label} webhook and the message to send.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myMessage" {...field} />
                  </FormControl>
                  <FormDescription>
                    The result is stored under this name. Other nodes can use it
                    as {`{{${watchVariableName}.sent}}`} and{" "}
                    {`{{${watchVariableName}.message}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={provider.urlPlaceholder}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Only official {provider.label} webhook addresses are
                    accepted. The address is a secret: anyone who has it can
                    post to your channel. It is saved with the workflow.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        "New payment: {{stripe.object.amount}} from {{googleForm.respondentEmail}}"
                      }
                      className="min-h-[120px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {"{{variables}}"} for simple values or{" "}
                    {"{{json variable}}"} to insert objects.{" "}
                    {provider.id === "DISCORD"
                      ? "Messages longer than 2000 characters are shortened. @everyone and role pings are turned off."
                      : "Text from earlier nodes is escaped, so it cannot trigger @channel or links."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {provider.supportsUsername && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Username (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Workflow Bot" {...field} />
                    </FormControl>
                    <FormDescription>
                      Overrides the name shown for the message.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
