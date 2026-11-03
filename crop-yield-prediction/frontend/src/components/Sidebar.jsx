import { NavLink } from "react-router-dom";
import { BarChart3, ClipboardList, Wheat } from "lucide-react";

const items = [
  { to: "/predict", label: "New prediction", icon: Wheat },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/history", label: "Prediction history", icon: ClipboardList },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 lg:block" aria-label="Application sections">
      <ul className="sticky top-20 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }) => `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-field-100 text-field-800" : "text-soil-700 hover:bg-soil-100"}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />{label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
