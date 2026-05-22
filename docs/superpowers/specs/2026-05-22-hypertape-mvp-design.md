# Hypertape MVP Design

## Context

Hypertape is a live probability tape for Hyperliquid HIP-4 outcome markets. The MVP should prioritize market movement, spread, depth, expiry, watchlists, and shareable tape events. It should not include execution, wallet analytics, trader leaderboards, AI recommendations, or a broad research terminal.

The first implementation will use fixture fallback plus a live Hyperliquid API adapter. Fixtures make the app testable and demoable while live `outcomeMeta` and book APIs are wired behind the same interfaces.

## Product Shape

The approved homepage direction is the "Movers command center":

- Header with product name, market search, and alert CTA.
- Big movers strip across the top.
- Three-column main workspace:
  - Live tape feed.
  - Active markets table.
  - Watchlist and alert draft sidebar.

This layout keeps the tape identity visible while giving traders enough table density to compare probability, spread, depth, and expiry quickly.

## Architecture

Build a Next.js App Router application in TypeScript.

Core boundaries:

- `lib/hyperliquid`: HIP-4 encoding, metadata normalization, live API adapter, fixture adapter.
- `lib/markets`: normalized market and snapshot types, probability math, canonical book calculations, depth calculations.
- `lib/tape`: probability delta, severity classification, event generation, event ranking, dedupe helpers.
- `lib/alerts`: local alert draft models and preset definitions. Telegram delivery remains disabled in the first slice.
- `app/api`: read-only API routes for markets, snapshots, tape, and alert presets.
- `components`: dense dark-mode UI components for the homepage, markets page, detail page, and alerts page.

Provider selection:

- Default to fixtures in local development and tests.
- Allow live mode through an environment variable.
- If live mode fails, return fixture data with an explicit source marker so the UI can show data provenance.

## Data Model

Use the MVP scope's `Market`, `MarketSnapshot`, `TapeEvent`, `AlertRule`, and `WatchlistState` shapes as the source of truth.

Important rules:

- `marketId` is the `outcomeId` as a string.
- Derive side encoding as `10 * outcomeId + side`.
- Derive spot coin as `#<encoding>`.
- Derive token name as `+<encoding>`.
- Derive asset ID as `100000000 + encoding`.
- Do not hardcode side 0 as YES and side 1 as NO.
- Use the side labeled `Yes` as primary and `No` as dual when metadata confirms those labels.
- Fall back to side 0 as primary and side 1 as dual for missing or nonstandard labels.
- Store `quoteToken` when exposed; never hardcode USDH.
- Keep raw metadata available only in debug/detail surfaces.

## Core Calculations

Implement and test these pure functions before UI work:

- Mid probability: only when both bid and ask exist.
- Spread: ask minus bid, represented as probability units.
- Probability delta: previous/current/delta/deltaPoints.
- Depth within 1, 3, and 5 probability points from the canonical merged book.
- Severity:
  - Low: at least 2 points in 15 minutes.
  - Medium: at least 5 points in 15 minutes.
  - High: at least 10 points in 15 minutes.
  - None: below threshold.

One-sided books must not produce mid-dependent movers or depth summaries.

## Pages

### `/`

Homepage with:

- Big movers strip.
- Live tape feed.
- Active markets table.
- Watchlist sidebar using localStorage.
- Disabled Telegram alert CTA until backend delivery is implemented.

### `/markets`

Full market table with:

- Search.
- Filters: active only, expiring soon, high liquidity, tight spread, biggest movers, stale markets, watchlist only.
- Sorts: biggest 5m move, biggest 15m move, tightest spread, deepest book, soonest expiry, most recently updated.
- Watchlist star.
- Link to market detail.

### `/markets/[marketId]`

Market detail with:

- Header and current probability stats.
- Probability chart from fixture/live snapshot history.
- Canonical orderbook and depth summary.
- Market-scoped tape events.
- Local alert draft controls with Telegram delivery marked disabled.
- Builder/debug metadata with raw JSON collapsed.

### `/alerts`

Alerts page with:

- Disabled Telegram connection card.
- Alert preset cards.
- Local alert draft form.
- Local alert rules list.

Telegram message delivery, chat linking, backend dedupe, and rate limits are deferred.

## API Routes

Initial read-only routes:

- `GET /api/markets`
- `GET /api/markets/[marketId]`
- `GET /api/tape`
- `GET /api/alerts/presets`

These routes use the selected data provider and return normalized application models. They do not expose raw Hyperliquid response shapes except through explicit debug fields on detail routes.

## UI Direction

Use dark mode first, dense but readable spacing, and a terminal/market-data feel. Avoid casino aesthetics and marketing-heavy hero composition.

Language should be trader-native:

- probability
- spread
- depth
- expiry
- liquidity
- book
- stale
- move

Avoid:

- bet
- wager
- guaranteed
- sure win
- AI pick
- buy signal

## Testing Strategy

Use TDD for core behavior:

- HIP-4 asset encoding.
- Side label selection and primary/dual side selection.
- Market normalization from fixture outcome metadata.
- Mid, spread, delta, depth, and severity calculations.
- Tape event generation and ranking.
- Watchlist localStorage helpers.
- Provider selection and fixture fallback behavior.

UI tests can come after the core is green. The first browser verification should confirm:

- Homepage renders nonblank.
- Big movers, live tape, market table, and watchlist appear in the first viewport.
- Market detail route opens from a row.
- Alerts page shows Telegram as disabled.

## Deferred Work

Do not include these in the first implementation slice:

- Supabase schema and persistence.
- Redis cache.
- Long-running market, snapshot, tape, or alert workers.
- Telegram bot delivery.
- Wallet connection.
- Trading or order placement.
- Trader leaderboards.
- AI recommendations.
- News/catalyst annotations.

The architecture should leave room for these later without adding placeholder infrastructure now.

## Acceptance Criteria For First Slice

- The app can run locally.
- Fixtures produce realistic HIP-4 markets, snapshots, tape events, and book data.
- Core math and tape logic are covered by automated tests.
- Homepage uses the approved movers command center layout.
- Users can star and unstar markets locally.
- Users can open market detail pages.
- Users can copy/share tape event text.
- Alerts page clearly communicates that Telegram delivery is disabled for now.
- Live Hyperliquid adapter exists behind the provider interface and can be enabled by environment configuration.
- Fixture fallback keeps the app usable when live calls fail.
