import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function ApprovalQueueScreen({ approvals, onDecision }) {
    const [operatorNotes, setOperatorNotes] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(null);
    const handleAction = async (id, decision) => {
        setIsSubmitting(id);
        try {
            await onDecision(id, decision, operatorNotes[id]);
            setOperatorNotes((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        }
        finally {
            setIsSubmitting(null);
        }
    };
    const getRiskBadge = (level) => {
        switch (level.toUpperCase()) {
            case 'HIGH':
                return _jsx("span", { className: "badge rose", children: "HIGH RISK" });
            case 'MEDIUM':
                return _jsx("span", { className: "badge amber", children: "MEDIUM RISK" });
            case 'LOW':
            default:
                return _jsx("span", { className: "badge emerald", children: "LOW RISK" });
        }
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", children: [_jsx("h1", { className: "screen-title", children: "Human-in-the-Loop Approval Queue" }), _jsx("p", { className: "screen-subtitle", children: "Pending dry-run verify_fix executions requiring explicit operator authorization before execution." })] }), approvals.length === 0 ? (_jsxs("div", { className: "panel", style: { textAlign: 'center', padding: '4rem 2rem' }, children: [_jsx("div", { style: { fontSize: '2.5rem', marginBottom: '1rem' }, children: "\uD83D\uDEE1\uFE0F" }), _jsx("h2", { style: { fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }, children: "Approval Queue Clean" }), _jsx("p", { style: { color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }, children: "No commands are awaiting execution approval. When an agent calls verify_fix with a non-allowlisted command, dry-run safety intercepts it here." })] })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: approvals.map((appr) => (_jsxs("div", { className: "panel", style: {
                        borderLeft: appr.risk.level === 'HIGH' ? '4px solid var(--accent-rose)' : '4px solid var(--accent-amber)',
                    }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }, children: [_jsx("span", { className: "mono", style: { fontWeight: 700, fontSize: '1rem', color: 'var(--accent-cyan)' }, children: appr.approvalId }), getRiskBadge(appr.risk.level), appr.recordId && _jsxs("span", { className: "mono badge gray", children: ["Record: ", appr.recordId] })] }), _jsxs("div", { style: { fontSize: '0.8rem', color: 'var(--text-muted)' }, children: ["Queued: ", new Date(appr.createdAt).toLocaleString()] })] }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { className: "btn btn-danger", disabled: isSubmitting === appr.approvalId, onClick: () => handleAction(appr.approvalId, 'deny'), children: "Deny" }), _jsx("button", { className: "btn btn-success", disabled: isSubmitting === appr.approvalId, onClick: () => handleAction(appr.approvalId, 'approve'), children: "Approve Live Execution" })] })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("div", { style: { fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }, children: "Requested Execution Command:" }), _jsx("div", { className: "code-block mono", style: { fontSize: '0.92rem', color: 'var(--text-primary)' }, children: appr.requestedCommand })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("div", { style: { fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }, children: "Risk Assessment:" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }, children: appr.risk.reasons.map((r, i) => (_jsxs("span", { className: "badge amber", children: ["\u26A0 ", r] }, i))) })] }), _jsx("div", { children: _jsx("input", { type: "text", className: "input", placeholder: "Add optional operator audit notes...", value: operatorNotes[appr.approvalId] || '', onChange: (e) => setOperatorNotes({ ...operatorNotes, [appr.approvalId]: e.target.value }), style: { width: '100%' } }) })] }, appr.approvalId))) }))] }));
}
