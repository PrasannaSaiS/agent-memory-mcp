import { jsx as _jsx } from "react/jsx-runtime";
export function Badge({ tone = 'gray', children, className = '' }) {
    return _jsx("span", { className: `badge ${tone} ${className}`.trim(), children: children });
}
