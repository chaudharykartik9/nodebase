import { createHmac, timingSafeEqual } from "node:crypto";

// Public webhook addresses must not be guessable. Each workflow gets a secret
// token that is derived from the server secret, so nothing extra is stored in
// the database. Only the owner of a workflow can see its token (the webhook
// URL shown in the node settings).

const getSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not defined. Add it to .env.");
  }
  return secret;
};

export const signWorkflowWebhook = (workflowId: string): string =>
  createHmac("sha256", getSecret())
    .update(`nodebase:webhook:${workflowId}`)
    .digest("hex");

// Compares in constant time, so the token cannot be discovered bit by bit.
export const verifyWorkflowWebhook = (
  workflowId: string,
  token: string,
): boolean => {
  const expected = Buffer.from(signWorkflowWebhook(workflowId));
  const received = Buffer.from(token);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
};
