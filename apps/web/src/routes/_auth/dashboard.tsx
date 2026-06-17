import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Moon, PawPrint, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { categoryIcon } from "@/lib/category-icon";
import { centsToMajor } from "@/lib/money";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  const summary = useQuery(trpc.transaction.summary.queryOptions());
  const recent = useQuery(trpc.transaction.list.queryOptions({ type: "expense", limit: 5 }));

  const balance = summary.data?.balance ?? 0;
  const expense = summary.data?.expense ?? 0;
  const net = (summary.data?.income ?? 0) - expense;

  return (
    <div>
      {/* Top app bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-surface px-5 soft-shadow">
        <div className="flex items-center gap-3">
          <div className="size-10 overflow-hidden rounded-full bg-primary-fixed">
            <img
              src="/illustrations/avatar-ledger.png"
              alt="猫管家"
              className="size-full object-cover"
            />
          </div>
          <h1 className="font-display text-xl font-bold text-primary dark:text-primary-fixed-dim">
            我的账本
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="space-y-6 px-5 pt-5">
        {/* Balance card */}
        <section className="relative overflow-hidden rounded-3xl bg-surface-container p-5 soft-shadow">
          <PawPrint
            className="pointer-events-none absolute -bottom-4 -right-4 size-32 text-primary/15"
            fill="currentColor"
            strokeWidth={0}
          />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-bold tracking-wide text-on-surface-variant">
                总余额 (CNY)
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold tabular text-primary dark:text-primary-fixed-dim">
                ¥ {centsToMajor(balance)}
              </h2>
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-white">
                  本月结余
                </span>
                <span
                  className={`text-sm font-semibold tabular ${net >= 0 ? "text-success" : "text-on-surface"}`}
                >
                  {net >= 0 ? "+" : "-"}¥ {centsToMajor(Math.abs(net))}
                </span>
              </div>
            </div>
            <img
              src="/illustrations/mascot-coin.png"
              alt="猫咪吉祥物"
              className="size-24 object-contain"
            />
          </div>
        </section>

        {/* Recent expenses */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-on-surface">最近支出</h3>
          </div>
          {recent.isLoading ? (
            <p className="py-8 text-center text-on-surface-variant">加载中…</p>
          ) : recent.data && recent.data.length > 0 ? (
            <div className="space-y-3">
              {recent.data.map((tx) => {
                const Icon = categoryIcon(tx.category.name);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 rounded-3xl bg-surface-container-low p-4 soft-shadow"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-surface-container-highest text-primary">
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
                    <p className="font-display text-lg font-semibold tabular text-on-surface">
                      -¥ {centsToMajor(tx.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-surface-container-low p-8 text-center soft-shadow">
              <PawPrint className="mx-auto mb-2 size-8 text-primary/40" />
              <p className="text-on-surface-variant">还没有支出记录，喵～</p>
              <p className="text-sm text-on-surface-variant">点右下角的猫爪记一笔吧！</p>
            </div>
          )}
        </section>

        {/* Monthly spend (budget feature coming soon — honest placeholder) */}
        <section>
          <h3 className="mb-3 font-display text-xl font-semibold text-on-surface">本月概览</h3>
          <div className="rounded-3xl bg-surface-container p-5 soft-shadow">
            <div className="flex items-end justify-between">
              <span className="text-sm font-bold text-on-surface-variant">本月支出</span>
              <span className="font-display text-lg font-bold tabular text-primary dark:text-primary-fixed-dim">
                ¥ {centsToMajor(expense)}
              </span>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              喵～ 预算与统计功能马上就来，敬请期待。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="切换主题"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-on-surface-variant transition-opacity hover:opacity-80"
    >
      {isDark ? <Sun className="size-6" /> : <Moon className="size-6" />}
    </button>
  );
}
