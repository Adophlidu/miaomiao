import { describe, expect, it } from "vitest";

import {
  createTransactionInput,
  deleteTransactionInput,
  listTransactionInput,
  updateTransactionInput,
} from "../src/routers/transaction";

/**
 * Zod input-contract tests for transactionRouter (§6 API contract).
 * These run WITHOUT a database. Covers AC-T7 (amount <= 0, non-integer cents,
 * unknown type -> BAD_REQUEST) and the contract's date/note/limit rules.
 */
describe("createTransactionInput", () => {
  it("parses a valid input (amount in positive integer cents)", () => {
    const parsed = createTransactionInput.parse({
      amount: 1234,
      type: "expense",
      categoryId: 1,
      date: "2026-06-17",
      note: "lunch",
    });
    expect(parsed.amount).toBe(1234);
    expect(parsed.date).toBeInstanceOf(Date);
  });

  it("coerces an ISO date string to a Date", () => {
    const parsed = createTransactionInput.parse({
      amount: 500,
      type: "income",
      categoryId: 2,
      date: "2026-01-02T03:04:05.000Z",
    });
    expect(parsed.date.toISOString()).toBe("2026-01-02T03:04:05.000Z");
  });

  it("rejects amount <= 0 — AC-T7", () => {
    expect(
      createTransactionInput.safeParse({
        amount: 0,
        type: "expense",
        categoryId: 1,
        date: "2026-06-17",
      }).success,
    ).toBe(false);
    expect(
      createTransactionInput.safeParse({
        amount: -100,
        type: "expense",
        categoryId: 1,
        date: "2026-06-17",
      }).success,
    ).toBe(false);
  });

  it("rejects non-integer cents — AC-T7", () => {
    expect(
      createTransactionInput.safeParse({
        amount: 12.34,
        type: "expense",
        categoryId: 1,
        date: "2026-06-17",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown type — AC-T7", () => {
    expect(
      createTransactionInput.safeParse({
        amount: 100,
        type: "refund",
        categoryId: 1,
        date: "2026-06-17",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive categoryId", () => {
    expect(
      createTransactionInput.safeParse({
        amount: 100,
        type: "expense",
        categoryId: 0,
        date: "2026-06-17",
      }).success,
    ).toBe(false);
  });

  it("rejects an unparseable date", () => {
    expect(
      createTransactionInput.safeParse({
        amount: 100,
        type: "expense",
        categoryId: 1,
        date: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("rejects a note longer than 200 chars", () => {
    expect(
      createTransactionInput.safeParse({
        amount: 100,
        type: "expense",
        categoryId: 1,
        date: "2026-06-17",
        note: "x".repeat(201),
      }).success,
    ).toBe(false);
  });
});

describe("listTransactionInput", () => {
  it("defaults limit to 100 when omitted", () => {
    expect(listTransactionInput.parse({}).limit).toBe(100);
  });

  it("rejects a limit above 200", () => {
    expect(listTransactionInput.safeParse({ limit: 201 }).success).toBe(false);
  });

  it("rejects a limit below 1", () => {
    expect(listTransactionInput.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("rejects an invalid type filter", () => {
    expect(listTransactionInput.safeParse({ type: "nope" }).success).toBe(false);
  });
});

describe("updateTransactionInput", () => {
  it("parses an update with a single mutable field", () => {
    expect(updateTransactionInput.safeParse({ id: 1, amount: 999 }).success).toBe(true);
  });

  it("allows note to be explicitly nulled", () => {
    const parsed = updateTransactionInput.parse({ id: 1, note: null });
    expect(parsed.note).toBeNull();
  });

  it("rejects an empty update (id only)", () => {
    expect(updateTransactionInput.safeParse({ id: 1 }).success).toBe(false);
  });

  it("rejects amount <= 0 in an update", () => {
    expect(updateTransactionInput.safeParse({ id: 1, amount: -1 }).success).toBe(false);
  });
});

describe("deleteTransactionInput", () => {
  it("parses a valid positive id", () => {
    expect(deleteTransactionInput.parse({ id: 7 })).toEqual({ id: 7 });
  });

  it("rejects a non-integer id", () => {
    expect(deleteTransactionInput.safeParse({ id: 2.5 }).success).toBe(false);
  });
});
