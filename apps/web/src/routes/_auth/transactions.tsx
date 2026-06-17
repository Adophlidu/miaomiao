import { Button } from "@miaomiao/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@miaomiao/ui/components/card";
import { Input } from "@miaomiao/ui/components/input";
import { Label } from "@miaomiao/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { formatAmount, majorToCents } from "@/lib/money";
import { trpc } from "@/utils/trpc";

type TxType = "income" | "expense";

function todayInputValue(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

const recordSchema = z.object({
  amount: z
    .string()
    .refine((v) => Number.isFinite(Number.parseFloat(v)) && Number.parseFloat(v) > 0, {
      message: "请输入大于 0 的金额，喵～",
    }),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "请选择一个类别"),
  date: z.string().min(1, "请选择日期"),
  note: z.string().max(200, "备注太长啦"),
});

export const Route = createFileRoute("/_auth/transactions")({
  component: TransactionsRoute,
});

function TransactionsRoute() {
  const categories = useQuery(trpc.category.list.queryOptions());
  const transactions = useQuery(trpc.transaction.list.queryOptions({}));

  const refetchAll = () => {
    transactions.refetch();
  };

  const createMutation = useMutation(
    trpc.transaction.create.mutationOptions({
      onSuccess: () => {
        refetchAll();
        toast.success("记账成功，喵～");
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.transaction.delete.mutationOptions({
      onSuccess: () => {
        refetchAll();
        toast.success("已删除");
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      amount: "",
      type: "expense" as TxType,
      categoryId: "",
      date: todayInputValue(),
      note: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const note = value.note?.trim();
      await createMutation.mutateAsync({
        amount: majorToCents(value.amount),
        type: value.type,
        categoryId: Number(value.categoryId),
        date: new Date(value.date),
        ...(note ? { note } : {}),
      });
      formApi.reset();
    },
    validators: {
      onSubmit: recordSchema,
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">记账</h1>
        <p className="mt-1 text-muted-foreground">记下每一笔收入与支出，喵～</p>
      </header>

      <Card className="mb-8 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">记一笔</CardTitle>
          <CardDescription>金额、类型、类别、日期，备注可选。</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>金额</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="12.34"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="rounded-xl tabular-nums"
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-xs text-destructive">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>类型</Label>
                    <select
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value as TxType);
                        // reset category when type changes so it stays consistent
                        form.setFieldValue("categoryId", "");
                      }}
                      className="h-8 w-full rounded-xl border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="expense">支出</option>
                      <option value="income">收入</option>
                    </select>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Subscribe selector={(state) => state.values.type}>
                {(selectedType) => (
                  <form.Field name="categoryId">
                    {(field) => {
                      const options = categories.data?.filter((c) => c.type === selectedType) ?? [];
                      return (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>类别</Label>
                          <select
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="h-8 w-full rounded-xl border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
                          >
                            <option value="">请选择…</option>
                            {options.map((c) => (
                              <option key={c.id} value={String(c.id)}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          {field.state.meta.errors.map((error) => (
                            <p key={error?.message} className="text-xs text-destructive">
                              {error?.message}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  </form.Field>
                )}
              </form.Subscribe>

              <form.Field name="date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>日期</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="rounded-xl"
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-xs text-destructive">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="note">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>备注（可选）</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="今天和朋友吃饭"
                    className="rounded-xl"
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-xs text-destructive">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" className="rounded-xl" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "记一笔"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">账单</CardTitle>
          <CardDescription>最近的记录，新的在最前面。</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.data && transactions.data.length > 0 ? (
            <ul className="space-y-2">
              {transactions.data.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: tx.category.color ?? "var(--muted-foreground)",
                      }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-foreground">{tx.category.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                        {tx.note ? ` · ${tx.note}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className={`tabular-nums font-semibold ${
                        tx.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {formatAmount(tx.amount, tx.type as TxType)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="删除"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate({ id: tx.id })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-muted-foreground">
              还没有记录，喵～ 在上面记一笔吧！
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
