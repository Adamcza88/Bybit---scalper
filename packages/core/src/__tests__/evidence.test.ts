import { describe, expect, it } from "vitest";
import { aggregateEvidence } from "../evidence.js";

const baseMetrics = [
  { type: "breakout_retest", pass: true },
  { type: "volume_reaction", pass: true },
  { type: "liquidity_sweep", pass: false }
] as const;

describe("Entry evidence", () => {
  it("passes when minimum met", () => {
    const evidence = aggregateEvidence([...baseMetrics]);
    expect(evidence.passed).toBe(true);
    expect(evidence.minRequired).toBeGreaterThan(0);
  });

  it("fails below threshold", () => {
    const evidence = aggregateEvidence(
      baseMetrics.map((metric) => ({ ...metric, pass: metric.type === "liquidity_sweep" })),
      3
    );
    expect(evidence.passed).toBe(false);
  });
});
