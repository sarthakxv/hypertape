import { describe, expect, test, vi } from "vitest";
import {
  createHyperliquidClient,
  createTtlCache,
  mapWithConcurrency
} from "@/lib/hyperliquid/hyperliquid-client";
import outcomeMetaFixture from "./fixtures/hyperliquid/outcome-meta.json";
import allMidsFixture from "./fixtures/hyperliquid/all-mids-outcomes.json";
import l2book800Fixture from "./fixtures/hyperliquid/l2book-800.json";
import candle800Fixture from "./fixtures/hyperliquid/candle-800-1m.json";
import recentTrades800Fixture from "./fixtures/hyperliquid/recent-trades-800.json";

const INFO_URL = "https://api.hyperliquid.xyz/info";

function stubFetch(payload: unknown, ok = true, status = 200): typeof fetch {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => payload
  })) as unknown as typeof fetch;
}

function lastCallBody(fetchImpl: typeof fetch): { url: string; init: RequestInit; body: unknown } {
  const mock = fetchImpl as unknown as ReturnType<typeof vi.fn>;
  const [url, init] = mock.mock.calls[mock.mock.calls.length - 1];
  return { url, init, body: JSON.parse(init.body) };
}

describe("createHyperliquidClient", () => {
  test("fetchOutcomeMeta posts type outcomeMeta and returns the parsed response", async () => {
    const fetchImpl = stubFetch(outcomeMetaFixture);
    const client = createHyperliquidClient({ fetchImpl });

    const result = await client.fetchOutcomeMeta();

    expect(result).toEqual(outcomeMetaFixture);
    const { url, init, body } = lastCallBody(fetchImpl);
    expect(url).toBe(INFO_URL);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
    expect(init.cache).toBe("no-store");
    expect(body).toEqual({ type: "outcomeMeta" });
  });

  test("fetchAllMids posts type allMids and returns the mids map", async () => {
    const fetchImpl = stubFetch(allMidsFixture);
    const client = createHyperliquidClient({ fetchImpl });

    const result = await client.fetchAllMids();

    expect(result["#800"]).toBe("0.039255");
    expect(lastCallBody(fetchImpl).body).toEqual({ type: "allMids" });
  });

  test("fetchL2Book posts type l2Book with coin and returns the book", async () => {
    const fetchImpl = stubFetch(l2book800Fixture);
    const client = createHyperliquidClient({ fetchImpl });

    const result = await client.fetchL2Book("#800");

    expect(result.coin).toBe("#800");
    expect(result.levels[0][0].px).toBe("0.03701");
    expect(lastCallBody(fetchImpl).body).toEqual({ type: "l2Book", coin: "#800" });
  });

  test("fetchCandles posts type candleSnapshot with a nested req and returns candles", async () => {
    const fetchImpl = stubFetch(candle800Fixture);
    const client = createHyperliquidClient({ fetchImpl });

    const result = await client.fetchCandles("#800", "1m", 1779481020000, 1779484619999);

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].s).toBe("#800");
    expect(result[0].i).toBe("1m");
    expect(lastCallBody(fetchImpl).body).toEqual({
      type: "candleSnapshot",
      req: { coin: "#800", interval: "1m", startTime: 1779481020000, endTime: 1779484619999 }
    });
  });

  test("fetchRecentTrades posts type recentTrades with coin and returns trades", async () => {
    const fetchImpl = stubFetch(recentTrades800Fixture);
    const client = createHyperliquidClient({ fetchImpl });

    const result = await client.fetchRecentTrades("#800");

    expect(result[0].coin).toBe("#800");
    expect(result[0].side).toBe("B");
    expect(lastCallBody(fetchImpl).body).toEqual({ type: "recentTrades", coin: "#800" });
  });

  test("throws an error including the status when the response is not ok", async () => {
    const fetchImpl = stubFetch({}, false, 503);
    const client = createHyperliquidClient({ fetchImpl });

    await expect(client.fetchAllMids()).rejects.toThrow(/503/);
  });
});

describe("mapWithConcurrency", () => {
  test("preserves result order", async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await mapWithConcurrency(items, 2, async (item) => item * 10);
    expect(results).toEqual([10, 20, 30, 40, 50]);
  });

  test("never exceeds the concurrency limit", async () => {
    const limit = 3;
    let inFlight = 0;
    let maxInFlight = 0;
    const releases: Array<() => void> = [];

    const items = Array.from({ length: 10 }, (_, i) => i);
    const promise = mapWithConcurrency(items, limit, async (item) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>((resolve) => releases.push(resolve));
      inFlight -= 1;
      return item;
    });

    // Drain deferreds in waves until all tasks complete.
    while (releases.length > 0) {
      expect(inFlight).toBeLessThanOrEqual(limit);
      const pending = releases.splice(0, releases.length);
      pending.forEach((release) => release());
      await Promise.resolve();
      await Promise.resolve();
    }

    const results = await promise;
    expect(results).toEqual(items);
    expect(maxInFlight).toBeLessThanOrEqual(limit);
    expect(maxInFlight).toBe(limit);
  });

  test("handles an empty input array", async () => {
    const results = await mapWithConcurrency([], 4, async (item) => item);
    expect(results).toEqual([]);
  });
});

describe("createTtlCache", () => {
  test("calls fn once within the TTL window across multiple gets", async () => {
    let clock = 1000;
    const cache = createTtlCache(() => clock);
    const fn = vi.fn(async () => "value");

    const a = await cache.get("k", 5000, fn);
    clock += 1000;
    const b = await cache.get("k", 5000, fn);

    expect(a).toBe("value");
    expect(b).toBe("value");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("refetches after the TTL expires", async () => {
    let clock = 1000;
    const cache = createTtlCache(() => clock);
    const fn = vi.fn(async () => clock);

    await cache.get("k", 5000, fn);
    clock += 6000;
    const second = await cache.get("k", 5000, fn);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(second).toBe(7000);
  });

  test("dedupes concurrent in-flight gets for the same key", async () => {
    const cache = createTtlCache(() => 0);
    const fn = vi.fn(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      return "shared";
    });

    const [a, b] = await Promise.all([cache.get("k", 5000, fn), cache.get("k", 5000, fn)]);

    expect(a).toBe("shared");
    expect(b).toBe("shared");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("clears the cached entry when fn rejects so the next call retries", async () => {
    const cache = createTtlCache(() => 0);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok");

    await expect(cache.get("k", 5000, fn)).rejects.toThrow("boom");
    const retry = await cache.get("k", 5000, fn);

    expect(retry).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
