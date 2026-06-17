# packages/api — tRPC API Layer

## Responsibility

Defines the tRPC v11 API surface: the typed router tree, request context (session resolution), and the base procedures other routers build on. Exports the `AppRouter` type that the web client imports for end-to-end type safety.

## Key Files

- `src/index.ts` — `initTRPC.context<Context>().create()`; exports `router`, `publicProcedure`, and `protectedProcedure` (the latter throws `TRPCError("UNAUTHORIZED")` when `ctx.session` is null).
- `src/context.ts` — `createContext()` resolves the better-auth session from `context.req.raw.headers`; returns `{ auth, session }`. `Context` is the inferred return type.
- `src/routers/index.ts` — `appRouter` root: `healthCheck` (public), `privateData` (protected), `todo` sub-router. Exports `type AppRouter`.
- `src/routers/todo.ts` — example CRUD router over the `todo` table (`getAll`, `create`, `toggle`, `delete`) with Zod-validated inputs.

## Public Interface

- `appRouter` / `type AppRouter` — consumed server-side by `apps/server` and type-only by `apps/web/src/utils/trpc.ts`.
- `router`, `publicProcedure`, `protectedProcedure` — building blocks for new feature routers.
- `createContext` — passed to the Hono tRPC adapter.

## Dependencies

- `@trpc/server`, `zod` (input validation).
- `@miaomiao/auth` (session) and `@miaomiao/db` (queries, used inside routers).

## Adding a feature router

1. Create `src/routers/<feature>.ts` exporting a `router({...})`.
2. Use `protectedProcedure` for per-user data; scope every query by `ctx.session.user.id`.
3. Register it on `appRouter` in `src/routers/index.ts`. Types propagate to the client automatically.
