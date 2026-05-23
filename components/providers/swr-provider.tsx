"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import { liveSWRConfig } from "@/lib/swr/config";

type SWRProviderProps = {
  // Server-rendered seed keyed by SWR key, so the first client paint matches SSR
  // and concurrent consumers of the same key share one warm cache entry.
  fallback?: Record<string, unknown>;
  children: ReactNode;
};

export function SWRProvider({ fallback, children }: SWRProviderProps) {
  return <SWRConfig value={{ ...liveSWRConfig, fallback: fallback ?? {} }}>{children}</SWRConfig>;
}
