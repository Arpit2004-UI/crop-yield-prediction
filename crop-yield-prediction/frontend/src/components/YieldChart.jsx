import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { titleCase } from "../utils/format";

export function PredictionsOverTime({ data }) {
  return (
    <div className="h-64" role="img" aria-label="Line chart of predictions made per day">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2dbcf" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [v, "Predictions"]} />
          <Line type="monotone" dataKey="count" stroke="#335c28" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PredictionsByCrop({ data }) {
  const rows = data.map((d) => ({ ...d, name: titleCase(d.crop) }));
  return (
    <div className="h-64" role="img" aria-label="Bar chart of predictions grouped by crop">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2dbcf" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [v, "Predictions"]} />
          <Bar dataKey="count" fill="#4f8a3c" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
