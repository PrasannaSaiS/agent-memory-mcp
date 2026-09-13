import { useState, type ReactNode } from 'react';
import type { PendingApproval } from '../types.js';

interface Props {
  approvals: PendingApproval[];
  onDecision: (id: string, decision: 'approve' | 'deny', notes?: string) => Promise<boolean>;
}

export function ApprovalQueueScreen({ approvals, onDecision }: Props): ReactNode {
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
        return <span className="badge rose">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="badge amber">MEDIUM RISK</span>;
      case 'LOW':
      default:
        return <span className="badge emerald">LOW RISK</span>;
    }
  };

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Human-in-the-Loop Approval Queue</h1>
        <p className="screen-subtitle">
          Pending dry-run verify_fix executions requiring explicit operator authorization before execution.
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Approval Queue Clean
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
            No commands are awaiting execution approval. When an agent calls verify_fix with a non-allowlisted command, dry-run safety intercepts it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {approvals.map((appr) => (
            <div
              key={appr.approvalId}
              className="panel"
              style={{
                borderLeft: appr.risk.level === 'HIGH' ? '4px solid var(--accent-rose)' : '4px solid var(--accent-amber)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                      {appr.approvalId}
                    </span>
                    {getRiskBadge(appr.risk.level)}
                    {appr.recordId && <span className="mono badge gray">Record: {appr.recordId}</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Queued: {new Date(appr.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn btn-danger"
                    disabled={isSubmitting === appr.approvalId}
                    onClick={() => handleAction(appr.approvalId, 'deny')}
                  >
                    Deny
                  </button>
                  <button
                    className="btn btn-success"
                    disabled={isSubmitting === appr.approvalId}
                    onClick={() => handleAction(appr.approvalId, 'approve')}
                  >
                    Approve Live Execution
                  </button>
                </div>
              </div>

              {/* Requested Command */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Requested Execution Command:
                </div>
                <div className="code-block mono" style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {appr.requestedCommand}
                </div>
              </div>

              {/* Risk Reasons */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Risk Assessment:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {appr.risk.reasons.map((r, i) => (
                    <span key={i} className="badge amber">
                      ⚠ {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Operator Notes Input */}
              <div>
                <input
                  type="text"
                  className="input"
                  placeholder="Add optional operator audit notes..."
                  value={operatorNotes[appr.approvalId] || ''}
                  onChange={(e) =>
                    setOperatorNotes({ ...operatorNotes, [appr.approvalId]: e.target.value })
                  }
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
