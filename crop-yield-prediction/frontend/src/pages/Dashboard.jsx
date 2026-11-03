import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardCards from "../components/DashboardCards";
import { PredictionsByCrop, PredictionsOverTime } from "../components/YieldChart";
import PredictionHistoryTable from "../components/PredictionHistoryTable";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import { getDashboardStats } from "../services/api";
import { titleCase } from "../utils/format";

const CROPS = ["chickpea", "cotton", "maize", "rice"];

export default function Dashboard() {
  const [filters, setFilters] = useState({ crop: "", state: "", date_from: "", date_to: "" });
  const [stats, setStats] = useState(null);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const d = await getDashboardStats(params);
      setStats(d.stats);
      setStates((prev) => (prev.length ? prev : d.stats.available_states));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const filtered = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-soil-700">Based on predictions made in this application. These are model estimates, not historical yield measurements. Dates are in UTC.</p>
      </div>

      <form className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(e) => e.preventDefault()} aria-label="Dashboard filters">
        <div><label className="label" htmlFor="d-crop">Crop</label><select id="d-crop" className="input" value={filters.crop} onChange={set("crop")}><option value="">All crops</option>{CROPS.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}</select></div>
        <div><label className="label" htmlFor="d-state">State</label><select id="d-state" className="input" value={filters.state} onChange={set("state")}><option value="">All states</option>{states.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="label" htmlFor="d-from">From date</label><input id="d-from" type="date" className="input" value={filters.date_from} max={filters.date_to || undefined} onChange={set("date_from")} /></div>
        <div><label className="label" htmlFor="d-to">To date</label><input id="d-to" type="date" className="input" value={filters.date_to} min={filters.date_from || undefined} onChange={set("date_to")} /></div>
        <div className="flex items-end"><button type="button" className="btn-secondary w-full" disabled={!filtered} onClick={() => setFilters({ crop: "", state: "", date_from: "", date_to: "" })}>Clear filters</button></div>
      </form>

      {loading && !stats && <LoadingSpinner label="Loading dashboard…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {stats && !error && (stats.total_predictions === 0 ? (
        <EmptyState title={filtered ? "No predictions match these filters" : "No predictions yet"}>
          {filtered ? "Try widening the filters." : <>Make your first prediction and it will appear here. <Link className="font-semibold text-field-700 underline" to="/predict">Predict crop yield</Link></>}
        </EmptyState>
      ) : (
        <div className={loading ? "space-y-6 opacity-60" : "space-y-6"} aria-busy={loading}>
          <DashboardCards stats={stats} />
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card"><h2 className="mb-3 font-display text-lg font-semibold">Predictions over time</h2><PredictionsOverTime data={stats.predictions_over_time} /></section>
            <section className="card"><h2 className="mb-3 font-display text-lg font-semibold">Predictions by crop</h2><PredictionsByCrop data={stats.predictions_by_crop} /></section>
          </div>
          <section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Recent predictions</h2><Link to="/history" className="text-sm font-semibold text-field-700 underline">View all</Link></div>
            <PredictionHistoryTable rows={stats.recent_predictions} compact /></section>
        </div>
      ))}
    </div>
  );
}
