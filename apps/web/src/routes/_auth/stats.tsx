import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Settings, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

import { centsToMajor } from "@/lib/money";
import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";

type Tx = RouterOutputs["transaction"]["list"][number];
type Segment = "expense" | "income";
type Range = "week" | "month" | "year";

// Warm fallback palette for categories without a color.
const PALETTE = ["#e67e22", "#ffb783", "#fbd1c4", "#944a00", "#d98c73", "#6fa86a", "#897365"];

export const Route = createFileRoute("/_auth/stats")({
  component: StatsRoute,
});

function startOf(range: Range, now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (range === "week") d.setDate(d.getDate() - 6);
  else if (range === "month") d.setDate(1);
  else {
    d.setMonth(0, 1);
  }
  return d;
}

function prevStartOf(range: Range, start: Date): Date {
  const d = new Date(start);
  if (range === "week") d.setDate(d.getDate() - 7);
  else if (range === "month") d.setMonth(d.getMonth() - 1);
  else d.setFullYear(d.getFullYear() - 1);
  return d;
}

function buildTrend(txns: Tx[], range: Range, now: Date): { label: string; value: number }[] {
  if (range === "week") {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    return days.map((d, i) => ({
      label: i === 6 ? "今日" : `${d.getMonth() + 1}/${d.getDate()}`,
      value: txns.filter((t) => sameDay(new Date(t.date), d)).reduce((s, t) => s + t.amount, 0),
    }));
  }
  if (range === "month") {
    const buckets = [0, 0, 0, 0, 0];
    for (const t of txns) {
      const w = Math.min(4, Math.floor((new Date(t.date).getDate() - 1) / 7));
      buckets[w] = (buckets[w] ?? 0) + t.amount;
    }
    return buckets.map((value, i) => ({ label: `第${i + 1}周`, value }));
  }
  const months = Array.from({ length: 12 }, () => 0);
  for (const t of txns) {
    const m = new Date(t.date).getMonth();
    months[m] = (months[m] ?? 0) + t.amount;
  }
  return months.map((value, i) => ({ label: `${i + 1}月`, value }));
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function StatsRoute() {
  const navigate = useNavigate();
  const txq = useQuery(trpc.transaction.list.queryOptions({}));
  const [segment, setSegment] = useState<Segment>("expense");
  const [range, setRange] = useState<Range>("month");

  const now = new Date();
  const start = startOf(range, now);
  const prevStart = prevStartOf(range, start);

  const all = (txq.data ?? []).filter((t) => t.type === segment);
  const cur = all.filter((t) => new Date(t.date) >= start);
  const prev = all.filter((t) => {
    const d = new Date(t.date);
    return d >= prevStart && d < start;
  });

  const total = cur.reduce((s, t) => s + t.amount, 0);
  const prevTotal = prev.reduce((s, t) => s + t.amount, 0);
  const delta = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

  // Category distribution
  const byCat = new Map<number, { name: string; color: string; amount: number }>();
  cur.forEach((t, i) => {
    const e = byCat.get(t.category.id) ?? {
      name: t.category.name,
      color: t.category.color ?? (PALETTE[i % PALETTE.length] as string),
      amount: 0,
    };
    e.amount += t.amount;
    byCat.set(t.category.id, e);
  });
  const dist = [...byCat.values()].sort((a, b) => b.amount - a.amount);
  const top = dist[0];

  // Donut conic-gradient stops
  let acc = 0;
  const stops = dist
    .map((d) => {
      const from = total > 0 ? (acc / total) * 100 : 0;
      acc += d.amount;
      const to = total > 0 ? (acc / total) * 100 : 0;
      return `${d.color} ${from}% ${to}%`;
    })
    .join(", ");
  const donut =
    dist.length > 0
      ? `conic-gradient(${stops})`
      : "conic-gradient(var(--surface-container-high) 0 100%)";

  const trend = buildTrend(cur, range, now);
  const trendMax = Math.max(1, ...trend.map((b) => b.value));
  const peak = trend.reduce(
    (m, b) => (b.value > m.value ? b : m),
    trend[0] ?? { label: "", value: 0 },
  );

  const segLabel = segment === "expense" ? "支出" : "收入";
  const rangeLabel = range === "week" ? "本周" : range === "month" ? "本月" : "本年";

  return (
    <div>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-surface px-5 soft-shadow">
        <div className="flex items-center gap-3">
          <div className="size-10 overflow-hidden rounded-full border-2 border-primary-container">
            <img src="/illustrations/stats-avatar.png" alt="" className="size-full object-cover" />
          </div>
          <h1 className="font-display text-xl font-bold text-primary dark:text-primary-fixed-dim">
            收支统计
          </h1>
        </div>
        <button
          type="button"
          aria-label="设置"
          onClick={() => navigate({ to: "/categories" })}
          className="text-primary transition-opacity hover:opacity-80"
        >
          <Settings className="size-6" />
        </button>
      </header>

      <main className="space-y-6 px-5 pt-5">
        {/* Segment + range */}
        <div className="space-y-3">
          <div className="flex rounded-full bg-surface-container-low p-1">
            {(["expense", "income"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSegment(s)}
                className={`flex-1 rounded-full py-2 font-display text-sm font-bold transition-all ${
                  segment === s
                    ? "bg-primary-container text-white soft-shadow"
                    : "text-on-surface-variant"
                }`}
              >
                {s === "expense" ? "支出" : "收入"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(["week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  range === r ? "bg-primary-container/15 text-primary" : "text-on-surface-variant"
                }`}
              >
                {r === "week" ? "周" : r === "month" ? "月" : "年"}
              </button>
            ))}
          </div>
        </div>

        {/* Hero total */}
        <section className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-5 soft-shadow">
          <div className="relative z-10">
            <p className="text-sm text-on-surface-variant">
              {rangeLabel}总{segLabel}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tabular text-primary dark:text-primary-fixed-dim">
              ¥ {centsToMajor(total)}
            </h2>
            {delta !== null ? (
              <div className="mt-2 flex items-center gap-1 text-sm">
                <span
                  className={`flex items-center gap-0.5 font-bold ${delta > 0 ? "text-error" : "text-success"}`}
                >
                  {delta > 0 ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                  {Math.abs(delta)}%
                </span>
                <span className="text-on-surface-variant">较上期{delta > 0 ? "增加" : "减少"}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-on-surface-variant">喵～ 还没有上期数据可以对比。</p>
            )}
          </div>
          <img
            src="/illustrations/stats-hero.png"
            alt=""
            className="pointer-events-none absolute -bottom-3 -right-3 size-32 object-contain opacity-90"
          />
        </section>

        {/* Distribution */}
        <section className="space-y-3">
          <h3 className="px-1 font-display text-xl font-semibold text-on-surface">
            {segLabel}分布
          </h3>
          <div className="rounded-3xl bg-surface-container-lowest p-5 soft-shadow">
            {dist.length === 0 ? (
              <p className="py-6 text-center text-on-surface-variant">还没有数据，喵～</p>
            ) : (
              <>
                <div className="mb-5 flex justify-center">
                  <div
                    className="relative flex size-40 items-center justify-center rounded-full"
                    style={{ background: donut }}
                  >
                    <div className="flex size-24 flex-col items-center justify-center rounded-full bg-surface-container-lowest">
                      <span className="text-sm font-semibold text-on-surface-variant">
                        {top?.name}
                      </span>
                      <span className="font-display text-xl font-bold text-primary">
                        {total > 0 && top ? Math.round((top.amount / total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {dist.map((d) => {
                    const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0;
                    return (
                      <div key={d.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span
                              className="size-3 rounded-full"
                              style={{ backgroundColor: d.color }}
                            />
                            {d.name}
                          </span>
                          <span className="font-semibold tabular">
                            ¥ {centsToMajor(d.amount)} ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: d.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Trend */}
        <section className="space-y-3">
          <h3 className="px-1 font-display text-xl font-semibold text-on-surface">
            {segLabel}趋势
          </h3>
          <div className="rounded-3xl bg-surface-container-lowest p-5 soft-shadow">
            <div className="flex h-36 items-end justify-between gap-2">
              {trend.map((b) => (
                <div key={b.label} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className={`w-full rounded-t-full transition-all ${
                      b.value > 0 && b.value === peak.value
                        ? "bg-primary"
                        : "bg-surface-container-high"
                    }`}
                    style={{ height: `${Math.max(4, (b.value / trendMax) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between">
              {trend.map((b) => (
                <span
                  key={b.label}
                  className="flex-1 text-center text-[10px] font-medium text-on-surface-variant"
                >
                  {b.label}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-full bg-primary-container/10 p-3">
              <span className="text-lg">🐾</span>
              <p className="text-sm text-on-primary-container dark:text-on-surface">
                {peak.value > 0
                  ? `${rangeLabel}${segLabel}高峰在「${peak.label}」，¥ ${centsToMajor(peak.value)}。`
                  : `${rangeLabel}还没有${segLabel}记录，喵～`}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
