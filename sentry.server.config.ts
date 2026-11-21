// Runs on the Node.js server. Loaded from src/instrumentation.ts.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  // Without a DSN (not configured yet) Sentry stays off and the app runs normally.
  enabled: Boolean(dsn),

  integrations: [
    // Record Vercel AI SDK calls (generateText etc.) as spans.
    Sentry.vercelAIIntegration({
      recordInputs: true,
      recordOutputs: true,
    }),
    // Send console.log / warn / error to Sentry Logs.
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Sample 100% of traces in development, 10% in production.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  debug: false,
});
