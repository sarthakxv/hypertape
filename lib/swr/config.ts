import type { SWRConfiguration } from "swr";

// Single source of truth for client polling cadence. All live surfaces share
// this, so retuning the refresh rate is one edit.
export const LIVE_REFRESH_MS = 3000;

// Collapses concurrent requests to the same key into one in-flight fetch. Two
// components mounting against `/api/live` on the same page share a single poll.
export const LIVE_DEDUPE_MS = 2000;

/**
 * Fetches JSON and treats the API's error envelope as a failure.
 *
 * The routes answer with HTTP 200 even when the provider throws, returning
 * `{ error, markets: [] }`-shaped payloads. SWR would otherwise accept those as
 * success and overwrite the last good data. Throwing here makes SWR retain its
 * previous `data` and surface the failure via `error` instead. `cache: "no-store"`
 * keeps the browser HTTP cache from serving a stale 200.
 */
export async function liveFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as T & { error?: string };

  if (payload && typeof payload === "object" && payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

export const liveSWRConfig: SWRConfiguration = {
  fetcher: liveFetcher,
  refreshInterval: LIVE_REFRESH_MS,
  dedupingInterval: LIVE_DEDUPE_MS,
  keepPreviousData: true
};
