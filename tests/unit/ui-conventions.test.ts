import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isMessageKey } from "@/i18n";

const root = path.resolve(__dirname, "../..");

function sourceFiles(dir: string): string[] {
  return readdirSync(path.join(root, dir)).flatMap((name) => {
    const relative = path.join(dir, name);
    if (statSync(path.join(root, relative)).isDirectory()) return sourceFiles(relative);
    return /\.(ts|tsx)$/.test(name) ? [relative] : [];
  });
}

const uiSources = ["app", "actions", "components", "lib"].flatMap(sourceFiles);

describe("UI conventions", () => {
  it("keeps user-facing Arabic and Persian text out of code (it belongs in i18n/messages)", () => {
    const offenders = uiSources.filter((file) => /[؀-ۿ]/.test(readFileSync(path.join(root, file), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("does not hard-code text direction or locale-specific formatting in pages", () => {
    const offenders = uiSources.filter((file) => /dir="rtl"|toLocale(Date|Time)?String\(/.test(readFileSync(path.join(root, file), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("only returns existing translation keys from server actions", () => {
    const keys = sourceFiles("actions").flatMap((file) => [...readFileSync(path.join(root, file), "utf8").matchAll(/"((?:actionErrors)\.[A-Za-z]+)"/g)].map((match) => match[1] ?? ""));
    expect(keys.length).toBeGreaterThan(10);
    expect(keys.filter((key) => !isMessageKey(key))).toEqual([]);
  });

  it("does not convert values to floating point in server actions (money stays a decimal string)", () => {
    const offenders = sourceFiles("actions").filter((file) => /\b(Number|parseFloat|parseInt)\(|\.toNumber\(/.test(readFileSync(path.join(root, file), "utf8")));
    expect(offenders).toEqual([]);
  });
});
});
