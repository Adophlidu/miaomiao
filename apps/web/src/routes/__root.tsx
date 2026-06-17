import { Toaster } from "@miaomiao/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "miaomiao · 猫管家",
      },
      {
        name: "description",
        content: "miaomiao — 温暖的猫咪记账管家",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        storageKey="miaomiao-theme"
      >
        {/* App lives in a centered mobile column on any viewport. */}
        <div className="flex min-h-svh justify-center bg-surface-dim/25">
          <div className="relative min-h-svh w-full max-w-md bg-background">
            <Outlet />
          </div>
        </div>
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </>
  );
}
