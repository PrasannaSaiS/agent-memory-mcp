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

  const getEventBadge = (event?: string, quarantined?: boolean) => {
    if (quarantined) return <span className="badge rose">QUARANTINED</span>;
    if (!event) return <span className="badge gray">INFO</span>;
    if (event.includes('record')) return <span className="badge emerald">RECORD_FAILURE</span>;
    if (event.includes('find')) return <span className="badge cyan">FIND_FIX</span>;
    if (event.includes('verify')) return <span className="badge purple">VERIFY_FIX</span>;
    return <span className="badge gray">{event.toUpperCase()}</span>;
  };

  return (
    <div>
      <div
        className="screen-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <h1 className="screen-title">Live Activity Feed</h1>
          <p className="screen-subtitle">
            Real-time SSE event pipeline streaming MCP tool calls, fingerprinting, and retrieval
            decisions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="status-badge">
            <span
              className="pulse-dot"
              style={{ background: isStreaming ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}
            />
            {isStreaming ? 'SSE Active' : 'Disconnected'}
          </div>

          <button
            className={`btn ${autoScroll ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll PAUSED'}
          </button>

          <button className="btn btn-outline" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
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
            style={{ background: filter === tab.id ? 'var(--bg-card)' : 'transparent' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event Stream Container */}
      <div
        className="panel"
        style={{
          height: '650px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '1.25rem',
          background: '#090d16',
        }}
      >
        {filteredEvents.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No activity captured yet</p>
            <p style={{ fontSize: '0.85rem' }}>
              MCP server calls and log writes to logs.jsonl will stream here in real time.
            </p>
          </div>
        ) : (
          filteredEvents.map((evt, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.9rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                borderLeft: evt.quarantined
                  ? '3px solid var(--accent-rose)'
                  : evt.event?.includes('record')
                    ? '3px solid var(--accent-emerald)'
                    : evt.event?.includes('find')
                      ? '3px solid var(--accent-cyan)'
                      : '3px solid var(--border-subtle)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {getEventBadge(evt.event, evt.quarantined)}
                  <span
                    style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  >
                    {evt.msg ?? evt.event}
                  </span>
                </div>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {evt.time ? new Date(evt.time).toLocaleTimeString() : 'now'}
                </span>
              </div>

              {/* Event Metadata details */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {evt.fingerprint && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Fingerprint: </span>
                    <span className="mono" style={{ color: 'var(--accent-cyan)' }}>
                      {String(evt.fingerprint).slice(0, 18)}...
                    </span>
                  </div>
                )}
                {evt.command && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Command: </span>
                    <code style={{ color: 'var(--text-primary)' }}>{String(evt.command)}</code>
                  </div>
                )}
                {evt.matchCount !== undefined && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Matches: </span>
                    <strong style={{ color: 'var(--accent-emerald)' }}>{evt.matchCount}</strong>
                  </div>
                )}
                {Boolean(evt.id) && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Record ID: </span>
                    <span className="mono">{String(evt.id)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
