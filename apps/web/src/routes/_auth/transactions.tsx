import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, PawPrint, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { categoryIcon } from "@/lib/category-icon";
import { centsToMajor } from "@/lib/money";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/transactions")({
  component: BillsRoute,
});

function BillsRoute() {
  const navigate = useNavigate();
  const transactions = useQuery(trpc.transaction.list.queryOptions({}));
  const summary = useQuery(trpc.transaction.summary.queryOptions());

  const deleteMutation = useMutation(
    trpc.transaction.delete.mutationOptions({
      onSuccess: () => {
        transactions.refetch();
        summary.refetch();
        toast.success("已删除");
      },
    }),
  );

  return (
    <div>
      <header className="sticky top-0 z-40 flex h-16 items-center bg-surface px-5 soft-shadow">
        <h1 className="font-display text-xl font-bold text-primary dark:text-primary-fixed-dim">
          账单
        </h1>
      </header>

      <main className="space-y-5 px-5 pt-5">
        {/* Income / expense summary */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-surface-container-low p-4 soft-shadow">
            <p className="text-sm font-bold text-on-surface-variant">收入</p>
            <p className="mt-1 font-display text-xl font-bold tabular text-success">
              ¥ {centsToMajor(summary.data?.income ?? 0)}
            </p>
          </div>
          <div className="rounded-3xl bg-surface-container-low p-4 soft-shadow">
            <p className="text-sm font-bold text-on-surface-variant">支出</p>
            <p className="mt-1 font-display text-xl font-bold tabular text-on-surface">
              ¥ {centsToMajor(summary.data?.expense ?? 0)}
            </p>
          </div>
        </section>

        {transactions.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-on-surface-variant" />
          </div>
        ) : transactions.data && transactions.data.length > 0 ? (
          <section className="space-y-3">
            {transactions.data.map((tx) => {
              const Icon = categoryIcon(tx.category.name);
              const income = tx.type === "income";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 rounded-3xl bg-surface-container-low p-4 soft-shadow"
                >
                  <div
                    className="flex size-12 items-center justify-center rounded-full bg-surface-container-highest text-primary"
                    style={tx.category.color ? { color: tx.category.color } : undefined}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-on-surface">
                      {tx.note?.trim() || tx.category.name}
                    </h4>
                    <p className="truncate text-sm text-on-surface-variant">
                      {new Date(tx.date).toLocaleDateString("zh-CN")} · {tx.category.name}
                    </p>
                  </div>
                  <p
                    className={`font-display text-lg font-semibold tabular ${
                      income ? "text-success" : "text-on-surface"
                    }`}
                  >
                    {income ? "+" : "-"}¥ {centsToMajor(tx.amount)}
                  </p>
                  <button
                    type="button"
                    aria-label="删除"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ id: tx.id })}
                    className="text-on-surface-variant transition-colors hover:text-error"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              );
            })}
          </section>
        ) : (
          <button
            type="button"
            onClick={() => navigate({ to: "/record" })}
            className="flex w-full flex-col items-center gap-2 rounded-3xl bg-surface-container-low p-10 text-center soft-shadow"
          >
            <PawPrint className="size-10 text-primary/40" />
            <p className="text-on-surface-variant">还没有账单，喵～</p>
            <p className="text-sm text-on-surface-variant">点这里记第一笔吧！</p>
          </button>
        )}
      </main>
    </div>
  );
}
