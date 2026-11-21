import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project slugs (set in .env). Used for source map upload.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print upload logs in CI.
  silent: !process.env.CI,

  // Upload a larger set of source maps for more readable stack traces.
  widenClientFileUpload: true,

  // Route browser reports through /monitoring to avoid ad blockers.
  tunnelRoute: "/monitoring",
});
