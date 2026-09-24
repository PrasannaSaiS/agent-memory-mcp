import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export function ConfirmButton({ confirmLabel, confirmText = 'Confirm action?', onConfirm, variant = 'danger', disabled = false, className = '', children, }) {
    const [isConfirming, setIsConfirming] = useState(false);
    const handleClick = async () => {
        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }
        setIsConfirming(false);
        await onConfirm();
    };
    const buttonClass = variant === 'success' ? 'btn btn-success' : variant === 'primary' ? 'btn btn-primary' : 'btn btn-danger';
    return (_jsx("button", { className: `${buttonClass} ${className}`.trim(), disabled: disabled, onClick: handleClick, "aria-label": isConfirming ? confirmLabel : undefined, title: confirmLabel, children: isConfirming ? confirmText : children }));
}
