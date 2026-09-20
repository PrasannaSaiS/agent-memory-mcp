import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { RecordDetailDrawer } from './RecordDetailDrawer.js';
export function RecordBrowserScreen({ records, isLoading, onFetchDetail }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [familyFilter, setFamilyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const commandFamilies = ['all', ...Array.from(new Set(records.map((r) => r.commandFamily)))];
    const filtered = records.filter((r) => {
        if (familyFilter !== 'all' && r.commandFamily !== familyFilter)
            return false;
        if (statusFilter === 'quarantined' && !r.isQuarantined)
            return false;
        if (statusFilter === 'clean' && r.isQuarantined)
            return false;
        if (statusFilter === 'verified' && r.verificationStatus !== 'verified_success')
            return false;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (r.command.toLowerCase().includes(q) ||
                r.id.toLowerCase().includes(q) ||
                r.fingerprint.toLowerCase().includes(q) ||
                r.fixExplanation.toLowerCase().includes(q));
        }
        return true;
    });
    const handleRowClick = async (id) => {
        const full = await onFetchDetail(id);
        if (full)
            setSelectedRecord(full);
    };
    return (_jsxs("div", { children: [_jsx("div", { className: "screen-header", children: _jsxs("div", { className: "screen-title-row", children: [_jsxs("div", { children: [_jsx("h1", { className: "screen-title", children: "Record Browser & Detail" }), _jsx("p", { className: "screen-subtitle", children: "Searchable catalog of error-fix memories, deterministic fingerprints, provenance metadata, and supersedes history." })] }), _jsxs("div", { className: "badge gray", children: ["Catalog: ", records.length, " Records (", filtered.length, " matching)"] })] }) }), _jsxs("div", { className: "panel", style: {
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.85rem',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsx("div", { style: { display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }, children: _jsx("input", { id: "record-search-input", type: "text", className: "input", placeholder: "Search commands, fingerprints, or explanations... (Press '/' to focus)", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: { width: '100%' } }) }), _jsxs("div", { style: { display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }, children: [_jsxs("select", { id: "family-filter-select", className: "input", value: familyFilter, onChange: (e) => setFamilyFilter(e.target.value), "aria-label": "Filter by command family", children: [_jsx("option", { value: "all", children: "All Command Families" }), commandFamilies
                                        .filter((f) => f !== 'all')
                                        .map((f) => (_jsx("option", { value: f, children: f }, f)))] }), _jsxs("select", { id: "status-filter-select", className: "input", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), "aria-label": "Filter by record status", children: [_jsx("option", { value: "all", children: "All Verification Statuses" }), _jsx("option", { value: "clean", children: "Clean (Unquarantined)" }), _jsx("option", { value: "quarantined", children: "Quarantined (Flagged)" }), _jsx("option", { value: "verified", children: "Verified Only (Passing)" })] }), (searchTerm || familyFilter !== 'all' || statusFilter !== 'all') && (_jsx("button", { className: "btn btn-outline", style: { fontSize: '0.75rem', padding: '0.35rem 0.65rem' }, onClick: () => {
                                    setSearchTerm('');
                                    setFamilyFilter('all');
                                    setStatusFilter('all');
                                }, children: "Reset Filters" }))] })] }), _jsx("div", { className: "panel", style: { padding: 0, overflow: 'hidden' }, children: _jsx("div", { className: "table-container", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Record ID" }), _jsx("th", { children: "Target Command" }), _jsx("th", { children: "Family" }), _jsx("th", { children: "Fingerprint (SHA-256)" }), _jsx("th", { children: "Wilson Lower Bound" }), _jsx("th", { children: "Integrity Status" }), _jsx("th", { children: "Created" }), _jsx("th", { style: { textAlign: 'right' }, children: "Actions" })] }) }), _jsx("tbody", { children: isLoading ? (Array.from({ length: 5 }).map((_, idx) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("div", { className: "skeleton-box", style: { width: '80px', height: '18px' } }) }), _jsx("td", { children: _jsx("div", { className: "skeleton-box", style: { width: '180px', height: '18px' } }) }), _jsx("td", { children: _jsx("div", { className: "skeleton-box", style: { width: '60px', height: '18px' } }) }), _jsx("td", { children: _jsx("div", { className: "skeleton-box", style: { width: '120px', height: '18px' } }) }), _jsx("td", { children: _jsx("div", { className: "skeleton-box", style: { width: '70px', height: '18px' } }) }), _jsx("td", { children: _jsx("div", { className: "skeleton-box", style: { width: '85px', height: '18px' } }) }), _jsx("td", { children: _jsx("div", { className: "skeleton-box", style: { width: '80px', height: '18px' } }) }), _jsx("td", { style: { textAlign: 'right' }, children: _jsx("div", { className: "skeleton-box", style: { width: '60px', height: '24px', marginLeft: 'auto' } }) })] }, idx)))) : filtered.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, style: { padding: '3.5rem 1.5rem' }, children: _jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state-icon", children: "\uD83D\uDD0D" }), _jsx("h2", { className: "empty-state-title", children: "No Matching Memory Records" }), _jsx("p", { className: "empty-state-desc", children: records.length === 0
                                                        ? 'The memory database is currently empty. Run test executions or benchmarks to seed records.'
                                                        : 'No records match your active search terms or filter selection.' })] }) }) })) : (filtered.map((r) => (_jsxs("tr", { onClick: () => handleRowClick(r.id), style: { cursor: 'pointer' }, tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && handleRowClick(r.id), children: [_jsx("td", { children: _jsx("span", { className: "mono", style: { fontWeight: 600, color: 'var(--accent-cyan)' }, children: r.id }) }), _jsx("td", { children: _jsx("code", { style: { fontSize: '0.8rem', color: 'var(--text-primary)' }, children: r.command.length > 40 ? `${r.command.slice(0, 40)}…` : r.command }) }), _jsx("td", { children: _jsx("span", { className: "badge violet", children: r.commandFamily }) }), _jsx("td", { children: _jsxs("span", { className: "mono", style: { fontSize: '0.74rem', color: 'var(--text-secondary)' }, children: [r.fingerprint.slice(0, 16), "\u2026"] }) }), _jsx("td", { children: r.wilsonLowerBound !== null ? (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsxs("span", { className: "mono", style: { fontWeight: 600, color: 'var(--status-success)' }, children: [(r.wilsonLowerBound * 100).toFixed(1), "%"] }), _jsx("div", { style: {
                                                            width: '45px',
                                                            height: '5px',
                                                            background: 'rgba(125, 140, 160, 0.15)',
                                                            borderRadius: '3px',
                                                            overflow: 'hidden',
                                                        }, children: _jsx("div", { style: {
                                                                width: `${r.wilsonLowerBound * 100}%`,
                                                                height: '100%',
                                                                background: 'var(--status-success)',
                                                            } }) })] })) : (_jsx("span", { style: { color: 'var(--text-muted)' }, children: "\u2014" })) }), _jsx("td", { children: r.isQuarantined ? (_jsx("span", { className: "badge rose", children: "QUARANTINED" })) : r.verificationStatus === 'verified_success' ? (_jsx("span", { className: "badge emerald", children: "VERIFIED" })) : (_jsx("span", { className: "badge gray", children: "RECORDED" })) }), _jsx("td", { style: { fontSize: '0.76rem', color: 'var(--text-muted)' }, children: new Date(r.createdAt).toLocaleDateString() }), _jsx("td", { style: { textAlign: 'right' }, children: _jsx("button", { className: "btn btn-outline", style: { padding: '0.22rem 0.65rem', fontSize: '0.74rem' }, onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleRowClick(r.id);
                                                }, "aria-label": `Inspect record ${r.id}`, children: "Inspect \u2192" }) })] }, r.id)))) })] }) }) }), _jsx(RecordDetailDrawer, { record: selectedRecord, onClose: () => setSelectedRecord(null) })] }));
}
