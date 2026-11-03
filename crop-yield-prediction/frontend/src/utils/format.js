export const fmtNumber = (n, digits = 2) =>
  n === null || n === undefined ? "–" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const fmtInt = (n) => (n === null || n === undefined ? "–" : Number(n).toLocaleString("en-IN"));
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "–");
export const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
export const fmtTonnes = (kg) => `${fmtNumber(kg / 1000, 2)} t`;
