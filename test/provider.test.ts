import { describe, expect, test } from "vitest";
import { getMarketDataProvider } from "@/lib/hyperliquid/provider";

describe("market data provider selection", () => {
  test("defaults to the live provider", () => {
    const provider = getMarketDataProvider({});
    expect(provider.source).toBe("live");
  });

  test("uses the live provider for any non-fixture data source", () => {
    const provider = getMarketDataProvider({ HYPERTAPE_DATA_SOURCE: "live" });
    expect(provider.source).toBe("live");
  });

  test("uses the fixture provider when the data source is fixture", async () => {
    const provider = getMarketDataProvider({ HYPERTAPE_DATA_SOURCE: "fixture" });
    expect(provider.source).toBe("fixture");

    const markets = await provider.getMarkets();
    expect(markets.length).toBeGreaterThan(0);
    expect(markets.map((market) => market.name)).toEqual([
      "BTC above 105k by 06:00 UTC",
      "HYPE closes green today",
      "SOL above 180 by Friday close"
    ]);
    expect(markets[2]?.primarySide).toBe(0);
    expect(markets[2]?.dualSide).toBe(1);
  });

  test("filters fixture snapshots and tape events by market id", async () => {
    const provider = getMarketDataProvider({ HYPERTAPE_DATA_SOURCE: "fixture" });

    const snapshots = await provider.getSnapshots("7");
    const events = await provider.getTapeEvents("7");

    expect(snapshots).toHaveLength(2);
    expect(snapshots.every((snapshot) => snapshot.marketId === "7")).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe("probability_move");
  });

  test("returns deep-cloned fixture markets so consumers cannot mutate provider state", async () => {
    const provider = getMarketDataProvider({ HYPERTAPE_DATA_SOURCE: "fixture" });

    const firstRead = await provider.getMarkets();
    firstRead[0]!.sides[0]!.label = "Mutated";

    const secondRead = await provider.getMarkets();
    expect(secondRead[0]!.sides[0]!.label).toBe("Yes");
  });
});
