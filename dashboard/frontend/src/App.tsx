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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('agent-memory-theme') as 'dark' | 'light') || 'dark';
  });

  const [activeScreen, setActiveScreen] = useState<string>('overview');
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [records, setRecords] = useState<MemoryRecordSummary[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Sync theme with document attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('agent-memory-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initial data load
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        await Promise.all([fetchStats(), fetchRecords(), fetchApprovals()]);
      } catch (err) {
        setFetchError('Failed to communicate with the local bridge server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();

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
    notes?: string,
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
      {/* Precision Top Navigation */}
      <header className="top-nav">
        <div className="brand-section">
          <div className="brand-icon-box" title="Agent Memory Observability Console">
            ⚡
          </div>
          <div className="brand-meta">
            <span className="brand-title">Memory Console</span>
            <span className="brand-subtitle mono">agent-memory-mcp • v0.1.0</span>
          </div>
        </div>

        {/* Segmented Navigation Tab Bar */}
        <nav className="nav-links" role="tablist" aria-label="Dashboard views">
          <button
            id="nav-tab-overview"
            role="tab"
            aria-selected={activeScreen === 'overview'}
            className={`nav-tab ${activeScreen === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveScreen('overview')}
          >
            Overview
          </button>

          <button
            id="nav-tab-feed"
            role="tab"
            aria-selected={activeScreen === 'feed'}
            className={`nav-tab ${activeScreen === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveScreen('feed')}
          >
            Live Activity
            {events.length > 0 && <span className="nav-badge cyan">{events.length}</span>}
          </button>

          <button
            id="nav-tab-records"
            role="tab"
            aria-selected={activeScreen === 'records'}
            className={`nav-tab ${activeScreen === 'records' ? 'active' : ''}`}
            onClick={() => setActiveScreen('records')}
          >
            Records
            {records.length > 0 && <span className="nav-badge gray">{records.length}</span>}
          </button>

          <button
            id="nav-tab-explain"
            role="tab"
            aria-selected={activeScreen === 'explain'}
            className={`nav-tab ${activeScreen === 'explain' ? 'active' : ''}`}
            onClick={() => setActiveScreen('explain')}
          >
            Explainability
          </button>

          <button
            id="nav-tab-approvals"
            role="tab"
            aria-selected={activeScreen === 'approvals'}
            className={`nav-tab ${activeScreen === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveScreen('approvals')}
          >
            Approval Queue
            {approvals.length > 0 && <span className="nav-badge warning">{approvals.length}</span>}
          </button>

          <button
            id="nav-tab-security"
            role="tab"
            aria-selected={activeScreen === 'security'}
            className={`nav-tab ${activeScreen === 'security' ? 'active' : ''}`}
            onClick={() => setActiveScreen('security')}
          >
            Security Audit
            {stats && stats.quarantinedCount > 0 && (
              <span className="nav-badge danger">{stats.quarantinedCount}</span>
            )}
          </button>

          <button
            id="nav-tab-benchmarks"
            role="tab"
            aria-selected={activeScreen === 'benchmarks'}
            className={`nav-tab ${activeScreen === 'benchmarks' ? 'active' : ''}`}
            onClick={() => setActiveScreen('benchmarks')}
          >
            Evaluation
          </button>
        </nav>

        {/* Nav Actions: Status Badge & Theme Switcher */}
        <div className="nav-actions">
          <div className="status-badge" title="SSE Bridge Pipeline Status">
            <span
              className="pulse-dot"
              style={{
                background: isStreaming ? 'var(--status-success)' : 'var(--status-warning)',
              }}
            />
            <span>{isStreaming ? '127.0.0.1:4321' : 'Reconnecting...'}</span>
          </div>

          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {/* Main Screen Content View */}
      <main className="main-content">
        {fetchError && (
          <div className="error-banner">
            <div>
              <strong>Connection Warning:</strong> {fetchError}
            </div>
            <button
              className="btn btn-outline"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => {
                fetchStats();
                fetchRecords();
                fetchApprovals();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {activeScreen === 'overview' && (
          <OverviewScreen
            stats={stats}
            isLoading={isLoading}
            onNavigate={(screen) => setActiveScreen(screen)}
          />
        )}
        {activeScreen === 'feed' && (
          <LiveFeedScreen events={events} isStreaming={isStreaming} onClear={() => setEvents([])} />
        )}
        {activeScreen === 'records' && (
          <RecordBrowserScreen
            records={records}
            isLoading={isLoading}
            onFetchDetail={handleFetchRecordDetail}
          />
        )}
        {activeScreen === 'explain' && (
          <ExplainabilityScreen onFetchExplainability={handleFetchExplainability} />
        )}
        {activeScreen === 'approvals' && (
          <ApprovalQueueScreen
            approvals={approvals}
            isLoading={isLoading}
            onDecision={handleDecision}
          />
        )}
        {activeScreen === 'security' && <SecurityAuditScreen onFetchAudit={handleFetchAudit} />}
        {activeScreen === 'benchmarks' && (
          <BenchmarkScreen onFetchBenchmarks={handleFetchBenchmarks} />
        )}
      </main>
    </div>
  );
}
