import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({ icon = '◌', title, description, action }) {
    return (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-state-icon", "aria-hidden": "true", children: icon }), _jsx("h2", { className: "empty-state-title", children: title }), _jsx("p", { className: "empty-state-desc", children: description }), action && _jsx("div", { className: "empty-state-action", children: action })] }));
}
