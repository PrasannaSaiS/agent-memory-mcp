import { useState, type ReactNode } from 'react';
import type { MemoryRecordSummary, FullMemoryRecord } from '../types.js';
import { RecordDetailDrawer } from './RecordDetailDrawer.js';

interface Props {
  records: MemoryRecordSummary[];
  onFetchDetail: (id: string) => Promise<FullMemoryRecord | null>;
}

export function RecordBrowserScreen({ records, onFetchDetail }: Props): ReactNode {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<FullMemoryRecord | null>(null);

  const commandFamilies = ['all', ...Array.from(new Set(records.map((r) => r.commandFamily)))];

  const filtered = records.filter((r) => {
    if (familyFilter !== 'all' && r.commandFamily !== familyFilter) return false;
    if (statusFilter === 'quarantined' && !r.isQuarantined) return false;
    if (statusFilter === 'clean' && r.isQuarantined) return false;
    if (statusFilter === 'verified' && r.verificationStatus !== 'verified_success') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.command.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.fingerprint.toLowerCase().includes(q) ||
        r.fixExplanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRowClick = async (id: string) => {
    const full = await onFetchDetail(id);
    if (full) setSelectedRecord(full);
  };

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Record Browser & Detail</h1>
        <p className="screen-subtitle">
          Searchable catalog of error-fix memories, fingerprints, provenance metadata, and
          supersedes history.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div
        className="panel"
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search commands, error text, fingerprints, or explanations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="input"
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
          >
            <option value="all">All Command Families</option>
            {commandFamilies
              .filter((f) => f !== 'all')
              .map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
          </select>

          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="clean">Clean (Unquarantined)</option>
            <option value="quarantined">Quarantined (Flagged)</option>
            <option value="verified">Verified Only</option>
          </select>
        </div>
      </div>

      {/* Table Results */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Command</th>
                <th>Family</th>
                <th>Fingerprint (SHA-256)</th>
                <th>Confidence / Wilson</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}
                  >
                    No matching memory records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} onClick={() => handleRowClick(r.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span
                        className="mono"
                        style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}
                      >
                        {r.id}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {r.command.length > 38 ? `${r.command.slice(0, 38)}...` : r.command}
                      </code>
                    </td>
                    <td>
                      <span className="badge purple">{r.commandFamily}</span>
                    </td>
                    <td>
                      <span
                        className="mono"
                        style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                      >
                        {r.fingerprint.slice(0, 16)}...
                      </span>
                    </td>
                    <td>
                      {r.wilsonLowerBound !== null ? (
                        <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                          {(r.wilsonLowerBound * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {r.isQuarantined ? (
                        <span className="badge rose">QUARANTINED</span>
                      ) : r.verificationStatus === 'verified_success' ? (
                        <span className="badge emerald">VERIFIED</span>
                      ) : (
                        <span className="badge gray">RECORDED</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(r.id);
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <RecordDetailDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}
