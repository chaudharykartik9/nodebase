# T09: Workflows backend CRUD + search/pagination params

**Branch:** `09-workflows-backend` · **Size:** M · **Depends on:** T06, T08

## Goal
A `workflows` feature module: tRPC router (`create`, `remove`, `updateName`, `getOne`, `getMany` with search + pagination), URL params loader, prefetch helpers.

## Reference
`src/features/workflows/server/{routers,prefetch,params-loader}.ts`, `features/workflows/params.ts`, `src/config/constants.ts`, `trpc/routers/_app.ts`.

## Plan
1. Install `nuqs` (if not yet), `random-word-slugs`, decide on `superjson` (ask).
2. `src/config/constants.ts`: `PAGINATION` defaults.
3. `features/workflows/params.ts`: nuqs parsers (`page`, `pageSize`, `search`) with `clearOnDefault`.
4. `server/params-loader.ts`: `createLoader(workflowsParams)`.
5. `server/routers.ts`: all procedures scoped by `ctx.auth.user.id`; `getMany` returns `{items, page, pageSize, totalCount, totalPages, hasNextPage, hasPreviousPage}`; `create` generates slug name (and, after T12, an INITIAL node).
6. `server/prefetch.ts`: `prefetchWorkflows(params)`, `prefetchWorkflow(id)`.
7. `trcp/routers/_app.ts`: `workflows: workflowsRouter`; remove demo procedures (confirm first; page.tsx scratch usage must be gone by T08/T10).
8. Quick test via a throwaway script or the tRPC caller.

## Files
Create: `src/config/constants.ts`, `src/features/workflows/{params.ts, server/*}`. Modify: `_app.ts`.

## Risks
Removing demo procedures breaks any page still using them. Pagination query must use `Promise.all([findMany, count])` with matching `where`.

## Acceptance
All procedures reject other users' data; search and pagination return correct totals; types flow to client (`inferInput`).

## understand.md topics
tRPC routers/procedures/input validation with zod; authorization by ownership; pagination math; URL state with nuqs; server-side prefetch.

## Out of scope
UI (T10), premium gating (T11).
