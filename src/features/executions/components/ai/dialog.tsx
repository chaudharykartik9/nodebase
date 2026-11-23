"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import type { AiProviderConfig } from "./providers";

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
    initial.model,
    initial.systemPrompt,
    initial.userPrompt,
    form,
  ]);

  const watchVariableName = form.watch("variableName") || "myAi";

  const handleSubmit = (values: AiFormType) => {
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
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder={provider.defaultModel} {...field} />
                  </FormControl>
                  <FormDescription>
                    {provider.modelHint}. The API key is read from{" "}
                    <code>{provider.envVar}</code> in <code>.env</code>.
                  </FormDescription>
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
