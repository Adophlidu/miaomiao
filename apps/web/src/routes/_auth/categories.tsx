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
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";

type TxType = "income" | "expense";

type Category = RouterOutputs["category"]["list"][number];

const DEFAULT_COLOR = "#E8A04B";

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "请给类别起个名字，喵～").max(50, "名字太长啦"),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "颜色格式应为 #RRGGBB"),
});

export const Route = createFileRoute("/_auth/categories")({
  component: CategoriesRoute,
});

function CategoriesRoute() {
  const categories = useQuery(trpc.category.list.queryOptions());

  const createMutation = useMutation(
    trpc.category.create.mutationOptions({
      onSuccess: () => {
        categories.refetch();
        toast.success("类别已添加，喵～");
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      name: "",
      type: "expense" as TxType,
      color: DEFAULT_COLOR,
    },
    onSubmit: async ({ value, formApi }) => {
      await createMutation.mutateAsync({
        name: value.name,
        type: value.type,
        color: value.color,
      });
      formApi.reset();
    },
    validators: {
      onSubmit: createCategorySchema,
    },
  });

  const income = categories.data?.filter((c) => c.type === "income") ?? [];
  const expense = categories.data?.filter((c) => c.type === "expense") ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">类别管理</h1>
        <p className="mt-1 text-muted-foreground">整理你的收入与支出类别，喵～</p>
      </header>

      <Card className="mb-8 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">新建类别</CardTitle>
          <CardDescription>名字、类型与颜色。</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <form.Field name="name">
              {(field) => (
                <div className="flex-1 space-y-2">
                  <Label htmlFor={field.name}>名称</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="例如：餐饮"
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

            <form.Field name="type">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>类型</Label>
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value as TxType)}
                    className="h-8 w-full rounded-xl border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                  </select>
                </div>
              )}
            </form.Field>

            <form.Field name="color">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>颜色</Label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="color"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-xl border border-input bg-transparent p-1"
                  />
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
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "添加"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>

      {categories.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <CategoryGroup title="支出" items={expense} refetch={categories.refetch} />
          <CategoryGroup title="收入" items={income} refetch={categories.refetch} />
        </div>
      )}
    </div>
  );
}

function CategoryGroup({
  title,
  items,
  refetch,
}: {
  title: string;
  items: Category[];
  refetch: () => void;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">还没有类别，喵～</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <CategoryRow key={item.id} item={item} refetch={refetch} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryRow({ item, refetch }: { item: Category; refetch: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [type, setType] = useState<TxType>(item.type as TxType);
  const [color, setColor] = useState(item.color ?? DEFAULT_COLOR);

  const updateMutation = useMutation(
    trpc.category.update.mutationOptions({
      onSuccess: () => {
        refetch();
        setEditing(false);
        toast.success("已保存，喵～");
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.category.delete.mutationOptions({
      onSuccess: () => {
        refetch();
        toast.success("已删除");
      },
    }),
  );

  if (editing) {
    return (
      <li className="flex items-center gap-2 rounded-xl border border-border p-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="颜色"
          className="size-7 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="名称"
          className="rounded-xl"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TxType)}
          aria-label="类型"
          className="h-8 rounded-xl border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
        <Button
          variant="ghost"
          size="icon"
          aria-label="保存"
          disabled={updateMutation.isPending || name.trim().length === 0}
          onClick={() =>
            updateMutation.mutate({
              id: item.id,
              name: name.trim(),
              type,
              color,
            })
          }
        >
          {updateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="取消"
          onClick={() => {
            setName(item.name);
            setType(item.type as TxType);
            setColor(item.color ?? DEFAULT_COLOR);
            setEditing(false);
          }}
        >
          <X className="size-4" />
        </Button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border border-border p-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: item.color ?? "var(--muted-foreground)" }}
          aria-hidden
        />
        <span className="truncate text-foreground">{item.name}</span>
      </div>
      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon" aria-label="编辑" onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          aria-label="删除"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate({ id: item.id })}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </div>
    </li>
  );
}
