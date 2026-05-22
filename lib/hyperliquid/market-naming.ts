import type { ParsedOutcomeDescription } from "./parse-description";

const UNDERLYING_LABELS: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  HYPE: "HYPE"
};

const PERIOD_LABELS: Record<string, string> = {
  "1d": "Daily",
  "1w": "Weekly",
  "1h": "Hourly",
  "4h": "4-Hour"
};

const USD_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

/**
 * Maps a HIP-4 underlying symbol to a readable name. Unknown symbols pass through
 * unchanged; an undefined symbol becomes the generic "Outcome".
 */
export function underlyingLabel(symbol?: string): string {
  if (symbol === undefined) return "Outcome";
  return UNDERLYING_LABELS[symbol] ?? symbol;
}

/**
 * Maps a HIP-4 period code to a readable cadence. Unknown codes pass through
 * unchanged; an undefined period becomes an empty string (so callers can trim).
 */
export function periodLabel(period?: string): string {
  if (period === undefined) return "";
  return PERIOD_LABELS[period] ?? period;
}

/**
 * Derives a human market name from a parsed description. priceBinary markets read
 * "{Underlying} Up or Down {Period}"; priceBucket reads "{Underlying} Multi Outcomes
 * {Period}". Unknown or missing classes fall back to "{Underlying} {fallbackId}" so we
 * never surface the useless template label "Recurring".
 */
export function deriveMarketName(parsed: ParsedOutcomeDescription, fallbackId: number): string {
  const underlying = underlyingLabel(parsed.underlying);
  const period = periodLabel(parsed.period);

  if (parsed.class === "priceBinary") {
    return `${underlying} Up or Down ${period}`.trimEnd();
  }
  if (parsed.class === "priceBucket") {
    return `${underlying} Multi Outcomes ${period}`.trimEnd();
  }

  return `${underlying} ${fallbackId}`;
}

/**
 * Labels one leg of a price-bucket market given the sorted thresholds and the leg
 * index. With N thresholds there are N+1 legs: the first is "< $T0", the last is
 * "> $T_{N-1}", and middle legs are "$T_{i-1}–$T_i" using an en-dash.
 */
export function bucketLegLabel(thresholds: number[], index: number): string {
  if (index <= 0) {
    return `< ${USD_FORMAT.format(thresholds[0])}`;
  }
  if (index >= thresholds.length) {
    return `> ${USD_FORMAT.format(thresholds[thresholds.length - 1])}`;
  }
  return `${USD_FORMAT.format(thresholds[index - 1])}–${USD_FORMAT.format(thresholds[index])}`;
}
