# packages/db — Database Layer (Drizzle + Postgres)

## Responsibility

Owns the Drizzle ORM client and the full Postgres schema. Single source of truth for table definitions; consumed by the API routers (queries) and the auth package (adapter schema).

## Key Files

- `src/index.ts` — `createDb()` returns `drizzle(env.DATABASE_URL, { schema })`; exports the shared `db` singleton.
- `src/schema/index.ts` — barrel re-exporting all schema modules (`auth`, `category`, `todo`, `transaction`).
- `src/schema/auth.ts` — better-auth tables: `user`, `session`, `account`, `verification` + their Drizzle `relations`. Text PKs, `timestamp` audit columns with `$onUpdate`, indexed FKs (`onDelete: "cascade"`).
- `src/schema/category.ts` — 记账 `category` table: per-user expense/income categories (`user_id text` FK → `user.id`, `onDelete: "cascade"`); seeded with defaults on first use.
- `src/schema/transaction.ts` — 记账 `transaction` table: per-user ledger entries (`user_id` FK, `category_id` FK, integer-cents `amount`, `type` income|expense, `occurred_at`).
- `src/schema/todo.ts` — leftover scaffold example table (`serial` PK); kept only as a public-procedure reference — do NOT model user data on it.
- `drizzle.config.ts` — drizzle-kit config; `dialect: "postgresql"`, schema dir `./src/schema`, migrations out `./src/migrations`, loads `../../apps/server/.env`.
- `src/migrations/0000_gigantic_psynapse.sql` (+ `meta/`) — the committed baseline migration (auth + category + todo + transaction tables); apply with `pnpm run db:migrate`.

## Public Interface

- `db` / `createDb()` — imported by `@miaomiao/api` routers and `@miaomiao/auth`.
- Table objects (`user`, `session`, `account`, `verification`, `category`, `transaction`, `todo`) and `relations` — imported by query code and the better-auth Drizzle adapter.

## Dependencies

- `drizzle-orm` (`/node-postgres`), `drizzle-kit`, `pg`.
- `@miaomiao/env` (server) for `DATABASE_URL`.

## Schema workflow

- Edit/add tables under `src/schema/*`, re-export from `src/schema/index.ts`.
- `pnpm run db:generate` (create migration) → `pnpm run db:migrate` (apply), or `pnpm run db:push` for dev. `pnpm run db:studio` to inspect.
- **记账 tables are implemented** (`category.ts`, `transaction.ts`) — model any new per-user table on them, not on `todo.ts`: add a `user_id text` FK referencing `user.id` (`onDelete: "cascade"`), store money as `integer` cents.
