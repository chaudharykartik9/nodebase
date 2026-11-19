---
name: add-page
description: Add a new App Router page or route group with correct auth guarding, tRPC prefetch/hydration and Suspense. Use when creating dashboard pages or public pages.
---

# Add a page

## Authenticated server page (preferred)

```tsx
// src/app/(dashboard)/<route>/page.tsx
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary"; // only if installed; ask before adding
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trcp/server"; // add this helper if missing (see below)
import { prefetch<Name> } from "@/features/<name>/server/prefetch";
import { <Name>List } from "@/features/<name>/components/<name>-list";

export default async function Page() {
  await requireAuth();
  prefetch<Name>();
  return (
    <HydrateClient>
      <Suspense fallback={<p>Loading…</p>}>
        <<Name>List />
      </Suspense>
    </HydrateClient>
  );
}
```

`HydrateClient` and `prefetch` are not in `src/trcp/server.tsx` yet. The reference repo defines them there:

```ts
export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>;
}
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptions: T) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") void queryClient.prefetchInfiniteQuery(queryOptions as any);
  else void queryClient.prefetchQuery(queryOptions);
}
```
Adding these is an edit to an existing file: tell the user and get agreement first.

## Public / auth pages

Use `await requireUnauth()` so signed-in users get redirected to `/`. Auth pages live in `src/app/(auth)` and share `(auth)/layout.tsx`.

## Rules

- Pages are server components by default. Put interactivity in a child `"use client"` component.
- Never call `useTRPC`/`useQuery` in a page that also imports server-only modules (the current `src/app/page.tsx` does this; don't copy it).
- Use route groups: `(auth)`, `(dashboard)`, nested `(editor)` / `(rest)` as in the reference repo when the dashboard is built.
- Run `verify-changes` afterwards.
