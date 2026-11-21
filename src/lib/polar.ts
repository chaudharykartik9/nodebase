import { Polar } from "@polar-sh/sdk";

// Sandbox only: no real money moves. Switch to "production" when going live.
export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

// Fail fast with a clear message instead of a broken checkout later.
export const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined. Add it to .env.`);
  }
  return value;
};
