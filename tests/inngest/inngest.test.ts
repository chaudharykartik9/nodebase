import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { inngest } from "@/inngest/client";
import { functions, helloWorld } from "@/inngest/functions";

type Handler = (ctx: {
  event: { name: string; data?: Record<string, unknown> };
  step: {
    sleep: (id: string, duration: string) => Promise<unknown>;
    run: (id: string, fn: () => unknown) => Promise<unknown>;
  };
}) => Promise<{ message: string }>;

const handler = (helloWorld as unknown as { fn: Handler }).fn;

const fakeStep = () => ({
  sleep: vi.fn(async () => {}),
  run: vi.fn(async (_id: string, fn: () => unknown) => fn()),
});

describe("Inngest client (T07)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the app id 'nodebase'", () => {
    expect(inngest.id).toBe("nodebase");
  });

  // Inngest v4 defaults to cloud mode (needs a signing key); `next dev` must use the local dev server.
  it("runs in dev mode when NODE_ENV is development", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    const { inngest: devClient } = await import("@/inngest/client");
    expect(devClient.mode).toBe("dev");
  });

  it("runs in cloud mode in production (needs INNGEST_SIGNING_KEY)", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    const { inngest: prodClient } = await import("@/inngest/client");
    expect(prodClient.mode).toBe("cloud");
  });
});

describe("hello-world background job (T07)", () => {
  it("is registered with the expected id and event trigger", () => {
    const opts = (
      helloWorld as unknown as {
        opts: { id: string; triggers: { event: string }[] };
      }
    ).opts;
    expect(opts.id).toBe("hello-world");
    expect(opts.triggers).toEqual([{ event: "test/hello.world" }]);
  });

  it("is included in the list served by the API route", () => {
    expect(functions).toContain(helloWorld);
  });

  it("sleeps, then builds a greeting from event.data.email", async () => {
    const step = fakeStep();
    const result = await handler({
      event: { name: "test/hello.world", data: { email: "a@b.test" } },
      step,
    });

    expect(result).toEqual({ message: "Hello, a@b.test!" });
    expect(step.sleep).toHaveBeenCalledWith("wait-a-moment", "2s");
    expect(step.run).toHaveBeenCalledWith(
      "build-message",
      expect.any(Function),
    );
  });

  it("sleeps before running the message step", async () => {
    const order: string[] = [];
    const step = {
      sleep: vi.fn(async () => {
        order.push("sleep");
      }),
      run: vi.fn(async (_id: string, fn: () => unknown) => {
        order.push("run");
        return fn();
      }),
    };
    await handler({ event: { name: "test/hello.world" }, step });
    expect(order).toEqual(["sleep", "run"]);
  });

  it("falls back to 'world' when the event has no email", async () => {
    const result = await handler({
      event: { name: "test/hello.world" },
      step: fakeStep(),
    });
    expect(result.message).toBe("Hello, world!");
  });
});

describe("/api/inngest route (T07)", () => {
  it("exports GET, POST and PUT handlers", async () => {
    const route = await import("@/app/api/inngest/route");
    expect(typeof route.GET).toBe("function");
    expect(typeof route.POST).toBe("function");
    expect(typeof route.PUT).toBe("function");
  });
});

describe("dev tooling config (T07)", () => {
  const root = path.resolve(__dirname, "../..");
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const mprocs = readFileSync(path.join(root, "mprocs.yaml"), "utf8");

  it("has scripts for the Inngest dev server and running everything together", () => {
    expect(pkg.scripts["inngest:dev"]).toMatch(
      /inngest-cli dev .*\/api\/inngest/,
    );
    expect(pkg.scripts["dev:all"]).toMatch(/mprocs/);
  });

  it("declares the required packages", () => {
    expect(pkg.dependencies.inngest).toBeDefined();
    for (const dep of ["inngest-cli", "mprocs", "dotenv-cli"]) {
      expect(pkg.devDependencies[dep]).toBeDefined();
    }
  });

  it("mprocs runs both the Next dev server and the Inngest dev server", () => {
    expect(mprocs).toMatch(/next:\s*\n\s*cmd: \["npm", "run", "dev"\]/);
    expect(mprocs).toMatch(
      /inngest:\s*\n\s*cmd: \["npm", "run", "inngest:dev"\]/,
    );
  });
});
