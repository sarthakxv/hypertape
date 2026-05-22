# Hypertape MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Hypertape MVP: a fixture-backed, live-adapter-ready probability tape for HIP-4 markets with movers, spread/depth, watchlists, detail pages, disabled Telegram alert setup, and shareable tape events.

**Architecture:** Use a Next.js App Router app with TypeScript and Vitest. Keep market data behind a provider boundary so deterministic fixtures and live Hyperliquid calls return the same normalized models. Build core calculations and tape logic with TDD before rendering UI.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library, Lightweight Charts, localStorage, Hyperliquid HTTP API.

---

## File Structure

- Create `package.json`: npm scripts and dependencies.
- Create `tsconfig.json`: strict TypeScript project config.
- Create `next.config.ts`: Next.js config.
- Create `vitest.config.ts`: Vitest config with path aliases and jsdom.
- Create `vitest.setup.ts`: Testing Library setup.
- Create `app/layout.tsx`: root HTML shell.
- Create `app/globals.css`: dark terminal UI baseline.
- Create `app/page.tsx`: homepage using the movers command center layout.
- Create `app/markets/page.tsx`: full markets table page.
- Create `app/markets/[marketId]/page.tsx`: market detail page.
- Create `app/alerts/page.tsx`: local alert draft page with disabled Telegram.
- Create `app/api/markets/route.ts`: list markets API.
- Create `app/api/markets/[marketId]/route.ts`: market detail API.
- Create `app/api/tape/route.ts`: tape event API.
- Create `app/api/alerts/presets/route.ts`: alert preset API.
- Create `components/layout/app-shell.tsx`: header and page shell.
- Create `components/tape/live-tape.tsx`: tape feed and event sharing.
- Create `components/markets/markets-table.tsx`: sortable/filterable table.
- Create `components/markets/watchlist-star.tsx`: local watchlist toggle.
- Create `components/markets/watchlist-sidebar.tsx`: homepage watchlist.
- Create `components/markets/market-detail.tsx`: detail page sections.
- Create `components/charts/probability-chart.tsx`: client-only probability time-series chart.
- Create `components/alerts/alerts-panel.tsx`: alert preset/draft UI.
- Create `lib/hyperliquid/types.ts`: normalized domain types.
- Create `lib/hyperliquid/asset-encoding.ts`: HIP-4 asset encoding.
- Create `lib/hyperliquid/normalize-outcome-meta.ts`: metadata normalization.
- Create `lib/hyperliquid/live-provider.ts`: live API adapter.
- Create `lib/hyperliquid/fixture-provider.ts`: deterministic fixture adapter.
- Create `lib/hyperliquid/provider.ts`: provider selection and fallback.
- Create `lib/markets/probability.ts`: mid, spread, delta, formatting.
- Create `lib/markets/depth.ts`: canonical depth calculations.
- Create `lib/tape/severity.ts`: move severity.
- Create `lib/tape/event-engine.ts`: tape event generation and ranking.
- Create `lib/alerts/presets.ts`: alert preset definitions.
- Create `lib/watchlist/storage.ts`: localStorage helpers.
- Create `test/*.test.ts`: unit tests for core logic and provider behavior.

---

### Task 1: Scaffold Next.js, Testing, and Base Shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Modify: `README.md`

- [ ] **Step 1: Create project configuration**

Create `package.json`:

```json
{
  "name": "hypertape",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lightweight-charts": "^5.2.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.3.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true
};

export default nextConfig;
```

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  }
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules` and `package-lock.json` are created without dependency resolution errors.

- [ ] **Step 3: Create base app shell**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hypertape",
  description: "The live probability tape for Hyperliquid outcome markets."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/globals.css` with the dark baseline:

```css
:root {
  color-scheme: dark;
  --bg: #07090d;
  --panel: #10141b;
  --panel-2: #151b24;
  --line: #263140;
  --text: #eef4ff;
  --muted: #8f9bad;
  --green: #41d98b;
  --red: #ff6b78;
  --amber: #f5c469;
  --blue: #62a8ff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select {
  font: inherit;
}
```

Update `README.md`:

````md
# Hypertape

The live probability tape for Hyperliquid outcome markets.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run typecheck
npm run build
```
````

- [ ] **Step 4: Verify scaffold**

Run:

```bash
npm run typecheck
```

Expected: typecheck succeeds. Run `npm test` after Task 2 creates the first test file.

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts vitest.setup.ts app/layout.tsx app/globals.css README.md
git commit -m "chore: scaffold hypertape app"
```

---

### Task 2: Domain Types and HIP-4 Asset Encoding

**Files:**
- Create: `lib/hyperliquid/types.ts`
- Create: `lib/hyperliquid/asset-encoding.ts`
- Create: `test/asset-encoding.test.ts`

- [ ] **Step 1: Write failing encoding tests**

Create `test/asset-encoding.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { buildOutcomeSide, getPrimaryAndDualSides } from "@/lib/hyperliquid/asset-encoding";

describe("HIP-4 asset encoding", () => {
  test("derives encoding, coin, token name, and asset id from outcome id and side", () => {
    expect(buildOutcomeSide(1, 0, "Yes")).toEqual({
      side: 0,
      label: "Yes",
      encoding: 10,
      coin: "#10",
      tokenName: "+10",
      assetId: 100000010
    });

    expect(buildOutcomeSide(1, 1, "No")).toEqual({
      side: 1,
      label: "No",
      encoding: 11,
      coin: "#11",
      tokenName: "+11",
      assetId: 100000011
    });
  });

  test("uses Yes as primary and No as dual when metadata confirms labels", () => {
    const sides = [buildOutcomeSide(42, 0, "No"), buildOutcomeSide(42, 1, "Yes")] as const;
    expect(getPrimaryAndDualSides(sides)).toEqual({ primarySide: 1, dualSide: 0 });
  });

  test("falls back to side 0 primary and side 1 dual for nonstandard labels", () => {
    const sides = [buildOutcomeSide(42, 0, "Over"), buildOutcomeSide(42, 1, "Under")] as const;
    expect(getPrimaryAndDualSides(sides)).toEqual({ primarySide: 0, dualSide: 1 });
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm test -- test/asset-encoding.test.ts
```

Expected: FAIL because `@/lib/hyperliquid/asset-encoding` does not exist.

- [ ] **Step 3: Create domain types and implementation**

Create `lib/hyperliquid/types.ts`:

```ts
export type OutcomeSide = {
  side: 0 | 1;
  label: string;
  encoding: number;
  coin: `#${number}`;
  tokenName: `+${number}`;
  assetId: number;
};

export type OutcomeQuestion = {
  questionId: number;
  name: string;
  description?: string;
  fallbackOutcome?: number;
  namedOutcomes: number[];
  settledNamedOutcomes: number[];
};

export type MarketStatus = "active" | "settling" | "settled" | "unknown";
export type MarketStatusSource = "metadata" | "expiry" | "book" | "trade" | "indexer" | "unknown";

export type Market = {
  id: string;
  outcomeId: number;
  questionId?: number;
  name: string;
  description?: string;
  inheritedQuestionDescription?: string;
  quoteToken?: string;
  underlying?: string;
  targetPrice?: number;
  priceThresholds?: number[];
  expiryTime?: string;
  period?: string;
  sides: readonly [OutcomeSide, OutcomeSide];
  question?: OutcomeQuestion;
  primarySide: 0 | 1;
  dualSide: 0 | 1;
  status: MarketStatus;
  statusSource: MarketStatusSource;
  raw: unknown;
  createdAt: number;
  updatedAt: number;
};

export type BookLevel = {
  price: number;
  size: number;
};

export type MarketSnapshot = {
  marketId: string;
  timestamp: number;
  primarySide: 0 | 1;
  primaryBestBid: number | null;
  primaryBestAsk: number | null;
  primaryMid: number | null;
  dualBestBid: number | null;
  dualBestAsk: number | null;
  dualMid: number | null;
  canonicalSpread: number | null;
  bidDepthOnePoint: number | null;
  askDepthOnePoint: number | null;
  bidDepthThreePoints: number | null;
  askDepthThreePoints: number | null;
  bidDepthFivePoints: number | null;
  askDepthFivePoints: number | null;
  totalDepthOnePoint: number | null;
  totalDepthThreePoints: number | null;
  totalDepthFivePoints: number | null;
  recentVolume: number | null;
  recentTradeCount: number | null;
  lastBookUpdateAt: number | null;
  lastTradeAt: number | null;
  bids: BookLevel[];
  asks: BookLevel[];
};

export type TapeEvent = {
  id: string;
  marketId: string;
  timestamp: number;
  eventType: "probability_move" | "spread_tightened" | "spread_widened" | "new_market" | "expiry_soon" | "large_trade";
  side?: string;
  previousProbability?: number;
  currentProbability?: number;
  delta?: number;
  windowSeconds?: number;
  spread?: number;
  depth?: number;
  volume?: number;
  severity: "low" | "medium" | "high";
  title: string;
  summary: string;
};

export type WatchlistState = {
  marketIds: string[];
  updatedAt: number;
};
```

Create `lib/hyperliquid/asset-encoding.ts`:

```ts
import type { OutcomeSide } from "./types";

export function buildOutcomeSide(outcomeId: number, side: 0 | 1, label: string): OutcomeSide {
  const encoding = 10 * outcomeId + side;

  return {
    side,
    label,
    encoding,
    coin: `#${encoding}`,
    tokenName: `+${encoding}`,
    assetId: 100000000 + encoding
  };
}

export function getPrimaryAndDualSides(sides: readonly [OutcomeSide, OutcomeSide]): {
  primarySide: 0 | 1;
  dualSide: 0 | 1;
} {
  const yesSide = sides.find((side) => side.label.toLowerCase() === "yes")?.side;
  const noSide = sides.find((side) => side.label.toLowerCase() === "no")?.side;

  if (yesSide !== undefined && noSide !== undefined && yesSide !== noSide) {
    return { primarySide: yesSide, dualSide: noSide };
  }

  return { primarySide: 0, dualSide: 1 };
}
```

- [ ] **Step 4: Run test to verify GREEN**

Run:

```bash
npm test -- test/asset-encoding.test.ts
npm run typecheck
```

Expected: PASS and typecheck succeeds.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/hyperliquid/types.ts lib/hyperliquid/asset-encoding.ts test/asset-encoding.test.ts
git commit -m "feat: add hip4 asset encoding"
```

---

### Task 3: Probability, Depth, and Severity Calculations

**Files:**
- Create: `lib/markets/probability.ts`
- Create: `lib/markets/depth.ts`
- Create: `lib/tape/severity.ts`
- Create: `test/market-calculations.test.ts`
- Create: `test/severity.test.ts`

- [ ] **Step 1: Write failing calculation tests**

Create `test/market-calculations.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { calculateMid, calculateProbabilityDelta, calculateSpread } from "@/lib/markets/probability";
import { depthWithinPoints } from "@/lib/markets/depth";

describe("market calculations", () => {
  test("calculates mid only when bid and ask are both present", () => {
    expect(calculateMid(0.42, 0.44)).toBe(0.43);
    expect(calculateMid(0.42, null)).toBeNull();
    expect(calculateMid(null, 0.44)).toBeNull();
  });

  test("calculates spread only when bid and ask are both present", () => {
    expect(calculateSpread(0.42, 0.44)).toBeCloseTo(0.02);
    expect(calculateSpread(null, 0.44)).toBeNull();
  });

  test("calculates probability delta in probability units and points", () => {
    expect(calculateProbabilityDelta(0.421, 0.478)).toEqual({
      previous: 0.421,
      current: 0.478,
      delta: 0.056999999999999995,
      deltaPoints: 5.699999999999999
    });
  });

  test("calculates bid, ask, and total notional depth within point bands", () => {
    const result = depthWithinPoints(
      [
        { price: 0.43, size: 1000 },
        { price: 0.4, size: 1000 }
      ],
      [
        { price: 0.45, size: 2000 },
        { price: 0.5, size: 2000 }
      ],
      0.44,
      3
    );

    expect(result).toEqual({
      bidDepth: 430,
      askDepth: 900,
      totalDepth: 1330
    });
  });
});
```

Create `test/severity.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { classifyMove } from "@/lib/tape/severity";

describe("move severity", () => {
  test("classifies moves by point threshold inside fifteen minutes", () => {
    expect(classifyMove(1.9, 15 * 60)).toBe("none");
    expect(classifyMove(2, 15 * 60)).toBe("low");
    expect(classifyMove(5, 15 * 60)).toBe("medium");
    expect(classifyMove(10, 15 * 60)).toBe("high");
  });

  test("returns none when the move is outside the window", () => {
    expect(classifyMove(20, 16 * 60)).toBe("none");
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- test/market-calculations.test.ts test/severity.test.ts
```

Expected: FAIL because calculation modules do not exist.

- [ ] **Step 3: Implement calculations**

Create `lib/markets/probability.ts`:

```ts
export type ProbabilityDelta = {
  previous: number;
  current: number;
  delta: number;
  deltaPoints: number;
};

export function calculateMid(bestBid: number | null, bestAsk: number | null): number | null {
  if (bestBid == null || bestAsk == null) return null;
  return (bestBid + bestAsk) / 2;
}

export function calculateSpread(bestBid: number | null, bestAsk: number | null): number | null {
  if (bestBid == null || bestAsk == null) return null;
  return bestAsk - bestBid;
}

export function calculateProbabilityDelta(previous: number, current: number): ProbabilityDelta {
  const delta = current - previous;
  return {
    previous,
    current,
    delta,
    deltaPoints: delta * 100
  };
}

export function formatProbability(value: number | null): string {
  if (value == null) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPoints(value: number | null): string {
  if (value == null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}
```

Create `lib/markets/depth.ts`:

```ts
import type { BookLevel } from "@/lib/hyperliquid/types";

export type DepthWithinPoints = {
  bidDepth: number;
  askDepth: number;
  totalDepth: number;
};

export function depthWithinPoints(
  bids: BookLevel[],
  asks: BookLevel[],
  mid: number,
  points: number
): DepthWithinPoints {
  const band = points / 100;
  const lower = mid - band;
  const upper = mid + band;

  const bidDepth = bids
    .filter((level) => level.price >= lower && level.price <= mid)
    .reduce((sum, level) => sum + level.price * level.size, 0);

  const askDepth = asks
    .filter((level) => level.price >= mid && level.price <= upper)
    .reduce((sum, level) => sum + level.price * level.size, 0);

  return {
    bidDepth,
    askDepth,
    totalDepth: bidDepth + askDepth
  };
}
```

Create `lib/tape/severity.ts`:

```ts
export type MoveSeverity = "none" | "low" | "medium" | "high";

export function classifyMove(deltaPointsAbs: number, windowSeconds: number): MoveSeverity {
  if (windowSeconds <= 15 * 60 && deltaPointsAbs >= 10) return "high";
  if (windowSeconds <= 15 * 60 && deltaPointsAbs >= 5) return "medium";
  if (windowSeconds <= 15 * 60 && deltaPointsAbs >= 2) return "low";
  return "none";
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/market-calculations.test.ts test/severity.test.ts
npm run typecheck
```

Expected: PASS and typecheck succeeds.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/markets/probability.ts lib/markets/depth.ts lib/tape/severity.ts test/market-calculations.test.ts test/severity.test.ts
git commit -m "feat: add market calculation primitives"
```

---

### Task 4: Fixtures, Normalization, and Provider Selection

**Files:**
- Create: `lib/hyperliquid/fixtures.ts`
- Create: `lib/hyperliquid/normalize-outcome-meta.ts`
- Create: `lib/hyperliquid/fixture-provider.ts`
- Create: `lib/hyperliquid/live-provider.ts`
- Create: `lib/hyperliquid/provider.ts`
- Create: `test/normalize-outcome-meta.test.ts`
- Create: `test/provider.test.ts`

- [ ] **Step 1: Write failing normalization and provider tests**

Create `test/normalize-outcome-meta.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { normalizeOutcomeMeta } from "@/lib/hyperliquid/normalize-outcome-meta";

describe("outcome meta normalization", () => {
  test("normalizes side labels, encodings, primary side, quote token, and raw metadata", () => {
    const market = normalizeOutcomeMeta({
      outcomeId: 7,
      questionId: 3,
      name: "BTC above 105k by 06:00 UTC",
      description: "Resolves Yes if BTC trades above 105k before expiry.",
      sideSpecs: [{ name: "No" }, { name: "Yes" }],
      quoteToken: "USDH",
      expiryTime: "2026-05-23T06:00:00.000Z",
      status: "active"
    }, 1700000000000);

    expect(market.id).toBe("7");
    expect(market.primarySide).toBe(1);
    expect(market.dualSide).toBe(0);
    expect(market.quoteToken).toBe("USDH");
    expect(market.sides[0].encoding).toBe(70);
    expect(market.sides[1].encoding).toBe(71);
    expect(market.status).toBe("active");
    expect(market.raw).toMatchObject({ outcomeId: 7 });
  });
});
```

Create `test/provider.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

describe("market data provider selection", () => {
  test("uses fixture provider by default", async () => {
    const provider = getMarketDataProvider({});
    const markets = await provider.getMarkets();
    expect(provider.source).toBe("fixture");
    expect(markets.length).toBeGreaterThan(0);
  });

  test("falls back to fixtures when live provider fails", async () => {
    const provider = getMarketDataProvider({
      HYPERTAPE_DATA_SOURCE: "live",
      HYPERTAPE_FORCE_LIVE_FAILURE: "1"
    });

    const markets = await provider.getMarkets();
    expect(provider.source).toBe("live-with-fixture-fallback");
    expect(markets.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- test/normalize-outcome-meta.test.ts test/provider.test.ts
```

Expected: FAIL because fixture and provider modules do not exist.

- [ ] **Step 3: Implement fixtures and providers**

Create `lib/hyperliquid/fixtures.ts` with three markets, current snapshots, snapshot history, and tape events. Use these market names:

```ts
export const fixtureOutcomeMeta = [
  {
    outcomeId: 7,
    questionId: 3,
    name: "BTC above 105k by 06:00 UTC",
    description: "Resolves Yes if BTC trades above 105k before expiry.",
    sideSpecs: [{ name: "Yes" }, { name: "No" }],
    quoteToken: "USDH",
    expiryTime: "2026-05-23T06:00:00.000Z",
    status: "active"
  },
  {
    outcomeId: 8,
    questionId: 4,
    name: "HYPE closes green today",
    description: "Resolves Yes if HYPE closes above the daily open.",
    sideSpecs: [{ name: "Yes" }, { name: "No" }],
    quoteToken: "USDH",
    expiryTime: "2026-05-23T00:00:00.000Z",
    status: "active"
  },
  {
    outcomeId: 9,
    questionId: 5,
    name: "SOL above 180 by Friday close",
    description: "Resolves Up if SOL is above 180 by Friday close.",
    sideSpecs: [{ name: "Up" }, { name: "Down" }],
    quoteToken: "USDC",
    expiryTime: "2026-05-24T00:00:00.000Z",
    status: "active"
  }
] as const;
```

Create `lib/hyperliquid/normalize-outcome-meta.ts`:

```ts
import { buildOutcomeSide, getPrimaryAndDualSides } from "./asset-encoding";
import type { Market, MarketStatus } from "./types";

type RawSideSpec = { name?: string; label?: string };

type RawOutcomeMeta = {
  outcomeId: number;
  questionId?: number;
  name?: string;
  title?: string;
  description?: string;
  sideSpecs?: RawSideSpec[];
  quoteToken?: string;
  expiryTime?: string;
  status?: string;
};

function normalizeStatus(status: string | undefined): MarketStatus {
  if (status === "active" || status === "settling" || status === "settled") return status;
  return "unknown";
}

export function normalizeOutcomeMeta(raw: RawOutcomeMeta, now = Date.now()): Market {
  const outcomeId = raw.outcomeId;
  const side0Label = raw.sideSpecs?.[0]?.name ?? raw.sideSpecs?.[0]?.label ?? "Side 0";
  const side1Label = raw.sideSpecs?.[1]?.name ?? raw.sideSpecs?.[1]?.label ?? "Side 1";
  const sides = [
    buildOutcomeSide(outcomeId, 0, side0Label),
    buildOutcomeSide(outcomeId, 1, side1Label)
  ] as const;
  const { primarySide, dualSide } = getPrimaryAndDualSides(sides);

  return {
    id: String(outcomeId),
    outcomeId,
    questionId: raw.questionId,
    name: raw.name ?? raw.title ?? `Outcome ${outcomeId}`,
    description: raw.description,
    quoteToken: raw.quoteToken,
    expiryTime: raw.expiryTime,
    sides,
    primarySide,
    dualSide,
    status: normalizeStatus(raw.status),
    statusSource: raw.status ? "metadata" : "unknown",
    raw,
    createdAt: now,
    updatedAt: now
  };
}
```

Create `lib/hyperliquid/fixture-provider.ts`, `live-provider.ts`, and `provider.ts` so they expose:

```ts
export type MarketDataProvider = {
  source: "fixture" | "live" | "live-with-fixture-fallback";
  getMarkets(): Promise<Market[]>;
  getMarket(marketId: string): Promise<Market | null>;
  getSnapshots(marketId?: string): Promise<MarketSnapshot[]>;
  getTapeEvents(marketId?: string): Promise<TapeEvent[]>;
};
```

The fixture provider must normalize `fixtureOutcomeMeta` and return deterministic snapshots/events. The live provider must POST to `https://api.hyperliquid.xyz/info` with `{ "type": "outcomeMeta" }` and normalize response arrays when present. The provider selector must use fixtures unless `HYPERTAPE_DATA_SOURCE=live`.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/normalize-outcome-meta.test.ts test/provider.test.ts
npm run typecheck
```

Expected: PASS and typecheck succeeds.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/hyperliquid/fixtures.ts lib/hyperliquid/normalize-outcome-meta.ts lib/hyperliquid/fixture-provider.ts lib/hyperliquid/live-provider.ts lib/hyperliquid/provider.ts test/normalize-outcome-meta.test.ts test/provider.test.ts
git commit -m "feat: add market data providers"
```

---

### Task 5: Tape Event Engine and Alert Presets

**Files:**
- Create: `lib/tape/event-engine.ts`
- Create: `lib/alerts/presets.ts`
- Create: `test/tape-engine.test.ts`

- [ ] **Step 1: Write failing tape engine tests**

Create `test/tape-engine.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { generateProbabilityMoveEvents, rankTapeEvents } from "@/lib/tape/event-engine";
import type { Market, MarketSnapshot } from "@/lib/hyperliquid/types";

const market = {
  id: "7",
  outcomeId: 7,
  name: "BTC above 105k by 06:00 UTC",
  sides: [
    { side: 0, label: "Yes", encoding: 70, coin: "#70", tokenName: "+70", assetId: 100000070 },
    { side: 1, label: "No", encoding: 71, coin: "#71", tokenName: "+71", assetId: 100000071 }
  ],
  primarySide: 0,
  dualSide: 1,
  status: "active",
  statusSource: "metadata",
  raw: {},
  createdAt: 1,
  updatedAt: 1
} satisfies Market;

function snapshot(timestamp: number, mid: number): MarketSnapshot {
  return {
    marketId: "7",
    timestamp,
    primarySide: 0,
    primaryBestBid: mid - 0.01,
    primaryBestAsk: mid + 0.01,
    primaryMid: mid,
    dualBestBid: 1 - mid - 0.01,
    dualBestAsk: 1 - mid + 0.01,
    dualMid: 1 - mid,
    canonicalSpread: 0.02,
    bidDepthOnePoint: 1000,
    askDepthOnePoint: 1200,
    bidDepthThreePoints: 2500,
    askDepthThreePoints: 2600,
    bidDepthFivePoints: 4000,
    askDepthFivePoints: 4200,
    totalDepthOnePoint: 2200,
    totalDepthThreePoints: 5100,
    totalDepthFivePoints: 8200,
    recentVolume: 9000,
    recentTradeCount: 14,
    lastBookUpdateAt: timestamp,
    lastTradeAt: timestamp,
    bids: [],
    asks: []
  };
}

describe("tape event engine", () => {
  test("generates a medium probability move event for a five point move", () => {
    const events = generateProbabilityMoveEvents([market], [snapshot(1000, 0.42), snapshot(1000 + 5 * 60, 0.478)], 5 * 60);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      marketId: "7",
      eventType: "probability_move",
      side: "Yes",
      previousProbability: 0.42,
      currentProbability: 0.478,
      severity: "medium"
    });
  });

  test("ranks higher severity and larger deltas first", () => {
    const ranked = rankTapeEvents([
      { id: "a", marketId: "7", timestamp: 10, eventType: "probability_move", severity: "low", delta: 0.03, title: "a", summary: "a" },
      { id: "b", marketId: "7", timestamp: 9, eventType: "probability_move", severity: "high", delta: 0.11, title: "b", summary: "b" }
    ]);

    expect(ranked[0].id).toBe("b");
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm test -- test/tape-engine.test.ts
```

Expected: FAIL because `lib/tape/event-engine.ts` does not exist.

- [ ] **Step 3: Implement event engine and alert presets**

Create `lib/tape/event-engine.ts`:

```ts
import type { Market, MarketSnapshot, TapeEvent } from "@/lib/hyperliquid/types";
import { calculateProbabilityDelta } from "@/lib/markets/probability";
import { classifyMove } from "./severity";

const severityRank = { high: 3, medium: 2, low: 1 };

export function generateProbabilityMoveEvents(
  markets: Market[],
  snapshots: MarketSnapshot[],
  windowSeconds: number
): TapeEvent[] {
  const marketsById = new Map(markets.map((market) => [market.id, market]));
  const byMarket = new Map<string, MarketSnapshot[]>();

  for (const snapshot of snapshots) {
    const list = byMarket.get(snapshot.marketId) ?? [];
    list.push(snapshot);
    byMarket.set(snapshot.marketId, list);
  }

  const events: TapeEvent[] = [];

  for (const [marketId, marketSnapshots] of byMarket) {
    const sorted = [...marketSnapshots].sort((a, b) => a.timestamp - b.timestamp);
    const previous = sorted[0];
    const current = sorted[sorted.length - 1];
    const market = marketsById.get(marketId);
    if (!market || previous.primaryMid == null || current.primaryMid == null) continue;

    const delta = calculateProbabilityDelta(previous.primaryMid, current.primaryMid);
    const severity = classifyMove(Math.abs(delta.deltaPoints), windowSeconds);
    if (severity === "none") continue;

    const side = market.sides.find((candidate) => candidate.side === market.primarySide)?.label;

    events.push({
      id: `${marketId}-${windowSeconds}-${current.timestamp}`,
      marketId,
      timestamp: current.timestamp,
      eventType: "probability_move",
      side,
      previousProbability: previous.primaryMid,
      currentProbability: current.primaryMid,
      delta: delta.delta,
      windowSeconds,
      spread: current.canonicalSpread ?? undefined,
      depth: current.totalDepthFivePoints ?? undefined,
      volume: current.recentVolume ?? undefined,
      severity,
      title: `${market.name} ${side ?? "primary"} moved ${delta.deltaPoints >= 0 ? "+" : ""}${delta.deltaPoints.toFixed(1)} pts`,
      summary: `${(previous.primaryMid * 100).toFixed(1)}% to ${(current.primaryMid * 100).toFixed(1)}% in ${Math.round(windowSeconds / 60)}m`
    });
  }

  return rankTapeEvents(events);
}

export function rankTapeEvents(events: TapeEvent[]): TapeEvent[] {
  return [...events].sort((a, b) => {
    const severityDiff = severityRank[b.severity] - severityRank[a.severity];
    if (severityDiff !== 0) return severityDiff;
    const deltaDiff = Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0);
    if (deltaDiff !== 0) return deltaDiff;
    return b.timestamp - a.timestamp;
  });
}
```

Create `lib/alerts/presets.ts`:

```ts
export type AlertPreset = {
  id: string;
  name: string;
  description: string;
  trigger: "probability_delta" | "spread_below" | "spread_above" | "new_market" | "expiry_soon";
  threshold: number;
  windowSeconds?: number;
  marketScope: "all" | "watchlist" | "single";
};

export const alertPresets: AlertPreset[] = [
  {
    id: "big-move",
    name: "Big Move",
    description: "Any market moves at least 5 pts in 15 min.",
    trigger: "probability_delta",
    threshold: 5,
    windowSeconds: 15 * 60,
    marketScope: "all"
  },
  {
    id: "violent-move",
    name: "Violent Move",
    description: "Any market moves at least 10 pts in 15 min.",
    trigger: "probability_delta",
    threshold: 10,
    windowSeconds: 15 * 60,
    marketScope: "all"
  },
  {
    id: "expiry-soon",
    name: "Expiry Soon",
    description: "Watchlist market expires in 30 min.",
    trigger: "expiry_soon",
    threshold: 30,
    windowSeconds: 30 * 60,
    marketScope: "watchlist"
  },
  {
    id: "new-market",
    name: "New Market",
    description: "A new HIP-4 market appears.",
    trigger: "new_market",
    threshold: 1,
    marketScope: "all"
  },
  {
    id: "tight-book",
    name: "Tight Book",
    description: "Spread tightens below 1 pt.",
    trigger: "spread_below",
    threshold: 1,
    marketScope: "all"
  }
];
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/tape-engine.test.ts
npm run typecheck
```

Expected: PASS and typecheck succeeds.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/tape/event-engine.ts lib/alerts/presets.ts test/tape-engine.test.ts
git commit -m "feat: generate tape events"
```

---

### Task 6: API Routes

**Files:**
- Create: `app/api/markets/route.ts`
- Create: `app/api/markets/[marketId]/route.ts`
- Create: `app/api/tape/route.ts`
- Create: `app/api/alerts/presets/route.ts`
- Create: `test/api-routes.test.ts`

- [ ] **Step 1: Write failing API route tests**

Create `test/api-routes.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { GET as getMarkets } from "@/app/api/markets/route";
import { GET as getTape } from "@/app/api/tape/route";
import { GET as getPresets } from "@/app/api/alerts/presets/route";

describe("api routes", () => {
  test("returns normalized markets", async () => {
    const response = await getMarkets();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBeTruthy();
    expect(body.markets.length).toBeGreaterThan(0);
    expect(body.markets[0]).toHaveProperty("primarySide");
  });

  test("returns tape events", async () => {
    const response = await getTape();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.events.length).toBeGreaterThan(0);
  });

  test("returns alert presets", async () => {
    const response = await getPresets();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.presets.map((preset: { id: string }) => preset.id)).toContain("big-move");
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm test -- test/api-routes.test.ts
```

Expected: FAIL because API route modules do not exist.

- [ ] **Step 3: Implement API routes**

Create `app/api/markets/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export async function GET() {
  const provider = getMarketDataProvider(process.env);
  const markets = await provider.getMarkets();
  const snapshots = await provider.getSnapshots();

  return NextResponse.json({
    source: provider.source,
    markets,
    snapshots
  });
}
```

Create `app/api/markets/[marketId]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export async function GET(_request: Request, context: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await context.params;
  const provider = getMarketDataProvider(process.env);
  const market = await provider.getMarket(marketId);

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  const snapshots = await provider.getSnapshots(marketId);
  const events = await provider.getTapeEvents(marketId);

  return NextResponse.json({
    source: provider.source,
    market,
    snapshots,
    events
  });
}
```

Create `app/api/tape/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export async function GET() {
  const provider = getMarketDataProvider(process.env);
  const events = await provider.getTapeEvents();

  return NextResponse.json({
    source: provider.source,
    events
  });
}
```

Create `app/api/alerts/presets/route.ts`:

```ts
import { NextResponse } from "next/server";
import { alertPresets } from "@/lib/alerts/presets";

export async function GET() {
  return NextResponse.json({ presets: alertPresets });
}
```

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/api-routes.test.ts
npm run typecheck
```

Expected: PASS and typecheck succeeds.

- [ ] **Step 5: Commit**

Run:

```bash
git add app/api lib test/api-routes.test.ts
git commit -m "feat: add read only api routes"
```

---

### Task 7: Homepage, Markets Page, and Watchlist UI

**Files:**
- Create: `components/layout/app-shell.tsx`
- Create: `components/tape/live-tape.tsx`
- Create: `components/markets/markets-table.tsx`
- Create: `components/markets/watchlist-star.tsx`
- Create: `components/markets/watchlist-sidebar.tsx`
- Create: `lib/watchlist/storage.ts`
- Create: `app/page.tsx`
- Create: `app/markets/page.tsx`
- Create: `test/watchlist-storage.test.ts`

- [ ] **Step 1: Write failing watchlist storage tests**

Create `test/watchlist-storage.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { addMarketToWatchlist, removeMarketFromWatchlist, toggleMarketInWatchlist } from "@/lib/watchlist/storage";

describe("watchlist storage helpers", () => {
  test("adds, removes, and toggles market ids without duplicates", () => {
    const empty = { marketIds: [], updatedAt: 1 };
    const added = addMarketToWatchlist(empty, "7", 2);
    expect(added).toEqual({ marketIds: ["7"], updatedAt: 2 });

    const addedAgain = addMarketToWatchlist(added, "7", 3);
    expect(addedAgain.marketIds).toEqual(["7"]);

    const toggledOff = toggleMarketInWatchlist(addedAgain, "7", 4);
    expect(toggledOff).toEqual({ marketIds: [], updatedAt: 4 });

    const removed = removeMarketFromWatchlist({ marketIds: ["7", "8"], updatedAt: 4 }, "7", 5);
    expect(removed).toEqual({ marketIds: ["8"], updatedAt: 5 });
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm test -- test/watchlist-storage.test.ts
```

Expected: FAIL because `lib/watchlist/storage.ts` does not exist.

- [ ] **Step 3: Implement watchlist helpers**

Create `lib/watchlist/storage.ts`:

```ts
import type { WatchlistState } from "@/lib/hyperliquid/types";

export const watchlistStorageKey = "hypertape.watchlist";

export function addMarketToWatchlist(state: WatchlistState, marketId: string, now = Date.now()): WatchlistState {
  if (state.marketIds.includes(marketId)) {
    return { marketIds: state.marketIds, updatedAt: now };
  }

  return { marketIds: [...state.marketIds, marketId], updatedAt: now };
}

export function removeMarketFromWatchlist(state: WatchlistState, marketId: string, now = Date.now()): WatchlistState {
  return { marketIds: state.marketIds.filter((id) => id !== marketId), updatedAt: now };
}

export function toggleMarketInWatchlist(state: WatchlistState, marketId: string, now = Date.now()): WatchlistState {
  if (state.marketIds.includes(marketId)) {
    return removeMarketFromWatchlist(state, marketId, now);
  }

  return addMarketToWatchlist(state, marketId, now);
}

export function readWatchlistFromStorage(storage: Storage): WatchlistState {
  const raw = storage.getItem(watchlistStorageKey);
  if (!raw) return { marketIds: [], updatedAt: Date.now() };

  try {
    const parsed = JSON.parse(raw) as WatchlistState;
    return {
      marketIds: Array.isArray(parsed.marketIds) ? parsed.marketIds : [],
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now()
    };
  } catch {
    return { marketIds: [], updatedAt: Date.now() };
  }
}

export function writeWatchlistToStorage(storage: Storage, state: WatchlistState): void {
  storage.setItem(watchlistStorageKey, JSON.stringify(state));
}
```

- [ ] **Step 4: Run watchlist test to verify GREEN**

Run:

```bash
npm test -- test/watchlist-storage.test.ts
```

Expected: PASS.

- [ ] **Step 5: Build homepage and markets UI**

Create components that:

- Render `AppShell` with `Hypertape`, `Markets`, and `Alerts` links.
- Render `LiveTape` with event title, summary, severity, spread, depth, and copy/share buttons.
- Render `MarketsTable` with columns: Market, primary probability, 5m, 15m, spread, depth, expiry, status.
- Render `WatchlistStar` as a client component using localStorage helpers.
- Render `WatchlistSidebar` from starred market IDs.
- Render `app/page.tsx` in the approved movers command center layout.
- Render `app/markets/page.tsx` as the full-width markets table.

Use server components for fetching fixture/provider data and client components only where browser state is required.

- [ ] **Step 6: Verify page typecheck and tests**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all tests pass, typecheck succeeds, Next.js production build succeeds.

- [ ] **Step 7: Commit**

Run:

```bash
git add components app/page.tsx app/markets/page.tsx lib/watchlist/storage.ts test/watchlist-storage.test.ts
git commit -m "feat: build homepage and markets table"
```

---

### Task 8: Market Detail and Alerts Pages

**Files:**
- Create: `components/markets/market-detail.tsx`
- Create: `components/charts/probability-chart.tsx`
- Create: `components/alerts/alerts-panel.tsx`
- Create: `app/markets/[marketId]/page.tsx`
- Create: `app/alerts/page.tsx`

- [ ] **Step 1: Implement market detail page**

Create `components/markets/market-detail.tsx` to render:

- Market header with name, outcome ID, quote token, expiry, and status.
- Current primary and dual probabilities.
- Client-only Lightweight Charts area chart for primary probability history.
- Canonical book levels from latest snapshot.
- Depth summary for 1, 3, and 5 point bands.
- Market-scoped tape events.
- Local alert draft controls with Telegram marked disabled.
- Collapsed raw metadata JSON.

Create `components/charts/probability-chart.tsx` as a client component that:

- Creates the chart in a `useEffect` with `createChart`.
- Uses `AreaSeries` for primary-side probability history.
- Converts snapshot timestamps to Lightweight Charts time values.
- Cleans up the chart instance on unmount.
- Calls `timeScale().fitContent()` after setting data.
- Includes TradingView attribution in the chart footer because Lightweight Charts requires it.

Create `app/markets/[marketId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MarketDetail } from "@/components/markets/market-detail";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

export default async function MarketDetailPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  const provider = getMarketDataProvider(process.env);
  const market = await provider.getMarket(marketId);

  if (!market) notFound();

  const snapshots = await provider.getSnapshots(marketId);
  const events = await provider.getTapeEvents(marketId);

  return (
    <AppShell>
      <MarketDetail market={market} snapshots={snapshots} events={events} source={provider.source} />
    </AppShell>
  );
}
```

- [ ] **Step 2: Implement alerts page**

Create `components/alerts/alerts-panel.tsx` to render:

- Telegram connection card with a disabled button labeled `Telegram disabled`.
- Alert preset cards from `alertPresets`.
- Local draft form controls for scope, threshold, and window.
- A local rules list that stores drafts in component state only.

Create `app/alerts/page.tsx`:

```tsx
import { AlertsPanel } from "@/components/alerts/alerts-panel";
import { AppShell } from "@/components/layout/app-shell";
import { alertPresets } from "@/lib/alerts/presets";

export default function AlertsPage() {
  return (
    <AppShell>
      <AlertsPanel presets={alertPresets} />
    </AppShell>
  );
}
```

- [ ] **Step 3: Verify detail and alerts pages**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all tests pass, typecheck succeeds, Next.js production build succeeds.

- [ ] **Step 4: Commit**

Run:

```bash
git add components/markets/market-detail.tsx components/charts/probability-chart.tsx components/alerts/alerts-panel.tsx app/markets/'[marketId]'/page.tsx app/alerts/page.tsx
git commit -m "feat: add market detail and alerts pages"
```

---

### Task 9: Browser Verification and Polish

**Files:**
- Modify: `app/globals.css`
- Modify: `components/layout/app-shell.tsx`
- Modify: `components/tape/live-tape.tsx`
- Modify: `components/markets/markets-table.tsx`
- Modify: `components/markets/watchlist-sidebar.tsx`
- Modify: `components/markets/market-detail.tsx`
- Modify: `components/charts/probability-chart.tsx`
- Modify: `components/alerts/alerts-panel.tsx`

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev
```

Expected: Next.js dev server starts and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 2: Verify homepage in Browser**

Open the local URL in the in-app browser and confirm:

- First viewport is nonblank.
- Big movers strip is visible.
- Live tape, markets table, and watchlist sidebar are visible on desktop.
- Text does not overlap or overflow on desktop width.
- Share/copy controls are visible on tape events.

- [ ] **Step 3: Verify market detail and alerts**

In the browser:

- Click a market row and confirm `/markets/[marketId]` opens.
- Confirm chart, book, depth, tape events, and raw metadata render.
- Open `/alerts`.
- Confirm Telegram connection is visibly disabled.

- [ ] **Step 4: Verify mobile layout**

Resize browser to `390x844` and confirm:

- Homepage sections stack cleanly.
- Market table can scroll horizontally or becomes readable without text overlap.
- Watchlist controls remain tappable.
- Alerts cards do not overflow.

- [ ] **Step 5: Final verification**

Run:

```bash
npm test
npm run typecheck
npm run build
git status --short
```

Expected: tests, typecheck, and build pass. `git status --short` should show only intentional changes.

- [ ] **Step 6: Commit polish**

Run:

```bash
git add app components lib test package.json package-lock.json README.md
git commit -m "chore: verify hypertape mvp"
```

---

## Self-Review

Spec coverage:

- Fixture fallback plus live API adapter: Tasks 4 and 6.
- HIP-4 encoding and side labels: Task 2.
- Mid, spread, delta, depth, severity: Task 3.
- Tape generation and ranking: Task 5.
- Homepage movers command center: Task 7.
- Markets page and watchlist: Task 7.
- Detail page: Task 8.
- Alerts page with disabled Telegram: Task 8.
- Browser verification: Task 9.

Deferred items stay out of this plan:

- Supabase, Redis, long-running workers, Telegram delivery, wallet connection, execution, leaderboards, AI, and news annotations.

Incomplete-marker scan:

- No red-flag incomplete markers are used.
- Deferred work is explicitly excluded, not left as incomplete implementation.

Type consistency:

- Domain types are introduced before tests or consumers reference them.
- Provider methods are defined once and reused by API routes and pages.
- `marketId` remains the string form of `outcomeId` throughout.
