import { requireAuth } from "@/lib/auth-utils";

// Placeholder until execution history is built (see requirements T20).
const Page = async () => {
  await requireAuth();

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Executions</h1>
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </div>
  );
};

export default Page;
