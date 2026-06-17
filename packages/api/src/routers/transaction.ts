import { db } from "@miaomiao/db";
import { category } from "@miaomiao/db/schema/category";
import { transaction } from "@miaomiao/db/schema/transaction";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const TxType = z.enum(["income", "expense"]);

export const listTransactionInput = z.object({
  type: TxType.optional(),
  categoryId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

export const createTransactionInput = z.object({
  amount: z.number().int().positive(),
  type: TxType,
  categoryId: z.number().int().positive(),
  date: z.coerce.date(),
  note: z.string().trim().max(200).optional(),
});

export const updateTransactionInput = z
  .object({
    id: z.number().int().positive(),
    amount: z.number().int().positive().optional(),
    type: TxType.optional(),
    categoryId: z.number().int().positive().optional(),
    date: z.coerce.date().optional(),
    note: z.string().trim().max(200).nullable().optional(),
  })
  .refine(
    (v) =>
      v.amount !== undefined ||
      v.type !== undefined ||
      v.categoryId !== undefined ||
      v.date !== undefined ||
      v.note !== undefined,
    { message: "At least one field must be provided" },
  );

export const deleteTransactionInput = z.object({ id: z.number().int().positive() });

const txSelect = {
  id: transaction.id,
  amount: transaction.amount,
  type: transaction.type,
  note: transaction.note,
  date: transaction.date,
  createdAt: transaction.createdAt,
  category: {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
  },
};

async function assertCategoryOwned(userId: string, categoryId: number) {
  const [owned] = await db
    .select({ id: category.id })
    .from(category)
    .where(and(eq(category.id, categoryId), eq(category.userId, userId)));

  if (!owned) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
}

async function fetchTransaction(userId: string, id: number) {
  const [row] = await db
    .select(txSelect)
    .from(transaction)
    .innerJoin(category, eq(transaction.categoryId, category.id))
    .where(and(eq(transaction.id, id), eq(transaction.userId, userId)));

  return row;
}

export const transactionRouter = router({
  list: protectedProcedure.input(listTransactionInput).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const filters = [eq(transaction.userId, userId)];
    if (input.type !== undefined) filters.push(eq(transaction.type, input.type));
    if (input.categoryId !== undefined) {
      filters.push(eq(transaction.categoryId, input.categoryId));
    }

    return await db
      .select(txSelect)
      .from(transaction)
      .innerJoin(category, eq(transaction.categoryId, category.id))
      .where(and(...filters))
      .orderBy(desc(transaction.date), desc(transaction.createdAt))
      .limit(input.limit);
  }),

  create: protectedProcedure.input(createTransactionInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    await assertCategoryOwned(userId, input.categoryId);

    const [inserted] = await db
      .insert(transaction)
      .values({
        userId,
        categoryId: input.categoryId,
        amount: input.amount,
        type: input.type,
        note: input.note ?? null,
        date: input.date,
      })
      .returning({ id: transaction.id });

    if (!inserted) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    const created = await fetchTransaction(userId, inserted.id);
    if (!created) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    return created;
  }),

  update: protectedProcedure.input(updateTransactionInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const [existing] = await db
      .select({ id: transaction.id })
      .from(transaction)
      .where(and(eq(transaction.id, input.id), eq(transaction.userId, userId)));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    if (input.categoryId !== undefined) {
      await assertCategoryOwned(userId, input.categoryId);
    }

    const values: {
      amount?: number;
      type?: "income" | "expense";
      categoryId?: number;
      date?: Date;
      note?: string | null;
    } = {};
    if (input.amount !== undefined) values.amount = input.amount;
    if (input.type !== undefined) values.type = input.type;
    if (input.categoryId !== undefined) values.categoryId = input.categoryId;
    if (input.date !== undefined) values.date = input.date;
    if (input.note !== undefined) values.note = input.note;

    await db
      .update(transaction)
      .set(values)
      .where(and(eq(transaction.id, input.id), eq(transaction.userId, userId)));

    const updated = await fetchTransaction(userId, input.id);
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return updated;
  }),

  delete: protectedProcedure.input(deleteTransactionInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const [existing] = await db
      .select({ id: transaction.id })
      .from(transaction)
      .where(and(eq(transaction.id, input.id), eq(transaction.userId, userId)));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    await db
      .delete(transaction)
      .where(and(eq(transaction.id, input.id), eq(transaction.userId, userId)));

    return { id: input.id };
  }),

  summary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [totals] = await db
      .select({
        income: sql<number>`coalesce(sum(case when ${transaction.type} = 'income' then ${transaction.amount} else 0 end), 0)`,
        expense: sql<number>`coalesce(sum(case when ${transaction.type} = 'expense' then ${transaction.amount} else 0 end), 0)`,
      })
      .from(transaction)
      .where(eq(transaction.userId, userId));

    const income = Number(totals?.income ?? 0);
    const expense = Number(totals?.expense ?? 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }),
});
