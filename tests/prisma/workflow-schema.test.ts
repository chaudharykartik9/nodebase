import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const root = path.resolve(__dirname, "../..");
const schema = readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");

const block = (name: string) => {
  const m = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
  return m?.[1] ?? "";
};

describe("Prisma schema: Workflow (T06)", () => {
  const workflow = block("Workflow");

  it("defines a PascalCase Workflow model and no lowercase leftover", () => {
    expect(workflow).not.toBe("");
    expect(schema).not.toMatch(/model workflow\b/);
  });

  it("keeps the existing table via @@map so no table rename is needed", () => {
    expect(workflow).toMatch(/@@map\("workflow"\)/);
  });

  it("has timestamps and an owner relation that cascades on delete", () => {
    expect(workflow).toMatch(/createdAt\s+DateTime\s+@default\(now\(\)\)/);
    expect(workflow).toMatch(/updatedAt\s+DateTime\s+@updatedAt/);
    expect(workflow).toMatch(/userId\s+String\b/);
    expect(workflow).toMatch(
      /user\s+User\s+@relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/,
    );
    expect(workflow).toMatch(/@@index\(\[userId\]\)/);
  });

  it("User has the inverse workflows relation", () => {
    expect(block("User")).toMatch(/workflows\s+Workflow\[\]/);
  });

  it("generated client is in sync with the schema (run `npx prisma generate` if this fails)", () => {
    expect(Prisma.ModelName.Workflow).toBe("Workflow");
    expect(Object.values(Prisma.WorkflowScalarFieldEnum)).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "createdAt",
        "updatedAt",
        "userId",
      ]),
    );
  });
});

describe("Migration: workflow_user_relation (T06)", () => {
  const dirs = readdirSync(path.join(root, "prisma/migrations")).filter((d) =>
    d.endsWith("_workflow_user_relation"),
  );
  const sql = dirs[0]
    ? readFileSync(
        path.join(root, "prisma/migrations", dirs[0], "migration.sql"),
        "utf8",
      )
    : "";

  it("exists", () => {
    expect(dirs).toHaveLength(1);
  });

  it("is ordered after the migration that created the workflow table", () => {
    const all = readdirSync(path.join(root, "prisma/migrations"))
      .filter((d) => /^\d+_/.test(d))
      .sort();
    const created = all.find((d) => d.endsWith("_add_workflow"));
    expect(created).toBeDefined();
    expect(all.indexOf(dirs[0])).toBeGreaterThan(
      all.indexOf(created as string),
    );
  });

  it("clears owner-less rows BEFORE adding the NOT NULL userId column", () => {
    const del = sql.indexOf('DELETE FROM "workflow"');
    const add = sql.indexOf("ADD COLUMN");
    expect(del).toBeGreaterThanOrEqual(0);
    expect(add).toBeGreaterThan(del);
  });

  it("adds columns, index and cascading foreign key to the existing table", () => {
    expect(sql).toMatch(/ALTER TABLE "workflow"[\s\S]*"userId" TEXT NOT NULL/);
    expect(sql).toMatch(
      /"createdAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/,
    );
    expect(sql).toMatch(/"updatedAt" TIMESTAMP\(3\) NOT NULL/);
    expect(sql).toMatch(
      /CREATE INDEX "workflow_userId_idx" ON "workflow"\("userId"\)/,
    );
    expect(sql).toMatch(
      /FOREIGN KEY \("userId"\) REFERENCES "user"\("id"\) ON DELETE CASCADE/,
    );
  });

  it("does not drop or recreate the table", () => {
    expect(sql).not.toMatch(/DROP TABLE/i);
    expect(sql).not.toMatch(/CREATE TABLE/i);
  });
});
