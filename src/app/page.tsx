import { requireAuth } from "@/lib/auth-utils";
import LogOutbutton from "./Logout-button";
import WorkflowsScratch from "./workflows-scratch";

// Scratch page used while the dashboard is not built yet (see requirements T08).
const Page = async () => {
  await requireAuth();

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center gap-4">
      <WorkflowsScratch />
      <LogOutbutton />
    </div>
  );
};

export default Page;
