// "use client"

import { requireAuth } from "@/lib/auth-utils";
import { caller } from "@/trcp/server";
import { LogOut } from "lucide-react";
import LogOutbutton from "./Logout-button";

// import { authClient } from "@/lib/auth-client";
// import { Button } from "@base-ui/react";
// import { createAuthClient } from "better-auth/react";

// const Page =  () => {

//   const {data} = authClient.useSession() ;
//   return (
//     <div className="min-h-screen min-w-screen flex items-center justify-center">
//       {JSON.stringify(data)}
//       {data &&(
//       <Button onClick={()=>{authClient.signOut()}}>
//         Logout
//       </Button>)
// }
//     </div>
//   );
// };

// export default Page;

const page = async () => {
  await requireAuth();
  const data = await caller.getusers();
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      protechde server component
      <div>{JSON.stringify(data)}</div>
      <LogOutbutton/>
    </div>
  );
};

export default page;
