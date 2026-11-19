import { HydrationBoundary, type QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

// One shared client so prefetch() and HydrateClient() see the same cache,
// like React's cache() does for a single server request.
const { shared } = vi.hoisted(() => ({ shared: { client: null as unknown } }));

vi.mock("@/trcp/query-client", async (orig) => {
  const mod = await orig<typeof import("@/trcp/query-client")>();
  return {
    ...mod,
    makeQueryClient: () => {
      shared.client = shared.client ?? mod.makeQueryClient();
      return shared.client;
    },
  };
});
vi.mock("@/lib/db", () => ({ default: {} }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { getQueryClient, HydrateClient, prefetch } from "@/trcp/server";

const options = (key: unknown[], fn = async () => "value") =>
  ({ queryKey: key, queryFn: fn }) as never;

describe("trcp/server helpers (T06)", () => {
  beforeEach(() => {
    (getQueryClient() as QueryClient).clear();
  });

  it("prefetch() puts the query into the shared client cache", async () => {
    prefetch(options(["workflows", { type: "query" }]));
    await (getQueryClient() as QueryClient).getQueryCache().findAll()[0]
      ?.promise;

    expect(
      (getQueryClient() as QueryClient).getQueryData([
        "workflows",
        { type: "query" },
      ]),
    ).toBe("value");
  });

  it("prefetch() is fire-and-forget (returns undefined, does not throw on failure)", async () => {
    const result = prefetch(
      options(["bad", { type: "query" }], async () => {
        throw new Error("boom");
      }),
    );
    expect(result).toBeUndefined();
  });

  it("prefetch() uses prefetchInfiniteQuery for infinite queries", () => {
    const qc = getQueryClient() as QueryClient;
    const infinite = vi.spyOn(qc, "prefetchInfiniteQuery").mockResolvedValue();
    const normal = vi.spyOn(qc, "prefetchQuery").mockResolvedValue();

    prefetch(options(["list", { type: "infinite" }]));

    expect(infinite).toHaveBeenCalledOnce();
    expect(normal).not.toHaveBeenCalled();
    infinite.mockRestore();
    normal.mockRestore();
  });

  it("HydrateClient wraps children in a HydrationBoundary with dehydrated state", async () => {
    const qc = getQueryClient() as QueryClient;
    await qc.prefetchQuery({ queryKey: ["a"], queryFn: async () => 42 });

    const child = "child";
    const el = HydrateClient({ children: child }) as React.ReactElement<{
      state: { queries: { queryKey: unknown[] }[] };
      children: string;
    }>;

    expect(el.type).toBe(HydrationBoundary);
    expect(el.props.children).toBe(child);
    expect(el.props.state.queries.map((q) => q.queryKey)).toContainEqual(["a"]);
  });
});
