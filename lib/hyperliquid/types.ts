export type OutcomeSide = {
  side: 0 | 1;
  label: string;
  encoding: number;
  coin: `#${number}`;
  tokenName: `+${number}`;
  assetId: number;
};

export type OutcomeQuestion = {
  questionId: number;
  name: string;
  description?: string;
  fallbackOutcome?: number;
  namedOutcomes: number[];
  settledNamedOutcomes: number[];
};

export type MarketStatus = "active" | "settling" | "settled" | "unknown";
export type MarketStatusSource = "metadata" | "expiry" | "book" | "trade" | "indexer" | "unknown";

export type Market = {
  kind: "binary";
  id: string;
  outcomeId: number;
  questionId?: number;
  name: string;
  description?: string;
  inheritedQuestionDescription?: string;
  quoteToken?: string;
  underlying?: string;
  targetPrice?: number;
  priceThresholds?: number[];
  expiryTime?: string;
  period?: string;
  sides: readonly [OutcomeSide, OutcomeSide];
  question?: OutcomeQuestion;
  primarySide: 0 | 1;
  dualSide: 0 | 1;
  status: MarketStatus;
  statusSource: MarketStatusSource;
  raw: unknown;
  createdAt: number;
  updatedAt: number;
};

export type BucketLeg = {
  outcomeId: number;
  index: number;
  label: string;
  yesCoin: string;
  probability: number | null;
};

export type BucketMarket = {
  kind: "bucket";
  id: string;
  questionId: number;
  name: string;
  underlying?: string;
  period?: string;
  expiryTime?: string;
  priceThresholds?: number[];
  status: MarketStatus;
  statusSource: MarketStatusSource;
  legs: BucketLeg[];
  raw: unknown;
  createdAt: number;
  updatedAt: number;
};

export type MarketCard = Market | BucketMarket;

export type BookLevel = {
  price: number;
  size: number;
};

export type MarketSnapshot = {
  marketId: string;
  timestamp: number;
  primarySide: 0 | 1;
  primaryBestBid: number | null;
  primaryBestAsk: number | null;
  primaryMid: number | null;
  dualBestBid: number | null;
  dualBestAsk: number | null;
  dualMid: number | null;
  canonicalSpread: number | null;
  bidDepthOnePoint: number | null;
  askDepthOnePoint: number | null;
  bidDepthThreePoints: number | null;
  askDepthThreePoints: number | null;
  bidDepthFivePoints: number | null;
  askDepthFivePoints: number | null;
  totalDepthOnePoint: number | null;
  totalDepthThreePoints: number | null;
  totalDepthFivePoints: number | null;
  recentVolume: number | null;
  recentTradeCount: number | null;
  underlyingSpot: number | null;
  lastBookUpdateAt: number | null;
  lastTradeAt: number | null;
  bids: BookLevel[];
  asks: BookLevel[];
};

export type TapeEvent = {
  id: string;
  marketId: string;
  timestamp: number;
  eventType: "probability_move" | "spread_tightened" | "spread_widened" | "new_market" | "expiry_soon" | "large_trade";
  side?: string;
  previousProbability?: number;
  currentProbability?: number;
  delta?: number;
  windowSeconds?: number;
  spread?: number;
  depth?: number;
  volume?: number;
  severity: "low" | "medium" | "high";
  title: string;
  summary: string;
};

export type WatchlistState = {
  marketIds: string[];
  updatedAt: number;
};
