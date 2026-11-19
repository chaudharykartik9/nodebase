# T21: Sentry, polish, deploy prep

**Branch:** `21-polish-deploy` · **Size:** M · **Depends on:** all

## Goal
Error monitoring, cleanup of tutorial leftovers, production readiness.

## Plan
1. Optional Sentry via wizard-style setup: `@sentry/nextjs`, `instrumentation*.ts`, `global-error.tsx`, `next.config.ts` wrapper (modifies existing file: show diff first). Skip sample pages from the reference.
2. Cleanup: metadata, remove scratch code, unused imports (`npm run lint`), update `README.md` and `CLAUDE.md`.
3. Env documentation (`.env.example` with all keys, no values).
4. Build check `npm run build`; Vercel deployment notes (env vars, Inngest cloud sync, Neon pooled URL for runtime vs direct for migrations, webhook URLs).
5. Security pass (`security-review` skill): auth on all routes, webhook secrets, credential handling.

## Acceptance
`npm run build` passes; documented deploy steps; no secrets committed.

## understand.md topics
Observability, environment config, build vs runtime env, deployment architecture.

## Verified against reference (code read)
- Reference `next.config.ts` combines `devIndicators: false`, the `/` -> `/workflows` redirect (also relevant to T08) and `withSentryConfig(...)` (hard-coded `org`/`project`: use your own).
- Sentry files: `instrumentation.ts` (loads `sentry.server.config` / `sentry.edge.config`, exports `onRequestError`), `instrumentation-client.ts`, `global-error.tsx`. The reference also ships Sentry example page/API: skip those.
