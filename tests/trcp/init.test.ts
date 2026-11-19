import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import {
  createCallerFactory,
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
} from "@/trcp/init";

describe("trcp/init (T06)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("context no longer contains the hard-coded placeholder user", async () => {
    const ctx = await createTRPCContext();
    expect(ctx).toEqual({});
    expect(ctx).not.toHaveProperty("userId");
  });

  it("protectedProcedure throws UNAUTHORIZED without a session", async () => {
    getSession.mockResolvedValue(null);
    const router = createTRPCRouter({
      ping: protectedProcedure.query(() => "pong"),
    });
    const call = createCallerFactory(router)({});

    await expect(call.ping()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("protectedProcedure injects the session as ctx.auth", async () => {
    const s = { user: { id: "u1" }, session: { id: "s1" } };
    getSession.mockResolvedValue(s);
    const router = createTRPCRouter({
      who: protectedProcedure.query(({ ctx }) => ctx.auth.user.id),
    });
    const call = createCallerFactory(router)({});

    await expect(call.who()).resolves.toBe("u1");
  });
});
