import { ArrowDown, ArrowUp, Eye, Trash2 } from "lucide-react";
import { fmtDateTime, fmtNumber, titleCase } from "../utils/format";

const COLS = [
  { key: "id", label: "ID" }, { key: "crop", label: "Crop" }, { key: "state_name", label: "State" },
  { key: "district_name", label: "District" }, { key: "year", label: "Year" },
  { key: "area_ha", label: "Area (ha)", num: true }, { key: "predicted_yield_kg_per_ha", label: "Yield (kg/ha)", num: true },
  { key: "estimated_production_kg", label: "Est. production (kg)", num: true }, { key: "created_at", label: "Created" },
];

export default function PredictionHistoryTable({ rows, sortBy, order, onSort, onView, onDelete, compact = false }) {
  const cols = compact ? COLS.filter((c) => ["id", "crop", "district_name", "predicted_yield_kg_per_ha", "created_at"].includes(c.key)) : COLS;
  return (
    <div className="overflow-x-auto rounded-lg border border-soil-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-soil-100 text-left text-soil-700">
          <tr>
            {cols.map((c) => (
              <th key={c.key} scope="col" className={`px-3 py-2 font-semibold ${c.num ? "text-right" : ""}`} aria-sort={onSort && sortBy === c.key ? (order === "asc" ? "ascending" : "descending") : undefined}>
                {onSort ? (
                  <button className="inline-flex items-center gap-1 hover:underline" onClick={() => onSort(c.key)}>
                    {c.label}{sortBy === c.key && (order === "asc" ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />)}
                  </button>
                ) : c.label}
              </th>
            ))}
            {!compact && <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-soil-100">
              {cols.map((c) => (
                <td key={c.key} className={`whitespace-nowrap px-3 py-2 ${c.num ? "text-right tabular-nums" : ""}`}>
                  {c.key === "crop" ? titleCase(r.crop)
                    : c.key === "created_at" ? fmtDateTime(r.created_at)
                    : c.num ? fmtNumber(r[c.key], c.key === "estimated_production_kg" ? 0 : 2)
                    : r[c.key]}
                </td>
              ))}
              {!compact && (
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <button className="rounded p-1.5 hover:bg-soil-100" onClick={() => onView(r)} aria-label={`View details of prediction ${r.id}`}><Eye className="h-4 w-4" /></button>
                  <button className="rounded p-1.5 text-red-700 hover:bg-red-50" onClick={() => onDelete(r)} aria-label={`Delete prediction ${r.id}`}><Trash2 className="h-4 w-4" /></button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
