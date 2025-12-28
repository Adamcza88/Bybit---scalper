import { EMAStack } from "./types.js";

export type EMARuleInput = {
  price: number;
  ema8: number;
  ema21: number;
  ema50: number;
};

export function evaluateEmaRule({ price, ema8, ema21, ema50 }: EMARuleInput): EMAStack {
  const allAbovePrice = ema8 > price && ema21 > price && ema50 > price;
  const allBelowPrice = ema8 < price && ema21 < price && ema50 < price;
  const rulePass = allAbovePrice || allBelowPrice;

  return {
    ema8,
    ema21,
    ema50,
    allAbovePrice,
    allBelowPrice,
    rulePass
  };
}

export function emaDirection(stack: EMAStack): "long" | "short" | "none" {
  if (stack.allBelowPrice) {
    return "long";
  }
  if (stack.allAbovePrice) {
    return "short";
  }
  return "none";
}
