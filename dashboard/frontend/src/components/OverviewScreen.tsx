import type { ReactNode } from 'react';
import type { MemoryStats } from '../types.js';

interface Props {
  stats: MemoryStats | null;
  onNavigate: (screen: string) => void;
}

export function OverviewScreen({ stats, onNavigate }: Props): ReactNode {
  const ageMax = Math.max(
    1,
    stats?.ageDistribution.under1h ?? 0,
    stats?.ageDistribution.under24h ?? 0,
    stats?.ageDistribution.under7d ?? 0,
    stats?.ageDistribution.over7d ?? 0,
  );

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">System Overview</h1>
        <p className="screen-subtitle">
          Real-time memory state, Wilson-score confidence lower bounds, and integrity telemetry.
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="stat-grid">
        <div
          className="stat-card"
          onClick={() => onNavigate('records')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-label">Total Memories</div>
          <div className="stat-value">{stats?.totalRecords ?? 0}</div>
          <div className="stat-subtext">Across all active repositories</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-label">Confidence (Wilson Bound)</div>
          <div className="stat-value">
            {stats ? `${(stats.successRate * 100).toFixed(1)}%` : '0%'}
          </div>
          <div className="stat-subtext">95% statistical confidence lower bound</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-label">Verified Fixes</div>
          <div className="stat-value">{stats?.verifiedCount ?? 0}</div>
          <div className="stat-subtext">Sandboxed & human verified</div>
        </div>

        <div
          className={`stat-card ${stats && stats.quarantinedCount > 0 ? 'rose' : ''}`}
          onClick={() => onNavigate('security')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-label">Poisoning Flags</div>
          <div
            className="stat-value"
            style={{
              color: stats && stats.quarantinedCount > 0 ? 'var(--accent-rose)' : 'inherit',
            }}
          >
            {stats?.quarantinedCount ?? 0}
          </div>
          <div className="stat-subtext">Quarantined from retrieval</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-label">Stale Warnings</div>
          <div className="stat-value">{stats?.staleCount ?? 0}</div>
          <div className="stat-subtext">Lockfile/runtime mismatch</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Unique Fingerprints</div>
          <div className="stat-value">{stats?.exactFingerprints ?? 0}</div>
          <div className="stat-subtext">Normalized SHA-256 digests</div>
        </div>
      </div>

      {/* Visual Age Distribution Histogram */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Memory Age Distribution</h2>
          <span className="badge cyan">Temporal Decay Policy</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Record age affects provenance scoring and TTL staleness evaluation during fix retrieval.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          {[
            {
              label: '< 1 Hour (Fresh)',
              count: stats?.ageDistribution.under1h ?? 0,
              color: 'var(--accent-emerald)',
            },
            {
              label: '< 24 Hours (Active)',
              count: stats?.ageDistribution.under24h ?? 0,
              color: 'var(--accent-cyan)',
            },
            {
              label: '< 7 Days (Established)',
              count: stats?.ageDistribution.under7d ?? 0,
              color: 'var(--accent-purple)',
            },
            {
              label: '> 7 Days (Aging/Archived)',
              count: stats?.ageDistribution.over7d ?? 0,
              color: 'var(--accent-amber)',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-subtle)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}
                >
                  {item.label}
                </span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                  {item.count}
                </strong>
              </div>
              <div
                style={{
                  height: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(4, (item.count / ageMax) * 100)}%`,
                    background: item.color,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Architecture & Isolation Status */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Core Subsystem Telemetry</h2>
          <span className="badge emerald">All Systems Healthy</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            fontSize: '0.88rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-subtle)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Transport & Protocol
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Stdio transport, MCP 2026-07-28 compliant
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span className="badge cyan">stdio channel</span>
              <span className="badge emerald">Zero stdout leaks</span>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-subtle)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Storage Architecture
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              JSONL source of truth + rebuildable SQLite FTS5
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span className="badge purple">SQLite WAL</span>
              <span className="badge cyan">node:sqlite readOnly</span>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-subtle)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Security Policy
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Command allowlist, Dry-Run default, Wilson ranking
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span className="badge emerald">Redaction active</span>
              <span className="badge rose">Quarantine active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
