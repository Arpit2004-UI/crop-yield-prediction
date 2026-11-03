import { fmtDateTime, fmtNumber, titleCase } from "../utils/format";
import CropCaution from "./CropCaution";

export const SUMMARY_ROWS = (r) => [
  ["Crop", titleCase(r.crop)], ["Year", r.year], ["State", r.state_name], ["District", r.district_name],
  ["Cultivated area", `${fmtNumber(r.area_ha)} ha`], ["Temperature", `${fmtNumber(r.temperature_c, 1)} °C`],
  ["Humidity", `${fmtNumber(r.humidity, 1)} %`], ["Soil pH", fmtNumber(r.soil_ph, 1)],
  ["Rainfall", `${fmtNumber(r.rainfall_mm, 0)} mm`], ["Wind speed", `${fmtNumber(r.wind_speed_m_s, 1)} m/s`],
  ["Solar radiation", `${fmtNumber(r.solar_radiation, 1)} MJ/m²/day`],
];

export function InputSummary({ record }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {SUMMARY_ROWS(record).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-soil-100 pb-1"><dt className="text-soil-700">{k}</dt><dd className="font-medium">{v}</dd></div>
      ))}
    </dl>
  );
}

export default function PredictionResult({ result }) {
  const { prediction: p, inputs, warnings } = result;
  return (
    <section className="card space-y-5" aria-labelledby="result-title">
      <h2 id="result-title" className="font-display text-xl font-semibold">Prediction result</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md bg-field-50 p-4">
          <p className="text-sm text-field-800">Predicted yield (per hectare)</p>
          <p className="mt-1 font-display text-3xl font-bold text-field-900">{fmtNumber(p.predicted_yield_kg_per_ha)} <span className="text-base font-normal">kg/ha</span></p>
        </div>
        <div className="rounded-md bg-soil-100 p-4">
          <p className="text-sm text-soil-700">Estimated production (whole area)</p>
          <p className="mt-1 font-display text-3xl font-bold">{fmtNumber(p.estimated_production_kg, 0)} <span className="text-base font-normal">kg</span></p>
          <p className="mt-1 text-xs text-soil-700">= {fmtNumber(p.predicted_yield_kg_per_ha)} kg/ha × {fmtNumber(p.area_ha)} ha</p>
        </div>
      </div>
      <p className="text-sm text-soil-700">
        The model estimates that {titleCase(p.crop)} in {inputs.district_name}, {inputs.state_name} would yield about {fmtNumber(p.predicted_yield_kg_per_ha, 0)} kg per hectare
        in {inputs.year}, based on patterns in historical data. Yield is per hectare; production multiplies it by your area. This is an estimate, not a guaranteed outcome, and no confidence level is available.
      </p>
      <CropCaution items={warnings} />
      <div><h3 className="mb-2 font-semibold">Input summary</h3><InputSummary record={inputs} /></div>
      <p className="text-xs text-soil-500">Record #{p.id} · generated {fmtDateTime(p.created_at)} · saved to prediction history</p>
    </section>
  );
}
