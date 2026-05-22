export type ParsedOutcomeDescription = {
  class?: string;
  underlying?: string;
  period?: string;
  expiry?: string;
  targetPrice?: number;
  priceThresholds?: number[];
  index?: number;
};

const EXPIRY_PATTERN = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/;

function parseExpiry(value: string): string | undefined {
  const match = EXPIRY_PATTERN.exec(value);
  if (!match) return undefined;

  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
}

function parseNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseNumberList(value: string): number[] | undefined {
  const numbers = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map(Number);

  if (numbers.length === 0 || numbers.some(Number.isNaN)) return undefined;
  return numbers;
}

/**
 * Parses a HIP-4 pipe-delimited `key:value` outcome description into a typed object.
 *
 * Rules: split on `|`; for each segment split on the FIRST `:` only; ignore segments
 * without a colon (e.g. the literal `other`); numeric fields are parsed with Number and
 * dropped when NaN. Empty or garbage input returns `{}`.
 */
export function parseOutcomeDescription(description: string): ParsedOutcomeDescription {
  const result: ParsedOutcomeDescription = {};
  if (!description) return result;

  for (const segment of description.split("|")) {
    const colonIndex = segment.indexOf(":");
    if (colonIndex === -1) continue;

    const key = segment.slice(0, colonIndex).trim();
    const value = segment.slice(colonIndex + 1).trim();
    if (key.length === 0 || value.length === 0) continue;

    switch (key) {
      case "class":
        result.class = value;
        break;
      case "underlying":
        result.underlying = value;
        break;
      case "period":
        result.period = value;
        break;
      case "expiry": {
        const expiry = parseExpiry(value);
        if (expiry !== undefined) result.expiry = expiry;
        break;
      }
      case "targetPrice": {
        const targetPrice = parseNumber(value);
        if (targetPrice !== undefined) result.targetPrice = targetPrice;
        break;
      }
      case "priceThresholds": {
        const thresholds = parseNumberList(value);
        if (thresholds !== undefined) result.priceThresholds = thresholds;
        break;
      }
      case "index": {
        const index = parseNumber(value);
        if (index !== undefined) result.index = index;
        break;
      }
      default:
        break;
    }
  }

  return result;
}
