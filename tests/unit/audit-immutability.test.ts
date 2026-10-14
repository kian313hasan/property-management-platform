import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");

function sources(dir: string): string[] {
  return readdirSync(path.join(root, dir)).flatMap((name) => {
    const relative = path.join(dir, name);
    if (statSync(path.join(root, relative)).isDirectory()) return sources(relative);
    return /\.(ts|tsx|mjs)$/.test(name) ? [relative] : [];
  });
}

describe("audit log immutability", () => {
  it("application code only ever appends to the audit log", () => {
    const offenders = ["app", "actions", "components", "lib", "scripts"]
      .flatMap(sources)
      .filter((file) => /auditLog\.(update|updateMany|delete|deleteMany|upsert)\b|\bTRUNCATE\b[^;]*AuditLog/i.test(readFileSync(path.join(root, file), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("ships a migration whose trigger rejects UPDATE, DELETE and TRUNCATE", () => {
    const migrations = readdirSync(path.join(root, "prisma/migrations")).filter((name) => name.includes("protect_audit_log"));
    expect(migrations).toHaveLength(1);
    const sql = readFileSync(path.join(root, "prisma/migrations", migrations[0] ?? "", "migration.sql"), "utf8");
    expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON "AuditLog"/);
    expect(sql).toMatch(/BEFORE TRUNCATE ON "AuditLog"/);
    expect(sql).toMatch(/RAISE EXCEPTION/);
  });
});
