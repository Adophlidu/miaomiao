import { Button } from "@miaomiao/ui/components/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail, PawPrint, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});

function LoginRoute() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pending, setPending] = useState(false);

  const isSignUp = mode === "sign-up";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return toast.error("请输入邮箱，喵～");
    if (password.length < 8) return toast.error("密码至少 8 位，喵～");
    if (isSignUp && !name.trim()) return toast.error("给自己起个名字吧，喵～");

    setPending(true);
    const onError = (msg?: string) => toast.error(msg || "出错了，喵～");
    const onSuccess = () => {
      toast.success(isSignUp ? "注册成功，欢迎回家～" : "登录成功，喵～");
      navigate({ to: "/dashboard" });
    };

    if (isSignUp) {
      await authClient.signUp.email(
        { name: name.trim(), email: email.trim(), password },
        {
          onSuccess,
          onError: (err) => {
            onError(err.error.message);
          },
        },
      );
    } else {
      await authClient.signIn.email(
        { email: email.trim(), password },
        {
          onSuccess,
          onError: (err) => {
            onError(err.error.message);
          },
        },
      );
    }
    setPending(false);
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-8">
      {/* Atmospheric blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-surface-container opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/2 size-72 rounded-full bg-surface-dim opacity-30 blur-3xl" />

      <main className="relative z-10 w-full">
        {/* Hero */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-5 size-40 animate-float">
            <img
              src="/illustrations/login-hero.png"
              alt="猫管家"
              className="size-full rounded-3xl object-cover soft-shadow"
            />
            <span className="absolute -bottom-2 -right-2 flex size-12 items-center justify-center rounded-full bg-primary-container text-white soft-shadow">
              <PawPrint className="size-6" fill="currentColor" strokeWidth={0} />
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            {isSignUp ? "欢迎加入" : "欢迎回家"}
          </h1>
          <p className="mt-1 text-on-surface-variant opacity-80">您的个人财务管家已就绪</p>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          className="flex flex-col gap-5 rounded-3xl bg-surface-container-low p-6 soft-shadow"
        >
          {isSignUp ? (
            <Field
              icon={<User className="size-5" />}
              label="昵称"
              value={name}
              onChange={setName}
              placeholder="猫管家"
            />
          ) : null}
          <Field
            icon={<Mail className="size-5" />}
            label="电子邮箱"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="hello@kitty.com"
          />
          <div>
            <Field
              icon={<Lock className="size-5" />}
              label="登录密码"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              trailing={
                <button
                  type="button"
                  aria-label="显示密码"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-on-surface-variant transition-colors hover:text-primary"
                >
                  {showPwd ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              }
            />
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
            {pending ? "请稍候…" : isSignUp ? "Meow Join" : "Meow Start"}
            <ArrowRight className="size-5" />
          </Button>

          <p className="text-center text-sm text-on-surface-variant">
            {isSignUp ? "已经有账号了？ " : "还没有账号？ "}
            <button
              type="button"
              onClick={() => setMode(isSignUp ? "sign-in" : "sign-up")}
              className="font-display font-bold text-primary hover:underline"
            >
              {isSignUp ? "去登录" : "立即注册猫管家"}
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="ml-2 font-display text-sm font-bold text-on-surface-variant">{label}</span>
      <span className="relative flex items-center">
        <span className="absolute left-4 text-outline">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-full border-2 border-transparent bg-surface-bright pl-12 pr-12 text-base text-on-surface outline-none transition-all placeholder:text-outline-variant focus-visible:border-primary-container"
        />
        {trailing ? <span className="absolute right-4">{trailing}</span> : null}
      </span>
    </label>
  );
}
