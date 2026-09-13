import { useState, useEffect, type ReactNode } from 'react';
import type {
  MemoryStats,
  MemoryRecordSummary,
  FullMemoryRecord,
  PendingApproval,
  LogEvent,
  ExplainabilityData,
  BenchmarkData,
} from './types.js';

import { OverviewScreen } from './components/OverviewScreen.js';
import { LiveFeedScreen } from './components/LiveFeedScreen.js';
import { RecordBrowserScreen } from './components/RecordBrowserScreen.js';
import { ExplainabilityScreen } from './components/ExplainabilityScreen.js';
import { ApprovalQueueScreen } from './components/ApprovalQueueScreen.js';
import { SecurityAuditScreen } from './components/SecurityAuditScreen.js';
import { BenchmarkScreen } from './components/BenchmarkScreen.js';

export default function App(): ReactNode {
  const [activeScreen, setActiveScreen] = useState<string>('overview');
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [records, setRecords] = useState<MemoryRecordSummary[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Initial data load
  useEffect(() => {
    fetchStats();
    fetchRecords();
    fetchApprovals();

    // Setup SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsStreaming(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data) as LogEvent;
          setEvents((prev) => [...prev, parsed].slice(-200));

          // Refresh stats or approvals if relevant event received
          if (parsed.event?.includes('record') || parsed.event?.includes('verify')) {
            fetchStats();
            fetchRecords();
            fetchApprovals();
          }
        } catch {
          // ignore non-json ping messages
        }
      };

      eventSource.onerror = () => {
        setIsStreaming(false);
      };
    } catch {
      setIsStreaming(false);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.warn('Failed to fetch stats from bridge:', e);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records?limit=100');
      if (res.ok) setRecords(await res.json());
    } catch (e) {
      console.warn('Failed to fetch records from bridge:', e);
    }
  };

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/pending-approvals');
      if (res.ok) setApprovals(await res.json());
    } catch (e) {
      console.warn('Failed to fetch approvals from bridge:', e);
    }
  };

  const handleFetchRecordDetail = async (id: string): Promise<FullMemoryRecord | null> => {
    try {
      const res = await fetch(`/api/records/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch record detail:', e);
    }
    return null;
  };

  const handleDecision = async (
    id: string,
    decision: 'approve' | 'deny',
    notes?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/approvals/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, operatorNotes: notes }),
      });
      if (res.ok) {
        await fetchApprovals();
        await fetchStats();
        return true;
      }
    } catch (e) {
      console.warn('Failed to submit decision:', e);
    }
    return false;
  };

  const handleFetchExplainability = async (): Promise<ExplainabilityData | null> => {
    try {
      const res = await fetch('/api/explainability');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch explainability data:', e);
    }
    return null;
  };

  const handleFetchAudit = async () => {
    try {
      const res = await fetch('/api/security-audit');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch audit data:', e);
    }
    return null;
  };

  const handleFetchBenchmarks = async (): Promise<BenchmarkData | null> => {
    try {
      const res = await fetch('/api/benchmarks/latest');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch benchmark data:', e);
    }
    return null;
  };

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
      <header className="top-nav">
        <div className="brand-section">
          <div className="brand-badge">⚡</div>
          <div>
            <div className="brand-title">Memory Console</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              agent-memory-mcp • Observability Dashboard
            </div>
          </div>
        </div>

        {/* Navigation Tabs for All 7 Screens */}
        <nav className="nav-links">
          <button
            className={`nav-tab ${activeScreen === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveScreen('overview')}
          >
            Overview
          </button>

          <button
            className={`nav-tab ${activeScreen === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveScreen('feed')}
          >
            Live Activity
            {events.length > 0 && <span className="nav-badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>{events.length}</span>}
          </button>

          <button
            className={`nav-tab ${activeScreen === 'records' ? 'active' : ''}`}
            onClick={() => setActiveScreen('records')}
          >
            Records
            {records.length > 0 && <span className="nav-badge gray">{records.length}</span>}
          </button>

          <button
            className={`nav-tab ${activeScreen === 'explain' ? 'active' : ''}`}
            onClick={() => setActiveScreen('explain')}
          >
            Explainability
          </button>

          <button
            className={`nav-tab ${activeScreen === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveScreen('approvals')}
          >
            Approval Queue
            {approvals.length > 0 && <span className="nav-badge warning">{approvals.length}</span>}
          </button>

          <button
            className={`nav-tab ${activeScreen === 'security' ? 'active' : ''}`}
            onClick={() => setActiveScreen('security')}
          >
            Security Audit
            {stats && stats.quarantinedCount > 0 && (
              <span className="nav-badge danger">{stats.quarantinedCount}</span>
            )}
          </button>

          <button
            className={`nav-tab ${activeScreen === 'benchmarks' ? 'active' : ''}`}
            onClick={() => setActiveScreen('benchmarks')}
          >
            Evaluation
          </button>
        </nav>

        {/* Connection status indicator */}
        <div className="status-badge">
          <span className="pulse-dot" style={{ background: isStreaming ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} />
          <span>{isStreaming ? '127.0.0.1:4321' : 'Reconnecting...'}</span>
        </div>
      </header>

      {/* Main Content View */}
      <main className="main-content">
        {activeScreen === 'overview' && (
          <OverviewScreen stats={stats} onNavigate={(screen) => setActiveScreen(screen)} />
        )}
        {activeScreen === 'feed' && (
          <LiveFeedScreen
            events={events}
            isStreaming={isStreaming}
            onClear={() => setEvents([])}
          />
        )}
        {activeScreen === 'records' && (
          <RecordBrowserScreen
            records={records}
            onFetchDetail={handleFetchRecordDetail}
          />
        )}
        {activeScreen === 'explain' && (
          <ExplainabilityScreen onFetchExplainability={handleFetchExplainability} />
        )}
        {activeScreen === 'approvals' && (
          <ApprovalQueueScreen
            approvals={approvals}
            onDecision={handleDecision}
          />
        )}
        {activeScreen === 'security' && (
          <SecurityAuditScreen onFetchAudit={handleFetchAudit} />
        )}
        {activeScreen === 'benchmarks' && (
          <BenchmarkScreen onFetchBenchmarks={handleFetchBenchmarks} />
        )}
      </main>
    </div>
  );
}
