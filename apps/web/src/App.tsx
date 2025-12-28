import { useMemo, useState } from "react";
import { usePairs, useSignals, useSnapshot, useHealth } from "./api";
import type { Signal } from "./types";

function formatLatency(latency: number) {
  if (latency >= 1000) {
    return `${(latency / 1000).toFixed(1)}s`;
  }
  return `${latency.toFixed(0)}ms`;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "healthy":
      return "badge green";
    case "degraded":
      return "badge orange";
    default:
      return "badge red";
  }
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="signal-item">
      <div>
        <div className={`signal-direction ${signal.direction}`}>{signal.direction.toUpperCase()}</div>
        <div>{signal.symbol}</div>
        <small>
          TF {signal.timeframe} • Checklist {signal.correlation.checklistScore}/12 • Corr {" "}
          {(signal.correlation.btcCorrelation * 100).toFixed(0)}%
        </small>
      </div>
      <div>
        <div>RR {signal.risk.tpRR.toFixed(2)}</div>
        <div>TS {signal.risk.trailing.tsPct.toFixed(1)}%</div>
        <div>SL {signal.risk.sl.toFixed(2)}%</div>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>();
  const { data: pairs, isLoading: loadingPairs } = usePairs();
  const { data: signals } = useSignals();
  const { data: snapshot } = useSnapshot(selectedSymbol);
  const { data: health } = useHealth();

  const latestSignals = useMemo(() => signals?.slice(0, 5) ?? [], [signals]);
  const snapshotJson = useMemo(() => (snapshot ? JSON.stringify(snapshot, null, 2) : ""), [snapshot]);

  return (
    <div className="dashboard">
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>System Health</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {health?.map((source) => (
            <div key={source.name} className={statusBadgeClass(source.status)}>
              {source.name.toUpperCase()} · {formatLatency(source.latencyMs)}
            </div>
          )) || <span>Loading...</span>}
        </div>
      </section>

      <section className="card">
        <h2>Perpetual Pairs</h2>
        {loadingPairs && <div>Loading pairs…</div>}
        {!loadingPairs && (
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Liquidity</th>
                <th>EMA Rule</th>
              </tr>
            </thead>
            <tbody>
              {pairs?.map((pair) => (
                <tr key={pair.symbol} onClick={() => setSelectedSymbol(pair.symbol)} style={{ cursor: "pointer" }}>
                  <td>{pair.symbol}</td>
                  <td>{pair.liquidityScore.toFixed(1)}</td>
                  <td>
                    <span className={`badge ${pair.emaRulePass ? "green" : "red"}`}>
                      {pair.emaRulePass ? "PASS" : "BLOCK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Signal Queue</h2>
        <div className="signal-list">
          {latestSignals.length === 0 && <div>No signals yet.</div>}
          {latestSignals.map((signal) => (
            <SignalCard signal={signal} key={signal.id} />
          ))}
        </div>
      </section>

      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>Snapshot Export</h2>
        <div className="snapshot-export">
          <pre>{snapshotJson}</pre>
        </div>
      </section>
    </div>
  );
}
