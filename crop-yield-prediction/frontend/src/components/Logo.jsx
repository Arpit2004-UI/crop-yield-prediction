import { Sprout } from "lucide-react";

export default function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-lg font-bold text-field-800 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-field-700 text-white"><Sprout className="h-5 w-5" aria-hidden="true" /></span>
      Smart Crop Yield
    </span>
  );
}
