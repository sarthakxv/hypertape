import { buildOutcomeSide, getPrimaryAndDualSides } from "./asset-encoding";
import type {
  AllMids,
  RawOutcomeMetaEntry,
  RawOutcomeMetaResponse,
  RawOutcomeQuestionEntry
} from "./hyperliquid-client";
import { deriveMarketName, legLabel } from "./market-naming";
import { parseOutcomeDescription } from "./parse-description";
import type { BucketLeg, BucketMarket, MarketCard, Market, MarketStatus } from "./types";

function deriveStatus(expiryTime: string | undefined, now: number): MarketStatus {
  if (expiryTime !== undefined && Date.parse(expiryTime) <= now) {
    return "settled";
  }

  return "active";
}

// outcome.xyz presents priceBinary markets as Up/Down rather than Yes/No.
function relabelBinarySide(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized === "yes") return "Up";
  if (normalized === "no") return "Down";
  return label;
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
  const isPriceBinary = parsed.class === "priceBinary";

  // Derive side labels BEFORE building sides so primary/dual is computed from the
  // original Yes/No labels (Up/Down would otherwise fall through to side-zero default).
  const label0 = isPriceBinary ? relabelBinarySide(raw.sideSpecs[0].name) : raw.sideSpecs[0].name;
  const label1 = isPriceBinary ? relabelBinarySide(raw.sideSpecs[1].name) : raw.sideSpecs[1].name;

  const sides = [
    buildOutcomeSide(outcome, 0, label0),
    buildOutcomeSide(outcome, 1, label1)
  ] as const;
  const { primarySide, dualSide } = getPrimaryAndDualSides([
    buildOutcomeSide(outcome, 0, raw.sideSpecs[0].name),
    buildOutcomeSide(outcome, 1, raw.sideSpecs[1].name)
  ] as const);

  const expiryTime = parsed.expiry;
  const status = deriveStatus(expiryTime, now);

  return {
    kind: "binary",
    id: String(outcome),
    outcomeId: outcome,
    name: deriveMarketName(parsed, outcome, raw.name),
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

function buildBucketMarket(
  question: RawOutcomeQuestionEntry,
  outcomesById: Map<number, RawOutcomeMetaEntry>,
  allMids: AllMids,
  now: number
): BucketMarket {
  const parsed = parseOutcomeDescription(question.description);
  const thresholds = parsed.priceThresholds ?? [];
  const namedOutcomes = question.namedOutcomes ?? [];

  const legs: BucketLeg[] = namedOutcomes.map((outcomeId, position) => {
    const outcome = outcomesById.get(outcomeId);
    const parsedOutcome = outcome ? parseOutcomeDescription(outcome.description) : {};
    const index = parsedOutcome.index ?? position;
    const yesCoin = `#${10 * outcomeId}`;
    const mid = allMids[yesCoin];

    return {
      outcomeId,
      index,
      label: legLabel(thresholds, index, outcome?.name, outcomeId),
      yesCoin,
      probability: mid != null ? Number(mid) : null
    };
  });

  legs.sort((left, right) => left.index - right.index);

  const expiryTime = parsed.expiry;
  // A populated settledNamedOutcomes is the authoritative resolution signal — it takes
  // precedence over the expiry heuristic, and it's the only way prose markets (which carry
  // no parseable expiry) ever leave "active".
  const isSettled = (question.settledNamedOutcomes ?? []).length > 0;
  const status = isSettled ? "settled" : deriveStatus(expiryTime, now);

  return {
    kind: "bucket",
    id: `q${question.question}`,
    questionId: question.question,
    name: deriveMarketName(parsed, question.question, question.name),
    underlying: parsed.underlying,
    period: parsed.period,
    expiryTime,
    priceThresholds: parsed.priceThresholds,
    status,
    statusSource: isSettled ? "metadata" : "expiry",
    legs,
    raw: question,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Builds the full set of market cards from a raw outcomeMeta response, modeling the
 * data the way outcome.xyz presents it: each priceBucket question becomes one
 * multi-outcome `BucketMarket` (its named outcomes fold in as legs with live mids),
 * fallback outcomes are dropped entirely, and every remaining outcome becomes a binary
 * `Market`. Binary cards come first for deterministic ordering.
 */
export function buildMarketsFromOutcomeMeta(
  response: RawOutcomeMetaResponse,
  allMids: AllMids,
  now: number = Date.now()
): MarketCard[] {
  const questions = response.questions ?? [];
  const fallbackIds = new Set(
    questions.flatMap((question) =>
      question.fallbackOutcome != null ? [question.fallbackOutcome] : []
    )
  );
  const namedIds = new Set(questions.flatMap((question) => question.namedOutcomes ?? []));
  const outcomesById = new Map(response.outcomes.map((outcome) => [outcome.outcome, outcome]));

  const binaryMarkets: Market[] = response.outcomes
    .filter((outcome) => !namedIds.has(outcome.outcome) && !fallbackIds.has(outcome.outcome))
    .map((outcome) => normalizeOutcomeMeta(outcome, now));

  // A question is structurally a multi-outcome bundle regardless of description format:
  // pipe `class:priceBucket` and prose macro/event questions alike. Classifying by the
  // presence of named outcomes (not the description string) keeps future market shapes
  // working without special-casing.
  const bucketMarkets: BucketMarket[] = questions
    .filter((question) => (question.namedOutcomes ?? []).length > 0)
    .map((question) => buildBucketMarket(question, outcomesById, allMids, now));

  return [...binaryMarkets, ...bucketMarkets];
}
