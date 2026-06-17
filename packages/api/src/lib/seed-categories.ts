import { db } from "@miaomiao/db";
import { category } from "@miaomiao/db/schema/category";
import { eq } from "drizzle-orm";

export type DefaultCategory = {
  name: string;
  type: "income" | "expense";
  color: string;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "餐饮", type: "expense", color: "#D98C73" },
  { name: "交通", type: "expense", color: "#E8A04B" },
  { name: "购物", type: "expense", color: "#6FA86A" },
  { name: "居住", type: "expense", color: "#A8907A" },
  { name: "其他", type: "expense", color: "#B8ACA0" },
  { name: "工资", type: "income", color: "#6FA86A" },
  { name: "其他收入", type: "income", color: "#E8A04B" },
];

/**
 * Seed the default category set for a user. Idempotent: only inserts when the
 * user currently has zero categories.
 */
export async function seedDefaultCategories(userId: string) {
  const existing = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.userId, userId));

  if (existing.length > 0) {
    return;
  }

  await db.insert(category).values(
    DEFAULT_CATEGORIES.map((c) => ({
      userId,
      name: c.name,
      type: c.type,
      color: c.color,
    })),
  );
}
