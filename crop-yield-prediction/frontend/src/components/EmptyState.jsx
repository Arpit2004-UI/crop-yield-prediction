import { Inbox } from "lucide-react";

export default function EmptyState({ title, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-soil-200 bg-white px-6 py-12 text-center">
      <Inbox className="h-10 w-10 text-soil-500" aria-hidden="true" />
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="max-w-sm text-sm text-soil-700">{children}</div>
    </div>
  );
}
