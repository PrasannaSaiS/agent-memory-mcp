import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { OverviewScreen } from './components/OverviewScreen.js';
import { LiveFeedScreen } from './components/LiveFeedScreen.js';
import { RecordBrowserScreen } from './components/RecordBrowserScreen.js';
import { ExplainabilityScreen } from './components/ExplainabilityScreen.js';
import { ApprovalQueueScreen } from './components/ApprovalQueueScreen.js';
import { SecurityAuditScreen } from './components/SecurityAuditScreen.js';
import { BenchmarkScreen } from './components/BenchmarkScreen.js';
export default function App() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('agent-memory-theme') || 'dark';
    });
    const [activeScreen, setActiveScreen] = useState('overview');
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [events, setEvents] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
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
            }
            catch (err) {
                setFetchError('Failed to communicate with the local bridge server.');
            }
            finally {
                setIsLoading(false);
            }
        };
        loadAll();
        // Setup SSE connection
        let eventSource = null;
        try {
            eventSource = new EventSource('/api/events');
            eventSource.onopen = () => {
                setIsStreaming(true);
            };
            eventSource.onmessage = (e) => {
                try {
                    const parsed = JSON.parse(e.data);
                    setEvents((prev) => [...prev, parsed].slice(-200));
                    if (parsed.event?.includes('record') || parsed.event?.includes('verify')) {
                        fetchStats();
                        fetchRecords();
                        fetchApprovals();
                    }
                }
                catch {
                    // ignore non-json ping messages
                }
            };
            eventSource.onerror = () => {
                setIsStreaming(false);
            };
        }
        catch {
            setIsStreaming(false);
        }
        return () => {
            eventSource?.close();
        };
    }, []);
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats');
            if (res.ok)
                setStats(await res.json());
        }
        catch (e) {
            console.warn('Failed to fetch stats from bridge:', e);
        }
    };
    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/records?limit=100');
            if (res.ok)
                setRecords(await res.json());
        }
        catch (e) {
            console.warn('Failed to fetch records from bridge:', e);
        }
    };
    const fetchApprovals = async () => {
        try {
            const res = await fetch('/api/pending-approvals');
            if (res.ok)
                setApprovals(await res.json());
        }
        catch (e) {
            console.warn('Failed to fetch approvals from bridge:', e);
        }
    };
    const handleFetchRecordDetail = async (id) => {
        try {
            const res = await fetch(`/api/records/${id}`);
            if (res.ok)
                return await res.json();
        }
        catch (e) {
            console.warn('Failed to fetch record detail:', e);
        }
        return null;
    };
    const handleDecision = async (id, decision, notes) => {
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
        }
        catch (e) {
            console.warn('Failed to submit decision:', e);
        }
        return false;
    };
    const handleFetchExplainability = async () => {
        try {
            const res = await fetch('/api/explainability');
            if (res.ok)
                return await res.json();
        }
        catch (e) {
            console.warn('Failed to fetch explainability data:', e);
        }
        return null;
    };
    const handleFetchAudit = async () => {
        try {
            const res = await fetch('/api/security-audit');
            if (res.ok)
                return await res.json();
        }
        catch (e) {
            console.warn('Failed to fetch audit data:', e);
        }
        return null;
    };
    const handleFetchBenchmarks = async () => {
        try {
            const res = await fetch('/api/benchmarks/latest');
            if (res.ok)
                return await res.json();
        }
        catch (e) {
            console.warn('Failed to fetch benchmark data:', e);
        }
        return null;
    };
    return (_jsxs("div", { className: "app-container", children: [_jsxs("header", { className: "top-nav", children: [_jsxs("div", { className: "brand-section", children: [_jsx("div", { className: "brand-icon-box", title: "Agent Memory Observability Console", children: "\u26A1" }), _jsxs("div", { className: "brand-meta", children: [_jsx("span", { className: "brand-title", children: "Memory Console" }), _jsx("span", { className: "brand-subtitle mono", children: "agent-memory-mcp \u2022 v0.1.0" })] })] }), _jsxs("nav", { className: "nav-links", role: "tablist", "aria-label": "Dashboard views", children: [_jsx("button", { id: "nav-tab-overview", role: "tab", "aria-selected": activeScreen === 'overview', className: `nav-tab ${activeScreen === 'overview' ? 'active' : ''}`, onClick: () => setActiveScreen('overview'), children: "Overview" }), _jsxs("button", { id: "nav-tab-feed", role: "tab", "aria-selected": activeScreen === 'feed', className: `nav-tab ${activeScreen === 'feed' ? 'active' : ''}`, onClick: () => setActiveScreen('feed'), children: ["Live Activity", events.length > 0 && _jsx("span", { className: "nav-badge cyan", children: events.length })] }), _jsxs("button", { id: "nav-tab-records", role: "tab", "aria-selected": activeScreen === 'records', className: `nav-tab ${activeScreen === 'records' ? 'active' : ''}`, onClick: () => setActiveScreen('records'), children: ["Records", records.length > 0 && _jsx("span", { className: "nav-badge gray", children: records.length })] }), _jsx("button", { id: "nav-tab-explain", role: "tab", "aria-selected": activeScreen === 'explain', className: `nav-tab ${activeScreen === 'explain' ? 'active' : ''}`, onClick: () => setActiveScreen('explain'), children: "Explainability" }), _jsxs("button", { id: "nav-tab-approvals", role: "tab", "aria-selected": activeScreen === 'approvals', className: `nav-tab ${activeScreen === 'approvals' ? 'active' : ''}`, onClick: () => setActiveScreen('approvals'), children: ["Approval Queue", approvals.length > 0 && _jsx("span", { className: "nav-badge warning", children: approvals.length })] }), _jsxs("button", { id: "nav-tab-security", role: "tab", "aria-selected": activeScreen === 'security', className: `nav-tab ${activeScreen === 'security' ? 'active' : ''}`, onClick: () => setActiveScreen('security'), children: ["Security Audit", stats && stats.quarantinedCount > 0 && (_jsx("span", { className: "nav-badge danger", children: stats.quarantinedCount }))] }), _jsx("button", { id: "nav-tab-benchmarks", role: "tab", "aria-selected": activeScreen === 'benchmarks', className: `nav-tab ${activeScreen === 'benchmarks' ? 'active' : ''}`, onClick: () => setActiveScreen('benchmarks'), children: "Evaluation" })] }), _jsxs("div", { className: "nav-actions", children: [_jsxs("div", { className: "status-badge", title: "SSE Bridge Pipeline Status", children: [_jsx("span", { className: "pulse-dot", style: {
                                            background: isStreaming ? 'var(--status-success)' : 'var(--status-warning)',
                                        } }), _jsx("span", { children: isStreaming ? '127.0.0.1:4321' : 'Reconnecting...' })] }), _jsx("button", { className: "theme-toggle-btn", onClick: toggleTheme, title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, "aria-label": "Toggle visual theme", children: theme === 'dark' ? '☀' : '☾' })] })] }), _jsxs("main", { className: "main-content", children: [fetchError && (_jsxs("div", { className: "error-banner", children: [_jsxs("div", { children: [_jsx("strong", { children: "Connection Warning:" }), " ", fetchError] }), _jsx("button", { className: "btn btn-outline", style: { padding: '0.25rem 0.6rem', fontSize: '0.75rem' }, onClick: () => {
                                    fetchStats();
                                    fetchRecords();
                                    fetchApprovals();
                                }, children: "Retry" })] })), activeScreen === 'overview' && (_jsx(OverviewScreen, { stats: stats, isLoading: isLoading, onNavigate: (screen) => setActiveScreen(screen) })), activeScreen === 'feed' && (_jsx(LiveFeedScreen, { events: events, isStreaming: isStreaming, onClear: () => setEvents([]) })), activeScreen === 'records' && (_jsx(RecordBrowserScreen, { records: records, isLoading: isLoading, onFetchDetail: handleFetchRecordDetail })), activeScreen === 'explain' && (_jsx(ExplainabilityScreen, { onFetchExplainability: handleFetchExplainability })), activeScreen === 'approvals' && (_jsx(ApprovalQueueScreen, { approvals: approvals, isLoading: isLoading, onDecision: handleDecision })), activeScreen === 'security' && _jsx(SecurityAuditScreen, { onFetchAudit: handleFetchAudit }), activeScreen === 'benchmarks' && (_jsx(BenchmarkScreen, { onFetchBenchmarks: handleFetchBenchmarks }))] })] }));
}
