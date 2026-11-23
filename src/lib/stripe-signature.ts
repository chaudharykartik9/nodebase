import { createHmac, timingSafeEqual } from "node:crypto";

// Stripe signs every webhook event. The `Stripe-Signature` header looks like
// `t=1700000000,v1=<hex>,v1=<hex>`: `t` is the time Stripe signed the event and
// each `v1` is HMAC-SHA256(secret, `${t}.${rawBody}`).
//
// This is the documented scheme, checked by hand so no extra package is needed.
// `rawBody` must be the exact text Stripe sent (read it with `request.text()`).

const DEFAULT_TOLERANCE_SECONDS = 300;

export type StripeSignatureResult =
  | { ok: true }
  | { ok: false; reason: "malformed" | "mismatch" | "expired" };

export const verifyStripeSignature = (
  rawBody: string,
  header: string | null,
  secret: string,
  options: { toleranceSeconds?: number; nowSeconds?: number } = {},
): StripeSignatureResult => {
  if (!header) return { ok: false, reason: "malformed" };

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === "t") timestamp = value;
    else if (key === "v1") signatures.push(value);
  }

  if (!/^\d+$/.test(timestamp) || signatures.length === 0) {
    return { ok: false, reason: "malformed" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest();

  const matches = signatures.some((signature) => {
    if (!/^[0-9a-f]+$/i.test(signature) || signature.length % 2 !== 0) {
      return false;
    }
    const received = Buffer.from(signature, "hex");
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  });

  if (!matches) return { ok: false, reason: "mismatch" };

  // Reject old events, so a captured request cannot be replayed later.
  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > tolerance) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true };
};
