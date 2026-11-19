import "server-only"; // <-- ensure this file cannot be imported from the client
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import type { AppRouter } from "./routers/_app";
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});
// If your router is on a separate server, pass a client:
// createTRPCOptionsProxy<AppRouter>({
//   client: createTRPCClient<AppRouter>({
//     links: [httpLink({ url: "..." })],
//   }),
//   queryClient: getQueryClient,
// });

// ...
export const caller = appRouter.createCaller(createTRPCContext);

/**
 * Wraps client components so queries prefetched on the server
 * are sent to the browser (dehydrated) and reused (hydrated).
 */
export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

/**
 * Starts fetching a query on the server without awaiting it.
 * Works for normal and infinite queries.
 */
// biome-ignore lint/suspicious/noExplicitAny: matches the tRPC docs helper signature
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    // biome-ignore lint/suspicious/noExplicitAny: infinite options typing differs
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}
