import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, getSession, inngestSend } = vi.hoisted(() => ({
  prismaMock: {
    workflow: { findMany: vi.fn(), create: vi.fn() },
  },
  getSession: vi.fn(),
  inngestSend: vi.fn(),
}));

vi.mock("@/inngest/client", () => ({ inngest: { send: inngestSend } }));

vi.mock("@/lib/db", () => ({ default: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { appRouter } from "@/trcp/routers/_app";

const session = (id: string) => ({ user: { id }, session: { id: "s1" } });
const caller = () => appRouter.createCaller({});

describe("appRouter (T06)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("getWorkFlows rejects unauthenticated callers", async () => {
      getSession.mockResolvedValue(null);
      await expect(caller().getWorkFlows()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      expect(prismaMock.workflow.findMany).not.toHaveBeenCalled();
    });

    it("createWorkflow rejects unauthenticated callers", async () => {
      getSession.mockResolvedValue(null);
      await expect(caller().createWorkflow()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      expect(prismaMock.workflow.create).not.toHaveBeenCalled();
    });
  });

  describe("getWorkFlows", () => {
    it("filters by the signed-in user's userId (not by workflow id)", async () => {
      getSession.mockResolvedValue(session("user-A"));
      prismaMock.workflow.findMany.mockResolvedValue([]);

      await caller().getWorkFlows();

      const arg = prismaMock.workflow.findMany.mock.calls[0][0];
      expect(arg.where).toEqual({ userId: "user-A" });
      expect(arg.where).not.toHaveProperty("id");
    });

    it("returns newest first", async () => {
      getSession.mockResolvedValue(session("user-A"));
      prismaMock.workflow.findMany.mockResolvedValue([]);

      await caller().getWorkFlows();

      expect(prismaMock.workflow.findMany.mock.calls[0][0].orderBy).toEqual({
        createdAt: "desc",
      });
    });

    it("scopes each user separately", async () => {
      prismaMock.workflow.findMany.mockResolvedValue([]);

      getSession.mockResolvedValue(session("user-A"));
      await caller().getWorkFlows();
      getSession.mockResolvedValue(session("user-B"));
      await caller().getWorkFlows();

      const wheres = prismaMock.workflow.findMany.mock.calls.map(
        (c) => c[0].where.userId,
      );
      expect(wheres).toEqual(["user-A", "user-B"]);
    });

    it("returns what prisma returns", async () => {
      const rows = [{ id: "w1", name: "n", userId: "user-A" }];
      getSession.mockResolvedValue(session("user-A"));
      prismaMock.workflow.findMany.mockResolvedValue(rows);

      await expect(caller().getWorkFlows()).resolves.toEqual(rows);
    });
  });

  describe("createWorkflow", () => {
    it("creates the workflow owned by the signed-in user", async () => {
      getSession.mockResolvedValue(session("user-A"));
      prismaMock.workflow.create.mockResolvedValue({ id: "w1" });

      await caller().createWorkflow();

      expect(prismaMock.workflow.create).toHaveBeenCalledWith({
        data: { name: "test-workflow", userId: "user-A" },
      });
    });
  });

  describe("testInngest (T07)", () => {
    it("rejects unauthenticated callers and sends no event", async () => {
      getSession.mockResolvedValue(null);
      await expect(caller().testInngest()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      expect(inngestSend).not.toHaveBeenCalled();
    });

    it("sends the test event with the signed-in user's email", async () => {
      getSession.mockResolvedValue({
        user: { id: "user-A", email: "a@b.test" },
        session: { id: "s1" },
      });
      inngestSend.mockResolvedValue({ ids: ["evt1"] });

      await expect(caller().testInngest()).resolves.toEqual({ success: true });
      expect(inngestSend).toHaveBeenCalledWith({
        name: "test/hello.world",
        data: { email: "a@b.test" },
      });
    });

    it("surfaces failures when Inngest is unreachable", async () => {
      getSession.mockResolvedValue({
        user: { id: "user-A", email: "a@b.test" },
        session: { id: "s1" },
      });
      inngestSend.mockRejectedValue(new Error("connect ECONNREFUSED"));

      await expect(caller().testInngest()).rejects.toThrow("ECONNREFUSED");
    });
  });
});
