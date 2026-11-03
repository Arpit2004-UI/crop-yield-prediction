import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, ClipboardList, Database, FileInput, Cpu, LineChart } from "lucide-react";

const CROPS = [["Chickpea", "Pulse crop"], ["Cotton", "Fibre crop · low reliability"], ["Maize", "Cereal crop"], ["Rice", "Cereal crop"]];
const FEATURES = [
  { icon: Cpu, title: "Real model output", text: "Every number comes from your trained Extra Trees pipeline running on the Flask server. Nothing is calculated in the browser." },
  { icon: Database, title: "Saved history", text: "Each prediction is stored in MySQL so you can search, sort and review it later." },
  { icon: BarChart3, title: "Usage dashboard", text: "Charts show your own prediction history, never made-up agricultural statistics." },
  { icon: ClipboardList, title: "Input checks", text: "States and districts are limited to what the model has seen, so it never guesses on unknown places." },
];
const STEPS = [
  [FileInput, "Enter details", "Choose crop, state, district, year, area and growing conditions."],
  [Cpu, "Model runs on the server", "The API validates the inputs and passes them to the saved pipeline."],
  [LineChart, "Review the estimate", "See yield in kg/ha, estimated production for your area, and any cautions."],
];

export default function Home() {
  return (
    <>
      <section className="border-b border-soil-200 bg-field-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight text-field-900 md:text-5xl">Estimate crop yield from historical district data</h1>
            <p className="mt-4 max-w-lg text-lg text-soil-700">Pick a crop and district, describe the growing conditions, and get a yield estimate in kg per hectare from a machine learning model trained on records from 1966 to 2017.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/predict" className="btn-primary">Predict Crop Yield</Link>
              <Link to="/dashboard" className="btn-secondary">Explore Dashboard</Link>
            </div>
          </div>
          <div className="card space-y-3" aria-label="Example of what a prediction shows">
            <p className="text-sm text-soil-700">A prediction shows two separate numbers</p>
            <div className="rounded-md bg-field-50 p-4"><p className="text-sm text-field-800">Predicted yield</p><p className="font-display text-2xl font-bold">kg per hectare</p></div>
            <div className="rounded-md bg-soil-100 p-4"><p className="text-sm text-soil-700">Estimated production</p><p className="font-display text-2xl font-bold">yield × your area</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold">What the system does</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card"><Icon className="h-6 w-6 text-field-700" aria-hidden="true" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-1 text-sm text-soil-700">{text}</p></div>
          ))}
        </div>
      </section>

      <section className="border-y border-soil-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="font-display text-2xl font-bold">Supported crops</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CROPS.map(([n, d]) => <li key={n} className="rounded-md border border-soil-200 p-4"><p className="font-semibold">{n}</p><p className="text-sm text-soil-700">{d}</p></li>)}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map(([Icon, t, d], i) => (
            <li key={t} className="card"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-field-700 text-sm font-bold text-white">{i + 1}</span><h3 className="mt-3 flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" aria-hidden="true" />{t}</h3><p className="mt-1 text-sm text-soil-700">{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-950" role="note">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold"><AlertTriangle className="h-5 w-5" aria-hidden="true" />Model limitations</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
            <li>Overall test R² is about 0.74 (MAE ≈ 482 kg/ha). By crop, R² is about 0.68 for rice, 0.53 for maize and 0.40 for chickpea.</li>
            <li>Cotton predictions are unreliable: its test R² is negative (about −0.07).</li>
            <li>The model covers 7 states and 120 districts only. Other places are rejected rather than guessed.</li>
            <li>Weather and soil values in the training data take only a few repeated values, so they add little information.</li>
            <li>Training data ends in 2017. Accuracy for current conditions has not been established.</li>
            <li>Results are estimates, not guaranteed agricultural outcomes.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
