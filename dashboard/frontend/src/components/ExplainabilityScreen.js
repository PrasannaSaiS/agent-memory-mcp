import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function ExplainabilityScreen({ onFetchExplainability }) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await onFetchExplainability();
            if (res)
                setData(res);
        }
        finally {
            setIsLoading(false);
        }
    };
    const threshold = data?.threshold ?? 0.7;
    if (isLoading) {
        return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", children: [_jsxs("div", { className: "explainability-loading", role: "status", "aria-live": "polite", children: [_jsx("span", { className: "explainability-loading-spinner", "aria-hidden": "true" }), _jsx("span", { children: "Loading retrieval explanation\u2026" })] }), _jsx("div", { className: "skeleton-box", style: { width: '280px', height: '28px', marginBottom: '8px' } }), _jsx("div", { className: "skeleton-box", style: { width: '520px', height: '16px' } })] }), _jsx("div", { className: "panel", style: { height: '120px' }, children: _jsx("div", { className: "skeleton-box", style: { height: '100%' } }) }), _jsx("div", { className: "panel", style: { height: '400px' }, children: _jsx("div", { className: "skeleton-box", style: { height: '100%' } }) })] }));
    }
    return (_jsxs("div", { children: [_jsx("div", { className: "screen-header", children: _jsxs("div", { className: "screen-title-row", children: [_jsxs("div", { children: [_jsx("h1", { className: "screen-title", children: "Retrieval Explainability" }), _jsx("p", { className: "screen-subtitle", children: "Transparent multi-factor ranking, fuzzy fallback evaluation, and stale-penalty scoring against the acceptance threshold." })] }), _jsx("div", { className: "badge cyan", style: { padding: '0.35rem 0.75rem', fontSize: '0.8rem' }, children: "Deterministic Scoring Engine" })] }) }), _jsx("div", { className: "panel", style: {
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(37, 99, 235, 0.04))',
                    borderColor: 'var(--border-subtle)',
                }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: {
                                        fontSize: '0.72rem',
                                        color: 'var(--accent-cyan)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        fontWeight: 700,
                                        marginBottom: '0.25rem',
                                    }, children: "Active Diagnostic Evaluation Query" }), _jsx("div", { className: "mono", style: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }, children: data?.query ?? 'npm run build' }), _jsx("div", { style: { fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }, children: "Normalized compiler & build script exit failure" })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Retrieval Acceptance Threshold (\u03C4)" }), _jsxs("div", { className: "mono", style: { fontSize: '1.45rem', fontWeight: 700, color: 'var(--status-warning)' }, children: [(threshold * 100).toFixed(0), "% (0.70)"] }), _jsx("span", { className: "badge amber", style: { fontSize: '0.68rem' }, children: "CONSERVATIVE BOUND" })] })] }) }), _jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("div", { children: _jsx("h2", { className: "panel-title", children: "Candidate Fix Scoring vs. Acceptance Threshold" }) }), _jsx("span", { className: "badge cyan", children: "Levenshtein + Wilson + Provenance" })] }), _jsxs("p", { style: { fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.35rem' }, children: ["Composite score formula: ", _jsx("code", { className: "mono", style: { color: 'var(--accent-cyan)' }, children: "S = Similarity \u00D7 ProvenanceDecay(0.8x) \u00D7 Quarantine(0.5x) \u00D7 WilsonBound" }), ". Candidates below \u03C4 = 0.70 are decisively rejected from prompt injection."] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.15rem' }, children: !data || data.candidates.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state-icon", children: "\uD83D\uDCCA" }), _jsx("h2", { className: "empty-state-title", children: "No Candidate Scores Available" }), _jsx("p", { className: "empty-state-desc", children: "No diagnostic candidate matches were produced for the active query." })] })) : (data.candidates.map((cand, idx) => {
                            const scorePercent = Math.min(100, Math.round(cand.trustScore * 100));
                            const passes = cand.trustScore >= threshold;
                            return (_jsxs("div", { style: {
                                    background: 'var(--bg-subtle)',
                                    padding: '1.15rem 1.25rem',
                                    borderRadius: '6px',
                                    border: `1px solid ${passes ? 'var(--border-subtle)' : 'var(--status-danger-bd)'}`,
                                }, children: [_jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '0.65rem',
                                            flexWrap: 'wrap',
                                            gap: '0.5rem',
                                        }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }, children: [_jsx("span", { className: "mono", style: { fontWeight: 700, color: 'var(--accent-cyan)' }, children: cand.id }), _jsxs("span", { className: `badge ${cand.matchType === 'exact' ? 'emerald' : 'violet'}`, children: [cand.matchType.toUpperCase(), " MATCH"] }), cand.isQuarantined && _jsx("span", { className: "badge rose", children: "QUARANTINED (0.5x PENALTY)" }), cand.isStale && _jsx("span", { className: "badge amber", children: "STALE (LOCKFILE MISMATCH)" })] }), _jsx("code", { style: { fontSize: '0.8rem', color: 'var(--text-primary)' }, children: cand.command })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { className: "mono", style: {
                                                            fontSize: '1.25rem',
                                                            fontWeight: 700,
                                                            color: passes ? 'var(--status-success)' : 'var(--status-danger)',
                                                        }, children: [(cand.trustScore * 100).toFixed(1), "%"] }), _jsx("span", { className: `badge ${passes ? 'emerald' : 'rose'}`, style: { fontSize: '0.68rem', fontWeight: 700 }, children: passes ? '✓ ACCEPTED' : '✗ REJECTED (BELOW THRESHOLD)' })] })] }), _jsxs("div", { className: "explain-bar-track", children: [_jsx("div", { className: "explain-bar-fill", style: {
                                                    width: `${scorePercent}%`,
                                                    background: passes ? 'var(--status-success)' : 'var(--status-danger)',
                                                } }), _jsx("div", { className: "explain-threshold-line", style: { left: `${threshold * 100}%` }, title: `Retrieval Threshold: ${(threshold * 100).toFixed(0)}%` })] }), _jsxs("div", { style: {
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: '0.85rem',
                                            marginTop: '0.65rem',
                                            fontSize: '0.76rem',
                                            color: 'var(--text-secondary)',
                                        }, children: [_jsxs("div", { children: ["Raw Similarity:", ' ', _jsxs("strong", { className: "mono", style: { color: 'var(--text-primary)' }, children: [(cand.similarityScore * 100).toFixed(1), "%"] })] }), _jsxs("div", { children: ["Repo Match:", ' ', _jsx("span", { style: {
                                                            fontWeight: 600,
                                                            color: cand.passedFilters.repository ? 'var(--status-success)' : 'var(--status-danger)',
                                                        }, children: cand.passedFilters.repository ? 'Pass ✓' : 'Fail ✗' })] }), _jsxs("div", { children: ["Family Match:", ' ', _jsx("span", { style: {
                                                            fontWeight: 600,
                                                            color: cand.passedFilters.commandFamily ? 'var(--status-success)' : 'var(--status-danger)',
                                                        }, children: cand.passedFilters.commandFamily ? 'Pass ✓' : 'Fail ✗' })] }), _jsxs("div", { children: ["Exit Code:", ' ', _jsx("span", { style: {
                                                            fontWeight: 600,
                                                            color: cand.passedFilters.exitCode ? 'var(--status-success)' : 'var(--status-danger)',
                                                        }, children: cand.passedFilters.exitCode ? 'Pass ✓' : 'Fail ✗' })] })] })] }, idx));
                        })) })] }), _jsxs("div", { className: "panel", style: {
                    borderLeft: '4px solid var(--status-warning)',
                    background: 'var(--status-warning-bg)',
                }, children: [_jsx("h3", { style: {
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: 'var(--status-warning)',
                            marginBottom: '0.25rem',
                        }, children: "Defensible Safety Invariant: No Silent Promotion" }), _jsx("p", { style: { fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.45 }, children: "Fuzzy matches are never silently promoted to verified fixes. Every retrieved record surfaces its exact matchType, raw similarity, provenance decay factor, and quarantine containment status directly into the prompt sanitization envelope." })] })] }));
}
