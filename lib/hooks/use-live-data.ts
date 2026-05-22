"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Polls a JSON endpoint on an interval, seeded by server-rendered data.
 *
 * Returns `initialData` immediately so there is no loading flash. After mount
 * it polls `url` every `intervalMs` and replaces the data with each successful
 * response. On a fetch or parse failure it keeps the last good data rather than
 * clearing it. The interval is cleared on unmount and state is never set after
 * the component has unmounted.
 */
export function useLiveData<T>(url: string, initialData: T, intervalMs: number): T {
  const [data, setData] = useState<T>(initialData);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function poll() {
      try {
        const response = await fetch(url, { cache: "no-store" });
        const payload = (await response.json()) as T;
        if (isMountedRef.current) {
          setData(payload);
        }
      } catch {
        // Keep the last good data on network or parse failure.
      }
    }

    const timer = setInterval(() => {
      void poll();
    }, intervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [url, intervalMs]);

  return data;
}
