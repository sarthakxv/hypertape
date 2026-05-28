export type MarketIcon = {
  src: string;
  alt: string;
};

/**
 * Resolves the avatar icon for a market card. Crypto markets are matched by their
 * `underlying` symbol; macro/event markets (which carry no underlying) are matched by a
 * keyword in their derived name. Returns null when no icon applies, so callers render
 * the title with no avatar. Matching by name keeps these working as outcome ids roll over.
 */
export function resolveMarketIcon(market: { name: string; underlying?: string }): MarketIcon | null {
  const underlying = market.underlying?.toLowerCase();
  if (underlying === "btc" || underlying === "bitcoin") {
    return { src: "/icons/bitcoin.png", alt: "Bitcoin" };
  }

  const name = market.name.toLowerCase();
  if (name.includes("fed") || name.includes("fomc")) {
    return { src: "/icons/fed.png", alt: "Federal Reserve" };
  }
  if (name.includes("cpi")) {
    return { src: "/icons/cpi.png", alt: "CPI" };
  }
  if (name.includes("champions league")) {
    return { src: "/icons/cpl_128.png", alt: "Champions League" };
  }

  return null;
}
