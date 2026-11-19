import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuth } = vi.hoisted(() => ({ requireAuth: vi.fn() }));

vi.mock("@/lib/auth-utils", () => ({ requireAuth }));
vi.mock("@/app/workflows-scratch", () => ({ default: () => null }));
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));
vi.mock("@/trcp/client", () => ({
  TRPCReactProvider: function TRPCReactProvider() {
    return null;
  },
}));

import { Provider as JotaiProvider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import CredentialsPage from "@/app/(dashboard)/(rest)/credentials/page";
import ExecutionsPage from "@/app/(dashboard)/(rest)/executions/page";
import WorkflowsPage from "@/app/(dashboard)/(rest)/workflows/page";
import RootLayout, { metadata } from "@/app/layout";
import WorkflowsScratch from "@/app/workflows-scratch";
import nextConfig from "../../next.config";

const root = path.resolve(__dirname, "../..");

/** Depth-first list of element types in a React element tree. */
const typesIn = (node: ReactNode, out: unknown[] = []): unknown[] => {
  if (Array.isArray(node)) {
    for (const n of node) typesIn(n, out);
  } else if (isValidElement(node)) {
    out.push(node.type);
    typesIn(
      (node as ReactElement<{ children?: ReactNode }>).props.children,
      out,
    );
  }
  return out;
};

beforeEach(() => vi.clearAllMocks());

describe("route structure (T08)", () => {
  it.each([
    "src/app/(dashboard)/layout.tsx",
    "src/app/(dashboard)/(rest)/layout.tsx",
    "src/app/(dashboard)/(rest)/workflows/page.tsx",
    "src/app/(dashboard)/(rest)/credentials/page.tsx",
    "src/app/(dashboard)/(rest)/executions/page.tsx",
    "src/components/app-sidebar.tsx",
    "src/components/app-header.tsx",
  ])("%s exists", (file) => {
    expect(existsSync(path.join(root, file))).toBe(true);
  });

  it("the sidebar logo asset exists in public/", () => {
    expect(existsSync(path.join(root, "public/logo/logo.svg"))).toBe(true);
  });

  it("the sidebar only links to routes that have a page", () => {
    const sidebar = readFileSync(
      path.join(root, "src/components/app-sidebar.tsx"),
      "utf8",
    );
    for (const url of [...sidebar.matchAll(/url: "(\/[a-z]+)"/g)].map(
      (m) => m[1],
    )) {
      expect(
        existsSync(
          path.join(root, `src/app/(dashboard)/(rest)${url}/page.tsx`),
        ),
      ).toBe(true);
    }
  });
});

describe("placeholder pages (T08)", () => {
  it.each([
    ["workflows", WorkflowsPage],
    ["credentials", CredentialsPage],
    ["executions", ExecutionsPage],
  ])("%s page requires authentication and renders", async (_name, Page) => {
    requireAuth.mockResolvedValue({ user: { id: "u1" } });
    const el = await Page();
    expect(requireAuth).toHaveBeenCalledOnce();
    expect(isValidElement(el)).toBe(true);
  });

  it.each([
    ["workflows", WorkflowsPage],
    ["credentials", CredentialsPage],
    ["executions", ExecutionsPage],
  ])(
    "%s page lets the signed-out redirect propagate (-> /login)",
    async (_name, Page) => {
      requireAuth.mockRejectedValue(new Error("NEXT_REDIRECT"));
      await expect(Page()).rejects.toThrow("NEXT_REDIRECT");
    },
  );

  it("workflows page keeps the temporary create / test-job buttons reachable", async () => {
    requireAuth.mockResolvedValue({ user: { id: "u1" } });
    expect(typesIn(await WorkflowsPage())).toContain(WorkflowsScratch);
  });
});

describe("root layout providers (T08)", () => {
  it("nests TRPC > Nuqs adapter > Jotai provider, with the Toaster inside", () => {
    const tree = RootLayout({ children: "kids" });
    const types = typesIn(tree);
    const idx = (t: unknown) => types.indexOf(t);

    const trpc = types.find(
      (t) =>
        typeof t === "function" &&
        (t as { name: string }).name === "TRPCReactProvider",
    );
    expect(idx(trpc)).toBeGreaterThan(-1);
    expect(idx(NuqsAdapter)).toBeGreaterThan(idx(trpc));
    expect(idx(JotaiProvider)).toBeGreaterThan(idx(NuqsAdapter));
    expect(idx(Toaster)).toBeGreaterThan(idx(JotaiProvider));
  });

  it("renders children inside the providers", () => {
    const tree = RootLayout({ children: "kids" }) as ReactElement<{
      children: ReactNode;
    }>;
    expect(
      JSON.stringify(tree, (_k, v) => (typeof v === "function" ? "fn" : v)),
    ).toContain("kids");
  });

  it("no longer uses the create-next-app default metadata", () => {
    expect(metadata.title).toBe("Nodebase");
    expect(String(metadata.description)).not.toMatch(/create next app/i);
  });
});

describe("next.config redirects (T08)", () => {
  it("temporarily redirects / to /workflows", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual([
      { source: "/", destination: "/workflows", permanent: false },
    ]);
  });
});
