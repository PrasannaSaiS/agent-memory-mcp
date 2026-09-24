import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ConfirmButton } from './shared/ConfirmButton.js';
export function ApprovalQueueScreen({ approvals, isLoading, onDecision }) {
    const [operatorNotes, setOperatorNotes] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(null);
    const handleAction = async (id, decision) => {
        setIsSubmitting(id);
        try {
            const ok = await onDecision(id, decision, operatorNotes[id]);
            if (ok) {
                setOperatorNotes((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                });
            }
        }
        finally {
            setIsSubmitting(null);
        }
    };
    const getRiskBadge = (level) => {
        switch (level.toUpperCase()) {
            case 'HIGH':
                return _jsx("span", { className: "badge rose", children: "HIGH RISK LEVEL" });
            case 'MEDIUM':
                return _jsx("span", { className: "badge amber", children: "MEDIUM RISK LEVEL" });
            case 'LOW':
            default:
                return _jsx("span", { className: "badge emerald", children: "LOW RISK LEVEL" });
        }
    };
    if (isLoading) {
        return (_jsxs("div", { children: [_jsxs("div", { className: "screen-header", children: [_jsx("div", { className: "skeleton-box", style: { width: '320px', height: '28px', marginBottom: '8px' } }), _jsx("div", { className: "skeleton-box", style: { width: '480px', height: '16px' } })] }), _jsx("div", { className: "panel", style: { height: '180px', marginBottom: '16px' }, children: _jsx("div", { className: "skeleton-box", style: { height: '100%' } }) }), _jsx("div", { className: "panel", style: { height: '180px' }, children: _jsx("div", { className: "skeleton-box", style: { height: '100%' } }) })] }));
    }
    return (_jsxs("div", { children: [_jsx("div", { className: "screen-header", children: _jsxs("div", { className: "screen-title-row", children: [_jsxs("div", { children: [_jsx("h1", { className: "screen-title", children: "Human-in-the-Loop Approval Queue" }), _jsx("p", { className: "screen-subtitle", children: "Dry-run safety control surface. Intercepts non-allowlisted agent repair commands prior to live shell execution." })] }), _jsxs("div", { className: "badge gray", children: [approvals.length, " Pending Execution Authorization", approvals.length === 1 ? '' : 's'] })] }) }), approvals.length === 0 ? (_jsx("div", { className: "panel", children: _jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state-icon", children: "\uD83D\uDEE1\uFE0F" }), _jsx("h2", { className: "empty-state-title", children: "Approval Queue Clean" }), _jsx("p", { className: "empty-state-desc", children: "Zero execution authorizations are pending. When an agent calls verify_fix with a non-allowlisted command or high-risk shell arguments, the execution barrier intercepts it here for operator authorization." }), _jsx("div", { style: { marginTop: '1.25rem' }, children: _jsx("span", { className: "badge emerald", children: "Dry-Run Protection Active" }) })] }) })) : (_jsx("div", { className: "approval-list", children: approvals.map((appr) => {
                    const isHighRisk = appr.risk.level.toUpperCase() === 'HIGH';
                    const isSubmittingThis = isSubmitting === appr.approvalId;
                    return (_jsxs("div", { className: "panel approval-card", style: {
                            borderLeft: isHighRisk ? '4px solid var(--status-danger)' : '4px solid var(--status-warning)',
                        }, children: [_jsxs("div", { className: "approval-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "approval-meta-row", children: [_jsx("span", { className: "mono approval-id", children: appr.approvalId }), getRiskBadge(appr.risk.level), appr.recordId && _jsxs("span", { className: "mono badge gray", children: ["Ref Record: ", appr.recordId] })] }), _jsxs("div", { className: "approval-timestamp", children: ["Intercepted: ", new Date(appr.createdAt).toLocaleString(), " \u2022 Status: ", _jsx("span", { className: "mono", children: appr.status })] })] }), _jsxs("div", { className: "approval-actions", children: [_jsx(ConfirmButton, { confirmLabel: "Deny", confirmText: "Confirm deny?", variant: "danger", disabled: isSubmittingThis, onConfirm: () => handleAction(appr.approvalId, 'deny'), children: isSubmittingThis ? 'Submitting…' : 'Deny & Terminate' }), _jsx(ConfirmButton, { confirmLabel: "Approve", confirmText: "Confirm authorize?", variant: "success", disabled: isSubmittingThis, onConfirm: () => handleAction(appr.approvalId, 'approve'), children: isSubmittingThis ? 'Authorizing…' : 'Authorize Execution' })] })] }), _jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("div", { className: "mini-label", children: "Intercepted Command Plan:" }), _jsxs("div", { className: "code-block mono approval-command", children: ["$ ", appr.requestedCommand] })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("div", { className: "mini-label", children: "Security Policy Findings:" }), _jsx("div", { className: "risk-badges", children: appr.risk.reasons.map((r, i) => (_jsxs("span", { className: `badge ${isHighRisk ? 'rose' : 'amber'}`, children: ["\u26A0 ", r] }, i))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `notes-${appr.approvalId}`, className: "field-label", children: "Operator Audit Notes (logged immutably to approvals-resolved.jsonl):" }), _jsx("input", { id: `notes-${appr.approvalId}`, type: "text", className: "input", placeholder: "Enter justification or review comments prior to decision...", value: operatorNotes[appr.approvalId] || '', onChange: (e) => setOperatorNotes((prev) => ({ ...prev, [appr.approvalId]: e.target.value })), style: { width: '100%' } })] })] }, appr.approvalId));
                }) }))] }));
}
