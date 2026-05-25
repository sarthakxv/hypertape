const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";

export type RawOutcomeSideSpecResponse = {
  name: string;
};

export type RawOutcomeMetaEntry = {
  outcome: number;
  name: string;
  description: string;
  sideSpecs: RawOutcomeSideSpecResponse[];
};

export type RawOutcomeQuestionEntry = {
  question: number;
  name: string;
  description: string;
  fallbackOutcome?: number;
  namedOutcomes?: number[];
  settledNamedOutcomes?: number[];
};

export type RawOutcomeMetaResponse = {
  outcomes: RawOutcomeMetaEntry[];
  questions: RawOutcomeQuestionEntry[];
};

export type AllMids = Record<string, string>;

export type L2BookLevel = {
  px: string;
  sz: string;
  n: number;
};

export type L2Book = {
  coin: string;
  time: number;
  levels: [L2BookLevel[], L2BookLevel[]];
};

export type Candle = {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
};

export type Trade = {
  coin: string;
  side: "A" | "B";
  px: string;
  sz: string;
  time: number;
  hash: string;
  tid: number;
  users: string[];
};

export type HyperliquidClientOptions = {
  fetchImpl?: typeof fetch;
  now?: () => number;
};

export type SpotAssetCtx = {
  coin: string;
  dayNtlVlm: string;
};

export type HyperliquidClient = {
  fetchOutcomeMeta(): Promise<RawOutcomeMetaResponse>;
  fetchAllMids(): Promise<AllMids>;
  fetchL2Book(coin: string): Promise<L2Book>;
  fetchCandles(coin: string, interval: string, startTime: number, endTime: number): Promise<Candle[]>;
  fetchRecentTrades(coin: string): Promise<Trade[]>;
  fetchSpotMetaAndAssetCtxs(): Promise<[unknown, SpotAssetCtx[]]>;
};

export function createHyperliquidClient(options: HyperliquidClientOptions = {}): HyperliquidClient {
  const fetchImpl = options.fetchImpl ?? fetch;

  async function postInfo<T>(body: Record<string, unknown>): Promise<T> {
    const response = await fetchImpl(HYPERLIQUID_INFO_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid ${String(body.type)} request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  return {
    fetchOutcomeMeta() {
      return postInfo<RawOutcomeMetaResponse>({ type: "outcomeMeta" });
    },
    fetchAllMids() {
      return postInfo<AllMids>({ type: "allMids" });
    },
    fetchL2Book(coin: string) {
      return postInfo<L2Book>({ type: "l2Book", coin });
    },
    fetchCandles(coin: string, interval: string, startTime: number, endTime: number) {
      return postInfo<Candle[]>({
        type: "candleSnapshot",
        req: { coin, interval, startTime, endTime }
      });
    },
    fetchRecentTrades(coin: string) {
      return postInfo<Trade[]>({ type: "recentTrades", coin });
    },
    fetchSpotMetaAndAssetCtxs() {
      return postInfo<[unknown, SpotAssetCtx[]]>({ type: "spotMetaAndAssetCtxs" });
    }
  };
}

/**
 * Maps `fn` over `items` with at most `limit` calls in flight at once, preserving
 * result order (results are written by index, never pushed).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const effectiveLimit = Math.max(1, Math.min(limit, items.length));
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index], index);
    }
  }

  const workers: Array<Promise<void>> = [];
  for (let i = 0; i < effectiveLimit; i += 1) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

type CacheEntry<T> = {
  storedAt: number;
  promise: Promise<T>;
};

export type TtlCache = {
  get<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T>;
};

/**
 * Creates a TTL cache that memoizes the in-flight promise per key. Returns the cached
 * value when called again within `ttlMs`, refetches after the TTL expires, and clears the
 * entry when `fn` rejects so the next call retries.
 */
export function createTtlCache(now: () => number = Date.now): TtlCache {
  const entries = new Map<string, CacheEntry<unknown>>();

  return {
    get<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
      const existing = entries.get(key);
      if (existing && now() - existing.storedAt < ttlMs) {
        return existing.promise as Promise<T>;
      }

      const promise = fn().catch((error) => {
        if (entries.get(key)?.promise === promise) {
          entries.delete(key);
        }
        throw error;
      });

      entries.set(key, { storedAt: now(), promise });
      return promise;
    }
  };
}
