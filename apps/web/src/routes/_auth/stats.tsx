import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_auth/stats")({
  component: StatsRoute,
});

function StatsRoute() {
  return (
    <div>
      <header className="sticky top-0 z-40 flex h-16 items-center bg-surface px-5 soft-shadow">
        <h1 className="font-display text-xl font-bold text-primary dark:text-primary-fixed-dim">
          统计
        </h1>
      </header>
      <main className="flex flex-col items-center justify-center px-5 pt-24 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-surface-container text-primary soft-shadow">
          <BarChart3 className="size-10" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-on-surface">统计功能即将上线</h2>
        <p className="mt-2 max-w-xs text-on-surface-variant">
          喵～ 我们正在准备好看的收支图表，让你的账本一目了然。敬请期待！
        </p>
      </main>
    </div>
  );
}
