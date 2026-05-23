# UI Design System — Hypertape

**Date:** 2026-05-23  
**Status:** Approved  
**Scope:** Full migration from hand-rolled CSS to Tailwind CSS v4 + shadcn/ui (New York style)

---

## Goal

Replace the 1,100-line monolithic `globals.css` and all hand-rolled CSS class names with a proper design system: Tailwind CSS v4 utility classes for layout/spacing, shadcn/ui New York primitives for interactive components, and a centralised token layer for the dark colour palette.

---

## Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Visual direction | Modern Fintech Dark | Clean card-based layout, polished dark palette |
| shadcn style | New York | Sharper 4px border-radius, bolder typography — editorial feel |
| Font | Inter (via `next/font/google`) | Industry standard for fintech dashboards; optimised for small sizes |
| Primary accent | `#50D2C1` (Hyperliquid teal) | Hyperliquid's exact interactive accent; separates UI chrome from bullish data colour |
| Button primary bg | `#17453F` (dark teal) | Hyperliquid's signature CTA surface |
| Data colours | unchanged | `--green #41d98b` = bullish/up only; `--red #ff6b78` = bearish/down; `--amber #f5c469` = settling/medium |
| Tailwind version | v4 (CSS-first) | Latest; no `tailwind.config.js` needed; shadcn v4 support is stable |
| Migration strategy | Full migration in one pass | Codebase is small (~10 components); a clean break beats a long-lived hybrid |

---

## Design tokens

All tokens live in `app/globals.css` under a single `:root` block as CSS custom properties. Tailwind v4 picks them up via `@theme inline`.

```css
:root {
  /* Surfaces */
  --background:          #04060C;   /* page bg — slightly deeper than current #07090d */
  --card:                #0a1218;   /* panel / card bg */
  --muted:               #0d1620;   /* secondary surface (panel-2) */
  --popover:             #0a1218;

  /* Borders */
  --border:              #131e28;
  --input:               #131e28;
  --ring:                #50D2C1;   /* focus ring = accent */

  /* Text */
  --foreground:          #eef4ff;
  --muted-foreground:    #8f9bad;
  --card-foreground:     #eef4ff;
  --popover-foreground:  #eef4ff;

  /* Interactive (shadcn --primary) */
  --primary:             #50D2C1;   /* HL teal — nav active, links, focus rings */
  --primary-foreground:  #04060C;   /* text on bright teal surface */

  /*
   * shadcn Button default variant uses bg-primary by convention.
   * We override the Button component to use bg-accent instead so buttons
   * render as dark-teal-bg / teal-text (HL style) rather than bright teal bg.
   * --primary stays as the colour token for links, active nav, and focus rings.
   */
  --accent:              #17453F;   /* HL dark teal — button bg */
  --accent-foreground:   #50D2C1;   /* HL teal — button label */

  /* Semantic (not in shadcn defaults — keep as custom vars) */
  --chart-positive:      #41d98b;   /* bullish / up */
  --chart-negative:      #ff6b78;   /* bearish / down */
  --chart-warning:       #f5c469;   /* settling / medium severity */
  --chart-info:          #62a8ff;   /* eyebrow labels / info */

  /* shadcn shape */
  --radius:              4px;       /* New York style */

  /* Secondary / destructive (required by shadcn) */
  --secondary:           #0d1620;
  --secondary-foreground:#eef4ff;
  --destructive:         #ff6b78;
  --destructive-foreground: #eef4ff;
}
```

---

## shadcn components

Install only components that replace hand-rolled equivalents. No speculative additions.

| Component | Replaces | Notes |
|---|---|---|
| `Button` | `.alert-cta`, `.telegram-cta`, `.icon-button`, alert panel buttons | Default variant customised to use `bg-accent text-accent-foreground` (dark teal bg + teal text); variant="outline" for secondary actions; variant="ghost" for icon buttons |
| `Badge` | `.severity`, `.status-pill` | Custom variant for each severity level |
| `Table` + sub-components | `.markets-table` + all td/th classes | Keep `.table-scroll` wrapper for overflow |
| `Card` + `CardHeader` + `CardContent` | `.panel` + `.panel-heading` | Direct 1:1 replacement |
| `Input` | `.shell-search input`, `.alert-draft input` | |
| `Select` | `.alert-draft select` | |
| `Separator` | Border-bottom dividers inside panels | |

### Not replaced by shadcn

These stay as Tailwind utility classes (not shadcn primitives):

- **Layout grids** — `.command-grid`, `.market-detail-grid`, `.movers-strip`, etc. are app-specific responsive grids with custom `minmax()` column tracks. Tailwind utilities express these directly.
- **Chart canvas wrapper** — `.probability-chart-canvas` wraps `lightweight-charts` and needs exact sizing; keep as Tailwind.
- **Tape event rows** — `.tape-event` items are custom enough (metrics grid, severity badge, action row) to stay as Tailwind-classed divs.
- **Watchlist star** — small toggle button, express directly with Tailwind + `cn()`.

---

## Font

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Apply: <html className={inter.variable}>
```

```css
/* globals.css */
body {
  font-family: var(--font-inter), -apple-system, system-ui, sans-serif;
}
```

---

## Migration order

Steps must be executed in this order. Infrastructure before leaf components, leaf components before pages.

1. **Install Tailwind v4 + shadcn**
   - `npm install tailwindcss @tailwindcss/postcss postcss`
   - `npx shadcn@latest init` — New York style, no base colour (we provide our own), dark mode via `class`
   - Add `postcss.config.mjs`

2. **`app/globals.css`** — rewrite
   - `@import "tailwindcss"`
   - `@theme inline { /* map CSS vars to Tailwind theme tokens */ }`
   - Shadcn `:root` token block (above)
   - Keep only layout-specific utility overrides not expressible by Tailwind alone
   - Remove all `.panel`, `.severity`, `.markets-table`, etc. class definitions

3. **`app/layout.tsx`** — add Inter font variable

4. **`components/layout/app-shell.tsx`** — Tailwind utilities, `Button` for alert CTA and search wrapper

5. **`components/tape/live-tape.tsx`** — Tailwind for feed layout; `Badge` for severity; `Card`/`CardHeader` for panel

6. **`components/markets/markets-table.tsx`** — shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`; `Badge` for status pill; `Button` variant="ghost" for watchlist star

7. **`components/markets/market-detail.tsx`** — `Card` for panels; Tailwind grid for depth tiles; `Badge` for status

8. **`components/markets/watchlist-sidebar.tsx`** — Tailwind utilities; `Button` variant="ghost" for star toggle

9. **`components/alerts/alerts-panel.tsx`** — `Input`, `Select`, `Button` from shadcn; Tailwind for layout

10. **`components/charts/probability-chart.tsx`** — minimal: Tailwind wrappers only, chart canvas unchanged

11. **Verify & clean up**
    - Delete remaining hand-rolled class definitions from `globals.css`
    - Run `npm run typecheck` — must pass clean
    - Run `npm test` — all 85 tests must pass
    - Visually verify all 4 pages: `/`, `/markets`, `/markets/[marketId]`, `/alerts`

---

## What does not change

- All API routes, data fetching, SWR logic — untouched
- Component props and TypeScript interfaces — untouched
- `lightweight-charts` integration — untouched
- Responsive breakpoints — same breakpoints (1180px, 760px), expressed as Tailwind `md:` / `sm:` variants
- Dark-only theme — no light mode, no `prefers-color-scheme` toggle

---

## Success criteria

- `npm run typecheck` passes with zero errors
- `npm test` passes all 85 tests
- All 4 pages render correctly and match the design mockups reviewed during brainstorming
- No `globals.css` hand-rolled class names remain (only token vars + Tailwind directives)
- Bundle size does not meaningfully regress from current baseline
