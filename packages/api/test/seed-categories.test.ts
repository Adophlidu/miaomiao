import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES } from "../src/lib/seed-categories";

/**
 * Pure-logic test for the default-category seed SET (§6).
 * The exact hex is a soft suggestion; the NAME + TYPE set is the contract.
 * Runs WITHOUT a database.
 */
describe("DEFAULT_CATEGORIES seed set", () => {
  const byType = (type: "income" | "expense") =>
    DEFAULT_CATEGORIES.filter((c) => c.type === type).map((c) => c.name);

  it("seeds exactly the five expense categories from the contract", () => {
    expect(byType("expense")).toEqual(["餐饮", "交通", "购物", "居住", "其他"]);
  });

  it("seeds exactly the two income categories from the contract", () => {
    expect(byType("income")).toEqual(["工资", "其他收入"]);
  });

  it("has no duplicate (name, type) pairs", () => {
    const keys = DEFAULT_CATEGORIES.map((c) => `${c.type}:${c.name}`);
    expect(new Set(keys).size).toBe(DEFAULT_CATEGORIES.length);
  });

  it("only uses income|expense types and valid hex colors", () => {
    for (const c of DEFAULT_CATEGORIES) {
      expect(["income", "expense"]).toContain(c.type);
      expect(c.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
