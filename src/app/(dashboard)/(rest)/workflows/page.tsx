import { requireAuth } from "@/lib/auth-utils";
import WorkflowsScratch from "../../../workflows-scratch";

// Placeholder until the workflows list is built (see requirements T10).
// It keeps the temporary create/test-job buttons reachable in the meantime.
const Page = async () => {
  await requireAuth();

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Workflows</h1>
      <WorkflowsScratch />
    </div>
  );
};

export default Page;
