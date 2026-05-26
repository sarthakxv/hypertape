import { describe, expect, test } from "vitest";
import { resolveMarketIcon } from "@/lib/markets/market-icon";

describe("resolveMarketIcon", () => {
  test("maps BTC markets by underlying (binary and bucket alike)", () => {
    expect(resolveMarketIcon({ name: "Bitcoin Up or Down Daily", underlying: "BTC" })).toEqual({
      src: "/icons/bitcoin.png",
      alt: "Bitcoin"
    });
    expect(resolveMarketIcon({ name: "Bitcoin Multi Outcomes Daily", underlying: "bitcoin" })).toEqual({
      src: "/icons/bitcoin.png",
      alt: "Bitcoin"
    });
  });

  test("maps Fed markets by name keyword (no underlying)", () => {
    expect(resolveMarketIcon({ name: "June Fed rate change" })).toEqual({
      src: "/icons/fed.png",
      alt: "Federal Reserve"
    });
    expect(resolveMarketIcon({ name: "FOMC July decision" })).toEqual({
      src: "/icons/fed.png",
      alt: "Federal Reserve"
    });
  });

  test("maps CPI markets by name keyword (no underlying)", () => {
    expect(resolveMarketIcon({ name: "May CPI year-over-year" })).toEqual({
      src: "/icons/cpi.png",
      alt: "CPI"
    });
  });

  test("returns null for markets with no known icon", () => {
    expect(resolveMarketIcon({ name: "Ethereum Up or Down Daily", underlying: "ETH" })).toBeNull();
    expect(resolveMarketIcon({ name: "Some other event market" })).toBeNull();
  });

  test("prefers the underlying icon over a name match when both apply", () => {
    expect(resolveMarketIcon({ name: "Bitcoin vs the Fed", underlying: "BTC" })).toEqual({
      src: "/icons/bitcoin.png",
      alt: "Bitcoin"
    });
  });
});
