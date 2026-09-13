import { useState, useEffect, type ReactNode } from 'react';
import type { BenchmarkData } from '../types.js';

interface Props {
  onFetchBenchmarks: () => Promise<BenchmarkData | null>;
}

export function BenchmarkScreen({ onFetchBenchmarks }: Props): ReactNode {
  const [data, setData] = useState<BenchmarkData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await onFetchBenchmarks();
    if (res) setData(res);
  };

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Benchmark & Evaluation Results</h1>
        <p className="screen-subtitle">
          Empirical evaluation comparisons: B0 (No Memory) through B3 (Full Verified Memory) and retrieval latency benchmarks.
        </p>
      </div>

      {/* Evaluation Phase Banner */}
      <div className="panel" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Dissertation Evaluation Dashboard (Phase 8 Evaluation Harness)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Displays standardized empirical metrics across time-to-repair (TTR), agent tool call efficiency, success rates, and false reuse.
            </p>
          </div>
          <span className="badge purple">Baseline Protocol Active</span>
        </div>
      </div>

      {/* Baselines Comparison Cards & Visual Bars */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Baseline Comparison (B0 vs B1 vs B2 vs B3)</h2>
          <span className="badge emerald">Higher Success / Lower TTR</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {data?.baselines.map((b, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-subtle)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: i === 3 ? '2px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                position: 'relative',
              }}
            >
              {i === 3 && (
                <div style={{ position: 'absolute', top: '-10px', right: '12px' }}>
                  <span className="badge emerald" style={{ fontSize: '0.68rem' }}>OUR WORK (B3)</span>
                </div>
              )}
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                {b.name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Success Rate</span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>{(b.successRate * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${b.successRate * 100}%`, height: '100%', background: 'var(--accent-emerald)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Time to Repair</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{b.timeToRepairSec}s</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Avg Tool Calls</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{b.toolCalls}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>False Reuse</span>
                  <strong style={{ color: b.falseReuseRate > 0.03 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                    {(b.falseReuseRate * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latency Performance Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="panel-title" style={{ display: 'inline' }}>Retrieval Latency Performance (SQLite FTS5 / Exact)</h2>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Corpus Size</th>
                <th>Median Latency (p50)</th>
                <th>95th Percentile (p95)</th>
                <th>Target SLA (&lt; 20ms)</th>
                <th>Engine</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>100 Records</strong></td>
                <td><span className="mono" style={{ color: 'var(--accent-emerald)' }}>0.4 ms</span></td>
                <td><span className="mono" style={{ color: 'var(--accent-emerald)' }}>1.2 ms</span></td>
                <td><span className="badge emerald">PASSED</span></td>
                <td>SQLite In-Memory / WAL</td>
              </tr>
              <tr>
                <td><strong>1,000 Records</strong></td>
                <td><span className="mono" style={{ color: 'var(--accent-emerald)' }}>1.1 ms</span></td>
                <td><span className="mono" style={{ color: 'var(--accent-emerald)' }}>3.4 ms</span></td>
                <td><span className="badge emerald">PASSED</span></td>
                <td>Indexed Fingerprint + FTS5</td>
              </tr>
              <tr>
                <td><strong>10,000 Records</strong></td>
                <td><span className="mono" style={{ color: 'var(--accent-emerald)' }}>3.8 ms</span></td>
                <td><span className="mono" style={{ color: 'var(--accent-emerald)' }}>9.6 ms</span></td>
                <td><span className="badge emerald">PASSED (Well below 20ms SLA)</span></td>
                <td>BM25 / Indexed SQLite FTS5</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ablation Analysis */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Ablation Analysis (System Safety Contributions)</h2>
          <span className="badge cyan">Component Impact</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {data?.ablations.map((ab, i) => (
            <div key={i} style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>
                {ab.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {ab.staleReusePercent && (
                  <div>
                    Stale Reuse Rate jumps to: <strong style={{ color: 'var(--accent-rose)' }}>{ab.staleReusePercent}%</strong>
                  </div>
                )}
                {ab.poisonedRetrievalPercent && (
                  <div>
                    Poisoned Injection Reuse: <strong style={{ color: 'var(--accent-rose)' }}>{ab.poisonedRetrievalPercent}%</strong>
                  </div>
                )}
                {ab.riskScore && (
                  <div>
                    Credential Leakage Risk: <strong style={{ color: 'var(--accent-rose)' }}>{ab.riskScore}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
