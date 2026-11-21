// Runs in the browser. Next.js loads this file automatically.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  debug: false,
});

// Trace client-side route transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
