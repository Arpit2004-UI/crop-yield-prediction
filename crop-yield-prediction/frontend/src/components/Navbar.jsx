import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/predict", label: "Predict" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
];

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-field-100 text-field-800" : "text-soil-700 hover:bg-soil-100"}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-soil-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Main">
        <Link to="/" aria-label="Smart Crop Yield home"><Logo /></Link>
        <ul className="hidden gap-1 md:flex">
          {NAV.map((n) => <li key={n.to}><NavLink to={n.to} end={n.to === "/"} className={linkClass}>{n.label}</NavLink></li>)}
        </ul>
        <button className="rounded-md p-2 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <ul className="border-t border-soil-200 px-4 py-2 md:hidden">
          {NAV.map((n) => <li key={n.to}><NavLink to={n.to} end={n.to === "/"} className={linkClass} onClick={() => setOpen(false)}>{n.label}</NavLink></li>)}
        </ul>
      )}
    </header>
  );
}
