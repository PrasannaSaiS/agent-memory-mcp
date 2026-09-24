import { jsx as _jsx } from "react/jsx-runtime";
export function Skeleton({ width = '100%', height = '18px', className = '' }) {
    return _jsx("div", { className: `skeleton-box ${className}`.trim(), style: { width, height } });
}
