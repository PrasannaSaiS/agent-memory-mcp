import { useState, useEffect, type ReactNode } from 'react';
import type { ExplainabilityData } from '../types.js';

interface Props {
  onFetchExplainability: (queryId?: string) => Promise<ExplainabilityData | null>;
}

export function ExplainabilityScreen({ onFetchExplainability }: Props): ReactNode {
  const [data, setData] = useState<ExplainabilityData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await onFetchExplainability();
    if (res) setData(res);
  };

  const threshold = data?.threshold ?? 0.70;

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Retrieval Explainability</h1>
        <p className="screen-subtitle">
          Transparent multi-factor ranking, fuzzy fallback evaluation, and stale-penalty scoring against the acceptance threshold.
        </p>
      </div>

      {/* Query Banner */}
      <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.04))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.35rem' }}>
              Active Diagnostic Query
            </div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {data?.query ?? 'npm run build'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Retrieval Threshold</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
              {(threshold * 100).toFixed(0)}% (0.70)
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Score Bars vs Threshold Line */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Candidate Fix Scoring vs. Acceptance Threshold</h2>
          <span className="badge cyan">Conservative Ranking Engine</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Scores combine Levenshtein similarity, Git commit provenance decay (0.8x), quarantine penalties (0.5x), and Wilson-score verification bounds.
        </p>

        {/* Visual Threshold Line & Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data?.candidates.map((cand, idx) => {
            const scorePercent = Math.min(100, Math.round(cand.trustScore * 100));
            const passes = cand.trustScore >= threshold;

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: `1px solid ${passes ? 'var(--border-subtle)' : 'rgba(244, 63, 94, 0.2)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span className="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        {cand.id}
                      </span>
                      <span className={`badge ${cand.matchType === 'exact' ? 'emerald' : 'purple'}`}>
                        {cand.matchType.toUpperCase()} MATCH
                      </span>
                      {cand.isQuarantined && <span className="badge rose">QUARANTINED (0.5x)</span>}
                      {cand.isStale && <span className="badge amber">STALE (LOCKFILE MISMATCH)</span>}
                    </div>
                    <code style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {cand.command}
                    </code>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: passes ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {(cand.trustScore * 100).toFixed(1)}%
                    </div>
                    <span style={{ fontSize: '0.75rem', color: passes ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
                      {passes ? '✓ ACCEPTED' : '✗ BELOW THRESHOLD'}
                    </span>
                  </div>
                </div>

                {/* Score Progress Bar with Threshold Marker */}
                <div style={{ position: 'relative', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden', margin: '0.5rem 0' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${scorePercent}%`,
                      background: passes
                        ? cand.matchType === 'exact'
                          ? 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))'
                          : 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))'
                        : 'var(--accent-rose)',
                      borderRadius: '6px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                  {/* Threshold indicator line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${threshold * 100}%`,
                      width: '2px',
                      background: 'var(--accent-amber)',
                      boxShadow: '0 0 6px var(--accent-amber)',
                    }}
                    title={`Threshold: ${(threshold * 100).toFixed(0)}%`}
                  />
                </div>

                {/* Filter Badges & Diagnostics */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div>
                    Repository Match:{' '}
                    <span style={{ color: cand.passedFilters.repository ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {cand.passedFilters.repository ? 'Passed ✓' : 'Failed ✗'}
                    </span>
                  </div>
                  <div>
                    Command Family Match:{' '}
                    <span style={{ color: cand.passedFilters.commandFamily ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {cand.passedFilters.commandFamily ? 'Passed ✓' : 'Failed ✗'}
                    </span>
                  </div>
                  <div>
                    Raw Similarity:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{(cand.similarityScore * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Invariant Callout */}
      <div className="panel" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '0.35rem' }}>
          Defensible Safety Invariant: No Silent Promotion
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Fuzzy matches are never silently promoted to "known fixes." Every retrieved record surfaces its exact matchType, raw similarity, provenance decay, and quarantine status directly into the prompt sanitization envelope.
        </p>
      </div>
    </div>
  );
}
