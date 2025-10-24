import { z } from "zod";

export const symbolSchema = z.object({
  symbol: z.string(),
  quote: z.string(),
  base: z.string(),
  type: z.literal("perp"),
  tickSize: z.number(),
  lotSize: z.number(),
  status: z.enum(["trading", "halted"])
});
export type SymbolInfo = z.infer<typeof symbolSchema>;

export const ohlcvSchema = z.object({
  symbol: z.string(),
  t: z.number(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
  tf: z.enum(["1m", "5m", "15m", "1h"]),
  source: z.enum(["bybit", "coinglass", "birdie"])
});
export type OHLCV = z.infer<typeof ohlcvSchema>;

export const emaStackSchema = z.object({
  ema8: z.number(),
  ema21: z.number(),
  ema50: z.number(),
  allAbovePrice: z.boolean(),
  allBelowPrice: z.boolean(),
  rulePass: z.boolean()
});
export type EMAStack = z.infer<typeof emaStackSchema>;

export const entryMetricSchema = z.object({
  type: z.enum([
    "breakout_retest",
    "volume_reaction",
    "liquidity_sweep",
    "pattern_confirmation",
    "momentum_shift"
  ]),
  pass: z.boolean(),
  score: z.number().optional()
});
export type EntryMetric = z.infer<typeof entryMetricSchema>;

export const entryEvidenceSchema = z.object({
  metrics: z.array(entryMetricSchema),
  minRequired: z.number().int().min(1),
  passed: z.boolean()
});
export type EntryEvidence = z.infer<typeof entryEvidenceSchema>;

export const correlationCheckSchema = z.object({
  btcDominanceBias: z.enum(["bullish", "bearish", "neutral"]),
  total3State: z.enum(["expanding", "contracting", "neutral"]),
  btcCorrelation: z.number().min(-1).max(1),
  checklistScore: z.number().min(0).max(12),
  pass: z.boolean()
});
export type CorrelationCheck = z.infer<typeof correlationCheckSchema>;

export const trailingStopSchema = z.object({
  tsPct: z.number(),
  method: z.enum(["dynamic_pullback", "volatility_band", "fixed"]),
  tightenOnWeakTrend: z.boolean()
});
export type TrailingStop = z.infer<typeof trailingStopSchema>;

export const riskSchema = z.object({
  sl: z.number(),
  tpRR: z.number(),
  trailing: trailingStopSchema
});
export type Risk = z.infer<typeof riskSchema>;

export const signalSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  timeframe: z.enum(["1m", "5m", "15m", "1h"]),
  direction: z.enum(["long", "short"]),
  filters: z.record(z.string(), z.string()),
  evidence: entryEvidenceSchema,
  correlation: correlationCheckSchema,
  risk: riskSchema,
  status: z.enum(["CANDIDATE", "NEW", "UPDATE", "HIT TP", "HIT SL", "EXPIRED", "ARCHIVED"])
});
export type Signal = z.infer<typeof signalSchema>;

export type SourceHealth = {
  name: "bybit" | "coinglass" | "birdie";
  latencyMs: number;
  status: "healthy" | "degraded" | "down";
  lastUpdated: number;
};

export type Snapshot = {
  symbols: SymbolInfo[];
  ohlcv: OHLCV[];
  ema: Record<string, Record<string, EMAStack>>;
  signals: Signal[];
  health: SourceHealth[];
  updatedAt: number;
};

export const checklistSchema = z.object({
  items: z.array(
    z.object({
      key: z.string(),
      description: z.string(),
      pass: z.boolean()
    })
  )
});
export type Checklist = z.infer<typeof checklistSchema>;

export const MIN_CHECKLIST_SCORE = 10;
export const REQUIRED_EVIDENCE_COUNT = 2;
export const TRAILING_STOP_PRECISION = 0.1;
