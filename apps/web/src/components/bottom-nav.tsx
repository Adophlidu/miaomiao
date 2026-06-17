import { Link } from "@tanstack/react-router";
import { BarChart3, Home, PawPrint, ReceiptText, Settings } from "lucide-react";

const TABS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/transactions", label: "Bills", icon: ReceiptText },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/categories", label: "Settings", icon: Settings },
] as const;

/**
 * Mobile bottom tab bar + paw FAB. Pinned to the centered max-w-md column.
 * The FAB opens the keypad record screen.
 */
export function BottomNav() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <div className="relative mx-auto w-full max-w-md">
        {/* Paw FAB → record */}
        <Link
          to="/record"
          aria-label="记一笔"
          className="pointer-events-auto absolute -top-9 right-5 flex size-16 items-center justify-center rounded-full bg-primary-container text-white soft-shadow-lg transition-transform active:scale-90"
        >
          <PawPrint className="size-8" fill="currentColor" strokeWidth={0} />
        </Link>

        {/* Tab bar */}
        <nav className="pointer-events-auto flex h-20 items-center justify-around rounded-t-3xl bg-surface px-2 shadow-[0_-4px_20px_0_rgba(93,64,55,0.08)]">
          {TABS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl px-4 py-1.5 text-on-surface-variant transition-colors"
              activeProps={{
                className:
                  "flex flex-col items-center justify-center gap-0.5 rounded-2xl px-4 py-1.5 bg-primary-container text-white",
              }}
            >
              <Icon className="size-6" />
              <span className="font-display text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
