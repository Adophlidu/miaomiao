import { describe, expect, it } from "vitest";

import {
  createCategoryInput,
  deleteCategoryInput,
  updateCategoryInput,
} from "../src/routers/category";

/**
 * Zod input-contract tests for categoryRouter (§6 API contract).
 * These run WITHOUT a database — they only exercise the schemas.
 * Covers AC-C6 (empty/oversized name, bad type) and the contract's
 * color/id/empty-update rules.
 */
describe("createCategoryInput", () => {
  it("parses a valid input with color", () => {
    const parsed = createCategoryInput.parse({
      name: "餐饮",
      type: "expense",
      color: "#E8A04B",
    });
    expect(parsed).toEqual({ name: "餐饮", type: "expense", color: "#E8A04B" });
  });

  it("parses a valid input without color (optional)", () => {
    const parsed = createCategoryInput.parse({ name: "工资", type: "income" });
    expect(parsed.color).toBeUndefined();
  });

  it("trims surrounding whitespace from name", () => {
    const parsed = createCategoryInput.parse({ name: "  购物  ", type: "expense" });
    expect(parsed.name).toBe("购物");
  });

  it("rejects an empty name (after trim) — AC-C6", () => {
    expect(createCategoryInput.safeParse({ name: "   ", type: "expense" }).success).toBe(false);
  });

  it("rejects an oversized name (> 50 chars) — AC-C6", () => {
    const longName = "a".repeat(51);
    expect(createCategoryInput.safeParse({ name: longName, type: "expense" }).success).toBe(false);
  });

  it("rejects a type outside income|expense — AC-C6", () => {
    expect(createCategoryInput.safeParse({ name: "测试", type: "transfer" }).success).toBe(false);
  });

  it("rejects a malformed hex color", () => {
    expect(
      createCategoryInput.safeParse({ name: "测试", type: "expense", color: "red" }).success,
    ).toBe(false);
    expect(
      createCategoryInput.safeParse({ name: "测试", type: "expense", color: "#FFF" }).success,
    ).toBe(false);
  });
});

describe("updateCategoryInput", () => {
  it("parses an update with a single mutable field", () => {
    expect(updateCategoryInput.safeParse({ id: 1, name: "新名" }).success).toBe(true);
  });

  it("rejects an empty update (id only, no mutable fields)", () => {
    expect(updateCategoryInput.safeParse({ id: 1 }).success).toBe(false);
  });

  it("rejects a non-positive / non-integer id", () => {
    expect(updateCategoryInput.safeParse({ id: 0, name: "x" }).success).toBe(false);
    expect(updateCategoryInput.safeParse({ id: 1.5, name: "x" }).success).toBe(false);
  });

  it("rejects an invalid type in an update", () => {
    expect(updateCategoryInput.safeParse({ id: 1, type: "nope" }).success).toBe(false);
  });
});

describe("deleteCategoryInput", () => {
  it("parses a valid positive id", () => {
    expect(deleteCategoryInput.parse({ id: 3 })).toEqual({ id: 3 });
  });

  it("rejects a non-positive id", () => {
    expect(deleteCategoryInput.safeParse({ id: -1 }).success).toBe(false);
  });
});
