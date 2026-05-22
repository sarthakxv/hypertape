import { buildOutcomeSide, getPrimaryAndDualSides } from "./asset-encoding";
import type { Market, MarketStatus, MarketStatusSource } from "./types";

export type RawOutcomeSideSpec = {
  name?: unknown;
  label?: unknown;
};

export type RawOutcomeMeta = {
  outcomeId?: unknown;
  questionId?: unknown;
  name?: unknown;
  title?: unknown;
  description?: unknown;
  sideSpecs?: readonly RawOutcomeSideSpec[];
  quoteToken?: unknown;
  expiryTime?: unknown;
  status?: unknown;
  [key: string]: unknown;
};

function normalizeStatus(status: unknown): MarketStatus {
  if (status === "active" || status === "settling" || status === "settled") {
    return status;
  }

  return "unknown";
}

function normalizeStatusSource(status: MarketStatus): MarketStatusSource {
  return status === "unknown" ? "unknown" : "metadata";
}

function numberFromMetadata(value: unknown, fieldName: string): number {
  const numericValue = typeof value === "string" ? Number(value) : value;

  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    throw new Error(`Invalid outcome metadata: ${fieldName} is required`);
  }

  return numericValue;
}

function optionalNumberFromMetadata(value: unknown): number | undefined {
  if (value == null) return undefined;
  const numericValue = typeof value === "string" ? Number(value) : value;
  return typeof numericValue === "number" && Number.isFinite(numericValue) ? numericValue : undefined;
}

function optionalStringFromMetadata(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function sideLabel(sideSpec: RawOutcomeSideSpec | undefined, fallback: string): string {
  return optionalStringFromMetadata(sideSpec?.name) ?? optionalStringFromMetadata(sideSpec?.label) ?? fallback;
}

export function normalizeOutcomeMeta(raw: RawOutcomeMeta, timestamp: number = Date.now()): Market {
  const outcomeId = numberFromMetadata(raw.outcomeId, "outcomeId");
  const questionId = optionalNumberFromMetadata(raw.questionId);
  const name = optionalStringFromMetadata(raw.name) ?? optionalStringFromMetadata(raw.title) ?? `Outcome ${outcomeId}`;
  const description = optionalStringFromMetadata(raw.description);
  const sides = [
    buildOutcomeSide(outcomeId, 0, sideLabel(raw.sideSpecs?.[0], "Yes")),
    buildOutcomeSide(outcomeId, 1, sideLabel(raw.sideSpecs?.[1], "No"))
  ] as const;
  const { primarySide, dualSide } = getPrimaryAndDualSides(sides);
  const status = normalizeStatus(raw.status);

  return {
    id: String(outcomeId),
    outcomeId,
    questionId,
    name,
    description,
    quoteToken: optionalStringFromMetadata(raw.quoteToken),
    expiryTime: optionalStringFromMetadata(raw.expiryTime),
    sides,
    primarySide,
    dualSide,
    status,
    statusSource: normalizeStatusSource(status),
    raw,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
