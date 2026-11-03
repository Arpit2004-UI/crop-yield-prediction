import { BarChart3, Sprout, Wheat } from "lucide-react";
import { fmtInt, fmtNumber, titleCase } from "../utils/format";

export default function DashboardCards({ stats }) {
  const cards = [
    { label: "Recorded predictions", value: fmtInt(stats.total_predictions), icon: BarChart3 },
    { label: "Most predicted crop", value: stats.most_predicted_crop ? titleCase(stats.most_predicted_crop) : "–", icon: Wheat },
    { label: "Average predicted yield", value: stats.average_predicted_yield_kg_per_ha != null ? `${fmtNumber(stats.average_predicted_yield_kg_per_ha)} kg/ha` : "–", icon: Sprout },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="card flex items-center gap-4">
          <div className="rounded-md bg-field-100 p-3 text-field-700"><Icon className="h-6 w-6" aria-hidden="true" /></div>
          <div><p className="text-sm text-soil-700">{label}</p><p className="font-display text-2xl font-bold">{value}</p></div>
        </div>
      ))}
    </div>
  );
}
