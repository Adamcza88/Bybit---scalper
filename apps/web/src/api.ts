import { useQuery } from "@tanstack/react-query";
import type { Pair, Signal, Snapshot, HealthSource } from "./types";

type ApiResponse<T> = { data: T };

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function usePairs() {
  return useQuery({
    queryKey: ["pairs"],
    queryFn: () => fetchJson<ApiResponse<Pair[]>>("/api/pairs"),
    select: (result) => result.data,
    refetchInterval: 60_000
  });
}

export function useSignals(filters?: { timeframe?: string; direction?: string }) {
  const params = new URLSearchParams();
  if (filters?.timeframe) {
    params.set("tf", filters.timeframe);
  }
  if (filters?.direction) {
    params.set("direction", filters.direction);
  }
  const query = params.toString();
  return useQuery({
    queryKey: ["signals", filters],
    queryFn: () => fetchJson<ApiResponse<Signal[]>>(`/api/signals${query ? `?${query}` : ""}`),
    select: (result) => result.data,
    refetchInterval: 5_000
  });
}

export function useSnapshot(symbol?: string) {
  const params = new URLSearchParams();
  if (symbol) {
    params.set("symbol", symbol);
  }
  params.set("tf", "1m,5m,15m,1h");
  const query = params.toString();
  return useQuery({
    queryKey: ["snapshot", symbol],
    queryFn: () => fetchJson<Snapshot>(`/api/snapshot?${query}`),
    refetchInterval: 10_000
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => fetchJson<{ updatedAt: number; sources: HealthSource[] }>("/api/health"),
    select: (result) => result.sources,
    refetchInterval: 15_000
  });
}
