import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Encrypts the API keys that users save as credentials.
//
// AES-256-GCM: the text is scrambled with a secret key, and a tag detects any
// change to it. A saved value looks like `v1:<iv>:<tag>:<data>` (all base64).
// The secret key is `ENCRYPTION_KEY` in `.env`: 32 random bytes as base64
// (create one with `openssl rand -base64 32`). If it is lost or changed, the
// saved values can no longer be read and must be entered again.

const VERSION = "v1";

const getKey = (): Buffer => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Add it to .env (openssl rand -base64 32) and restart the app.",
    );
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 32 random bytes as base64 (openssl rand -base64 32).",
    );
  }
  return key;
};

export const encrypt = (plainText: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    data.toString("base64"),
  ].join(":");
};

export const decrypt = (encrypted: string): string => {
  const [version, iv, tag, data] = encrypted.split(":");
  if (version !== VERSION || !iv || !tag || !data) {
    throw new Error("The saved credential has an unknown format.");
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Wrong key, or the stored value was changed.
    throw new Error(
      "The saved credential could not be decrypted. Check that ENCRYPTION_KEY has not changed, or save the credential again.",
    );
  }
};
