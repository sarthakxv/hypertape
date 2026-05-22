import { afterEach, describe, expect, test, vi } from "vitest";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

describe("market data provider selection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("uses fixture provider by default", async () => {
    const provider = getMarketDataProvider({});
    const markets = await provider.getMarkets();
    expect(provider.source).toBe("fixture");
    expect(markets.map((market) => market.name)).toEqual([
      "BTC above 105k by 06:00 UTC",
      "HYPE closes green today",
      "SOL above 180 by Friday close"
    ]);
    expect(markets[2]?.primarySide).toBe(0);
    expect(markets[2]?.dualSide).toBe(1);
  });

  test("filters fixture snapshots and tape events by market id", async () => {
    const provider = getMarketDataProvider({});

    const snapshots = await provider.getSnapshots("7");
    const events = await provider.getTapeEvents("7");

    expect(snapshots).toHaveLength(2);
    expect(snapshots.every((snapshot) => snapshot.marketId === "7")).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe("probability_move");
  });

  test("returns deep-cloned fixture markets so consumers cannot mutate provider state", async () => {
    const provider = getMarketDataProvider({});

    const firstRead = await provider.getMarkets();
    firstRead[0]!.sides[0]!.label = "Mutated";

    const secondRead = await provider.getMarkets();
    expect(secondRead[0]!.sides[0]!.label).toBe("Yes");
  });

  test("falls back to fixtures when live provider fails", async () => {
    const provider = getMarketDataProvider({
      HYPERTAPE_DATA_SOURCE: "live",
      HYPERTAPE_FORCE_LIVE_FAILURE: "1"
    });

    const markets = await provider.getMarkets();
    expect(provider.source).toBe("live-with-fixture-fallback");
    expect(markets.map((market) => market.name)).toContain("BTC above 105k by 06:00 UTC");
  });

  test("falls back through the live provider wrapper when outcomeMeta fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const provider = getMarketDataProvider({
      HYPERTAPE_DATA_SOURCE: "live"
    });

    const markets = await provider.getMarkets();

    expect(provider.source).toBe("live-with-fixture-fallback");
    expect(markets.map((market) => market.name)).toEqual([
      "BTC above 105k by 06:00 UTC",
      "HYPE closes green today",
      "SOL above 180 by Friday close"
    ]);
  });

  test("falls back to fixture snapshots and tape events in live mode when live data is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const provider = getMarketDataProvider({
      HYPERTAPE_DATA_SOURCE: "live"
    });

    const snapshots = await provider.getSnapshots("7");
    const events = await provider.getTapeEvents("7");

    expect(provider.source).toBe("live-with-fixture-fallback");
    expect(snapshots).toHaveLength(2);
    expect(events[0]?.eventType).toBe("probability_move");
  });
});
