import { db } from "@miaomiao/db";
import { category } from "@miaomiao/db/schema/category";
import { transaction } from "@miaomiao/db/schema/transaction";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { seedDefaultCategories } from "../lib/seed-categories";

export const TxType = z.enum(["income", "expense"]);
export const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/)
  .optional();

export const createCategoryInput = z.object({
  name: z.string().trim().min(1).max(50),
  type: TxType,
  color: HexColor,
});

export const updateCategoryInput = z
  .object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1).max(50).optional(),
    type: TxType.optional(),
    color: HexColor,
  })
  .refine((v) => v.name !== undefined || v.type !== undefined || v.color !== undefined, {
    message: "At least one field must be provided",
  });

export const deleteCategoryInput = z.object({ id: z.number().int().positive() });

const categorySelect = {
  id: category.id,
  name: category.name,
  type: category.type,
  color: category.color,
  createdAt: category.createdAt,
};

export const categoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const rows = await db
      .select(categorySelect)
      .from(category)
      .where(eq(category.userId, userId))
      .orderBy(asc(category.createdAt), asc(category.id));

    if (rows.length === 0) {
      await seedDefaultCategories(userId);
      return await db
        .select(categorySelect)
        .from(category)
        .where(eq(category.userId, userId))
        .orderBy(asc(category.createdAt), asc(category.id));
    }

    return rows;
  }),

  create: protectedProcedure.input(createCategoryInput).mutation(async ({ ctx, input }) => {
    const [created] = await db
      .insert(category)
      .values({
        userId: ctx.session.user.id,
        name: input.name,
        type: input.type,
        color: input.color ?? null,
      })
      .returning(categorySelect);

    if (!created) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    return created;
  }),

  update: protectedProcedure.input(updateCategoryInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const [existing] = await db
      .select({ id: category.id })
      .from(category)
      .where(and(eq(category.id, input.id), eq(category.userId, userId)));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const values: { name?: string; type?: "income" | "expense"; color?: string | null } = {};
    if (input.name !== undefined) values.name = input.name;
    if (input.type !== undefined) values.type = input.type;
    if (input.color !== undefined) values.color = input.color;

    const [updated] = await db
      .update(category)
      .set(values)
      .where(and(eq(category.id, input.id), eq(category.userId, userId)))
      .returning(categorySelect);

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return updated;
  }),

  delete: protectedProcedure.input(deleteCategoryInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const [existing] = await db
      .select({ id: category.id })
      .from(category)
      .where(and(eq(category.id, input.id), eq(category.userId, userId)));

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const [referenced] = await db
      .select({ id: transaction.id })
      .from(transaction)
      .where(and(eq(transaction.categoryId, input.id), eq(transaction.userId, userId)))
      .limit(1);

    if (referenced) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Category is in use by one or more transactions",
      });
    }

    await db.delete(category).where(and(eq(category.id, input.id), eq(category.userId, userId)));

    return { id: input.id };
  }),
});
