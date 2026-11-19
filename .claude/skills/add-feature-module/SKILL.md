---
name: add-feature-module
description: Scaffold a new feature module (tRPC router, prefetch helper, client hooks, components) following this project's feature-based structure. Use when adding a new domain such as workflows, credentials or executions.
---

# Add a feature module

Existing patterns: `src/features/auth`, `src/trcp/*`. Reference layout: `code-with-antonio/nodebase` (`src/features/workflows`).

## Steps

1. **Check the data model first.** If a Prisma model is missing or lacks a `userId` relation, use the `prisma-migrate` skill first. Ask the user if fields are unclear.
2. **Router**: `src/features/<name>/server/routers.ts`
   ```ts
   import { z } from "zod";
   import prisma from "@/lib/db";
   import { createTRPCRouter, protectedProcedure } from "@/trcp/init";

   export const <name>Router = createTRPCRouter({
     getMany: protectedProcedure.query(({ ctx }) =>
       prisma.<model>.findMany({ where: { userId: ctx.auth.user.id } })),
     getOne: protectedProcedure.input(z.object({ id: z.string() }))
       .query(({ ctx, input }) =>
         prisma.<model>.findUniqueOrThrow({ where: { id: input.id, userId: ctx.auth.user.id } })),
     create: protectedProcedure.mutation(({ ctx }) =>
       prisma.<model>.create({ data: { name: "...", userId: ctx.auth.user.id } })),
   });
   ```
   Always scope by `ctx.auth.user.id`; validate input with zod.
3. **Register** it in `src/trcp/routers/_app.ts`: `<name>: <name>Router`. Keep `export type AppRouter`.
4. **Prefetch helper** `server/prefetch.ts`: call `trpc.<name>.getMany.queryOptions(...)` on the server (`@/trcp/server`) so pages can hydrate.
5. **Hooks** `hooks/use-<name>.ts` (client): wrap `useTRPC()` + `useSuspenseQuery` / `useMutation`, invalidate related queries in `onSuccess`, toast with `sonner` in `onSuccess`/`onError`.
6. **Components** `components/*.tsx`: client components using the hooks; use shadcn primitives from `@/components/ui`.
7. Wire into a route using the `add-page` skill, then run `verify-changes`.

## Rules

- Import Prisma only from `@/lib/db`; import the tRPC dir as `@/trcp/...` (the folder is intentionally `trcp`).
- Server-only code (`@/trcp/server`, `requireAuth`) must not be imported from `"use client"` files.
- Pagination/search params, when needed, use `nuqs` (add the dependency only after confirming with the user).
- Don't modify unrelated files; additive changes only.
