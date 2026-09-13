import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
export function LiveFeedScreen({ events, isStreaming, onClear }) {
    const [filter, setFilter] = useState('all');
    const [autoScroll, setAutoScroll] = useState(true);
    const bottomRef = useRef(null);
    useEffect(() => {
        if (autoScroll && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [events, autoScroll]);
    const filteredEvents = events.filter((e) => {
        if (filter === 'all')
            return true;
        if (filter === 'record')
            return e.event?.includes('record');
        if (filter === 'find')
            return e.event?.includes('find');
        if (filter === 'verify')
            return e.event?.includes('verify');
        if (filter === 'quarantine')
            return e.quarantined || e.status?.includes('quarantine');
        return true;
    });
    const getEventBadge = (event, quarantined) => {
        if (quarantined)
            return _jsx("span", { className: "badge rose", children: "QUARANTINED" });
        if (!event)
            return _jsx("span", { className: "badge gray", children: "INFO" });
        if (event.includes('record'))
            return _jsx("span", { className: "badge emerald", children: "RECORD_FAILURE" });
        if (event.includes('find'))
            return _jsx("span", { className: "badge cyan", children: "FIND_FIX" });
        if (event.includes('verify'))
            return _jsx("span", { className: "badge purple", children: "VERIFY_FIX" });
        return _jsx("span", { className: "badge gray", children: event.toUpperCase() });
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { children: [_jsx("h1", { className: "screen-title", children: "Live Activity Feed" }), _jsx("p", { className: "screen-subtitle", children: "Real-time SSE event pipeline streaming MCP tool calls, fingerprinting, and retrieval decisions." })] }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem', alignItems: 'center' }, children: [_jsxs("div", { className: "status-badge", children: [_jsx("span", { className: "pulse-dot", style: { background: isStreaming ? 'var(--accent-emerald)' : 'var(--accent-rose)' } }), isStreaming ? 'SSE Active' : 'Disconnected'] }), _jsx("button", { className: `btn ${autoScroll ? 'btn-primary' : 'btn-outline'}`, onClick: () => setAutoScroll(!autoScroll), children: autoScroll ? 'Auto-scroll ON' : 'Auto-scroll PAUSED' }), _jsx("button", { className: "btn btn-outline", onClick: onClear, children: "Clear" })] })] }), _jsx("div", { style: { display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }, children: [
                    { id: 'all', label: `All Events (${events.length})` },
                    { id: 'record', label: 'Record Failure' },
                    { id: 'find', label: 'Find Fix' },
                    { id: 'verify', label: 'Verify Fix' },
                    { id: 'quarantine', label: 'Quarantine Alerts' },
                ].map((tab) => (_jsx("button", { className: `nav-tab ${filter === tab.id ? 'active' : ''}`, onClick: () => setFilter(tab.id), style: { background: filter === tab.id ? 'var(--bg-card)' : 'transparent' }, children: tab.label }, tab.id))) }), _jsxs("div", { className: "panel", style: {
                    height: '650px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    padding: '1.25rem',
                    background: '#090d16',
                }, children: [filteredEvents.length === 0 ? (_jsxs("div", { style: { margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }, children: [_jsx("p", { style: { fontSize: '1.1rem', marginBottom: '0.5rem' }, children: "No activity captured yet" }), _jsx("p", { style: { fontSize: '0.85rem' }, children: "MCP server calls and log writes to logs.jsonl will stream here in real time." })] })) : (filteredEvents.map((evt, idx) => (_jsxs("div", { style: {
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
                        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.65rem' }, children: [getEventBadge(evt.event, evt.quarantined), _jsx("span", { style: { fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }, children: evt.msg ?? evt.event })] }), _jsx("span", { className: "mono", style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: evt.time ? new Date(evt.time).toLocaleTimeString() : 'now' })] }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }, children: [evt.fingerprint && (_jsxs("div", { children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Fingerprint: " }), _jsxs("span", { className: "mono", style: { color: 'var(--accent-cyan)' }, children: [String(evt.fingerprint).slice(0, 18), "..."] })] })), evt.command && (_jsxs("div", { children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Command: " }), _jsx("code", { style: { color: 'var(--text-primary)' }, children: String(evt.command) })] })), evt.matchCount !== undefined && (_jsxs("div", { children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Matches: " }), _jsx("strong", { style: { color: 'var(--accent-emerald)' }, children: evt.matchCount })] })), Boolean(evt.id) && (_jsxs("div", { children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Record ID: " }), _jsx("span", { className: "mono", children: String(evt.id) })] }))] })] }, idx)))), _jsx("div", { ref: bottomRef })] })] }));
}
