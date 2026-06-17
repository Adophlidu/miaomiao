# Visual-gate scenarios — spec 0001

> Owner: d-ui. Tool: Playwright (`uiBaseline.tool`). Source of truth: `docs/design.md`.
> **Status: deferred execution.** Baselines can only be captured against a running app + Postgres
> (no DB/browser in the init/CI sandbox). Capture baselines once `pnpm run dev` runs against a real DB.

## Scenarios (each captured in light AND dark themes, mobile 390px + desktop 1280px)

1. **Login** (`/login`) — sign-in/sign-up toggle. Warm palette, rounded inputs (`rounded-xl`), primary amber button, AA contrast.
2. **Dashboard** (`/_auth/dashboard`) — `transaction.summary` totals: income in success green, expense in neutral foreground, balance prominent; **tabular numerals**; nav to 记账/类别.
3. **Categories** (`/_auth/categories`) — list grouped by type, color dots from data; create/edit form; empty state with the cat-themed line ("还没有…喵～").
4. **Transactions** (`/_auth/transactions`) — record form (amount, type, category select, date, note) + newest-first bill list; income green / expense neutral (NOT red); tabular numerals; per-row delete; friendly empty state.

## Conformance checks (from docs/design.md §"Visual Gate Checklist")

- Colors from the warm token set; red reserved for destructive/errors only (expenses are neutral, not red).
- Amounts: tabular numerals, AA contrast.
- Soft radii (cards `rounded-2xl`, controls `rounded-xl`); comfortable spacing; touch targets ≥ ~40px.
- Empty/error/success states carry the friendly cat voice; motion honors `prefers-reduced-motion`.
- Both light and dark render correctly.

## To run later

Install `@playwright/test`, add a `test:visual` script, author `apps/web/e2e/visual.spec.ts` implementing the
scenarios above with `toHaveScreenshot()`, seed a test user + a few transactions, capture baselines, then diff on each run.
