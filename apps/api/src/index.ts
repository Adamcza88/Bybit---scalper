import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import {
  buildSignal,
  buildSnapshot,
  entryMetricSchema,
  signalSchema,
  symbolSchema
} from "@bybit-scalper/core";
import type { Signal } from "@bybit-scalper/core";
import { checklist, health, ohlcv, signals as seedSignals, symbols } from "./data/mockData.js";

const fastify = Fastify({ logger: false });

let cachedSignals = [...seedSignals];

fastify.get("/api/pairs", async (request, reply) => {
  const validSymbols = symbols.map((symbol) => symbolSchema.parse(symbol));
  const enriched = validSymbols.map((symbol) => ({
    ...symbol,
    liquidityScore: Math.random() * 100,
    emaRulePass: cachedSignals.some((signal) => signal.symbol === symbol.symbol)
  }));
  return reply.send({ data: enriched });
});

fastify.get("/api/signals", async (request, reply) => {
  const query = request.query as { tf?: string; direction?: string; minScore?: string };
  let filtered = [...cachedSignals];
  if (query.tf) {
    filtered = filtered.filter((signal) => signal.timeframe === query.tf);
  }
  if (query.direction) {
    filtered = filtered.filter((signal) => signal.direction === query.direction);
  }
  if (query.minScore) {
    const min = Number.parseFloat(query.minScore);
    filtered = filtered.filter((signal) => signal.correlation.checklistScore >= min);
  }
  return reply.send({ data: filtered.map((signal) => signalSchema.parse(signal)) });
});

fastify.get("/api/snapshot", async (request, reply) => {
  const query = request.query as { symbol?: string; tf?: string };

  const validSignals = cachedSignals.map((signal) => signalSchema.parse(signal));
  const snapshot = buildSnapshot({ symbols, ohlcv, signals: validSignals, health });
  const filteredSignals = snapshot.signals.filter((signal: Signal) => {
    if (query.symbol && signal.symbol !== query.symbol) {
      return false;
    }
    if (query.tf && !query.tf.split(",").includes(signal.timeframe)) {
      return false;
    }
    return true;
  });

  const filteredSnapshot = {
    ...snapshot,
    signals: filteredSignals
  };
  return reply.send(filteredSnapshot);
});

fastify.get("/api/health", async () => ({
  updatedAt: Date.now(),
  sources: health
}));

fastify.post("/api/signals", async (request, reply) => {
  const body = request.body as {
    symbol: string;
    price: number;
    timeframe: "1m" | "5m" | "15m" | "1h";
    metrics: unknown[];
  };

  const targetSymbol = symbols.find((item) => item.symbol === body.symbol);
  if (!targetSymbol) {
    reply.code(404);
    return { error: "Symbol not found" };
  }

  const metrics = (body.metrics ?? []).map((metric) => entryMetricSchema.parse(metric));
  const signal = buildSignal({
    symbol: targetSymbol,
    timeframe: body.timeframe,
    price: body.price,
    ema: { ema8: body.price * 0.99, ema21: body.price * 0.985, ema50: body.price * 0.98 },
    metrics,
    checklist,
    btcDominanceBias: "neutral",
    total3State: "expanding",
    btcCorrelation: 0.72,
    baselineStopPct: 1.2,
    recentPullbackPct: 1.0,
    weakenTrend: false
  });

  if (!signal) {
    reply.code(400);
    return { error: "Signal requirements not met" };
  }

  cachedSignals = cachedSignals.filter((existing) => existing.symbol !== signal.symbol);
  cachedSignals.push(signal);
  return reply.send(signalSchema.parse(signal));
});

const port = Number(process.env.PORT ?? 3001);

fastify.get("/api/stream", async (request, reply) => {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  const timer = setInterval(() => {
    const payload = JSON.stringify({
      type: "signal.update",
      data: cachedSignals
    });
    reply.raw.write(`data: ${payload}\n\n`);
  }, 5000);

  request.raw.on("close", () => {
    clearInterval(timer);
  });
});

async function start() {
  await fastify.register(fastifyCors, { origin: true });
  try {
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`API listening on http://localhost:${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
