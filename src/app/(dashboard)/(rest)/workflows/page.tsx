import { requireAuth } from "@/lib/auth-utils";
import { WorkflowsDemo } from "./workflows-demo";

const Page = async () => {
  await requireAuth();

  return <WorkflowsDemo />;
};

export default Page;
