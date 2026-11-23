"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import type { AiProviderConfig } from "./providers";

// The dropdown cannot hold an empty value, so "no credential" has its own value.
const NO_CREDENTIAL = "__env__";

// Names that would break (or pollute) the context object the results are stored in.
const RESERVED_NAMES = ["__proto__", "constructor", "prototype"];

const formSchema = z.object({
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
  // Empty means: use the key from .env.
  credentialId: z.string().optional(),
  model: z.string().min(1, { message: "Model is required" }),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, { message: "User prompt is required" }),
});

export type AiFormType = z.infer<typeof formSchema>;

interface Props {
  provider: AiProviderConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AiFormType) => void;
  // Variable names already used by the other nodes of the workflow.
  getTakenNames?: () => string[];
  defaultValues?: Partial<AiFormType>;
}

export const AiDialog = ({
  provider,
  open,
  onOpenChange,
  onSubmit,
  getTakenNames,
  defaultValues = {},
}: Props) => {
  const initial = {
    variableName: defaultValues.variableName ?? "",
    credentialId: defaultValues.credentialId ?? "",
    model: defaultValues.model || provider.defaultModel,
    systemPrompt: defaultValues.systemPrompt ?? "",
    userPrompt: defaultValues.userPrompt ?? "",
  };

  const form = useForm<AiFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: initial,
  });

  // Reset form values when the dialog opens with new defaults
  // biome-ignore lint/correctness/useExhaustiveDependencies: `initial` is rebuilt on every render; its fields are listed instead
  useEffect(() => {
    if (open) form.reset(initial);
  }, [
    open,
    initial.variableName,
    initial.credentialId,
    initial.model,
    initial.systemPrompt,
    initial.userPrompt,
    form,
  ]);

  const watchVariableName = form.watch("variableName") || "myAi";
  const watchCredentialId = form.watch("credentialId") || "";

  // The saved credentials of this provider (names only, never the keys).
  const credentials = useCredentialsByType(provider.id, open);
  const credentialMissing =
    !!watchCredentialId &&
    !!credentials.data &&
    !credentials.data.some((credential) => credential.id === watchCredentialId);

  const handleSubmit = (values: AiFormType) => {
    // Two nodes with the same name would overwrite each other's result.
    if (getTakenNames?.().includes(values.variableName)) {
      form.setError("variableName", {
        message: "Another node already uses this variable name",
      });
      return;
    }

    onSubmit({ ...values, credentialId: values.credentialId || undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{provider.label}</DialogTitle>
          <DialogDescription>
            Configure the AI model and the prompts for this node.
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
                    <Input placeholder="myAi" {...field} />
                  </FormControl>
                  <FormDescription>
                    The answer is stored under this name. Other nodes can use it
                    as {`{{${watchVariableName}.text}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credential</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NO_CREDENTIAL ? "" : value)
                    }
                    value={field.value || NO_CREDENTIAL}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a credential" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_CREDENTIAL}>
                        Use the key from .env ({provider.envVar})
                      </SelectItem>
                      {credentials.data?.map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          {credential.name}
                        </SelectItem>
                      ))}
                      {credentialMissing && (
                        <SelectItem value={watchCredentialId} disabled>
                          (deleted credential)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {credentialMissing ? (
                      <span className="text-destructive">
                        The saved credential no longer exists. Pick another one.{" "}
                      </span>
                    ) : null}
                    Save {provider.label} keys on the{" "}
                    <Link
                      href="/credentials"
                      target="_blank"
                      className="underline"
                    >
                      Credentials page
                    </Link>
                    .
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder={provider.defaultModel} {...field} />
                  </FormControl>
                  <FormDescription>{provider.modelHint}.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful assistant."
                      className="min-h-[80px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Sets the behaviour of the assistant. Supports{" "}
                    {"{{variables}}"}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        "Summarize this text: {{json myApiCall.httpResponse.data}}"
                      }
                      className="min-h-[120px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The prompt sent to the model. Use {"{{variables}}"} for
                    simple values or {"{{json variable}}"} to insert objects.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
