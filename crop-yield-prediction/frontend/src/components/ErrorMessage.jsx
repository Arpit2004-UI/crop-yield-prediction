import { AlertTriangle } from "lucide-react";

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900" role="alert">
      <div className="flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{message}</p></div>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}
