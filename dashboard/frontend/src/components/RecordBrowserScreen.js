import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { RecordDetailDrawer } from './RecordDetailDrawer.js';
export function RecordBrowserScreen({ records, onFetchDetail }) {
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
    return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", children: [_jsx("h1", { className: "screen-title", children: "Record Browser & Detail" }), _jsx("p", { className: "screen-subtitle", children: "Searchable catalog of error-fix memories, fingerprints, provenance metadata, and supersedes history." })] }), _jsxs("div", { className: "panel", style: {
                    padding: '1.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsx("div", { style: { display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }, children: _jsx("input", { type: "text", className: "input", placeholder: "Search commands, error text, fingerprints, or explanations...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: { width: '100%' } }) }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem', alignItems: 'center' }, children: [_jsxs("select", { className: "input", value: familyFilter, onChange: (e) => setFamilyFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Command Families" }), commandFamilies.filter((f) => f !== 'all').map((f) => (_jsx("option", { value: f, children: f }, f)))] }), _jsxs("select", { className: "input", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Statuses" }), _jsx("option", { value: "clean", children: "Clean (Unquarantined)" }), _jsx("option", { value: "quarantined", children: "Quarantined (Flagged)" }), _jsx("option", { value: "verified", children: "Verified Only" })] })] })] }), _jsx("div", { className: "panel", style: { padding: 0, overflow: 'hidden' }, children: _jsx("div", { className: "table-container", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Record ID" }), _jsx("th", { children: "Command" }), _jsx("th", { children: "Family" }), _jsx("th", { children: "Fingerprint (SHA-256)" }), _jsx("th", { children: "Confidence / Wilson" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Created" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: filtered.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, style: { textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }, children: "No matching memory records found." }) })) : (filtered.map((r) => (_jsxs("tr", { onClick: () => handleRowClick(r.id), style: { cursor: 'pointer' }, children: [_jsx("td", { children: _jsx("span", { className: "mono", style: { fontWeight: 600, color: 'var(--accent-cyan)' }, children: r.id }) }), _jsx("td", { children: _jsx("code", { style: { fontSize: '0.82rem', color: 'var(--text-primary)' }, children: r.command.length > 38 ? `${r.command.slice(0, 38)}...` : r.command }) }), _jsx("td", { children: _jsx("span", { className: "badge purple", children: r.commandFamily }) }), _jsx("td", { children: _jsxs("span", { className: "mono", style: { fontSize: '0.75rem', color: 'var(--text-secondary)' }, children: [r.fingerprint.slice(0, 16), "..."] }) }), _jsx("td", { children: r.wilsonLowerBound !== null ? (_jsxs("span", { style: { fontWeight: 600, color: 'var(--accent-emerald)' }, children: [(r.wilsonLowerBound * 100).toFixed(1), "%"] })) : (_jsx("span", { style: { color: 'var(--text-muted)' }, children: "\u2014" })) }), _jsx("td", { children: r.isQuarantined ? (_jsx("span", { className: "badge rose", children: "QUARANTINED" })) : r.verificationStatus === 'verified_success' ? (_jsx("span", { className: "badge emerald", children: "VERIFIED" })) : (_jsx("span", { className: "badge gray", children: "RECORDED" })) }), _jsx("td", { style: { fontSize: '0.78rem', color: 'var(--text-muted)' }, children: new Date(r.createdAt).toLocaleDateString() }), _jsx("td", { children: _jsx("button", { className: "btn btn-outline", style: { padding: '0.25rem 0.6rem', fontSize: '0.75rem' }, onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleRowClick(r.id);
                                                }, children: "Inspect" }) })] }, r.id)))) })] }) }) }), _jsx(RecordDetailDrawer, { record: selectedRecord, onClose: () => setSelectedRecord(null) })] }));
}
