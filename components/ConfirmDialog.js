'use client';

import { useEffect, useRef } from 'react';
import { Warning } from '@phosphor-icons/react';

/**
 * Dialog konfirmasi reusable (menggunakan style modal yang sudah ada).
 */
export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Hapus',
    cancelLabel = 'Batal',
    loading = false,
    onConfirm,
    onCancel,
}) {
    const cancelRef = useRef(null);

    // Fokus ke tombol batal (aman default) + tutup dengan Escape
    useEffect(() => {
        if (!open) return;
        cancelRef.current?.focus();

        const handleKey = (e) => {
            if (e.key === 'Escape' && !loading) onCancel?.();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, loading, onCancel]);

    if (!open) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) onCancel?.();
            }}
        >
            <div
                className="modal-card confirm-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <div className="modal-body-centered">
                    <div className="modal-icon-wrapper red-icon-wrapper">
                        <Warning weight="bold" />
                    </div>
                    <h3 id="confirm-dialog-title" className="modal-title">{title}</h3>
                    <p id="confirm-dialog-message" className="modal-subtitle">{message}</p>
                </div>
                <div className="modal-footer-flex">
                    <button
                        ref={cancelRef}
                        className="btn-modal-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className="btn-modal-confirm"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Menghapus...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
