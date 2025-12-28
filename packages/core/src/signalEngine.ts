import { aggregateEvidence } from "./evidence.js";
import { evaluateCorrelation } from "./correlation.js";
import { calculateTrailingStop } from "./trailingStop.js";
import { emaDirection, evaluateEmaRule } from "./ema.js";
import {
  Checklist,
  EntryMetric,
  OHLCV,
  Risk,
  Signal,
  Snapshot,
  SymbolInfo,
  TrailingStop
} from "./types.js";

export type SignalContext = {
  symbol: SymbolInfo;
  timeframe: Signal["timeframe"];
  price: number;
  ema: { ema8: number; ema21: number; ema50: number };
  metrics: EntryMetric[];
  checklist: Checklist;
  btcDominanceBias: Signal["correlation"]["btcDominanceBias"];
  total3State: Signal["correlation"]["total3State"];
  btcCorrelation: number;
  baselineStopPct: number;
  recentPullbackPct: number;
  weakenTrend: boolean;
  status?: Signal["status"];
};

export function buildSignal(context: SignalContext): Signal | null {
  const emaStack = evaluateEmaRule({
    price: context.price,
    ...context.ema
  });

  if (!emaStack.rulePass) {
    return null;
  }

  const evidence = aggregateEvidence(context.metrics);
  if (!evidence.passed) {
    return null;
  }

  const correlation = evaluateCorrelation({
    btcDominanceBias: context.btcDominanceBias,
    total3State: context.total3State,
    btcCorrelation: context.btcCorrelation,
    checklist: context.checklist
  });

  if (!correlation.pass) {
    return null;
  }

  const trailing: TrailingStop = calculateTrailingStop({
    baselinePct: context.baselineStopPct,
    recentPullbackPct: context.recentPullbackPct,
    weakenTrend: context.weakenTrend
  });

  const direction = emaDirection(emaStack);
  if (direction === "none") {
    return null;
  }

  const risk: Risk = {
    sl: context.baselineStopPct,
    tpRR: direction === "long" ? 1.8 : 1.6,
    trailing
  };

  return {
    id: `${context.symbol.symbol}-${context.timeframe}-${new Date().toISOString()}`,
    symbol: context.symbol.symbol,
    timeframe: context.timeframe,
    direction,
    filters: {
      emaStack: emaStack.allAbovePrice ? "aboveAll" : "belowAll",
      ema8: emaStack.ema8.toFixed(4),
      ema21: emaStack.ema21.toFixed(4),
      ema50: emaStack.ema50.toFixed(4)
    },
    evidence,
    correlation,
    risk,
    status: context.status ?? "NEW"
  };
}

export type SnapshotBuilderInput = {
  symbols: SymbolInfo[];
  ohlcv: OHLCV[];
  signals: Signal[];
  health: Snapshot["health"];
};

export function buildSnapshot({ symbols, ohlcv, signals, health }: SnapshotBuilderInput): Snapshot {
  const emaBySymbol: Snapshot["ema"] = {};
  for (const signal of signals) {
    emaBySymbol[signal.symbol] ??= {};
    const latestPrice = ohlcv
      .filter((bar) => bar.symbol === signal.symbol)
      .sort((a, b) => b.t - a.t)[0]?.c ?? 0;
    const ema8 = Number(signal.filters.ema8 ?? latestPrice);
    const ema21 = Number(signal.filters.ema21 ?? latestPrice);
    const ema50 = Number(signal.filters.ema50 ?? latestPrice);
    emaBySymbol[signal.symbol][signal.timeframe] = evaluateEmaRule({
      price: latestPrice,
      ema8,
      ema21,
      ema50
    });
  }

  return {
    symbols,
    ohlcv,
    ema: emaBySymbol,
    signals,
    health,
    updatedAt: Date.now()
  };
}
