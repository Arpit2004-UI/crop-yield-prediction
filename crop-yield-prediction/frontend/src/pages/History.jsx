import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import PredictionHistoryTable from "../components/PredictionHistoryTable";
import RecordDetails from "../components/RecordDetails";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import useDebounce from "../hooks/useDebounce";
import { useToast } from "../hooks/useToast";
import { deletePrediction, getPredictions } from "../services/api";
import { titleCase } from "../utils/format";

const CROPS = ["chickpea", "cotton", "maize", "rice"];
const PAGE_SIZES = [10, 25, 50];

export default function History() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const [crop, setCrop] = useState("");
  const [sort, setSort] = useState({ by: "created_at", order: "desc" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setPage(1), [dq, crop, perPage, sort]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setData(await getPredictions({ q: dq || undefined, crop: crop || undefined, sort_by: sort.by, order: sort.order, page, per_page: perPage }));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [dq, crop, sort, page, perPage]);
  useEffect(() => { load(); }, [load]);

  const onSort = (key) => setSort((s) => (s.by === key ? { by: key, order: s.order === "asc" ? "desc" : "asc" } : { by: key, order: "asc" }));

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePrediction(toDelete.id);
      toast.success(`Prediction #${toDelete.id} deleted.`);
      setToDelete(null);
      if (data.predictions.length === 1 && page > 1) setPage(page - 1); else load();
    } catch (e) { toast.error(e.message); } finally { setDeleting(false); }
  };

  const pg = data?.pagination;
  const filtered = Boolean(dq || crop);

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Prediction history</h1><p className="mt-1 text-soil-700">Every prediction saved by this application.</p></div>

      <div className="card grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><label className="label" htmlFor="h-search">Search by ID, crop, state or district</label>
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-soil-500" aria-hidden="true" /><input id="h-search" className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Karnataka" /></div></div>
        <div><label className="label" htmlFor="h-crop">Crop</label><select id="h-crop" className="input" value={crop} onChange={(e) => setCrop(e.target.value)}><option value="">All crops</option>{CROPS.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}</select></div>
      </div>

      {loading && !data && <LoadingSpinner label="Loading history…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {data && !error && (pg.total === 0 ? (
        <EmptyState title={filtered ? "No predictions match your search" : "No predictions yet"}>
          {filtered ? "Try a different search or clear the crop filter." : <>Your predictions will be listed here. <Link className="font-semibold text-field-700 underline" to="/predict">Make a prediction</Link></>}
        </EmptyState>
      ) : (
        <div className={loading ? "opacity-60" : ""} aria-busy={loading}>
          <PredictionHistoryTable rows={data.predictions} sortBy={sort.by} order={sort.order} onSort={onSort} onView={setSelected} onDelete={setToDelete} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p aria-live="polite">{pg.total} record{pg.total === 1 ? "" : "s"} · page {pg.page} of {pg.total_pages}</p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">Rows <select className="input w-auto py-1" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>{PAGE_SIZES.map((n) => <option key={n}>{n}</option>)}</select></label>
              <button className="btn-secondary px-3" disabled={pg.page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <button className="btn-secondary px-3" disabled={pg.page >= pg.total_pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}

      <RecordDetails record={selected} onClose={() => setSelected(null)} />
      <ConfirmDialog open={Boolean(toDelete)} busy={deleting} title="Delete this prediction?" message={toDelete ? `Prediction #${toDelete.id} (${titleCase(toDelete.crop)}, ${toDelete.district_name}) will be permanently removed.` : ""} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
