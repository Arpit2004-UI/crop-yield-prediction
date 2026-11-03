import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-soil-700" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span>{label}</span>
    </div>
  );
}
