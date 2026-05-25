# Homepage Redesign

**Date:** 2026-05-23  
**Branch:** refactor/design-system  
**Scope:** Layout restructure + table scroll fix + targeted polish on `app/page.tsx`, `components/markets/markets-table.tsx`

---

## Goal

Make the homepage professional and polished. The Active Markets table is cut off and has no scrollbar. The three-column grid gives the table insufficient width. The redesign restructures the grid, fixes the table, and adds mechanical polish — no new components, no color changes.

---

## Layout — Grid Restructure

**Current:** Three equal-ish columns — `LiveTapeLive | MarketsTableLive | WatchlistSidebar`  
**New:** Two columns — `MarketsTableLive (1fr) | RightRail (320px fixed)`

`app/page.tsx` changes:

- Grid class: `grid-cols-1 xl:grid-cols-[1fr_320px]`
- `LiveTapeLive` moves out of its own column into a `flex-col gap-3` right rail div alongside `WatchlistSidebar`
- `MarketsTableLive` becomes the sole left column — gets all the remaining horizontal space

```tsx
<div className="grid items-start gap-3.5 grid-cols-1 xl:grid-cols-[1fr_320px]">
  <MarketsTableLive markets={markets} snapshots={snapshots} events={events} />
  <div className="flex flex-col gap-3">
    <LiveTapeLive events={events} />
    <WatchlistSidebar markets={markets} snapshots={snapshots} />
  </div>
</div>
```

---

## Table — Minimum Column Widths

**Problem:** `div.table-scroll { overflow-x: auto }` exists but columns collapse to fit instead of forcing a scroll.  
**Fix:** Add `min-w-[...]` to each `TableHead` in `components/markets/markets-table.tsx`.

| Column | Class |
|---|---|
| Market | `min-w-[200px]` |
| Primary probability | `min-w-[130px]` |
| 5m | `min-w-[60px]` |
| 15m | `min-w-[60px]` |
| Spread | `min-w-[80px]` |
| Depth | `min-w-[80px]` |
| Expiry | `min-w-[120px]` |
| Status | `min-w-[75px]` |
| Watchlist | `min-w-[55px]` |

Total minimum table width ≈ 860px. At the table's actual rendered width (roughly 60–70% of viewport after the right rail), horizontal scroll activates naturally on any viewport under ~1230px wide.

No changes to the `table-scroll` CSS class or globals.css needed.

---

## Polish

Three targeted improvements, no structural changes:

1. **Table row hover** — Add `hover:bg-accent/5` to each `TableRow` in the table body (`TableBody` rows, not the header). Gives a subtle highlight that fits the dark terminal aesthetic.

2. **Mover card hover lift** — Cards in `app/page.tsx` already have `hover:border-primary/40 transition-colors`. Add `hover:-translate-y-0.5` to the same `transition-colors` class (extend to `transition-[colors,transform]`). Subtle lift makes cards feel interactive.

3. **LiveTape right-rail scroll** — When many tape events accumulate, the right rail grows and pushes the page. Add `overflow-y-auto max-h-[calc(100vh-200px)]` to the `CardContent` wrapper inside `live-tape.tsx` so the tape scrolls independently.

---

## Files Changed

| File | Change |
|---|---|
| `app/page.tsx` | Grid restructure, mover card hover lift |
| `components/markets/markets-table.tsx` | Column min-widths, row hover |
| `components/tape/live-tape.tsx` | Right-rail scroll cap |

---

## Out of Scope

- Color palette changes
- New components
- Typography changes
- Alerts page or market detail page
