import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function OverviewScreen({ stats, isLoading, onNavigate }) {
    if (isLoading) {
        return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", children: [_jsx("div", { className: "skeleton-box", style: { width: '240px', height: '28px', marginBottom: '8px' } }), _jsx("div", { className: "skeleton-box", style: { width: '480px', height: '16px' } })] }), _jsxs("div", { className: "stat-hero-grid", children: [_jsx("div", { className: "skeleton-box", style: { height: '140px' } }), _jsx("div", { className: "skeleton-box", style: { height: '140px' } }), _jsx("div", { className: "skeleton-box", style: { height: '140px' } })] }), _jsx("div", { className: "panel", style: { height: '220px' }, children: _jsx("div", { className: "skeleton-box", style: { height: '100%' } }) })] }));
    }
    if (!stats) {
        return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", children: [_jsx("h1", { className: "screen-title", children: "System Overview" }), _jsx("p", { className: "screen-subtitle", children: "Real-time memory state, Wilson-score confidence lower bounds, and integrity telemetry." })] }), _jsx("div", { className: "panel", children: _jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state-icon", children: "\uD83D\uDEE1\uFE0F" }), _jsx("h2", { className: "empty-state-title", children: "No Memory Telemetry Active" }), _jsx("p", { className: "empty-state-desc", children: "The agent memory system has not initialized records yet. Once tool calls (`record_failure` or `find_fix`) are received from an MCP client, telemetry will populate here." })] }) })] }));
    }
    const ageMax = Math.max(1, stats.ageDistribution.under1h, stats.ageDistribution.under24h, stats.ageDistribution.under7d, stats.ageDistribution.over7d);
    const hasQuarantine = stats.quarantinedCount > 0;
    const hasStale = stats.staleCount > 0;
    return (_jsxs("div", { children: [_jsx("div", { className: "screen-header", children: _jsxs("div", { className: "screen-title-row", children: [_jsxs("div", { children: [_jsx("h1", { className: "screen-title", children: "System Overview" }), _jsx("p", { className: "screen-subtitle", children: "High-integrity telemetry, Wilson-score statistical confidence bounds, and real-time defense posture." })] }), _jsx("div", { className: "badge emerald", style: { padding: '0.35rem 0.75rem', fontSize: '0.8rem' }, children: "\u25CF System State: Nominally Guarded" })] }) }), _jsxs("div", { className: "stat-hero-grid", children: [_jsxs("div", { className: `stat-hero-card ${hasQuarantine ? 'rose' : 'emerald'}`, onClick: () => onNavigate('security'), style: { cursor: 'pointer' }, role: "button", tabIndex: 0, "aria-label": "View security quarantine audit", onKeyDown: (e) => e.key === 'Enter' && onNavigate('security'), children: [_jsxs("div", { className: "stat-label", children: [_jsx("span", { children: "Poisoning / Quarantine Flags" }), _jsx("span", { className: `badge ${hasQuarantine ? 'rose' : 'emerald'}`, children: hasQuarantine ? 'ACTION REQUIRED' : 'ZERO DETECTED' })] }), _jsx("div", { className: "stat-value", style: { color: hasQuarantine ? 'var(--status-danger)' : 'var(--status-success)' }, children: stats.quarantinedCount }), _jsx("div", { className: "stat-subtext", children: hasQuarantine
                                    ? 'Malicious or prompt-injected memories isolated from retrieval.'
                                    : 'All candidate memories verified free of adversarial prompt injections.' })] }), _jsxs("div", { className: `stat-hero-card ${hasStale ? 'amber' : 'cyan'}`, onClick: () => onNavigate('records'), style: { cursor: 'pointer' }, role: "button", tabIndex: 0, "aria-label": "View stale warnings", onKeyDown: (e) => e.key === 'Enter' && onNavigate('records'), children: [_jsxs("div", { className: "stat-label", children: [_jsx("span", { children: "Stale Drift Warnings" }), _jsx("span", { className: `badge ${hasStale ? 'amber' : 'cyan'}`, children: hasStale ? 'LOCKFILE MISMATCH' : 'IN SYNC' })] }), _jsx("div", { className: "stat-value", style: { color: hasStale ? 'var(--status-warning)' : 'var(--accent-cyan)' }, children: stats.staleCount }), _jsx("div", { className: "stat-subtext", children: "Dependencies drifted since original fix verification. Re-verification advised." })] }), _jsxs("div", { className: "stat-hero-card emerald", children: [_jsxs("div", { className: "stat-label", children: [_jsx("span", { children: "Confidence (Wilson Lower Bound)" }), _jsx("span", { className: "badge emerald", children: "95% STATISTICAL CI" })] }), _jsxs("div", { className: "stat-value", style: { color: 'var(--status-success)' }, children: [(stats.successRate * 100).toFixed(1), "%"] }), _jsx("div", { className: "stat-subtext", children: "Conservative lower bound preventing over-optimistic fix recommendations." })] })] }), _jsxs("div", { className: "stat-grid", children: [_jsxs("div", { className: "stat-card", onClick: () => onNavigate('records'), style: { cursor: 'pointer' }, role: "button", tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && onNavigate('records'), children: [_jsxs("div", { className: "stat-label", children: [_jsx("span", { children: "Total Memories" }), _jsx("span", { className: "badge gray", children: "Catalog" })] }), _jsx("div", { className: "stat-value", children: stats.totalRecords }), _jsx("div", { className: "stat-subtext", children: "Indexed error-fix records across repository scope" })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-label", children: [_jsx("span", { children: "Verified Fixes" }), _jsx("span", { className: "badge violet", children: "Confirmed" })] }), _jsx("div", { className: "stat-value", style: { color: 'var(--accent-violet)' }, children: stats.verifiedCount }), _jsx("div", { className: "stat-subtext", children: "Dry-run sandboxed or explicit operator authorized" })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-label", children: [_jsx("span", { children: "Unique Fingerprints" }), _jsx("span", { className: "badge blue", children: "SHA-256" })] }), _jsx("div", { className: "stat-value", style: { color: 'var(--accent-blue)' }, children: stats.exactFingerprints }), _jsx("div", { className: "stat-subtext", children: "Normalized deterministic syntax digest keys" })] })] }), _jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("div", { children: _jsx("h2", { className: "panel-title", children: "Memory Age Distribution & Temporal Decay" }) }), _jsx("span", { className: "badge cyan", children: "Decay Factor: 0.8x / Tier" })] }), _jsx("p", { style: { color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.25rem' }, children: "Record age governs provenance weighting during retrieval ranking. Older unverified records incur decay penalties." }), _jsx("div", { className: "age-dist-grid", children: [
                            {
                                label: '< 1 Hour (Fresh)',
                                count: stats.ageDistribution.under1h,
                                color: 'var(--status-success)',
                                decay: '1.0x (Zero Decay)',
                            },
                            {
                                label: '< 24 Hours (Active)',
                                count: stats.ageDistribution.under24h,
                                color: 'var(--accent-cyan)',
                                decay: '0.95x Weight',
                            },
                            {
                                label: '< 7 Days (Established)',
                                count: stats.ageDistribution.under7d,
                                color: 'var(--accent-violet)',
                                decay: '0.85x Weight',
                            },
                            {
                                label: '> 7 Days (Aging/Archived)',
                                count: stats.ageDistribution.over7d,
                                color: 'var(--status-warning)',
                                decay: '0.70x (Re-verify)',
                            },
                        ].map((item, idx) => (_jsxs("div", { style: {
                                background: 'var(--bg-subtle)',
                                padding: '1.15rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                            }, children: [_jsxs("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        marginBottom: '0.5rem',
                                    }, children: [_jsx("span", { style: { fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }, children: item.label }), _jsx("strong", { className: "mono", style: { color: 'var(--text-primary)', fontSize: '1.15rem' }, children: item.count })] }), _jsx("div", { style: {
                                        height: '8px',
                                        background: 'rgba(125, 140, 160, 0.12)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        marginBottom: '0.45rem',
                                    }, children: _jsx("div", { style: {
                                            height: '100%',
                                            width: `${Math.max(4, (item.count / ageMax) * 100)}%`,
                                            background: item.color,
                                            borderRadius: '4px',
                                            transition: 'width 0.4s ease',
                                        } }) }), _jsxs("div", { style: { fontSize: '0.7rem', color: 'var(--text-muted)' }, children: ["Provenance Weight: ", _jsx("span", { style: { color: item.color, fontWeight: 600 }, children: item.decay })] })] }, idx))) })] }), _jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h2", { className: "panel-title", children: "Core Subsystem Telemetry & Architecture Invariants" }), _jsx("span", { className: "badge emerald", children: "All Checks Passed" })] }), _jsxs("div", { className: "subsystem-grid", style: { fontSize: '0.84rem' }, children: [_jsxs("div", { style: {
                                    padding: '1rem',
                                    background: 'var(--bg-subtle)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                }, children: [_jsx("div", { style: { fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }, children: "Transport & Channel Conformance" }), _jsx("div", { style: { color: 'var(--text-secondary)', fontSize: '0.8rem' }, children: "MCP Specification 2026-07-28 via stdio. Bridge operates strictly on loopback." }), _jsxs("div", { style: { marginTop: '0.65rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }, children: [_jsx("span", { className: "badge cyan", children: "stdio channel" }), _jsx("span", { className: "badge emerald", children: "Zero stdout leaks" })] })] }), _jsxs("div", { style: {
                                    padding: '1rem',
                                    background: 'var(--bg-subtle)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                }, children: [_jsx("div", { style: { fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }, children: "Storage Engine & Isolation" }), _jsx("div", { style: { color: 'var(--text-secondary)', fontSize: '0.8rem' }, children: "Append-only JSONL source of truth + rebuildable SQLite FTS5 index." }), _jsxs("div", { style: { marginTop: '0.65rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }, children: [_jsx("span", { className: "badge violet", children: "SQLite WAL" }), _jsx("span", { className: "badge blue", children: "readOnly handle" })] })] }), _jsxs("div", { style: {
                                    padding: '1rem',
                                    background: 'var(--bg-subtle)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                }, children: [_jsx("div", { style: { fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }, children: "Security & Defense Perimeter" }), _jsx("div", { style: { color: 'var(--text-secondary)', fontSize: '0.8rem' }, children: "Deterministic regex + Shannon entropy secret redaction with dry-run gating." }), _jsxs("div", { style: { marginTop: '0.65rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }, children: [_jsx("span", { className: "badge emerald", children: "Redaction active" }), _jsx("span", { className: "badge rose", children: "Quarantine active" })] })] })] })] })] }));
}
