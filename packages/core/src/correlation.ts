import { Checklist, CorrelationCheck, MIN_CHECKLIST_SCORE } from "./types.js";

export type CorrelationInput = {
  btcDominanceBias: CorrelationCheck["btcDominanceBias"];
  total3State: CorrelationCheck["total3State"];
  btcCorrelation: number;
  checklist: Checklist;
};

export function evaluateCorrelation({
  btcDominanceBias,
  total3State,
  btcCorrelation,
  checklist
}: CorrelationInput): CorrelationCheck {
  const checklistScore = checklist.items.filter((item) => item.pass).length;
  const pass = checklistScore >= MIN_CHECKLIST_SCORE && Math.abs(btcCorrelation) <= 0.85;

  return {
    btcDominanceBias,
    total3State,
    btcCorrelation,
    checklistScore,
    pass
  };
}
