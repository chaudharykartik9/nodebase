"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { socialErrorMessage } from "@/features/auth/lib/social-errors";
import { authClient } from "@/lib/auth-client";
import type { SocialProviderAvailability } from "@/lib/social-providers";
import Image from "next/image";

const loginSchema = z.object({
  email: z.email("please Enter a valid email address"),
  password: z.string().min(1, "passsword is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({
  socialProviders,
  socialError,
}: {
  socialProviders: SocialProviderAvailability;
  socialError?: string;
}) {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onsubmit = async (value: LoginFormValues) => {
    await authClient.signIn.email(
      {
        email: value.email,
        password: value.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };
  const isPending = form.formState.isSubmitting;
  const [socialPending, setSocialPending] = useState<string | null>(null);

  // A cancelled or failed social sign-in comes back here with ?error=...
  useEffect(() => {
    if (socialError) {
      toast.error(socialErrorMessage(socialError));
      router.replace("/login");
    }
  }, [socialError, router]);

  // Coming back with the browser's back button must not leave the buttons disabled.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setSocialPending(null);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const signInSocial = async (provider: "github" | "google") => {
    setSocialPending(provider);
    await authClient.signIn.social(
      { provider, callbackURL: "/", errorCallbackURL: "/login" },
      {
        onError: (ctx) => {
          setSocialPending(null);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Login to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onsubmit)}>
              <div className="grid gap-6">
                {(socialProviders.github || socialProviders.google) && (
                  <div className="flex flex-col gap-4">
                    {socialProviders.github && (
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={() => signInSocial("github")}
                        disabled={isPending || !!socialPending}
                      >
                        <Image
                          alt="github"
                          src="/logo/github.svg"
                          width={20}
                          height={20}
                        />
                        Continue with Github
                      </Button>
                    )}
                    {socialProviders.google && (
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={() => signInSocial("google")}
                        disabled={isPending || !!socialPending}
                      >
                        <Image
                          alt="google"
                          src="/logo/google.svg"
                          width={20}
                          height={20}
                        />
                        Continue with Google
                      </Button>
                    )}
                  </div>
                )}
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="m@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="*********"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                    Login
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
