# T08: Dashboard layout (route groups, sidebar, header, providers)

**Branch:** `08-dashboard-layout` · **Size:** M · **Depends on:** T06

## Goal
Authenticated app shell: sidebar navigation (Workflows, Credentials, Executions, Logout), header, route groups, and global providers.

## Reference
`src/app/(dashboard)/layout.tsx`, `(rest)/layout.tsx`, `(editor)`, `components/app-sidebar.tsx`, `components/app-header.tsx`, `app/layout.tsx` (Jotai + Nuqs providers), `src/lib/auth-utils.ts`.

## Plan
1. Install `jotai`, `nuqs` (ask first).
2. `app/layout.tsx`: add `NuqsAdapter` and Jotai `Provider` around children; fix metadata title/description (reference still shows "Create Next App"; ours can be "Nodebase").
3. Route groups: `(dashboard)/layout.tsx` (SidebarProvider + AppSidebar + SidebarInset), `(dashboard)/(rest)/layout.tsx` (header + padded content), `(dashboard)/(editor)` reserved for T12.
4. Placeholder pages: `(rest)/workflows`, `(rest)/credentials`, `(rest)/executions` with `requireAuth()`.
5. `components/app-sidebar.tsx`: menu items + active link, sign-out using existing `authClient.signOut` (reuse `Logout-button` logic), billing items only after T11.
6. `components/app-header.tsx`: `SidebarTrigger`.
7. Make `/` redirect to `/workflows`. Reference does this in `next.config.ts` (`redirects()`: source `/` -> `/workflows`, `permanent: false`) and also sets `devIndicators: false`. That is a small edit to your existing `next.config.ts` (ask first); `app/page.tsx` can then be deleted or left as scratch.
8. Logo asset into `public/logos/` if needed.

## Files
Create: layouts, 3 placeholder pages, `app-sidebar.tsx`, `app-header.tsx`. Modify: `app/layout.tsx`, `app/page.tsx`.

## Risks
Existing `Toaster` import (from `sonner`) must keep working; wrapping with providers must not break TRPC provider order. Sidebar component version differences (our `sidebar.tsx` uses newer shadcn) may need small prop adjustments.

## Acceptance
Signed-out users go to `/login`; signed-in see sidebar + header; nav links work; logout works; mobile sidebar toggles.

## understand.md topics
App Router route groups and nested layouts; server layouts vs client sidebar; providers and context; Jotai/Nuqs basics (just the adapter now).

## Out of scope
Data lists, upgrade/billing UI.
