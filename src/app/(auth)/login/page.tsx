import { LoginForm } from "@/features/auth/components/login-form";
import { requireUnauth } from "@/lib/auth-utils";
import { getSocialProviderAvailability } from "@/lib/social-providers";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

const page = async ({ searchParams }: Props) => {
  await requireUnauth();
  const { error } = await searchParams;
  return (
    <LoginForm
      socialProviders={getSocialProviderAvailability()}
      socialError={error}
    />
  );
};

export default page;
