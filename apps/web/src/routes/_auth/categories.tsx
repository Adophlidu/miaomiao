import { Button } from "@miaomiao/ui/components/button";
import { Input } from "@miaomiao/ui/components/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, LogOut, Moon, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useTheme } from "@/components/theme-provider";
import { authClient } from "@/lib/auth-client";
import { categoryIcon } from "@/lib/category-icon";
import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";

type TxType = "income" | "expense";
type Category = RouterOutputs["category"]["list"][number];

const DEFAULT_COLOR = "#e67e22";

export const Route = createFileRoute("/_auth/categories")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const categories = useQuery(trpc.category.list.queryOptions());
  const transactions = useQuery(trpc.transaction.list.queryOptions({}));

  const counts = new Map<number, number>();
  for (const tx of transactions.data ?? []) {
    counts.set(tx.category.id, (counts.get(tx.category.id) ?? 0) + 1);
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
        <ProfileCard />
        <AppearanceSection />

        <CategorySection
          title="支出类别"
          type="expense"
          items={expense}
          counts={counts}
          refetch={categories.refetch}
        />
        <CategorySection
          title="收入类别"
          type="income"
          items={income}
          counts={counts}
          refetch={categories.refetch}
        />

        <LogoutButton />
      </main>
    </div>
  );
}

function ProfileCard() {
  const { data: session } = authClient.useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setName(session?.user.name ?? "");
    setEditing(true);
  };

  const save = async () => {
    const next = name.trim();
    if (!next) return toast.error("名字不能为空，喵～");
    setSaving(true);
    await authClient.updateUser(
      { name: next },
      {
        onSuccess: () => {
          toast.success("已更新，喵～");
          setEditing(false);
        },
        onError: (err) => {
          toast.error(err.error.message || "更新失败");
        },
      },
    );
    setSaving(false);
  };

  return (
    <section className="flex items-center justify-between rounded-3xl bg-surface-container-low p-4 soft-shadow">
      <div className="flex min-w-0 items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-full border-2 border-primary-container">
          <img
            src="/illustrations/avatar-categories.png"
            alt="头像"
            className="size-full object-cover"
          />
        </div>
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            aria-label="昵称"
            className="h-10"
          />
        ) : (
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-semibold text-on-surface">
              {session?.user.name ?? "喵管家"}
            </h2>
            <p className="truncate text-sm text-on-surface-variant">{session?.user.email}</p>
          </div>
        )}
      </div>
      {editing ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="保存"
            disabled={saving}
            onClick={save}
            className="text-primary transition-colors hover:opacity-80"
          >
            <Check className="size-5" />
          </button>
          <button
            type="button"
            aria-label="取消"
            onClick={() => setEditing(false)}
            className="text-on-surface-variant transition-colors hover:opacity-80"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="编辑昵称"
          onClick={startEdit}
          className="shrink-0 text-primary transition-colors hover:opacity-80"
        >
          <Pencil className="size-5" />
        </button>
      )}
    </section>
  );
}

function AppearanceSection() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <section className="space-y-3">
      <h2 className="ml-1 font-display text-xl font-semibold text-on-surface">外观设置</h2>
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
  counts,
  refetch,
}: {
  title: string;
  type: TxType;
  items: Category[];
  counts: Map<number, number>;
  refetch: () => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="ml-1 font-display text-xl font-semibold text-on-surface">{title}</h2>
        <Button size="xs" onClick={() => setAdding((v) => !v)}>
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
        <p className="rounded-3xl bg-surface-container-low p-5 text-center text-sm text-on-surface-variant soft-shadow">
          还没有{title}，喵～
        </p>
      ) : (
        items.map((c) => (
          <CategoryRow key={c.id} item={c} count={counts.get(c.id) ?? 0} refetch={refetch} />
        ))
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

function CategoryRow({
  item,
  count,
  refetch,
}: {
  item: Category;
  count: number;
  refetch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color ?? DEFAULT_COLOR);
  const Icon = categoryIcon(item.name);
  const accent = item.color ?? "var(--primary-container)";

  const update = useMutation(
    trpc.category.update.mutationOptions({
      onSuccess: () => {
        toast.success("已保存，喵～");
        setOpen(false);
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
    <div className="overflow-hidden rounded-3xl bg-surface-container soft-shadow">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-3 text-left transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-full bg-white"
            style={{ color: accent }}
          >
            <Icon className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-on-surface">{item.name}</p>
            <p className="text-sm text-on-surface-variant">{count} 笔交易</p>
          </div>
        </div>
        <ChevronRight
          className={`size-5 text-on-surface-variant transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open ? (
        <div className="flex items-center gap-2 border-t border-outline-variant/50 p-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="颜色"
            className="size-9 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="名称"
            maxLength={50}
            className="h-10"
          />
          <Button
            size="icon-sm"
            aria-label="保存"
            disabled={update.isPending || name.trim().length === 0}
            onClick={() => update.mutate({ id: item.id, name: name.trim(), color })}
          >
            <Check className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="destructive"
            aria-label="删除"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id: item.id })}
          >
            <Trash2 className="size-4" />
          </Button>
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
