import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "nodebase",
  // Dev mode talks to the local Inngest dev server (no signing key needed).
  isDev: process.env.NODE_ENV === "development",
});
