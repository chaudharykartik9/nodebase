import { RegisterForm } from "@/features/auth/components/register-form";
import { requireUnauth } from "@/lib/auth-utils";
import { getSocialProviderAvailability } from "@/lib/social-providers";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

const page = async ({ searchParams }: Props) => {
  await requireUnauth();
  const { error } = await searchParams;
  return (
    <RegisterForm
      socialProviders={getSocialProviderAvailability()}
      socialError={error}
    />
  );
};

export default page;
