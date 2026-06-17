import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";

import { BottomNav } from "@/components/bottom-nav";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }
    return { session };
  },
});

function AuthLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The record (keypad) screen is task-focused: it has its own back bar, no bottom nav.
  const showNav = pathname !== "/record";

  return (
    <div className="min-h-svh">
      <div className={showNav ? "pb-28" : undefined}>
        <Outlet />
      </div>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}
