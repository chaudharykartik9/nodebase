import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuth } = vi.hoisted(() => ({ requireAuth: vi.fn() }));

vi.mock("@/lib/auth-utils", () => ({ requireAuth }));
vi.mock("@/app/Logout-button", () => ({ default: () => null }));
vi.mock("@/app/workflows-scratch", () => ({ default: () => null }));

import Page from "@/app/page";

const read = (rel: string) =>
  readFileSync(path.resolve(__dirname, "../../src/app", rel), "utf8");

describe("home page (T06)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is a server component that requires authentication", async () => {
    requireAuth.mockResolvedValue({ user: { id: "u1" } });
    const el = await Page();
    expect(requireAuth).toHaveBeenCalledOnce();
    expect(el).toBeTruthy();
  });

  it("propagates the redirect/throw from requireAuth for signed-out users", async () => {
    requireAuth.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(Page()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("page.tsx is NOT a client component (it uses server-only requireAuth)", () => {
    expect(read("page.tsx")).not.toMatch(/^\s*["']use client["']/);
  });

  it("client scratch component uses the client hook, not server-only modules", () => {
    const src = read("workflows-scratch.tsx");
    expect(src).toMatch(/^\s*["']use client["']/);
    expect(src).toMatch(/useTRPC/);
    expect(src).not.toMatch(/@\/trcp\/server/);
    expect(src).not.toMatch(/@\/lib\/auth-utils/);
  });
});
