# Nodebase

A workflow-automation SaaS (n8n / Zapier style): users build node-based workflows in a visual editor, wire triggers to actions (HTTP, AI models, Slack, Discord…), and run them as background jobs. The project follows the public reference repo `code-with-antonio/nodebase`; this repo is built up step by step, so **most reference features are not implemented yet**.

> Requirements are still being finalised. Do not refactor or "fix" existing code unless asked. Prefer additive changes and ask when the requirement is unclear.

## Stack (actual, from package.json)

- Next.js 15.5 (App Router, Turbopack), React 19, TypeScript strict
- tRPC 11 + TanStack Query 5 (`@trpc/tanstack-react-query`)
- Prisma 7 with `@prisma/adapter-pg` on Neon Postgres; client generated to `src/generated/prisma`
- better-auth (email + password, Prisma adapter)
- Tailwind CSS 4, shadcn/ui (`src/components/ui`), `sonner` toasts, `react-hook-form` + `zod` 4
- Biome 2 for lint/format (not ESLint/Prettier)

Inngest v4 (background jobs; `src/inngest/`, route `api/inngest`; client must set `isDev` for local dev) + mprocs.

Planned (from the reference repo, not installed yet): `@xyflow/react` editor, Jotai, `@inngest/realtime`, `ai` SDK providers, Handlebars templating, Sentry, Polar billing, nuqs search params, superjson.

## Commands

```bash
npm run dev          # next dev --turbopack
npm run build        # next build --turbopack
npm run lint         # biome check
npm run format       # biome format --write
npm run dev:all      # next + inngest dev server via mprocs (or `npm run inngest:dev` separately)
npx prisma generate  # REQUIRED after clone / schema change (src/generated is gitignored)
npx prisma migrate dev --name <snake_case_name>
npx tsc --noEmit     # typecheck (no script defined; ignore stale errors under .next/)
npm test             # vitest run
```

## Layout

```
prisma/schema.prisma        models + migrations/
prisma.config.ts            reads DATABASE_URL from .env
src/app/                    routes: (auth)/login, (auth)/signup, api/auth/[...all], api/trpc/[trpc]
src/lib/                    db.ts (Prisma singleton), auth.ts, auth-client.ts, auth-utils.ts, utils.ts
src/trcp/                   tRPC setup: init.ts, client.tsx, server.tsx, query-client.ts, routers/_app.ts
src/features/<feature>/     feature modules (currently only auth/)
src/components/ui/          shadcn primitives, do not hand-edit casually
src/hooks/                  shared hooks
```

## Conventions

- **Path alias:** `@/*` → `src/*`. Prisma client import is `@/generated/prisma/client`.
- **tRPC directory is spelled `trcp`** (typo vs. the reference repo's `trpc`). Keep using `@/trcp/...` until the user renames it; never create a second `trpc` folder.
- **Prisma singleton:** always `import prisma from "@/lib/db"`. Never instantiate `PrismaClient` elsewhere.
- **Auth in server components/pages:** `requireAuth()` / `requireUnauth()` from `@/lib/auth-utils`.
- **Auth in tRPC:** use `protectedProcedure` (adds `ctx.auth` with session). Scope every query by `ctx.auth.user.id`.
- **Client auth:** `authClient` from `@/lib/auth-client`.
- **Feature-based structure:** new domain code goes in `src/features/<name>/{components,hooks,server,params.ts}`; routers are merged in `src/trcp/routers/_app.ts`.
- **Forms:** `react-hook-form` + `zodResolver` + shadcn `Form`; toast feedback via `sonner`.
- Biome: 2-space indent, organised imports. Run `npm run lint` before finishing.
- Prisma models should be PascalCase and mapped to snake/lowercase tables with `@@map` (see existing auth models).

## Known quirks in current code (do not fix unprompted)

- `src/app/page.tsx` is a scratch page (server) rendering `workflows-scratch.tsx`; replaced by the dashboard in T08.
- tRPC context (`src/trcp/init.ts`) is an empty object; identity comes from `protectedProcedure` (`ctx.auth`).
- The demo procedures `getWorkFlows` / `createWorkflow` in `_app.ts` are temporary; replaced by a `workflows` feature router in T09.
- Migration `20261119150000_workflow_user_relation` may still be unapplied: check `npx prisma migrate status` (it deletes old `workflow` test rows).
- Old lint noise in `src/trcp/{client,init,query-client,server}` (unused imports, formatting) is pre-existing.
- `User` still has a leftover `posts Post[]` relation/`Post` model from the Prisma starter.
- `.env` needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Neon: use the **direct** (non-`-pooler`) URL for migrations.
- Tests: `npm test` (Vitest, `tests/`). `vitest` is pinned to v3 because v5 needs `@types/node` >= 22.

## Target architecture (from the reference repo)

Use as guidance when a feature is requested, and confirm scope first.

- `Workflow`, `Node`, `Connection`, `Credential`, `Execution` models; `NodeType` enum (INITIAL, MANUAL_TRIGGER, HTTP_REQUEST, GOOGLE_FORM_TRIGGER, STRIPE_TRIGGER, ANTHROPIC, GEMINI, OPENAI, DISCORD, SLACK).
- Editor under `src/features/editor` (React Flow canvas, Jotai atoms).
- Execution engine: Inngest function `execute-workflow` topologically sorts nodes, then runs each via `executorRegistry[node.type]`, threading a `context` object between nodes and publishing status over realtime channels.
- Each node = `node.tsx` (canvas UI) + `dialog.tsx` (config form) + `executor.ts` (runtime) + `actions.ts` (realtime token) + Inngest channel.
- Credentials encrypted with `cryptr`; webhooks under `api/webhooks/*`; premium gating via Polar.

See the project skills in `.claude/skills/` for step-by-step recipes.

## Project skills

| Skill | Use when |
|---|---|
| `add-feature-module` | Adding a new domain (router + hooks + components) |
| `add-page` | Adding an authenticated or public route |
| `prisma-migrate` | Changing the schema / running migrations |
| `add-workflow-node` | Adding a trigger or action node (once editor + Inngest exist) |
| `verify-changes` | Before declaring any task done |

## Development workflow (read before any task)

Work is planned in `requirements/` (index: `requirements/README.md`, rules: `requirements/00-workflow-rules.md`, one file per task in `requirements/tasks/`).

- Implement **one task at a time**, only when the user says to start it.
- **Never run git branch/switch/commit/merge/push.** Tell the user which branch to create before a task and say when it is ready to review/commit.
- Teaching goes in `understand.md` (repo root, append a section per branch with What/Why/How/Where/Code/Flow/Examples), not in chat.
- Inspect existing code first; never overwrite working code to mimic the reference; warn about impact before touching existing files.
