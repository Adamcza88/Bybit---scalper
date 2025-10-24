import { describe, expect, it } from "vitest";
import { evaluateEmaRule } from "../ema.js";

describe("EMA rule", () => {
  it("passes when price is above all EMAs", () => {
    const result = evaluateEmaRule({ price: 110, ema8: 100, ema21: 95, ema50: 90 });
    expect(result.rulePass).toBe(true);
    expect(result.allBelowPrice).toBe(true);
    expect(result.allAbovePrice).toBe(false);
  });

  it("fails when price is between EMAs", () => {
    const result = evaluateEmaRule({ price: 95, ema8: 100, ema21: 94, ema50: 90 });
    expect(result.rulePass).toBe(false);
  });
});
