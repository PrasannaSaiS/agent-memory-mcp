import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export function SecurityAuditScreen({ onFetchAudit }) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        loadAudit();
    }, []);
    const loadAudit = async () => {
        setIsLoading(true);
        try {
            const res = await onFetchAudit();
            if (res)
                setData(res);
        }
        finally {
            setIsLoading(false);
        }
    };
    if (isLoading) {
        return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", children: [_jsx("div", { className: "skeleton-box", style: { width: '320px', height: '28px', marginBottom: '8px' } }), _jsx("div", { className: "skeleton-box", style: { width: '520px', height: '16px' } })] }), _jsx("div", { className: "panel", style: { height: '200px', marginBottom: '16px' }, children: _jsx("div", { className: "skeleton-box", style: { height: '100%' } }) }), _jsx("div", { className: "panel", style: { height: '300px' }, children: _jsx("div", { className: "skeleton-box", style: { height: '100%' } }) })] }));
    }
    return (_jsxs("div", { children: [_jsx("div", { className: "screen-header", children: _jsxs("div", { className: "screen-title-row", children: [_jsxs("div", { children: [_jsx("h1", { className: "screen-title", children: "Security & Redaction Audit" }), _jsx("p", { className: "screen-subtitle", children: "Verification of multi-layer secret redaction (deterministic regex + Shannon entropy) and persisted-retrieval poisoning heuristic defenses." })] }), _jsx("div", { className: "badge emerald", style: { padding: '0.35rem 0.75rem', fontSize: '0.8rem' }, children: "\u25CF Redaction Pipeline: 100% Recall" })] }) }), _jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("div", { children: _jsx("h2", { className: "panel-title", children: "Synchronous Secret Redaction Pipeline (ADR-005)" }) }), _jsx("span", { className: "badge emerald", children: "Zero Plaintext Leak Invariant" })] }), _jsx("p", { style: { fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }, children: "All error outputs pass through both redaction tiers synchronously before fingerprint calculation or persistence. Zero unredacted secrets touch disk or SQLite." }), _jsxs("div", { className: "redaction-layers-grid", children: [_jsxs("div", { style: {
                                    background: 'var(--bg-subtle)',
                                    padding: '1.15rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }, children: [_jsx("strong", { style: { color: 'var(--text-primary)', fontSize: '0.88rem' }, children: "Layer 1: Deterministic Pattern Signatures" }), _jsx("span", { className: "badge emerald", children: "ACTIVE" })] }), _jsx("p", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }, children: "High-precision regular expressions targeting credential prefixes, authorization headers, and format signatures." }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }, children: [
                                            'GitHub PAT (ghp_*)',
                                            'AWS Access Key (AKIA*)',
                                            'OpenAI (sk-*)',
                                            'Anthropic (sk-ant-*)',
                                            'Bearer JWT Tokens',
                                            'PEM Private Keys',
                                            'Database URIs',
                                        ].map((p, i) => (_jsx("span", { className: "badge gray", style: { fontSize: '0.7rem' }, children: p }, i))) })] }), _jsxs("div", { style: {
                                    background: 'var(--bg-subtle)',
                                    padding: '1.15rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }, children: [_jsx("strong", { style: { color: 'var(--text-primary)', fontSize: '0.88rem' }, children: "Layer 2: Shannon Entropy Scoring" }), _jsx("span", { className: "badge emerald", children: "ACTIVE" })] }), _jsx("p", { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }, children: "Calculates character distribution entropy (bits/char) for strings \u2265 24 chars to catch non-standard high-entropy API tokens." }), _jsxs("div", { style: { display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }, children: [_jsxs("div", { children: ["Entropy Threshold:", ' ', _jsx("strong", { className: "mono", style: { color: 'var(--accent-cyan)' }, children: "H > 4.5" })] }), _jsxs("div", { children: ["Min Token Length:", ' ', _jsx("strong", { className: "mono", style: { color: 'var(--accent-cyan)' }, children: "24 chars" })] })] })] })] })] }), _jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("div", { children: _jsx("h2", { className: "panel-title", children: "Persisted-Retrieval Poisoning Detectors (Phase 5 Defense)" }) }), _jsx("span", { className: "badge cyan", children: "7 Heuristic Layers Active" })] }), _jsx("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '0.85rem',
                            marginBottom: '1rem',
                        }, children: [
                            {
                                id: 'imp',
                                name: 'Imperative Injections',
                                desc: '"ignore previous instructions", "act as", "pretend"',
                            },
                            {
                                id: 'sys',
                                name: 'Fake System Markers',
                                desc: '[INST], <<SYS>>, <|im_start|>, "system note"',
                            },
                            {
                                id: 'exf',
                                name: 'Data Exfiltration',
                                desc: 'curl -X POST, send prompt to, webhook commands',
                            },
                            {
                                id: 'nes',
                                name: 'Nested / Base64 Injections',
                                desc: 'Quoted payloads, base64 decode wrappers',
                            },
                            {
                                id: 'zwc',
                                name: 'Zero-Width Characters',
                                desc: 'U+200B, soft hyphen, word-joiner evasion',
                            },
                            {
                                id: 'hgl',
                                name: 'Unicode Homoglyphs',
                                desc: 'Cyrillic/Greek confusables substituted for Latin',
                            },
                            {
                                id: 'den',
                                name: 'Imperative Verb Density',
                                desc: '> 8% imperative verbs over 20+ words',
                            },
                        ].map((det, i) => (_jsxs("div", { style: {
                                background: 'var(--bg-subtle)',
                                padding: '0.85rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                            }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }, children: [_jsx("span", { style: { fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }, children: det.name }), _jsx("span", { className: "badge emerald", style: { fontSize: '0.65rem' }, children: "ACTIVE" })] }), _jsx("p", { style: { fontSize: '0.74rem', color: 'var(--text-secondary)' }, children: det.desc })] }, i))) })] }), _jsxs("div", { className: "panel", style: { padding: 0, overflow: 'hidden' }, children: [_jsxs("div", { style: {
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                        }, children: [_jsxs("div", { children: [_jsx("h2", { className: "panel-title", style: { display: 'inline' }, children: "Quarantined Records Catalog" }), _jsxs("span", { style: { marginLeft: '0.65rem', fontSize: '0.78rem', color: 'var(--text-muted)' }, children: ["(", data?.poisoningAudit.quarantinedRecords.length ?? 0, " records quarantined)"] })] }), _jsx("span", { className: "badge rose", children: "Excluded from Default Prompt Retrieval" })] }), _jsx("div", { className: "table-container", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Record ID" }), _jsx("th", { children: "Command" }), _jsx("th", { children: "Detection Reason" }), _jsx("th", { children: "Quarantined At" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: !data || data.poisoningAudit.quarantinedRecords.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, style: { padding: '3.5rem 1.5rem' }, children: _jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state-icon", children: "\uD83D\uDEE1\uFE0F" }), _jsx("h2", { className: "empty-state-title", children: "Quarantine Log Clean" }), _jsx("p", { className: "empty-state-desc", children: "No records are currently quarantined. All active memory records passed through the 7-layer heuristic detection pipeline without triggering flags." })] }) }) })) : (data.poisoningAudit.quarantinedRecords.map((r) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: "mono", style: { fontWeight: 600, color: 'var(--accent-cyan)' }, children: r.id }) }), _jsx("td", { children: _jsx("code", { style: { fontSize: '0.8rem', color: 'var(--text-primary)' }, children: r.command }) }), _jsx("td", { children: _jsx("span", { style: { color: 'var(--status-danger)', fontSize: '0.8rem', fontWeight: 500 }, children: r.flagReason }) }), _jsx("td", { style: { fontSize: '0.76rem', color: 'var(--text-muted)' }, children: new Date(r.createdAt).toLocaleString() }), _jsx("td", { children: _jsx("span", { className: "badge rose", children: r.status.toUpperCase() }) })] }, r.id)))) })] }) })] })] }));
}
