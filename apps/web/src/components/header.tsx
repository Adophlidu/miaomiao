import { Link } from "@tanstack/react-router";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/dashboard", label: "概览" },
    { to: "/transactions", label: "记账" },
    { to: "/categories", label: "类别" },
  ] as const;

  return (
    <div className="border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl flex-row items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link to="/" className="text-base font-semibold text-primary">
            喵喵记账
          </Link>
          {links.map(({ to, label }) => {
            return (
              <Link
                key={to}
                to={to}
                className="text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
