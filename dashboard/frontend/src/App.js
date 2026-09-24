import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { OverviewScreen } from './components/OverviewScreen.js';
import { LiveFeedScreen } from './components/LiveFeedScreen.js';
import { RecordBrowserScreen } from './components/RecordBrowserScreen.js';
import { ExplainabilityScreen } from './components/ExplainabilityScreen.js';
import { ApprovalQueueScreen } from './components/ApprovalQueueScreen.js';
import { SecurityAuditScreen } from './components/SecurityAuditScreen.js';
import { BenchmarkScreen } from './components/BenchmarkScreen.js';
const screens = [
    { key: 'overview', label: 'Overview' },
    { key: 'feed', label: 'Live Activity' },
    { key: 'records', label: 'Records' },
    { key: 'explain', label: 'Explainability' },
    { key: 'approvals', label: 'Approval Queue' },
    { key: 'security', label: 'Security Audit' },
    { key: 'benchmarks', label: 'Evaluation' },
];
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsx(DashboardShell, {}) }));
}
function DashboardShell() {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('agent-memory-theme') || 'dark';
    });
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [events, setEvents] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const activeScreen = location.pathname.replace('/', '') || 'overview';
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('agent-memory-theme', theme);
    }, [theme]);
    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname]);
    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                await Promise.all([fetchStats(), fetchRecords(), fetchApprovals()]);
            }
            catch {
                setFetchError('Failed to communicate with the local bridge server.');
            }
            finally {
                setIsLoading(false);
            }
        };
        loadAll();
        let eventSource = null;
        try {
            eventSource = new EventSource('/api/events');
            eventSource.onopen = () => setIsStreaming(true);
            eventSource.onmessage = (e) => {
                try {
                    const parsed = JSON.parse(e.data);
                    setEvents((prev) => [...prev, parsed].slice(-200));
                    if (parsed.event?.includes('record') || parsed.event?.includes('verify')) {
                        void fetchStats();
                        void fetchRecords();
                        void fetchApprovals();
                    }
                }
                catch {
                    // ignore non-json ping or keepalive messages
                }
            };
            eventSource.onerror = () => setIsStreaming(false);
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
    const handleFetchExplainability = async (query) => {
        try {
            const url = query ? `/api/explainability?query=${encodeURIComponent(query)}` : '/api/explainability';
            const res = await fetch(url);
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
    const routeTo = (screen) => {
        navigate(`/${screen}`);
    };
    return (_jsxs("div", { className: "app-container", children: [_jsx("button", { className: "mobile-nav-toggle", type: "button", "aria-label": "Toggle navigation", onClick: () => setMobileNavOpen((prev) => !prev), children: "\u2630" }), _jsx("div", { className: `nav-overlay ${mobileNavOpen ? 'open' : ''}`, onClick: () => setMobileNavOpen(false) }), _jsxs("aside", { className: `side-nav ${mobileNavOpen ? 'open' : ''}`, children: [_jsxs("div", { className: "brand-section", children: [_jsx("div", { className: "brand-icon-box", title: "Agent Memory Observability Console", children: "\u26A1" }), _jsxs("div", { className: "brand-meta", children: [_jsx("span", { className: "brand-title", children: "Memory Console" }), _jsx("span", { className: "brand-subtitle mono", children: "agent-memory-mcp \u2022 v0.1.0" })] })] }), _jsx("nav", { className: "nav-links", role: "tablist", "aria-label": "Dashboard views", children: screens.map((item) => {
                            const isActive = activeScreen === item.key;
                            const badgeCount = item.key === 'feed'
                                ? events.length
                                : item.key === 'records'
                                    ? records.length
                                    : item.key === 'approvals'
                                        ? approvals.length
                                        : item.key === 'security'
                                            ? stats?.quarantinedCount ?? 0
                                            : 0;
                            return (_jsxs("button", { id: `nav-tab-${item.key}`, role: "tab", "aria-selected": isActive, className: `nav-tab ${isActive ? 'active' : ''}`, onClick: () => routeTo(item.key), children: [item.label, badgeCount > 0 && (_jsx("span", { className: `nav-badge ${item.key === 'approvals'
                                            ? 'warning'
                                            : item.key === 'security'
                                                ? 'danger'
                                                : item.key === 'feed'
                                                    ? 'cyan'
                                                    : item.key === 'records'
                                                        ? 'gray'
                                                        : ''}`, children: badgeCount }))] }, item.key));
                        }) }), _jsxs("div", { className: "nav-actions", children: [_jsxs("div", { className: "status-badge", title: "SSE Bridge Pipeline Status", children: [_jsx("span", { className: "pulse-dot", style: {
                                            background: isStreaming ? 'var(--status-success)' : 'var(--status-warning)',
                                        } }), _jsx("span", { children: isStreaming ? '127.0.0.1:4321' : 'Reconnecting...' })] }), _jsx("button", { className: "theme-toggle-btn", onClick: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')), title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, "aria-label": "Toggle visual theme", children: theme === 'dark' ? '☀' : '☾' })] })] }), _jsxs("main", { className: "main-content", children: [fetchError && (_jsxs("div", { className: "error-banner", children: [_jsxs("div", { children: [_jsx("strong", { children: "Connection Warning:" }), " ", fetchError] }), _jsx("button", { className: "btn btn-outline", style: { padding: '0.25rem 0.6rem', fontSize: '0.75rem' }, onClick: () => {
                                    void fetchStats();
                                    void fetchRecords();
                                    void fetchApprovals();
                                }, children: "Retry" })] })), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/overview", replace: true }) }), _jsx(Route, { path: "/overview", element: _jsx(OverviewScreen, { stats: stats, isLoading: isLoading, onNavigate: routeTo }) }), _jsx(Route, { path: "/feed", element: _jsx(LiveFeedScreen, { events: events, isStreaming: isStreaming, onClear: () => setEvents([]) }) }), _jsx(Route, { path: "/records", element: _jsx(RecordBrowserScreen, { records: records, isLoading: isLoading, onFetchDetail: handleFetchRecordDetail }) }), _jsx(Route, { path: "/explain", element: _jsx(ExplainabilityScreen, { onFetchExplainability: handleFetchExplainability }) }), _jsx(Route, { path: "/approvals", element: _jsx(ApprovalQueueScreen, { approvals: approvals, isLoading: isLoading, onDecision: handleDecision }) }), _jsx(Route, { path: "/security", element: _jsx(SecurityAuditScreen, { onFetchAudit: handleFetchAudit }) }), _jsx(Route, { path: "/benchmarks", element: _jsx(BenchmarkScreen, { onFetchBenchmarks: handleFetchBenchmarks }) })] })] })] }));
}
