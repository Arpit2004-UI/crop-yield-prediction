import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { InputSummary } from "./PredictionResult";
import { fmtDateTime, fmtNumber } from "../utils/format";

export default function RecordDetails({ record, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!record) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [record, onClose]);
  if (!record) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="rec-title">
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <div className="flex items-start justify-between">
          <h2 id="rec-title" className="font-display text-lg font-semibold">Prediction #{record.id}</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close details" className="rounded p-1 hover:bg-soil-100"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-1 text-xs text-soil-500">{fmtDateTime(record.created_at)}</p>
        <div className="my-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-field-50 p-3"><p className="text-xs text-field-800">Predicted yield</p><p className="font-display text-xl font-bold">{fmtNumber(record.predicted_yield_kg_per_ha)} kg/ha</p></div>
          <div className="rounded-md bg-soil-100 p-3"><p className="text-xs text-soil-700">Estimated production</p><p className="font-display text-xl font-bold">{fmtNumber(record.estimated_production_kg, 0)} kg</p></div>
        </div>
        <InputSummary record={record} />
        {record.crop === "cotton" && <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Cotton predictions are unreliable (test R² was negative).</p>}
      </div>
    </div>
  );
}
