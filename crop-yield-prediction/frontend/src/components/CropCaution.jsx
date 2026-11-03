import { AlertTriangle } from "lucide-react";

export default function CropCaution({ items }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="note">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Interpret with caution</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{items.map((w) => <li key={w}>{w}</li>)}</ul>
    </div>
  );
}
