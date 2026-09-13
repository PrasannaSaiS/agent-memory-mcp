import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function ExplainabilityScreen({ onFetchExplainability }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        const res = await onFetchExplainability();
        if (res)
            setData(res);
    };
    const threshold = data?.threshold ?? 0.70;
    return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", children: [_jsx("h1", { className: "screen-title", children: "Retrieval Explainability" }), _jsx("p", { className: "screen-subtitle", children: "Transparent multi-factor ranking, fuzzy fallback evaluation, and stale-penalty scoring against the acceptance threshold." })] }), _jsx("div", { className: "panel", style: { background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.04))' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.78rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.35rem' }, children: "Active Diagnostic Query" }), _jsx("div", { className: "mono", style: { fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }, children: data?.query ?? 'npm run build' })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: '0.78rem', color: 'var(--text-muted)' }, children: "Retrieval Threshold" }), _jsxs("div", { style: { fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-amber)' }, children: [(threshold * 100).toFixed(0), "% (0.70)"] })] })] }) }), _jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h2", { className: "panel-title", children: "Candidate Fix Scoring vs. Acceptance Threshold" }), _jsx("span", { className: "badge cyan", children: "Conservative Ranking Engine" })] }), _jsx("p", { style: { fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }, children: "Scores combine Levenshtein similarity, Git commit provenance decay (0.8x), quarantine penalties (0.5x), and Wilson-score verification bounds." }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.25rem' }, children: data?.candidates.map((cand, idx) => {
                            const scorePercent = Math.min(100, Math.round(cand.trustScore * 100));
                            const passes = cand.trustScore >= threshold;
                            return (_jsxs("div", { style: {
                                    background: 'var(--bg-subtle)',
                                    padding: '1.25rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${passes ? 'var(--border-subtle)' : 'rgba(244, 63, 94, 0.2)'}`,
                                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }, children: [_jsx("span", { className: "mono", style: { fontWeight: 600, color: 'var(--accent-cyan)' }, children: cand.id }), _jsxs("span", { className: `badge ${cand.matchType === 'exact' ? 'emerald' : 'purple'}`, children: [cand.matchType.toUpperCase(), " MATCH"] }), cand.isQuarantined && _jsx("span", { className: "badge rose", children: "QUARANTINED (0.5x)" }), cand.isStale && _jsx("span", { className: "badge amber", children: "STALE (LOCKFILE MISMATCH)" })] }), _jsx("code", { style: { fontSize: '0.82rem', color: 'var(--text-primary)' }, children: cand.command })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { style: { fontSize: '1.2rem', fontWeight: 700, color: passes ? 'var(--accent-emerald)' : 'var(--accent-rose)' }, children: [(cand.trustScore * 100).toFixed(1), "%"] }), _jsx("span", { style: { fontSize: '0.75rem', color: passes ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }, children: passes ? '✓ ACCEPTED' : '✗ BELOW THRESHOLD' })] })] }), _jsxs("div", { style: { position: 'relative', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden', margin: '0.5rem 0' }, children: [_jsx("div", { style: {
                                                    height: '100%',
                                                    width: `${scorePercent}%`,
                                                    background: passes
                                                        ? cand.matchType === 'exact'
                                                            ? 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))'
                                                            : 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))'
                                                        : 'var(--accent-rose)',
                                                    borderRadius: '6px',
                                                    transition: 'width 0.4s ease',
                                                } }), _jsx("div", { style: {
                                                    position: 'absolute',
                                                    top: 0,
                                                    bottom: 0,
                                                    left: `${threshold * 100}%`,
                                                    width: '2px',
                                                    background: 'var(--accent-amber)',
                                                    boxShadow: '0 0 6px var(--accent-amber)',
                                                }, title: `Threshold: ${(threshold * 100).toFixed(0)}%` })] }), _jsxs("div", { style: { display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }, children: [_jsxs("div", { children: ["Repository Match:", ' ', _jsx("span", { style: { color: cand.passedFilters.repository ? 'var(--accent-emerald)' : 'var(--accent-rose)' }, children: cand.passedFilters.repository ? 'Passed ✓' : 'Failed ✗' })] }), _jsxs("div", { children: ["Command Family Match:", ' ', _jsx("span", { style: { color: cand.passedFilters.commandFamily ? 'var(--accent-emerald)' : 'var(--accent-rose)' }, children: cand.passedFilters.commandFamily ? 'Passed ✓' : 'Failed ✗' })] }), _jsxs("div", { children: ["Raw Similarity:", ' ', _jsxs("strong", { style: { color: 'var(--text-primary)' }, children: [(cand.similarityScore * 100).toFixed(1), "%"] })] })] })] }, idx));
                        }) })] }), _jsxs("div", { className: "panel", style: { borderLeft: '4px solid var(--accent-amber)' }, children: [_jsx("h3", { style: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '0.35rem' }, children: "Defensible Safety Invariant: No Silent Promotion" }), _jsx("p", { style: { fontSize: '0.88rem', color: 'var(--text-secondary)' }, children: "Fuzzy matches are never silently promoted to \"known fixes.\" Every retrieved record surfaces its exact matchType, raw similarity, provenance decay, and quarantine status directly into the prompt sanitization envelope." })] })] }));
}
