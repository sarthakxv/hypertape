import { afterEach, describe, expect, test, vi } from "vitest";
import { liveFetcher } from "@/lib/swr/config";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("liveFetcher", () => {
  test("returns the parsed payload on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ source: "live", markets: [{ id: "1" }] }) })
    );

    const payload = await liveFetcher<{ source: string; markets: { id: string }[] }>("/api/live");

    expect(payload.source).toBe("live");
    expect(payload.markets[0].id).toBe("1");
  });

  test("throws on an error envelope so SWR retains the last good data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ source: "live", markets: [], error: "network down" }) })
    );

    await expect(liveFetcher("/api/live")).rejects.toThrow("network down");
  });

  test("requests with no-store so the browser cache cannot serve a stale 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ source: "live" }) });
    vi.stubGlobal("fetch", fetchMock);

    await liveFetcher("/api/live");

    expect(fetchMock).toHaveBeenCalledWith("/api/live", { cache: "no-store" });
  });
});
