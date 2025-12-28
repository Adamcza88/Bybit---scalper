export type Pair = {
  symbol: string;
  base: string;
  quote: string;
  liquidityScore: number;
  emaRulePass: boolean;
};

export type Signal = {
  id: string;
  symbol: string;
  timeframe: "1m" | "5m" | "15m" | "1h";
  direction: "long" | "short";
  risk: { sl: number; tpRR: number; trailing: { tsPct: number } };
  status: string;
  correlation: { checklistScore: number; btcCorrelation: number; btcDominanceBias: string; total3State: string };
  filters: Record<string, string>;
};

export type HealthSource = {
  name: string;
  latencyMs: number;
  status: "healthy" | "degraded" | "down";
  lastUpdated: number;
};

export type Snapshot = {
  symbols: Pair[];
  signals: Signal[];
  updatedAt: number;
  health: HealthSource[];
};
