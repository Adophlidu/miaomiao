# apps/web — Frontend (React + TanStack Router)

## Responsibility

The single-page client: file-based routing, data fetching via tRPC + TanStack Query, auth UI via better-auth, and the shadcn-based component layer. Runs on Vite (`:3001`).

## Key Files

- `src/main.tsx` — creates the TanStack Router (`routeTree.gen`), wraps the app in `QueryClientProvider`, mounts to `#app`.
- `src/routes/__root.tsx` — root layout: `ThemeProvider` (dark default), `Header`, `Toaster`, devtools; declares router context (`trpc`, `queryClient`).
- `src/utils/trpc.ts` — tRPC client (`httpBatchLink` → `${VITE_SERVER_URL}/trpc`, `credentials: "include"`), shared `QueryClient` with a global `onError` toast, and the `trpc` options proxy. Imports `AppRouter` **as a type only**.
- `src/lib/auth-client.ts` — better-auth React client (`createAuthClient`).
- `src/routes/_auth/route.tsx` — protected layout; `beforeLoad` redirects to `/login` when there is no session. Hosts the 记账 pages + `BottomNav`.
- `src/routes/_auth/dashboard.tsx` / `transactions.tsx` / `record.tsx` / `categories.tsx` / `stats.tsx` — the 记账 feature pages (summary, bill list, record entry, category CRUD, stats). **`transactions.tsx` is the canonical data-driven exemplar** (query + mutations against the `trpc` proxy) — prefer it over `todos.tsx` for new pages.
- `src/lib/money.ts` — money boundary helpers (`majorToCents` / `centsToMajor` / `formatAmount`); UI edits major units, API stores integer cents.
- `src/routes/todos.tsx` — leftover scaffold example route (public `todo` router); reference only, not user-scoped.
- `src/components/sign-in-form.tsx` / `sign-up-form.tsx` — TanStack Form + Zod validation against `authClient`.

## Public Interface

This is an app, not a library — its "interface" is the route tree (`/`, `/login`, `/todos`, and the protected `/_auth/dashboard`, `/_auth/transactions`, `/_auth/record`, `/_auth/categories`, `/_auth/stats`) and the HTTP/tRPC calls it makes to the server.

## Dependencies

- `@miaomiao/api` (type only), `@miaomiao/env` (web), `@miaomiao/ui` (components).
- `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-form`, `@trpc/client`, `better-auth`, `sonner`, `lucide-react`, Tailwind v4.

## Conventions specific to web

- Path alias `@/*` → `apps/web/src/*`; shared UI imported from `@miaomiao/ui/components/*`.
- Routes are file-based under `src/routes/`; `routeTree.gen.ts` is generated (gitignored, Biome-ignored) — never edit by hand.
- New protected pages live under `src/routes/_auth/`; data access goes through the `trpc` proxy, never raw `fetch`.
