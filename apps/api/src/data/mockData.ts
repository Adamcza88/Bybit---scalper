import {
  Checklist,
  EntryMetric,
  MIN_CHECKLIST_SCORE,
  OHLCV,
  Signal,
  Snapshot,
  SymbolInfo,
  buildSignal
} from "@bybit-scalper/core";

export const symbols: SymbolInfo[] = [
  {
    symbol: "BTCUSDT",
    quote: "USDT",
    base: "BTC",
    type: "perp",
    tickSize: 0.1,
    lotSize: 0.001,
    status: "trading"
  },
  {
    symbol: "SOLUSDT",
    quote: "USDT",
    base: "SOL",
    type: "perp",
    tickSize: 0.01,
    lotSize: 0.1,
    status: "trading"
  }
];

export const ohlcv: OHLCV[] = [
  {
    symbol: "BTCUSDT",
    t: Date.now() - 60_000,
    o: 65000,
    h: 65100,
    l: 64950,
    c: 65080,
    v: 1234,
    tf: "1m",
    source: "bybit"
  },
  {
    symbol: "SOLUSDT",
    t: Date.now() - 60_000,
    o: 150,
    h: 151.2,
    l: 149.5,
    c: 150.8,
    v: 9480,
    tf: "1m",
    source: "bybit"
  }
];

export const checklist: Checklist = {
  items: Array.from({ length: 12 }, (_, idx) => ({
    key: `check_${idx + 1}`,
    description: `Checklist item ${idx + 1}`,
    pass: idx < MIN_CHECKLIST_SCORE
  }))
};

export const evidenceMetrics: EntryMetric[] = [
  { type: "breakout_retest", pass: true, score: 2 },
  { type: "volume_reaction", pass: true, score: 1.5 },
  { type: "pattern_confirmation", pass: false }
];

export const health: Snapshot["health"] = [
  { name: "bybit", latencyMs: 120, status: "healthy", lastUpdated: Date.now() },
  { name: "coinglass", latencyMs: 450, status: "degraded", lastUpdated: Date.now() - 60_000 },
  { name: "birdie", latencyMs: 320, status: "healthy", lastUpdated: Date.now() }
];

const maybeSignal = buildSignal({
  symbol: symbols[1],
  timeframe: "5m",
  price: ohlcv[1].c,
  ema: { ema8: ohlcv[1].c * 0.995, ema21: ohlcv[1].c * 1.002, ema50: ohlcv[1].c * 1.01 },
  metrics: evidenceMetrics,
  checklist,
  btcDominanceBias: "neutral",
  total3State: "expanding",
  btcCorrelation: 0.72,
  baselineStopPct: 1.3,
  recentPullbackPct: 1.1,
  weakenTrend: false,
  status: "NEW"
});

export const signals: Signal[] = maybeSignal ? [maybeSignal] : [];
