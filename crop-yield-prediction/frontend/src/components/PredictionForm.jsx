import { useMemo, useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import FormField from "./FormField";
import { EMPTY_FORM, NUMERIC_FIELDS, validatePrediction } from "../utils/validation";
import { titleCase } from "../utils/format";

export default function PredictionForm({ options, submitting, serverErrors, onSubmit }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [clientErrors, setClientErrors] = useState({});
  const errors = { ...serverErrors, ...clientErrors };
  const districts = useMemo(() => options.districts_by_state[values["State Name"]] || [], [options, values]);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value, ...(name === "State Name" ? { "Dist Name": "" } : {}) }));
    setClientErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validatePrediction(values, options);
    setClientErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(values);
    else document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
  };

  const props = (name) => ({
    id: `f-${name}`, value: values[name], disabled: submitting,
    onChange: (e) => set(name, e.target.value),
    className: `input ${errors[name] ? "input-error" : ""}`,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `f-${name}-error` : `f-${name}-hint`,
  });

  return (
    <form onSubmit={submit} noValidate className="card space-y-6" aria-busy={submitting}>
      <fieldset className="grid gap-4 sm:grid-cols-3" disabled={submitting}>
        <legend className="mb-3 font-display text-lg font-semibold">Location and crop</legend>
        <FormField id="f-Crop" label="Crop" error={errors.Crop}>
          <select {...props("Crop")}><option value="">Select crop</option>{options.crops.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}</select>
        </FormField>
        <FormField id="f-State Name" label="State" error={errors["State Name"]} hint={`${options.states.length} states covered by the model`}>
          <select {...props("State Name")}><option value="">Select state</option>{options.states.map((s) => <option key={s}>{s}</option>)}</select>
        </FormField>
        <FormField id="f-Dist Name" label="District" error={errors["Dist Name"]}>
          <select {...props("Dist Name")} disabled={submitting || !values["State Name"]}>
            <option value="">{values["State Name"] ? "Select district" : "Choose a state first"}</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </FormField>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" disabled={submitting}>
        <legend className="mb-3 font-display text-lg font-semibold">Year, area and conditions</legend>
        {NUMERIC_FIELDS.map((f) => (
          <FormField key={f.name} id={`f-${f.name}`} label={f.label} error={errors[f.name]} hint={f.hint}>
            <input type="number" inputMode="decimal" step={f.step} {...props(f.name)} />
          </FormField>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Predicting…</> : <><Calculator className="h-4 w-4" aria-hidden="true" />Predict crop yield</>}
        </button>
        <button type="button" className="btn-secondary" disabled={submitting} onClick={() => { setValues(EMPTY_FORM); setClientErrors({}); }}>Clear form</button>
      </div>
    </form>
  );
}
