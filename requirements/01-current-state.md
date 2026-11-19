# Current state vs reference (snapshot 2026-11-19)

Reference: `code-with-antonio/nodebase` (Prisma 6, `@/trpc`, Polar, Inngest, React Flow, Sentry). Yours: Prisma 7, `@/trcp`, shadcn on `@base-ui/react` + `radix-ui`.

## How this plan was verified
Reference repo cloned and read. **Read in full or in large part:** schema, tRPC init, workflows router/prefetch/hooks/params-loader, credentials router, Inngest client/utils/functions/channel, executor types/registry, HTTP/Gemini/Discord/Stripe executors, base execution node, node-status hook, editor/editor-header/execute button/atoms/node-selector, editor page, both webhook routes, `lib/{auth,polar,encryption,utils}`, `next.config.ts`, `instrumentation.ts`, layouts. **Only skimmed by file name (re-check when the task starts):** dialogs/forms, `entity-components`, sidebar, upgrade modal, Slack/OpenAI/Anthropic executors, executions list/detail UI, `use-entity-search`, credentials UI.

## Done (committed)
| Area | Evidence |
|---|---|
| Next.js 15 + Biome + Tailwind 4 | `package.json`, `biome.json` |
| shadcn UI components (full set) | `src/components/ui/*` |
| tRPC + React Query setup | `src/trcp/{init,client,server,query-client}.ts(x)`, `api/trpc/[trpc]/route.ts`, provider in `layout.tsx` |
| Auth (better-auth, email/password) | `src/lib/auth*.ts`, `api/auth/[...all]`, login/signup pages, `features/auth/*`, `protectedProcedure`, `requireAuth/requireUnauth` |
| Theme/styling | `globals.css`, `next-themes` dep |
| Prisma 7 + Neon | `prisma.config.ts`, `src/lib/db.ts`, 2 migrations (init, better_auth) |

## Uncommitted / in progress (belongs to T06)
- `prisma/schema.prisma`: lowercase `model workflow {id, name}` with no user relation, no timestamps.
- Migration `20261119121540_add_workflow` (applied to Neon).
- `src/app/page.tsx`: client-component playground using `useQuery(trpc.getWorkFlows...)` (imports server-only `@/trcp/server` in a client file: likely broken).
- `src/trcp/routers/_app.ts`: `getWorkFlows` / `createWorkflow` demo procedures; filter by the wrong id; create has no `userId`.

## Partial
- `trcp/init.ts`: `createTRPCContext` returns placeholder `userId`; no `superjson`; no `premiumProcedure`; unused imports (`next`, `unauthorized`).
- `trcp/server.tsx`: has `trpc`, `caller`, `getQueryClient`; **missing `HydrateClient` and `prefetch`**.
- `layout.tsx`: has TRPC provider + `sonner` Toaster directly; missing Jotai `Provider`, `NuqsAdapter`; metadata still "Create Next App".
- Home page is not a dashboard, no route groups.

## Missing (all of the product)
Inngest · dashboard layout/sidebar/header · workflows CRUD + list UI + search/pagination · Polar billing · React Flow editor · Node/Connection/Credential/Execution models · executor engine · all nodes (manual, HTTP, Google Form, Stripe, Gemini, OpenAI, Anthropic, Discord, Slack) · realtime status · credentials + encryption · executions history · Sentry · ngrok/mprocs dev tooling.

## Dependencies to add over time (not now)
`superjson` (T06/T09) · `nuqs`, `jotai`, `random-word-slugs`, `react-error-boundary` (T08-T10) · `inngest`, `@inngest/realtime`, `inngest-cli`, `dotenv-cli`, `mprocs` (T07) · `@polar-sh/sdk`, `@polar-sh/better-auth` (T11) · `@xyflow/react` (T12) · `toposort`, `handlebars`, `ky` (T14) · `cryptr` (T17) · `ai`, `@ai-sdk/*` (T18) · `@sentry/nextjs` (T21).

## Version-drift risks (reference vs yours)
- Prisma 7: generated client at `@/generated/prisma/client` (reference imports `@/generated/prisma`); driver adapter required (already done).
- `react-resizable-panels` 4.x (reference 3.x) and `lucide-react` 1.x (reference 0.544): APIs/icon names can differ; verify when used.
- shadcn components in your repo may differ from reference (e.g. `sonner` imported from `sonner` directly, not `@/components/ui/sonner`).
- `@ai-sdk/*` v2 / `ai` v5 in reference: confirm current versions when T18 starts.
