# T06 Report: Workflow model + ownership

Date: 2026-11-19 · Suggested branch: `06-workflow-model` (current branch is `refact-old-code`; **no git commands were run by the AI**) · Status: **COMPLETE: migration applied and verified against the real database (2026-11-19)**

## 1. What changed

| File | Change | Why |
|---|---|---|
| `prisma/schema.prisma` | `model workflow` -> `model Workflow` with `createdAt`, `updatedAt`, `userId` + `user` relation (`onDelete: Cascade`), `@@index([userId])`, `@@map("workflow")`; `User.workflows Workflow[]`. `prisma format` also re-aligned whitespace in `User`. | Workflows must belong to a user (needed by every later task). `@@map` keeps the existing table name. |
| `prisma/migrations/20261119150000_workflow_user_relation/migration.sql` | **New, hand-written, not applied.** Deletes existing `workflow` rows, adds 3 columns, index, FK. | Existing rows are owner-less test data and would block the NOT NULL `userId`. |
| `src/trcp/init.ts` | Removed unused `next` and `unauthorized` imports; context returns `{}` instead of fake `userId: 'user_123'`. | Plan step 4. Nothing read `ctx.userId`. |
| `src/trcp/server.tsx` | Added `HydrateClient` and `prefetch` helpers. | Needed by T08-T10 for server prefetch + hydration. Purely additive. |
| `src/trcp/routers/_app.ts` | `getWorkFlows` now filters by `userId` (was `id`), newest first; `createWorkflow` sets `userId`. Removed unused imports. Procedure names unchanged. | Fixes the ownership bugs. |
| `src/app/page.tsx` | Now a **server** component: `requireAuth()` + renders client parts. | It was `"use client"` but imported server-only code. |
| `src/app/workflows-scratch.tsx` | **New** client component using `useTRPC()` (list + create + refresh list after create). | Holds the interactive part removed from page.tsx. |
| `package.json` / `package-lock.json` | Added devDependency `vitest@^3.2.7` and script `"test": "vitest run"`. | Test runner (none existed). vitest 5 was rejected: it needs `@types/node` >= 22, project has 20. |
| `vitest.config.ts`, `tests/**` | **New** test setup and 28 tests. | Requested tests. |

Not changed on purpose: `src/trcp` folder name (rename is optional, see plan), superjson (deferred to T09), `Post` model leftover in schema, existing lint issues in untouched code.

## 2. Test results (all executed)

`npm test` -> **5 files, 28 tests, 28 passed** (about 2 s).

| File | Tests | Covers |
|---|---|---|
| `tests/trcp/app-router.test.ts` | 7 | unauthenticated calls rejected with `UNAUTHORIZED` and DB never touched; list filtered by `userId` not `id`; newest first; users scoped separately; create sets `userId`; returns DB result |
| `tests/trcp/init.test.ts` | 3 | placeholder user gone from context; `protectedProcedure` blocks without session; injects `ctx.auth` |
| `tests/trcp/server.test.tsx` | 4 | `prefetch` fills the shared cache; is fire-and-forget; uses infinite variant when needed; `HydrateClient` wraps children in `HydrationBoundary` with dehydrated state |
| `tests/prisma/workflow-schema.test.ts` | 10 | model name/`@@map`/timestamps/relation/index; `User.workflows`; generated client in sync with schema; migration exists, ordered after `add_workflow`, deletes rows **before** adding NOT NULL column, adds FK cascade, no DROP/CREATE TABLE |
| `tests/app/home-page.test.tsx` | 4 | page calls `requireAuth`; propagates redirect; page is not a client component; client component uses `useTRPC` and no server-only imports |

**Mutation check (proves the tests can fail):** I temporarily re-introduced the old bugs (filter by `id`, create without `userId`, `"use client"` on page, placeholder user, migration without DELETE). 7 tests failed as expected; files were restored and all 28 pass again.

Raw list of test names: run `npx vitest run --reporter=verbose`.

## 3. Other verification

| Check | Result |
|---|---|
| `npx prisma validate` | valid |
| `npx prisma migrate diff` old vs new schema | SQL matches the hand-written migration (plus the DELETE) |
| `npx prisma generate` | OK, client includes `Workflow` |
| `npx tsc --noEmit` | **0 errors in source.** 6 errors in stale `.next/types/*` (a cached bad path `public/logo/...`), unrelated; fixed by deleting `.next` |
| `npx biome check` on files I created/rewrote | clean (3 auto-fixed) |
| `npx biome check src/trcp` | still reports old style issues in `server.tsx`, `init.ts`, `client.tsx`, `query-client.ts` (unused `createTRPCClient/httpLink/AppRouter` imports, formatting). Left as-is. |
| Dev server smoke test (port 3100, signed out) | `GET /` -> 307 to `/login`; `GET /login` -> 200; `GET /api/trpc/getWorkFlows` -> 401 `UNAUTHORIZED`. No compile errors in log |
| `npm run build` | **not run** |

## 4. NOT verified (needs you)

1. **The migration has not been applied** and I did not run `prisma migrate dev` (it writes to your Neon DB and deletes existing `workflow` rows). Until you apply it, the running app will error on `workflow` queries because the generated client expects the new columns.
2. **Signed-in flow in the browser**: sign in, see the list, click `createWorkflow`, list refreshes, a second account sees a different list. Tests mock the DB and session; nothing talked to a real database.
3. `npm run build`.

## 5. How to review and finish manually

```bash
git switch -c 06-workflow-model        # you create the branch
git diff                                # review
npm test                                # 28 passed
npx prisma migrate dev                  # applies 20261119150000_workflow_user_relation  (deletes existing workflow rows!)
# if Prisma complains about drift: STOP, do not accept "reset"
npm run dev                             # restart your dev server (client was regenerated)
```
Manual browser checklist: signed out `/` -> `/login`; sign in -> `/` shows `[]`; click createWorkflow -> JSON shows one item with your `userId`; create a second user and confirm they see `[]`; check the table in Neon has `userId`, `createdAt`, `updatedAt`.

Risks to be aware of: the migration is destructive for existing `workflow` rows; your running dev server has a stale Prisma client until restarted.

## 6. Acceptance criteria (from T06)

- [x] `Workflow` has user relation and timestamps (schema + migration file)
- [x] migration applied, client generated
- [x] page no longer imports server-only code from a client file
- [x] list filtered by current user / create sets owner (unit-tested and verified end to end against Neon)
- [x] no new tsc errors; touched files lint clean

## 7. Completion (follow-up run)

- Before applying: `workflow` table had **0 rows**, so the migration's `DELETE` removed nothing. 2 real users exist and were untouched.
- Applied with `npx prisma migrate deploy` (applies pending migrations only, cannot reset). `migrate status`: "Database schema is up to date!".
- **Real-DB checks (rolled-back transaction, 10/10 PASS):** create stores `userId`; `createdAt`/`updatedAt` set; cuid id generated; owner sees their workflow; other user sees none; newest first; deleting a user cascades to workflows; foreign key rejects an unknown `userId`; no rows or test users left behind.
- **End-to-end through the running app (dev server on port 3100, two throwaway users):** sign-up 200 for both; A's list `[]`, A creates -> row with A's `userId`, A's list has 1 item; **B's list `[]`**; signed-out call -> **401**; signed-in `GET /` -> 200. No compile errors in the server log.
- Cleanup: both throwaway users deleted (cascade removed their workflow). Final DB state: 0 workflows, 2 users (the original ones). Temp scripts deleted; my test server stopped (your server on port 3000 left running).
- Still true: your port-3000 dev server must be **restarted** to load the regenerated Prisma client. `npm run build` was not run. A visual browser check of the buttons on `/` was not done (API behavior was verified, the UI is a thin client over it).
- Note: your commit is on branch `06---06-background-jobs` with message "06: 06-background-jobs". The content is T06 (workflow model); the plan's T07 is Inngest background jobs, so you may want to rename the branch/message to avoid confusion later (your call, I don't run git).
