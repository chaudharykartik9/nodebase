"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";
import { ErrorView, LoadingView } from "@/components/entity-components";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { AI_PROVIDERS } from "@/features/executions/components/ai/providers";
import { CredentialType } from "@/generated/prisma/enums";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import {
  useCreateCredential,
  useSuspenseCredential,
  useUpdateCredential,
} from "../hooks/use-credentials";

// The API key is required when creating. When editing, an empty value keeps
// the saved key.
const createFormSchema = (isEdit: boolean) =>
  z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    type: z.enum(CredentialType),
    value: isEdit
      ? z.string().trim().max(2000)
      : z.string().trim().min(1, "API key is required").max(2000),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface CredentialFormProps {
  initialData?: {
    id: string;
    name: string;
    type: CredentialType;
  };
}

export const CredentialForm = ({ initialData }: CredentialFormProps) => {
  const router = useRouter();
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const { handleError, modal } = useUpgradeModal();

  const isEdit = !!initialData?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(isEdit)),
    defaultValues: {
      name: initialData?.name ?? "",
      type: initialData?.type ?? CredentialType.GEMINI,
      // The saved key is never sent to the browser, so this always starts empty.
      value: "",
    },
  });

  // The hooks already show an error message when a request fails, so the
  // failure is only caught here to keep it from becoming an unhandled error.
  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && initialData) {
        await updateCredential.mutateAsync({
          id: initialData.id,
          name: values.name,
          type: values.type,
          // Empty means "keep the saved key".
          value: values.value || undefined,
        });
        form.reset({ ...values, value: "" });
        return;
      }

      await createCredential.mutateAsync(values);
      router.push("/credentials");
    } catch (error) {
      // A missing subscription opens the upgrade modal.
      handleError(error);
    }
  };

  const isPending = createCredential.isPending || updateCredential.isPending;

  return (
    <>
      {modal}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit credential" : "Create credential"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Update the name or replace the saved API key."
              : "Save an API key once and pick it in your AI nodes. It is stored encrypted."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              autoComplete="off"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Gemini key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AI_PROVIDERS).map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              <Image
                                src={provider.icon}
                                alt=""
                                width={16}
                                height={16}
                              />
                              {provider.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder={
                          isEdit
                            ? "Leave empty to keep the saved key"
                            : "Paste your API key"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEdit
                        ? "The saved key is hidden and cannot be shown again. Enter a new one only to replace it."
                        : "It is encrypted before it is saved and cannot be shown again."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <Button type="submit" disabled={isPending}>
                  {isEdit ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/credentials" prefetch>
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export const CredentialView = ({ credentialId }: { credentialId: string }) => {
  const { data: credential } = useSuspenseCredential(credentialId);

  return <CredentialForm initialData={credential} />;
};

export const CredentialLoading = () => {
  return <LoadingView message="Loading credential..." />;
};

export const CredentialError = () => {
  return <ErrorView message="Error loading credential" />;
};
