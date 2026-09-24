import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { LogEvent } from '../types.js';

interface Props {
  events: LogEvent[];
  isStreaming: boolean;
  onClear: () => void;
}

export function LiveFeedScreen({ events, isStreaming, onClear }: Props): ReactNode {
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'record') return e.event?.includes('record');
    if (filter === 'find') return e.event?.includes('find');
    if (filter === 'verify') return e.event?.includes('verify');
    if (filter === 'quarantine') return e.quarantined || e.status?.includes('quarantine');
    return true;
  });

  const virtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => feedRef.current,
    estimateSize: () => 110,
    overscan: 10,
  });

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      const last = filteredEvents.length - 1;
      if (last >= 0) {
        const item = virtualizer.getVirtualItems().at(-1);
        if (item) {
          feedRef.current.scrollTo({ top: item.start + item.size, behavior: 'smooth' });
        }
      }
    }
  }, [autoScroll, filteredEvents.length, virtualizer]);

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

          <div className="feed-header-controls">
            <div className="status-badge">
              <span
                className="pulse-dot"
                style={{ background: isStreaming ? 'var(--status-success)' : 'var(--status-danger)' }}
              />
              <span>{isStreaming ? 'SSE Active (Streaming)' : 'Disconnected'}</span>
            </div>

            <button
              className={`btn btn-outline ${autoScroll ? 'active' : ''}`}
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

      <div className="feed-filter-bar">
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

      <div className="panel feed-panel">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <h2 className="empty-state-title">Awaiting Live Telemetry</h2>
            <p className="empty-state-desc">
              Events stream in real time over SSE when an AI agent calls tools (record_failure, find_fix, or verify_fix).
            </p>
          </div>
        ) : (
          <div ref={feedRef} className="feed-scroll" style={{ height: '620px', overflow: 'auto' }}>
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const evt = filteredEvents[virtualRow.index];
                const { typeClass, badge } = getToolCallTheme(evt);

                return (
                  <div
                    key={`${evt.time ?? virtualRow.index}-${virtualRow.index}`}
                    className={`feed-item ${typeClass}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
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

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {evt.command && (
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>cmd: </span>
                          <code style={{ color: 'var(--text-primary)' }}>{String(evt.command)}</code>
                        </div>
                      )}

                      {evt.fingerprint && (
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>fp: </span>
                          <span className="mono" style={{ color: 'var(--accent)' }}>{String(evt.fingerprint).slice(0, 16)}…</span>
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

                      {evt.quarantined && <span className="badge rose" style={{ fontSize: '0.68rem' }}>BLOCKED</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
