# packages/db — Database Layer (Drizzle + Postgres)

## Responsibility

Owns the Drizzle ORM client and the full Postgres schema. Single source of truth for table definitions; consumed by the API routers (queries) and the auth package (adapter schema).

## Key Files

- `src/index.ts` — `createDb()` returns `drizzle(env.DATABASE_URL, { schema })`; exports the shared `db` singleton.
- `src/schema/index.ts` — barrel re-exporting all schema modules (`auth`, `todo`).
- `src/schema/auth.ts` — better-auth tables: `user`, `session`, `account`, `verification` + their Drizzle `relations`. Text PKs, `timestamp` audit columns with `$onUpdate`, indexed FKs (`onDelete: "cascade"`).
- `src/schema/todo.ts` — example app table: `serial` PK, `text`, `boolean` default false.
- `drizzle.config.ts` — drizzle-kit config; `dialect: "postgresql"`, schema dir `./src/schema`, migrations out `./src/migrations`, loads `../../apps/server/.env`.

## Public Interface

- `db` / `createDb()` — imported by `@miaomiao/api` routers and `@miaomiao/auth`.
- Table objects (`user`, `session`, `account`, `verification`, `todo`) and `relations` — imported by query code and the better-auth Drizzle adapter.

## Dependencies

- `drizzle-orm` (`/node-postgres`), `drizzle-kit`, `pg`.
- `@miaomiao/env` (server) for `DATABASE_URL`.

## Schema workflow

- Edit/add tables under `src/schema/*`, re-export from `src/schema/index.ts`.
- `pnpm run db:generate` (create migration) → `pnpm run db:migrate` (apply), or `pnpm run db:push` for dev. `pnpm run db:studio` to inspect.
- **记账 tables** (transactions, categories, accounts) belong here, modeled after `todo.ts`; add a `user_id text` FK referencing `user.id` for per-user scoping.
