import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getPresets } from "@/app/api/alerts/presets/route";
import { GET as getLive } from "@/app/api/live/route";
import { GET as getMarketDetail } from "@/app/api/markets/[marketId]/route";

describe("api routes (fixture-backed success path)", () => {
  beforeEach(() => {
    vi.stubEnv("HYPERTAPE_DATA_SOURCE", "fixture");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("returns market detail with snapshots and events", async () => {
    const response = await getMarketDetail(new Request("http://localhost/api/markets/7"), {
      params: Promise.resolve({ marketId: "7" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.market.id).toBe("7");
    expect(body.snapshots.length).toBeGreaterThan(0);
    expect(body.events.length).toBeGreaterThan(0);
  });

  test("returns 404 for missing market detail", async () => {
    const response = await getMarketDetail(new Request("http://localhost/api/markets/missing"), {
      params: Promise.resolve({ marketId: "missing" })
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Market not found");
  });

  test("returns combined live markets, snapshots, and events", async () => {
    const response = await getLive();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBeTruthy();
    expect(body.markets.length).toBeGreaterThan(0);
    expect(body.markets[0]).toHaveProperty("primarySide");
    expect(body.snapshots.length).toBeGreaterThan(0);
    expect(body.events.length).toBeGreaterThan(0);
  });

  test("returns alert presets", async () => {
    const response = await getPresets();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.presets.map((preset: { id: string }) => preset.id)).toContain("big-move");
  });
});

describe("api routes (error envelope)", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/lib/hyperliquid/provider");
  });

  test("returns an empty error envelope when the live provider throws", async () => {
    vi.resetModules();
    vi.doMock("@/lib/hyperliquid/provider", () => ({
      getMarketDataProvider: () => ({
        source: "live",
        getMarkets: () => Promise.reject(new Error("network down")),
        getMarket: () => Promise.reject(new Error("network down")),
        getSnapshots: () => Promise.reject(new Error("network down")),
        getTapeEvents: () => Promise.reject(new Error("network down"))
      })
    }));

    const { GET } = await import("@/app/api/live/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("live");
    expect(body.markets).toEqual([]);
    expect(body.snapshots).toEqual([]);
    expect(body.events).toEqual([]);
    expect(body.error).toBe("network down");
  });
});
