# T06: Workflow model + ownership

**Branch:** `06-workflow-model` (create this first; your current uncommitted work belongs here)
**Size:** S · **Depends on:** nothing

## Goal
Turn the tutorial playground into a correct `Workflow` model owned by a user, with a clean tRPC context and no broken imports, so later tasks build on solid ground.

## Reference
`prisma/schema.prisma` (Workflow), `src/trpc/init.ts`, `src/trpc/server.tsx`, `src/app/layout.tsx`.

## Current state
Lowercase `workflow` model with only `id`, `name` and no user relation (already migrated to Neon). `_app.ts` demo procedures are wrong (see `01-current-state.md`). `page.tsx` is a client playground importing server-only code.

## Plan
1. **Decide with you:** keep demo data or wipe (table only has test rows).
2. Schema: rename to `Workflow` (`@@map("workflow")` keeps the existing table; avoids data loss), add `createdAt`, `updatedAt`, `userId` + `user` relation (`onDelete: Cascade`), and `workflows Workflow[]` on `User`. Existing rows have no `userId`; plan = delete test rows in the migration SQL or make the migration add the column after clearing (**ask before running**).
3. Migration via `prisma-migrate` skill: `npx prisma migrate dev --name workflow_user_relation`, then `prisma generate`.
4. `trcp/init.ts`: remove unused imports and the placeholder context user; keep `protectedProcedure`. Add `superjson` transformer **only if** we agree now (needs both `init.ts` and `client.tsx`/`query-client.ts`/`server.tsx`; otherwise do it in T09).
5. `trcp/server.tsx`: add `HydrateClient` and `prefetch` helpers (needed by T08-T10).
6. `_app.ts`: fix demo procedures (`where: { userId }`, `create` with `userId`). They will be replaced by a feature router in T09.
7. `app/page.tsx`: split into a server page (`requireAuth`) + small client component, or keep as a scratch page; decide with you.
8. Optional rename `src/trcp` -> `src/trpc` (separate commit-sized step, ask first).

## Files
Modify: `prisma/schema.prisma`, `src/trcp/init.ts`, `src/trcp/server.tsx`, `src/trcp/routers/_app.ts`, `src/app/page.tsx`. Create: new migration folder.

## Risks to existing work
Migration alters a live table (data loss for test rows). Renaming the model changes `prisma.workflow` -> `prisma.workflow` (delegate name stays lowercase-first, so call sites keep working). Fixing page.tsx changes visible behavior of the home page.

## Acceptance
- `Workflow` has a user relation and timestamps; migration applied; client generated.
- Home page loads when signed in, lists only the current user's workflows, create adds one owned by them.
- Lint/tsc show no new errors.

## understand.md topics
Prisma models/relations/migrations; why `@@map`; tRPC context and `protectedProcedure`; server vs client components; why server-only modules can't be imported in client code.

## Out of scope
Dashboard UI, CRUD routers, Inngest.
