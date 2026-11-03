import { useEffect, useRef } from "react";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", busy, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="card w-full max-w-sm">
        <h2 id="confirm-title" className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-soil-700">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>{busy ? "Deleting…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
