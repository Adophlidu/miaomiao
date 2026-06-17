import { Button } from "@miaomiao/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Delete, PawPrint } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { categoryIcon } from "@/lib/category-icon";
import { majorToCents } from "@/lib/money";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/record")({
  component: RecordRoute,
});

type TxType = "income" | "expense";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

function RecordRoute() {
  const navigate = useNavigate();
  const categories = useQuery(trpc.category.list.queryOptions());

  const [amount, setAmount] = useState("0");
  const [type, setType] = useState<TxType>("expense");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const create = useMutation(
    trpc.transaction.create.mutationOptions({
      onSuccess: () => {
        toast.success("记账成功，喵～");
        navigate({ to: "/transactions" });
      },
    }),
  );

  const options = (categories.data ?? []).filter((c) => c.type === type);

  function press(key: (typeof KEYS)[number]) {
    setAmount((prev) => {
      if (key === "del") {
        const next = prev.length > 1 ? prev.slice(0, -1) : "0";
        return next.endsWith(".") ? next.slice(0, -1) || "0" : next;
      }
      if (key === ".") return prev.includes(".") ? prev : `${prev}.`;
      // digit
      if (prev.includes(".") && (prev.split(".")[1]?.length ?? 0) >= 2) return prev;
      return prev === "0" ? key : prev + key;
    });
  }

  function save() {
    const cents = majorToCents(amount);
    if (!Number.isFinite(cents) || cents <= 0) {
      toast.error("请输入大于 0 的金额，喵～");
      return;
    }
    if (categoryId === null) {
      toast.error("请选择一个类别");
      return;
    }
    const trimmed = note.trim();
    create.mutate({
      amount: cents,
      type,
      categoryId,
      date: new Date(),
      ...(trimmed ? { note: trimmed } : {}),
    });
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-surface px-5 soft-shadow">
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate({ to: "/dashboard" })}
          className="text-on-surface-variant transition-transform active:scale-90"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="font-display text-xl font-bold text-primary dark:text-primary-fixed-dim">
          记一笔
        </h1>
        <span className="size-6" />
      </header>

      <main className="flex-1 px-5 pb-8 pt-4">
        {/* Amount display */}
        <section className="flex flex-col items-center">
          <span className="text-sm font-bold text-on-surface-variant">输入金额</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-xl font-semibold text-primary">¥</span>
            <span className="font-display text-4xl font-bold tabular tracking-tight text-on-surface">
              {amount}
            </span>
          </div>
        </section>

        {/* Type toggle */}
        <div className="mx-auto mt-5 flex w-44 rounded-full bg-surface-container p-1">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setCategoryId(null);
              }}
              className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-colors ${
                type === t ? "bg-primary-container text-white" : "text-on-surface-variant"
              }`}
            >
              {t === "expense" ? "支出" : "收入"}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <section className="mt-5">
          {options.length === 0 ? (
            <p className="py-2 text-center text-sm text-on-surface-variant">
              这个类型还没有类别，去「类别」里加一个吧，喵～
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {options.map((c) => {
                const Icon = categoryIcon(c.name);
                const active = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl p-2.5 transition-all active:scale-95 ${
                      active
                        ? "bg-surface-container-high ring-2 ring-primary-container"
                        : "bg-surface-container-low"
                    }`}
                  >
                    <span
                      className="flex size-11 items-center justify-center rounded-full bg-white text-primary-container shadow-sm"
                      style={c.color ? { color: c.color } : undefined}
                    >
                      <Icon className="size-6" />
                    </span>
                    <span className="max-w-full truncate text-xs font-semibold text-on-surface">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Optional note */}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="加个备注（可选）喵～"
          className="mt-5 h-12 w-full rounded-full border-2 border-transparent bg-surface-bright px-4 text-base text-on-surface outline-none transition-all placeholder:text-outline-variant focus-visible:border-primary-container"
        />

        {/* Keypad */}
        <section className="mt-5 rounded-3xl bg-surface-container-low p-4 soft-shadow">
          <div className="grid grid-cols-3 gap-3">
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                className="flex h-14 items-center justify-center rounded-2xl bg-surface-container-low font-display text-2xl font-semibold text-on-surface-variant transition-colors hover:bg-surface-container active:scale-95"
              >
                {k === "del" ? <Delete className="size-6" /> : k}
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full"
          disabled={create.isPending}
          onClick={save}
        >
          <PawPrint className="size-5" fill="currentColor" strokeWidth={0} />
          保存这一笔
        </Button>
      </main>
    </div>
  );
}
