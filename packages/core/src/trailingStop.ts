import { TRAILING_STOP_PRECISION, TrailingStop } from "./types.js";

export type TrailingStopParams = {
  baselinePct: number;
  recentPullbackPct: number;
  weakenTrend: boolean;
};

function roundToPrecision(value: number, precision: number): number {
  return Math.round(value / precision) * precision;
}

export function calculateTrailingStop({
  baselinePct,
  recentPullbackPct,
  weakenTrend
}: TrailingStopParams): TrailingStop {
  const tightened = weakenTrend ? baselinePct * 0.75 : baselinePct;
  const dynamic = Math.min(tightened, recentPullbackPct * 0.9);
  const tsPct = roundToPrecision(Math.max(dynamic, 0.1), TRAILING_STOP_PRECISION);

  return {
    tsPct,
    method: "dynamic_pullback",
    tightenOnWeakTrend: weakenTrend
  };
}
