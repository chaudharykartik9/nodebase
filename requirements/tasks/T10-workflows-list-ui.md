# T10: Workflows list UI

**Branch:** `10-workflows-list-ui` · **Size:** M · **Depends on:** T09

## Goal
Workflows page: header with "New workflow", search box, list with delete, pagination, loading/error/empty states.

## Reference
`features/workflows/components/workflows.tsx`, `components/entity-components.tsx`, `hooks/use-entity-search.tsx`, `features/workflows/hooks/*`, `(rest)/workflows/page.tsx`.

## Plan
1. Install `react-error-boundary` (ask).
2. Generic `components/entity-components.tsx` (EntityContainer, EntityHeader, EntitySearch, EntityPagination, EntityList, EntityItem, Loading/Error/Empty views). Build on our shadcn `button`, `input`, `empty`, `spinner`, `alert-dialog`.
3. `hooks/use-entity-search.tsx` (debounced search -> nuqs param).
4. `features/workflows/hooks/{use-workflows-params,use-workflows}.ts`: `useSuspenseWorkflows`, `useCreateWorkflow`, `useRemoveWorkflow` (toast + invalidate queries).
5. `features/workflows/components/workflows.tsx`.
6. `(rest)/workflows/page.tsx`: `requireAuth`, load params, `prefetchWorkflows`, `HydrateClient` + `ErrorBoundary` + `Suspense`.
7. Create -> navigate to `/workflows/[id]` (page arrives in T12).

## Files
Create: components, hooks, page content. Modify: placeholder `workflows/page.tsx`.

## Risks
Our UI kit is a newer shadcn: some component props differ (e.g. `Empty`, `Item`). Verify, don't assume.

## Acceptance
Create, search (debounced), paginate, delete all work with toasts; refresh keeps URL state; server prefetch means no loading flash.

## understand.md topics
Suspense + React Query; `useSuspenseQuery` vs `useQuery`; optimistic vs invalidated cache; error boundaries; reusable entity components; debounced search.

## Out of scope
Rename inline in editor (T13), upgrade modal (T11).
