import { useState, type ReactNode } from 'react';
import type { PendingApproval } from '../types.js';

interface Props {
  approvals: PendingApproval[];
  isLoading?: boolean;
  onDecision: (id: string, decision: 'approve' | 'deny', notes?: string) => Promise<boolean>;
}

export function ApprovalQueueScreen({ approvals, isLoading, onDecision }: Props): ReactNode {
  const [operatorNotes, setOperatorNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const handleAction = async (id: string, decision: 'approve' | 'deny') => {
    setIsSubmitting(id);
    try {
      await onDecision(id, decision, operatorNotes[id]);
      setOperatorNotes((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case 'HIGH':
        return <span className="badge rose">HIGH RISK LEVEL</span>;
      case 'MEDIUM':
        return <span className="badge amber">MEDIUM RISK LEVEL</span>;
      case 'LOW':
      default:
        return <span className="badge emerald">LOW RISK LEVEL</span>;
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="screen-header">
          <div className="skeleton-box" style={{ width: '320px', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '480px', height: '16px' }} />
        </div>
        <div className="panel" style={{ height: '180px', marginBottom: '16px' }}>
          <div className="skeleton-box" style={{ height: '100%' }} />
        </div>
        <div className="panel" style={{ height: '180px' }}>
          <div className="skeleton-box" style={{ height: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="screen-header">
        <div className="screen-title-row">
          <div>
            <h1 className="screen-title">Human-in-the-Loop Approval Queue</h1>
            <p className="screen-subtitle">
              Dry-run safety control surface. Intercepts non-allowlisted agent repair commands prior to live shell execution.
            </p>
          </div>
          <div className="badge gray">
            {approvals.length} Pending Execution Authorization{approvals.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <h2 className="empty-state-title">Approval Queue Clean</h2>
            <p className="empty-state-desc">
              Zero execution authorizations are pending. When an agent calls `verify_fix` with a non-allowlisted command or high-risk shell arguments, the execution barrier intercepts it here for operator authorization.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <span className="badge emerald">Dry-Run Protection Active</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {approvals.map((appr) => {
            const isHighRisk = appr.risk.level.toUpperCase() === 'HIGH';

            return (
              <div
                key={appr.approvalId}
                className="panel"
                style={{
                  borderLeft: isHighRisk
                    ? '4px solid var(--status-danger)'
                    : '4px solid var(--status-warning)',
                  padding: '1.35rem 1.5rem',
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--accent-cyan)' }}>
                        {appr.approvalId}
                      </span>
                      {getRiskBadge(appr.risk.level)}
                      {appr.recordId && <span className="mono badge gray">Ref Record: {appr.recordId}</span>}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Intercepted: {new Date(appr.createdAt).toLocaleString()} • Status: <span className="mono">{appr.status}</span>
                    </div>
                  </div>

                  {/* Decision Controls */}
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      id={`deny-btn-${appr.approvalId}`}
                      className="btn btn-danger"
                      disabled={isSubmitting === appr.approvalId}
                      onClick={() => handleAction(appr.approvalId, 'deny')}
                      aria-label={`Deny command for ${appr.approvalId}`}
                    >
                      {isSubmitting === appr.approvalId ? 'Submitting…' : 'Deny & Terminate'}
                    </button>

                    <button
                      id={`approve-btn-${appr.approvalId}`}
                      className="btn btn-success"
                      disabled={isSubmitting === appr.approvalId}
                      onClick={() => handleAction(appr.approvalId, 'approve')}
                      aria-label={`Authorize live execution for ${appr.approvalId}`}
                    >
                      {isSubmitting === appr.approvalId ? 'Authorizing…' : 'Authorize Execution'}
                    </button>
                  </div>
                </div>

                {/* Dry-Run Requested Command Plan */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Intercepted Command Plan:
                  </div>
                  <div className="code-block mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    $ {appr.requestedCommand}
                  </div>
                </div>

                {/* Risk Reasons & Safety Assessment */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Security Policy Findings:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {appr.risk.reasons.map((r, i) => (
                      <span key={i} className={`badge ${isHighRisk ? 'rose' : 'amber'}`}>
                        ⚠ {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Operator Audit Notes Input */}
                <div>
                  <label
                    htmlFor={`notes-${appr.approvalId}`}
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.3rem',
                      fontWeight: 500,
                    }}
                  >
                    Operator Audit Notes (logged immutably to approvals-resolved.jsonl):
                  </label>
                  <input
                    id={`notes-${appr.approvalId}`}
                    type="text"
                    className="input"
                    placeholder="Enter justification or review comments prior to decision..."
                    value={operatorNotes[appr.approvalId] || ''}
                    onChange={(e) =>
                      setOperatorNotes({ ...operatorNotes, [appr.approvalId]: e.target.value })
                    }
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
