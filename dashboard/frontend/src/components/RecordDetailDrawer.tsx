import type { ReactNode } from 'react';
import type { FullMemoryRecord } from '../types.js';

interface Props {
  record: FullMemoryRecord | null;
  onClose: () => void;
}

export function RecordDetailDrawer({ record, onClose }: Props): ReactNode {
  if (!record) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {record.id}
              </span>
              {record.isQuarantined && <span className="badge rose">QUARANTINED</span>}
              <span className="badge purple">{record.commandFamily}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Created: {new Date(record.createdAt).toLocaleString()}
            </div>
          </div>
          <button className="btn btn-outline" onClick={onClose}>
            Close ✕
          </button>
        </div>

        <div className="drawer-body">
          {/* Quarantine Alert if flagged */}
          {record.poisoningFlag && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '0.35rem' }}>
                ⚠ Security & Poisoning Quarantine Flag
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Reason: {record.poisoningFlag.reason}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Raised at: {new Date(record.poisoningFlag.raisedAt).toLocaleString()} • Status: {record.poisoningFlag.status}
              </div>
            </div>
          )}

          {/* Fix & Explanation */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Proposed Fix & Rationale
            </h3>
            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {record.fix?.explanation || record.fixExplanation}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Commands:</div>
              {(record.fix?.commands || record.fixCommands || []).map((cmd, i) => (
                <div key={i} className="code-block mono" style={{ margin: '0.25rem 0' }}>
                  {cmd}
                </div>
              ))}
            </div>
          </div>

          {/* Verification & Wilson Score */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Verification Telemetry
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                  {record.verification?.status ?? record.verificationStatus}
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wilson Lower Bound (95% CI)</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-purple)', marginTop: '0.25rem' }}>
                  {record.wilsonLowerBound !== null && record.wilsonLowerBound !== undefined
                    ? `${(record.wilsonLowerBound * 100).toFixed(1)}%`
                    : 'N/A (unverified)'}
                </div>
              </div>
            </div>
          </div>

          {/* Fingerprints & Hashes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Deterministic Signatures
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fingerprint (SHA-256):</div>
            <div className="code-block mono" style={{ color: 'var(--accent-cyan)' }}>
              {record.fingerprint}
            </div>

            {record.environment?.lockfileHashes && (
              <>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Lockfile Hashes:</div>
                <pre className="code-block mono">
                  {JSON.stringify(record.environment.lockfileHashes, null, 2)}
                </pre>
              </>
            )}
          </div>

          {/* Provenance Details */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Provenance & Git Context
            </h3>
            <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Commit: </span><span className="mono">{record.provenance?.gitCommit || 'N/A'}</span></div>
              <div style={{ marginTop: '0.25rem' }}><span style={{ color: 'var(--text-muted)' }}>Branch: </span><span className="mono">{record.provenance?.gitBranch || 'N/A'}</span></div>
              <div style={{ marginTop: '0.25rem' }}><span style={{ color: 'var(--text-muted)' }}>Author: </span><span>{record.provenance?.gitAuthor || 'N/A'}</span></div>
            </div>
          </div>

          {/* Supersedes Chain Linked List */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Supersedes Chain
            </h3>
            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              {record.supersedes ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{record.id}</span>
                  <span style={{ color: 'var(--text-muted)' }}>── replaces ──▶</span>
                  <span className="mono" style={{ color: 'var(--accent-amber)' }}>{record.supersedes}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(lockfile updated)</span>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Root record (no predecessor in supersedes chain)</span>
              )}
            </div>
          </div>

          {/* Normalized vs Raw Output */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Normalized vs. Redacted Raw Output
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Normalized Output:</div>
            <pre className="code-block" style={{ maxHeight: '180px' }}>
              {record.normalizedOutput || 'Normalized output unavailable in summary'}
            </pre>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Raw Redacted Output:</div>
            <pre className="code-block" style={{ maxHeight: '180px' }}>
              {record.rawOutputRedacted || 'Raw output unavailable in summary'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
