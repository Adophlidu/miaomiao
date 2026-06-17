import { Button } from "@miaomiao/ui/components/button";
import { Input } from "@miaomiao/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, LogOut, Moon, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useTheme } from "@/components/theme-provider";
import { authClient } from "@/lib/auth-client";
import { categoryIcon } from "@/lib/category-icon";
import { centsToMajor } from "@/lib/money";
import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";

type TxType = "income" | "expense";
type Category = RouterOutputs["category"]["list"][number];
type Usage = { count: number; spent: number };

const DEFAULT_COLOR = "#e67e22";

export const Route = createFileRoute("/_auth/categories")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const categories = useQuery(trpc.category.list.queryOptions());
  const transactions = useQuery(trpc.transaction.list.queryOptions({}));

  const usage = new Map<number, Usage>();
  for (const tx of transactions.data ?? []) {
    const u = usage.get(tx.category.id) ?? { count: 0, spent: 0 };
    u.count += 1;
    u.spent += tx.amount;
    usage.set(tx.category.id, u);
  }

  const expense = categories.data?.filter((c) => c.type === "expense") ?? [];
  const income = categories.data?.filter((c) => c.type === "income") ?? [];

  return (
    <div>
      <header className="sticky top-0 z-40 flex h-16 items-center bg-surface px-5 soft-shadow">
        <h1 className="font-display text-xl font-bold text-primary dark:text-primary-fixed-dim">
          类别与主题
        </h1>
      </header>

      <main className="space-y-6 px-5 pt-5">
        <AppearanceSection />

        <CategorySection
          title="支出类别"
          type="expense"
          items={expense}
          usage={usage}
          refetch={categories.refetch}
        />
        <CategorySection
          title="收入类别"
          type="income"
          items={income}
          usage={usage}
          refetch={categories.refetch}
        />

        {/* Paws footer */}
        <div className="py-2 text-center opacity-70">
          <img
            src="/illustrations/paws.png"
            alt=""
            className="mx-auto size-36 rounded-3xl object-cover"
          />
          <p className="mt-2 text-sm text-on-surface-variant">
            点类别卡片右上角的铅笔即可改名字或颜色，喵～
          </p>
        </div>

        <LogoutButton />
      </main>
    </div>
  );
}

function AppearanceSection() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-semibold text-on-surface">外观设置</h2>
      <div className="flex items-center justify-between rounded-3xl bg-surface-container-low p-4 soft-shadow">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <Moon className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-on-surface">夜间模式</p>
            <p className="text-sm text-on-surface-variant">让眼睛休息一下，切换到深色主题</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label="夜间模式"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            isDark ? "bg-primary-container" : "bg-secondary-container"
          }`}
        >
          <span
            className={`absolute top-1 size-6 rounded-full bg-white transition-all ${
              isDark ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>
    </section>
  );
}

function CategorySection({
  title,
  type,
  items,
  usage,
  refetch,
}: {
  title: string;
  type: TxType;
  items: Category[];
  usage: Map<number, Usage>;
  refetch: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const maxSpent = Math.max(1, ...items.map((c) => usage.get(c.id)?.spent ?? 0));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-on-surface">{title}</h2>
        <Button size="sm" onClick={() => setAdding((v) => !v)}>
          <Plus className="size-4" />
          新增类别
        </Button>
      </div>

      {adding ? (
        <AddCategoryForm
          type={type}
          onDone={() => {
            setAdding(false);
            refetch();
          }}
        />
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-3xl bg-surface-container-low p-6 text-center text-on-surface-variant soft-shadow">
          还没有{title}，喵～
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <CategoryCard
              key={c.id}
              item={c}
              usage={usage.get(c.id) ?? { count: 0, spent: 0 }}
              maxSpent={maxSpent}
              refetch={refetch}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AddCategoryForm({ type, onDone }: { type: TxType; onDone: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const create = useMutation(
    trpc.category.create.mutationOptions({
      onSuccess: () => {
        toast.success("类别已添加，喵～");
        onDone();
      },
    }),
  );
  return (
    <div className="flex items-center gap-2 rounded-3xl bg-surface-container-low p-3 soft-shadow">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        aria-label="颜色"
        className="size-10 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="类别名称"
        maxLength={50}
      />
      <Button
        size="icon-sm"
        aria-label="保存"
        disabled={create.isPending || name.trim().length === 0}
        onClick={() => create.mutate({ name: name.trim(), type, color })}
      >
        <Check className="size-4" />
      </Button>
    </div>
  );
}

function CategoryCard({
  item,
  usage,
  maxSpent,
  refetch,
}: {
  item: Category;
  usage: Usage;
  maxSpent: number;
  refetch: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color ?? DEFAULT_COLOR);
  const Icon = categoryIcon(item.name);
  const accent = item.color ?? "var(--primary-container)";

  const update = useMutation(
    trpc.category.update.mutationOptions({
      onSuccess: () => {
        toast.success("已保存，喵～");
        setEditing(false);
        refetch();
      },
    }),
  );
  const remove = useMutation(
    trpc.category.delete.mutationOptions({
      onSuccess: () => {
        toast.success("已删除");
        refetch();
      },
    }),
  );

  return (
    <div
      className="rounded-3xl bg-surface-container p-4 soft-shadow"
      style={{ borderLeft: `8px solid ${accent}` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 items-center justify-center rounded-full bg-white"
            style={{ color: accent }}
          >
            <Icon className="size-6" />
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="颜色"
                className="size-8 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="名称"
                maxLength={50}
                className="h-9"
              />
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-on-surface">{item.name}</h3>
              <p className="text-sm text-on-surface-variant">{usage.count} 笔交易</p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <button
                type="button"
                aria-label="保存"
                disabled={update.isPending || name.trim().length === 0}
                onClick={() => update.mutate({ id: item.id, name: name.trim(), color })}
                className="text-primary transition-colors hover:opacity-80"
              >
                <Check className="size-5" />
              </button>
              <button
                type="button"
                aria-label="取消"
                onClick={() => {
                  setName(item.name);
                  setColor(item.color ?? DEFAULT_COLOR);
                  setEditing(false);
                }}
                className="text-on-surface-variant transition-colors hover:opacity-80"
              >
                <X className="size-5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                aria-label="编辑"
                onClick={() => setEditing(true)}
                className="text-on-surface-variant transition-colors hover:text-primary"
              >
                <Pencil className="size-5" />
              </button>
              <button
                type="button"
                aria-label="删除"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: item.id })}
                className="text-on-surface-variant transition-colors hover:text-error"
              >
                <Trash2 className="size-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {!editing && usage.count > 0 ? (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-on-surface-variant">本月已用</span>
            <span className="tabular" style={{ color: accent }}>
              ¥ {centsToMajor(usage.spent)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round((usage.spent / maxSpent) * 100)}%`,
                background: accent,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LogoutButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() =>
        authClient.signOut({
          fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
        })
      }
    >
      <LogOut className="size-5" />
      退出登录
    </Button>
  );
}
