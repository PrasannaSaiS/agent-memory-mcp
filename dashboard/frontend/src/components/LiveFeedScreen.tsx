import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { LogEvent } from '../types.js';

interface Props {
  events: LogEvent[];
  isStreaming: boolean;
  onClear: () => void;
}

export function LiveFeedScreen({ events, isStreaming, onClear }: Props): ReactNode {
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'record') return e.event?.includes('record');
    if (filter === 'find') return e.event?.includes('find');
    if (filter === 'verify') return e.event?.includes('verify');
    if (filter === 'quarantine') return e.quarantined || e.status?.includes('quarantine');
    return true;
  });

  const getToolCallTheme = (evt: LogEvent) => {
    if (evt.quarantined || evt.status?.includes('quarantine')) {
      return {
        typeClass: 'quarantine',
        badge: <span className="badge rose">QUARANTINE_ALERT</span>,
      };
    }
    const eventName = evt.event?.toLowerCase() || '';
    if (eventName.includes('record')) {
      return {
        typeClass: 'record',
        badge: <span className="badge emerald">RECORD_FAILURE</span>,
      };
    }
    if (eventName.includes('find')) {
      return {
        typeClass: 'find',
        badge: <span className="badge cyan">FIND_FIX</span>,
      };
    }
    if (eventName.includes('verify')) {
      return {
        typeClass: 'verify',
        badge: <span className="badge violet">VERIFY_FIX</span>,
      };
    }
    return {
      typeClass: '',
      badge: <span className="badge gray">{evt.event?.toUpperCase() || 'INFO'}</span>,
    };
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-title-row">
          <div>
            <h1 className="screen-title">Live Activity Feed</h1>
            <p className="screen-subtitle">
              High-throughput SSE event stream of MCP tool calls, deterministic fingerprinting, and retrieval decisions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <div className="status-badge">
              <span
                className="pulse-dot"
                style={{
                  background: isStreaming ? 'var(--status-success)' : 'var(--status-danger)',
                }}
              />
              <span>{isStreaming ? 'SSE Active (Streaming)' : 'Disconnected'}</span>
            </div>

            <button
              className={`btn ${autoScroll ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAutoScroll(!autoScroll)}
              aria-label="Toggle auto-scrolling"
            >
              {autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: PAUSED'}
            </button>

            <button className="btn btn-outline" onClick={onClear} aria-label="Clear event stream">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.15rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `All Events (${events.length})` },
          { id: 'record', label: 'Record Failure' },
          { id: 'find', label: 'Find Fix' },
          { id: 'verify', label: 'Verify Fix' },
          { id: 'quarantine', label: 'Quarantine Alerts' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${filter === tab.id ? 'active' : ''}`}
            onClick={() => setFilter(tab.id)}
            style={{
              background: filter === tab.id ? 'var(--bg-surface)' : 'transparent',
              border: filter === tab.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* High-Performance Event Stream Container */}
      <div
        className="panel"
        style={{
          height: '620px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          padding: '1rem',
          background: 'var(--bg-code)',
        }}
      >
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <h2 className="empty-state-title">Awaiting Live Telemetry</h2>
            <p className="empty-state-desc">
              Events stream in real time over SSE when an AI agent calls tools (`record_failure`, `find_fix`, or `verify_fix`).
            </p>
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const { typeClass, badge } = getToolCallTheme(evt);

            return (
              <div key={idx} className={`feed-item ${typeClass}`}>
                {/* Header Line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {badge}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {evt.msg ?? evt.event}
                    </span>
                  </div>

                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {evt.time ? new Date(evt.time).toLocaleTimeString() : 'now'}
                  </span>
                </div>

                {/* Monospace Metadata Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.85rem',
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {evt.command && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>cmd: </span>
                      <code style={{ color: 'var(--text-primary)' }}>{String(evt.command)}</code>
                    </div>
                  )}

                  {evt.fingerprint && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>fp: </span>
                      <span className="mono" style={{ color: 'var(--accent-cyan)' }}>
                        {String(evt.fingerprint).slice(0, 16)}…
                      </span>
                    </div>
                  )}

                  {evt.matchCount !== undefined && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>matches: </span>
                      <strong style={{ color: 'var(--status-success)' }}>{evt.matchCount}</strong>
                    </div>
                  )}

                  {evt.repo && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>repo: </span>
                      <span className="mono">{String(evt.repo)}</span>
                    </div>
                  )}

                  {evt.quarantined && (
                    <span className="badge rose" style={{ fontSize: '0.68rem' }}>
                      BLOCKED
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
