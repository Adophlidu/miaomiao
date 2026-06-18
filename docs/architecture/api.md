# packages/api — tRPC API Layer

## Responsibility

Defines the tRPC v11 API surface: the typed router tree, request context (session resolution), and the base procedures other routers build on. Exports the `AppRouter` type that the web client imports for end-to-end type safety.

## Key Files

- `src/index.ts` — `initTRPC.context<Context>().create()`; exports `router`, `publicProcedure`, and `protectedProcedure` (the latter throws `TRPCError("UNAUTHORIZED")` when `ctx.session` is null).
- `src/context.ts` — `createContext()` resolves the better-auth session from `context.req.raw.headers`; returns `{ auth, session }`. `Context` is the inferred return type.
- `src/routers/index.ts` — `appRouter` root: `healthCheck` (public), `privateData` (protected), and the `todo`, `category`, `transaction` sub-routers. Exports `type AppRouter`.
- `src/routers/category.ts` — 记账 category CRUD (`list`, `create`, `update`, `delete`), all `protectedProcedure`, scoped by `ctx.session.user.id`; cross-user id → `NOT_FOUND`. Default categories seeded on first `list` via `src/lib/seed-categories.ts`.
- `src/routers/transaction.ts` — 记账 ledger (`list`, `create`, `update`, `delete`, `summary`), all `protectedProcedure`, user-scoped; integer-cents `amount`. **This is the canonical feature-router exemplar** — prefer it over `todo.ts`.
- `src/routers/todo.ts` — leftover scaffold example over the `todo` table (`getAll`, `create`, `toggle`, `delete`); uses `publicProcedure` and is **not** user-scoped — do NOT copy for user data.

## Public Interface

- `appRouter` / `type AppRouter` — consumed server-side by `apps/server` and type-only by `apps/web/src/utils/trpc.ts`.
- `router`, `publicProcedure`, `protectedProcedure` — building blocks for new feature routers.
- `createContext` — passed to the Hono tRPC adapter.

## Dependencies

- `@trpc/server`, `zod` (input validation).
- `@miaomiao/auth` (session) and `@miaomiao/db` (queries, used inside routers).

## Adding a feature router

1. Create `src/routers/<feature>.ts` exporting a `router({...})` — copy the shape of `transaction.ts` / `category.ts`.
2. Use `protectedProcedure` for per-user data; scope every query by `ctx.session.user.id`; for access-by-id, verify ownership and return `NOT_FOUND` (never `FORBIDDEN`) on a foreign row.
3. Export the Zod input schemas (so they can be unit-tested as input contracts — see `packages/api/test/*.test.ts`).
4. Register it on `appRouter` in `src/routers/index.ts`. Types propagate to the client automatically.
