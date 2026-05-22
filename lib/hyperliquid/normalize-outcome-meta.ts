import { buildOutcomeSide, getPrimaryAndDualSides } from "./asset-encoding";
import type { RawOutcomeMetaEntry } from "./hyperliquid-client";
import { parseOutcomeDescription } from "./parse-description";
import type { Market, MarketStatus } from "./types";

function deriveStatus(expiryTime: string | undefined, now: number): MarketStatus {
  if (expiryTime !== undefined && Date.parse(expiryTime) <= now) {
    return "settled";
  }

  return "active";
}

/**
 * Normalizes a single real-shape Hyperliquid `outcomeMeta` entry into a `Market`.
 *
 * The real API exposes `outcome` (a number), a pipe-delimited `description`, and
 * `sideSpecs`. There is no status field, so status is derived purely from the parsed
 * expiry: past expiry → "settled", otherwise (including no expiry) → "active".
 */
export function normalizeOutcomeMeta(raw: RawOutcomeMetaEntry, now: number = Date.now()): Market {
  const outcome = raw.outcome;
  const parsed = parseOutcomeDescription(raw.description);

  const sides = [
    buildOutcomeSide(outcome, 0, raw.sideSpecs[0].name),
    buildOutcomeSide(outcome, 1, raw.sideSpecs[1].name)
  ] as const;
  const { primarySide, dualSide } = getPrimaryAndDualSides(sides);

  const expiryTime = parsed.expiry;
  const status = deriveStatus(expiryTime, now);

  return {
    id: String(outcome),
    outcomeId: outcome,
    name: raw.name,
    description: raw.description,
    underlying: parsed.underlying,
    targetPrice: parsed.targetPrice,
    priceThresholds: parsed.priceThresholds,
    period: parsed.period,
    expiryTime,
    sides,
    primarySide,
    dualSide,
    status,
    statusSource: "expiry",
    raw,
    createdAt: now,
    updatedAt: now
  };
}
