import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "nodebase",
  // Inngest v4 defaults to cloud mode (needs INNGEST_SIGNING_KEY).
  // In `next dev` we talk to the local Inngest dev server instead.
  isDev: process.env.NODE_ENV === "development",
});
