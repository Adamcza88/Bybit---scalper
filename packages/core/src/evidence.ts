import { EntryEvidence, EntryMetric, REQUIRED_EVIDENCE_COUNT } from "./types.js";

export function aggregateEvidence(
  metrics: EntryMetric[],
  minRequired: number = REQUIRED_EVIDENCE_COUNT
): EntryEvidence {
  const passes = metrics.filter((metric) => metric.pass).length;
  const passed = passes >= minRequired;

  return {
    metrics,
    minRequired,
    passed
  };
}

export function evidenceScore(evidence: EntryEvidence): number {
  return evidence.metrics.reduce((acc, metric) => {
    if (!metric.pass) {
      return acc;
    }
    return acc + (metric.score ?? 1);
  }, 0);
}
