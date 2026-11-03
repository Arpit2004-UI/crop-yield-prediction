// Client-side validation is for fast feedback only. The Flask API re-validates everything.
export const NUMERIC_FIELDS = [
  { name: "Year", label: "Year", min: 1900, max: 2100, step: 1, integer: true, hint: "Training data covers 1966–2017" },
  { name: "Area_ha", label: "Cultivated area (ha)", min: 0.01, max: 5000000, step: "any", hint: "Hectares, greater than 0" },
  { name: "Temperature_C", label: "Temperature (°C)", min: -10, max: 55, step: "any", hint: "Training values: 20–28" },
  { name: "Humidity_%", label: "Humidity (%)", min: 0, max: 100, step: "any", hint: "Training values: 60–80" },
  { name: "pH", label: "Soil pH", min: 3, max: 10, step: "any", hint: "Training values: 6.0–6.5" },
  { name: "Rainfall_mm", label: "Rainfall (mm)", min: 0, max: 10000, step: "any", hint: "Training values: 600–1200" },
  { name: "Wind_Speed_m_s", label: "Wind speed (m/s)", min: 0, max: 50, step: "any", hint: "Training values: 1.5–3.0" },
  { name: "Solar_Radiation_MJ_m2_day", label: "Solar radiation (MJ/m²/day)", min: 0, max: 40, step: "any", hint: "Training values: 16–22" },
];

export const EMPTY_FORM = {
  Crop: "", "State Name": "", "Dist Name": "", Year: "", Area_ha: "", Temperature_C: "",
  "Humidity_%": "", pH: "", Rainfall_mm: "", Wind_Speed_m_s: "", Solar_Radiation_MJ_m2_day: "",
};

export function validatePrediction(values, options) {
  const errors = {};
  if (!values.Crop) errors.Crop = "Select a crop.";
  if (!values["State Name"]) errors["State Name"] = "Select a state.";
  if (!values["Dist Name"]) errors["Dist Name"] = "Select a district.";
  else if (options && !options.districts_by_state?.[values["State Name"]]?.includes(values["Dist Name"]))
    errors["Dist Name"] = "Select a district that belongs to the chosen state.";

  for (const f of NUMERIC_FIELDS) {
    const raw = values[f.name];
    if (raw === "" || raw === null || raw === undefined) { errors[f.name] = `${f.label} is required.`; continue; }
    const n = Number(raw);
    if (!Number.isFinite(n)) { errors[f.name] = `${f.label} must be a number.`; continue; }
    if (f.name === "Area_ha" && n <= 0) { errors[f.name] = "Cultivated area must be greater than zero."; continue; }
    if (n < f.min || n > f.max) { errors[f.name] = `${f.label} must be between ${f.min} and ${f.max}.`; continue; }
    if (f.integer && !Number.isInteger(n)) errors[f.name] = "Year must be a whole number.";
  }
  return errors;
}

export function toPayload(values) {
  const p = { Crop: values.Crop, "State Name": values["State Name"], "Dist Name": values["Dist Name"] };
  for (const f of NUMERIC_FIELDS) p[f.name] = Number(values[f.name]);
  return p;
}
