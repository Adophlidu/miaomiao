import { Button } from "@miaomiao/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@miaomiao/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ListPlus, Tags } from "lucide-react";

import { formatTotal } from "@/lib/money";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { session } = Route.useRouteContext();
  const summary = useQuery(trpc.transaction.summary.queryOptions());

  const income = summary.data?.income ?? 0;
  const expense = summary.data?.expense ?? 0;
  const balance = summary.data?.balance ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          欢迎回来，{session.data?.user.name ?? "朋友"}，喵～
        </h1>
        <p className="mt-1 text-muted-foreground">今天也要好好记账哦。</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardDescription>收入</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatTotal(income)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardDescription>支出</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums text-foreground">
              {formatTotal(expense)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardDescription>结余</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums text-foreground">
              {formatTotal(balance)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">记一笔</CardTitle>
            <CardDescription>记录今天的收入或支出。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/transactions">
              <Button className="rounded-xl">
                <ListPlus className="size-4" />
                去记账
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">类别管理</CardTitle>
            <CardDescription>整理你的收支类别。</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/categories">
              <Button variant="outline" className="rounded-xl">
                <Tags className="size-4" />
                管理类别
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
