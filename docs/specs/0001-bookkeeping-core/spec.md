# 0001 — Bookkeeping Core (记账核心)

> **Status: done** — implemented on `d/task/0001-bookkeeping-core`. Gates: lint/format/typecheck/test/build all green (35 tests). DB-integration + visual gates deferred (no Postgres/browser in env) — see `visual-scenarios.md` and the guarded tests.
> Spec owner: d-pm. Implementing agents: d-backend, d-frontend, d-tester (test setup), d-ui (visual gate).
> Source of truth for design: `docs/design.md`. Conventions: `docs/conventions.md`.

## 1. Overview & Definition of "basics work"

Deliver a working baseline of a cat-themed (喵喵) personal bookkeeping web app covering four features:

1. **注册/登录** — Register / Login (auth wiring on top of the existing better-auth setup).
2. **记账** — Record a transaction (income or expense).
3. **类别管理** — Category management (CRUD, seeded defaults).
4. **账单列表** — Bill / transaction list (newest first).

**"Basics work" means, end-to-end, a real user can:**

- Register a new account, log in, and be redirected into the app; protected pages reject unauthenticated access; the user can log out.
- See sensible default categories on first use (auto-seeded for their account).
- Create / rename / recolor / delete their own categories.
- Record a transaction (amount, type, category, date, optional note) and see it appear in the bill list immediately.
- View their bill list newest-first with amount, category, date, and note rendered per `docs/design.md` (income = success green, expense = neutral foreground, tabular numerals).
- **Per-user isolation:** a user can never read or mutate another user's categories or transactions; cross-user access yields `NOT_FOUND` (read/mutate by id) — never another user's data.

All amounts are stored as **INTEGER minor units (cents)**. No floats for money anywhere.

## 2. Existing vs New (real file paths)

### Already exists (reuse / wire, do NOT rebuild)

- Auth backend: better-auth email+password — `packages/auth/*`, session in `packages/api/src/context.ts` (`ctx.session`).
- `protectedProcedure` (throws `UNAUTHORIZED` when no session) — `packages/api/src/index.ts`.
- Auth schema (`user`, `session`, `account`, `verification`) — `packages/db/src/schema/auth.ts`. `user.id` is `text`.
- Sign-in / sign-up forms — `apps/web/src/components/sign-in-form.tsx`, `apps/web/src/components/sign-up-form.tsx`.
- Login page (toggles sign-in/sign-up) — `apps/web/src/routes/login.tsx`.
- Protected route guard layout — `apps/web/src/routes/_auth/route.tsx` (`beforeLoad` redirects to `/login` when no session).
- Auth client — `apps/web/src/lib/auth-client.ts`.
- tRPC client / query wiring + global error toasts — `apps/web/src/utils/trpc.ts`.
- Router merge point — `packages/api/src/routers/index.ts`. Schema barrel — `packages/db/src/schema/index.ts`.
- Reference (public, NOT the access model for real data) — `packages/api/src/routers/todo.ts`, `apps/web/src/routes/todos.tsx`.

### New (to create)

| Path | Owner | Purpose |
|------|-------|---------|
| `packages/db/src/schema/category.ts` | d-backend | `category` table |
| `packages/db/src/schema/transaction.ts` | d-backend | `transaction` table |
| `packages/db/src/schema/index.ts` (edit) | d-backend | re-export new tables |
| `packages/api/src/routers/category.ts` | d-backend | `categoryRouter` (protected) |
| `packages/api/src/routers/transaction.ts` | d-backend | `transactionRouter` (protected) |
| `packages/api/src/routers/index.ts` (edit) | d-backend | merge `category`, `transaction` |
| `packages/api/src/lib/seed-categories.ts` (or inline helper) | d-backend | default-category seeding helper |
| `apps/web/src/routes/_auth/dashboard.tsx` (or confirm existing) | d-frontend | post-login landing; entry to features |
| `apps/web/src/routes/_auth/categories.tsx` | d-frontend | category management UI |
| `apps/web/src/routes/_auth/transactions.tsx` | d-frontend | record + bill list UI |
| `apps/web/src/components/user-menu.tsx` (if absent) | d-frontend | logout / user menu |
| Vitest setup (config + first tests) | d-tester | test framework (none exists yet) |

> Note: sign-in-form currently navigates to `/dashboard` on success. d-frontend must ensure a `/dashboard` route exists under the `_auth` guard (or repoint the redirect to an existing guarded route) so the post-login flow is coherent.

## 3. Data Model — Drizzle tables to add

Conventions: snake_case columns, singular table name, camelCase fields. `user.id` is `text`. Follow the `auth.ts` style (indexes via the array form, `relations` exported).

### `category` — `packages/db/src/schema/category.ts`

| Field (TS) | Column | Type | Constraints |
|------------|--------|------|-------------|
| `id` | `id` | `serial` | PK |
| `userId` | `user_id` | `text` | NOT NULL, FK → `user.id`, `onDelete: "cascade"` |
| `name` | `name` | `text` | NOT NULL |
| `type` | `type` | `text` | NOT NULL; app-enforced `"income" \| "expense"` (Zod enum at API edge) |
| `color` | `color` | `text` | nullable (hex like `#E8A04B`) |
| `createdAt` | `created_at` | `timestamp` | `defaultNow()`, NOT NULL |

Indexes: `index("category_userId_idx").on(userId)`.
Relations: `category.user → user` (one); optional `category → transactions` (many).

### `transaction` — `packages/db/src/schema/transaction.ts`

| Field (TS) | Column | Type | Constraints |
|------------|--------|------|-------------|
| `id` | `id` | `serial` | PK |
| `userId` | `user_id` | `text` | NOT NULL, FK → `user.id`, `onDelete: "cascade"` |
| `categoryId` | `category_id` | `integer` | NOT NULL, FK → `category.id`, `onDelete: "restrict"` (block deleting a category in use) |
| `amount` | `amount` | `integer` | NOT NULL; **minor units (cents)**; stored positive (sign implied by `type`) |
| `type` | `type` | `text` | NOT NULL; `"income" \| "expense"` (Zod enum at edge) |
| `note` | `note` | `text` | nullable |
| `date` | `date` | `timestamp` | NOT NULL; the transaction date (user-chosen) |
| `createdAt` | `created_at` | `timestamp` | `defaultNow()`, NOT NULL |

Indexes: `index("transaction_userId_idx").on(userId)`, `index("transaction_categoryId_idx").on(categoryId)`, and a composite `index("transaction_user_date_idx").on(userId, date)` to support newest-first listing.
Relations: `transaction.user → user` (one), `transaction.category → category` (one).

**onDelete rationale:** deleting a user cascades and removes their categories + transactions. A category referenced by transactions cannot be hard-deleted (`restrict`) — the API surfaces this as a `BAD_REQUEST` (see contract). `category.delete` must check for referencing transactions before deleting.

After adding both tables, edit `packages/db/src/schema/index.ts` to add `export * from "./category";` and `export * from "./transaction";`. A Drizzle migration must be generated.

## 4. Sub-task breakdown (sequencing: schema → routers → frontend; categories before transactions)

| # | Title | Owner | Deliverable | Depends on |
|---|-------|-------|-------------|------------|
| T1 | Schema: `category` + `transaction` tables + migration | d-backend | New schema files, barrel export, generated Drizzle migration | — |
| T2 | `categoryRouter` (protected, user-scoped) + default-category seeding | d-backend | `routers/category.ts`, seed helper, merged in `routers/index.ts` | T1 |
| T3 | `transactionRouter` (protected, user-scoped) + summary | d-backend | `routers/transaction.ts`, merged in `routers/index.ts` | T1, T2 |
| T4 | Auth flow wiring | d-frontend | Coherent login/register (`login.tsx` already toggles), post-login redirect to a guarded landing, logout via user-menu, all bookkeeping routes under `_auth` guard | existing auth (no backend dep) |
| T5 | Category management UI | d-frontend | `_auth/categories.tsx` — list, create, edit (name/color), delete; design-conformant | T2 |
| T6 | Record transaction + bill list UI | d-frontend | `_auth/transactions.tsx` — record form (amount in major units → cents, type, category select, date, note) + newest-first bill list | T3, T5 |
| T7 | Test framework setup + core tests | d-tester | Vitest configured (root + relevant workspaces), test script wired, router unit tests for auth-scoping & cents handling | T2, T3 |

Backend (T1→T3) and the auth-only T4 can proceed in parallel; T5 needs T2; T6 needs T3+T5.

## 5. Acceptance criteria (testable)

### Auth (注册/登录) — T4

- AC-A1: Unauthenticated navigation to any `_auth/*` route redirects to `/login` (guard in `_auth/route.tsx`).
- AC-A2: Successful register then login lands the user on a guarded landing page (`/dashboard` or equivalent) — no dead redirect.
- AC-A3: A logout control clears the session; afterward `_auth/*` redirects to `/login`.
- AC-A4: While authenticated, `trpc.privateData` / any `protectedProcedure` returns data; while logged out it errors `UNAUTHORIZED`.

### Categories (类别管理) — T2/T5

- AC-C1: On a user's first category fetch with zero categories, default categories are seeded for that user and returned (idempotent — seeding never duplicates on later calls).
- AC-C2: `category.create` with valid `{name, type, color?}` persists a row scoped to `ctx.session.user.id`.
- AC-C3: `category.list` returns ONLY the caller's categories.
- AC-C4: `category.update` / `category.delete` on a category the caller does not own returns `NOT_FOUND` and mutates nothing.
- AC-C5: `category.delete` on a category referenced by ≥1 transaction returns `BAD_REQUEST` (not a DB crash); deleting an unused category succeeds.
- AC-C6: Empty `name` (after trim) → `BAD_REQUEST` (Zod). `type` outside `income|expense` → `BAD_REQUEST`.

### Transactions / Bill list (记账 + 账单列表) — T3/T6

- AC-T1: `transaction.create` stores `amount` as a positive integer in cents; the UI accepts major units (e.g. `12.34`) and converts to `1234` before calling the API.
- AC-T2: `transaction.create` referencing a `categoryId` not owned by the caller returns `NOT_FOUND` (validated against the caller's categories) — never silently writes.
- AC-T3: `transaction.list` returns only the caller's transactions, **newest first** (by `date` desc, then `createdAt` desc), each including its category (id, name, type, color), amount (cents), type, note, date.
- AC-T4: `transaction.update` / `transaction.delete` on a non-owned row returns `NOT_FOUND`.
- AC-T5: A recorded transaction appears in the bill list without a manual reload (query invalidation / refetch).
- AC-T6: In the UI, income amounts render in success green, expense amounts in neutral foreground (NOT red); all amounts use tabular numerals (design gate, `docs/design.md`).
- AC-T7: `amount ≤ 0`, non-integer cents, or unknown `type` → `BAD_REQUEST`.

### Per-user isolation (cross-cutting)

- AC-I1: Given users A and B, none of B's `list` results contain A's rows, and B's `update`/`delete`/`create`-with-A's-`categoryId` calls return `NOT_FOUND` and leave A's data unchanged. (Covered by tester unit/integration tests in T7.)

## 6. API contract

All procedures live in `categoryRouter` / `transactionRouter`, merged into `appRouter` (`packages/api/src/routers/index.ts`) under keys `category` and `transaction`. **Every procedure is `protectedProcedure`** and filters by `ctx.session.user.id`. Input validated with **Zod v4**. Cross-user resource access (by id) returns `NOT_FOUND` (do not leak existence via `FORBIDDEN`). `protectedProcedure` already throws `UNAUTHORIZED` when there is no session.

Shared Zod:
```
const TxType = z.enum(["income", "expense"]);
const HexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/).optional();
```

### category.list — query, protected

- Input: none.
- Behavior: if the caller has zero categories, seed defaults first, then return.
- Output: `Array<{ id: number; name: string; type: "income" | "expense"; color: string | null; createdAt: Date }>`.
- Errors: `UNAUTHORIZED`.

### category.create — mutation, protected

- Input: `{ name: z.string().trim().min(1).max(50); type: TxType; color?: HexColor }`.
- Output: the created category row (shape as in `list`).
- Errors: `BAD_REQUEST` (empty/oversized name, bad type/color), `UNAUTHORIZED`.

### category.update — mutation, protected

- Input: `{ id: z.number().int().positive(); name?: z.string().trim().min(1).max(50); type?: TxType; color?: HexColor }` (at least one mutable field; otherwise `BAD_REQUEST`).
- Behavior: update only when row's `userId === ctx.session.user.id`.
- Output: updated category row.
- Errors: `NOT_FOUND` (missing or not owned), `BAD_REQUEST` (no fields / invalid), `UNAUTHORIZED`.

### category.delete — mutation, protected

- Input: `{ id: z.number().int().positive() }`.
- Behavior: verify ownership; if any transaction references this category → `BAD_REQUEST` (message: category in use); else delete.
- Output: `{ id: number }`.
- Errors: `NOT_FOUND` (missing/not owned), `BAD_REQUEST` (in use), `UNAUTHORIZED`.

### transaction.list — query, protected

- Input (all optional, filtering is nice-to-have): `{ type?: TxType; categoryId?: z.number().int().positive(); limit?: z.number().int().min(1).max(200).default(100) }`.
- Behavior: caller's transactions only; order by `date` desc, then `createdAt` desc; join category.
- Output: `Array<{ id: number; amount: number; type: "income"|"expense"; note: string | null; date: Date; createdAt: Date; category: { id: number; name: string; type: "income"|"expense"; color: string | null } }>`.
- Errors: `BAD_REQUEST` (bad filter), `UNAUTHORIZED`.

### transaction.create — mutation, protected

- Input: `{ amount: z.number().int().positive(); type: TxType; categoryId: z.number().int().positive(); date: z.coerce.date(); note?: z.string().trim().max(200).optional() }` (`amount` in cents).
- Behavior: verify `categoryId` belongs to caller before insert; set `userId = ctx.session.user.id`.
- Output: created transaction row (shape as in `list`, including joined category).
- Errors: `BAD_REQUEST` (`amount ≤ 0` / non-integer / bad type / bad date), `NOT_FOUND` (categoryId not owned), `UNAUTHORIZED`.

### transaction.update — mutation, protected

- Input: `{ id: z.number().int().positive(); amount?: z.number().int().positive(); type?: TxType; categoryId?: z.number().int().positive(); date?: z.coerce.date(); note?: z.string().trim().max(200).nullable().optional() }` (at least one mutable field).
- Behavior: verify row ownership; if `categoryId` provided, verify that category is owned too.
- Output: updated transaction row (with joined category).
- Errors: `NOT_FOUND` (tx missing/not owned, or categoryId not owned), `BAD_REQUEST` (no fields / invalid), `UNAUTHORIZED`.

### transaction.delete — mutation, protected

- Input: `{ id: z.number().int().positive() }`.
- Behavior: delete only when owned.
- Output: `{ id: number }`.
- Errors: `NOT_FOUND` (missing/not owned), `UNAUTHORIZED`.

### transaction.summary — query, protected (lightweight totals for the landing/header)

- Input: none (period filtering deferred — see out of scope).
- Behavior: aggregate caller's transactions.
- Output: `{ income: number; expense: number; balance: number }` — all in **cents**; `balance = income - expense`.
- Errors: `UNAUTHORIZED`.

### Default-category seeding (helper, not a procedure)

Invoked by `category.list` when the caller has zero categories (idempotent). Seed for `ctx.session.user.id`:

- Expense: 餐饮 (`#D98C73`), 交通 (`#E8A04B`), 购物 (`#6FA86A`), 居住 (`#A8907A`), 其他 (`#B8ACA0`).
- Income: 工资 (`#6FA86A`), 其他收入 (`#E8A04B`).

(Colors drawn from the warm palette in `docs/design.md`; exact hex is a soft suggestion, the set is the contract.)

## 7. Out of scope (deferred — keep baseline tight)

- Budgets / spending limits and alerts.
- Recurring / scheduled transactions.
- Multi-currency (single implied currency; cents only).
- Charts / analytics dashboards and time-range reports (only the flat `summary` totals are in scope).
- Accounts/wallets as a separate entity (no `account` bookkeeping table — note the auth `account` table is unrelated/OAuth).
- CSV import/export, attachments/receipts, tags, search.
- Pagination beyond a simple `limit` cap; infinite scroll.
- Social/OAuth login providers, password reset, email verification flows (email+password only as already wired).
