# miaomiao — Design System: "Feline Finance"

> Source of truth for visual decisions. The `d-ui` visual gate checks implementations against this file.
> Mode: `design` · visual tool: Playwright.
> Originated from a Stitch export — raw source kept in `docs/design/feline-finance/` (`stitch-source.md` + `screen-1..4.png`).

## Aesthetic & Tone

**Iyashikei (healing) bookkeeping** — turn a stressful task into a calm, cozy moment. Warm, empathetic, gentle; a supportive cat companion (喵喵), not a rigid tool. Minimalism + tactile "soft-UI": generous whitespace, pillowy rounded shapes, soft ambient shadows. Cat motifs throughout (paw FAB, paw watermarks, "Meow Start", cat-voice copy).

## Color (warm terracotta + cream)

Tokens live as CSS variables in `packages/ui/src/styles/globals.css` (`:root` light, `.dark` dark) and are exposed as Tailwind utilities (MD3 names + shadcn aliases). **Use the tokens, never hardcoded hex** (category colors from data are the only exception).

Light (hero):
- `surface` / `background` `#fff8f6` (soft cream) · cards `surface-container-low` `#fff1ed`, `surface-container` `#ffe9e3`
- `primary` `#944a00` (deep) · **`primary-container` `#e67e22` (terracotta)** — the CTA/accent color
- `on-surface` `#2c160e` (soft brown text) · `on-surface-variant` `#564337`
- `outline-variant` `#dcc1b1` (borders) · `success` (income) warm green · `error` `#ba1a1a` (destructive only)

Dark: warm espresso surfaces (`#251b16` …), `primary-fixed-dim` `#ffb783` accent text, brightened terracotta containers. Never cool/blue-black.

**Money semantics:** income = `success` (green) with `+`; expense = `on-surface` (neutral) with `-`. Red is reserved for destructive/errors, never for normal spending. All amounts use **tabular numerals** (`.tabular`).

## Typography

- **Display / headings:** Plus Jakarta Sans (`font-display`, 600–800).
- **Body / labels / numbers:** Quicksand (`font-sans`, 400–700) — rounded terminals reinforce the soft feel.
- Loaded via Google Fonts in `apps/web/index.html`. Headings auto-use the display family (`@layer base`).

## Layout & Shape

- **Mobile-first.** App renders in a centered `max-w-md` column on any viewport (`__root.tsx`).
- **Bottom tab nav + paw FAB** (`components/bottom-nav.tsx`): Home → `/dashboard`, Bills → `/transactions`, Stats → `/stats`, Settings → `/categories`; FAB (paw) → `/record`. The nav is hidden on `/record` (task-focused, has a back bar).
- **Shapes:** cards `rounded-3xl`, controls/inputs/buttons `rounded-full` (pill). Soft ambient shadow via `.soft-shadow` / `.soft-shadow-lg` (warm brown, low opacity) — no hard borders or dark drop shadows.
- **Spacing:** comfortable; card padding ≥ `p-4`/`p-5`, vertical gaps `space-y-5`/`6`. Touch targets ≥ ~44px.
- **Density:** safe-and-airy over information-dense.

## Components (in `@miaomiao/ui`, restyled to this system)

- **Button:** pill, `primary-container` fill + white text, `soft-shadow`, `active:scale-95`. Variants: outline (sand border), ghost, secondary, destructive, link.
- **Card:** `rounded-3xl`, `bg-card` (sand), `soft-shadow`, no ring.
- **Input:** pill (`rounded-full`), `surface-bright` bg, transparent border → `primary-container` on focus.
- **Icons:** `lucide-react`. Category glyphs mapped by name in `apps/web/src/lib/category-icon.tsx` (fallback: paw print).
- **Illustrations:** local cat art in `apps/web/public/illustrations/` (login hero, coin mascot, avatars, paws).

## Screens (map to routes)

1. **Login** (`/login`) — cat hero + paw badge, "欢迎回家", pill fields, "Meow Start"; sign-in/sign-up toggle.
2. **Dashboard** (`/_auth/dashboard`) — balance card (mascot + paw watermark + 本月结余 chip), 最近支出 list, 本月概览 placeholder.
3. **Record** (`/_auth/record`) — amount + 支出/收入 toggle + category chips + numeric keypad + paw "保存这一笔".
4. **Bills** (`/_auth/transactions`) — income/expense summary + newest-first bill list.
5. **Settings** (`/_auth/categories`) — profile card (avatar + name + email + edit), 外观设置 dark-mode switch, simplified category rows (icon + name + 笔数 + chevron → tap to expand inline rename/recolor/delete), add category, logout. (`screen-5-settings-refactor.png`)
6. **Stats** (`/_auth/stats`) — 收支统计: 支出/收入 segment + 周/月/年 range; total hero card (with cat-and-chart image + period-over-period delta); 支出分布 conic-gradient donut + proportion bars; 支出趋势 bar chart with peak highlight + insight. All computed client-side from `transaction.list` (no backend aggregation). (`screen-6-stats.png`)

## Motion

Gentle, "squishy": 150–300ms, ease-out; `active:scale-95` press feedback; login hero `animate-float`. Honor `prefers-reduced-motion`. Theme flips are instant (`disableTransitionOnChange`).

## Visual Gate Checklist (d-ui)

- [ ] Warm tokens only (no cool blue-black; red only for destructive/errors).
- [ ] Income green / expense neutral; tabular numerals; AA contrast.
- [ ] Pill controls + `rounded-3xl` cards + `soft-shadow`; comfortable spacing.
- [ ] Plus Jakarta Sans headings / Quicksand body.
- [ ] Bottom nav + paw FAB present (except `/record`); friendly cat-voice empty states.
- [ ] Correct in both light and dark; scenarios in `docs/specs/0001-bookkeeping-core/visual-scenarios.md`.
