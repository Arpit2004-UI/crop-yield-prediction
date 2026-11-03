import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { getHealth } from "../services/api";

function StatusBanner() {
  const [problem, setProblem] = useState(null);
  useEffect(() => {
    getHealth()
      .then((h) => {
        if (!h.model?.loaded) setProblem(h.model?.detail || "The prediction model is not loaded.");
        else if (!h.database?.connected) setProblem("The database is not reachable. Predictions cannot be saved.");
      })
      .catch((e) => setProblem(e.message));
  }, []);
  if (!problem) return null;
  return <div className="border-b border-red-300 bg-red-50 px-4 py-2 text-center text-sm text-red-900" role="alert">{problem}</div>;
}

export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">Skip to content</a>
      <Navbar />
      <StatusBanner />
      <div className={`mx-auto w-full flex-1 ${isHome ? "" : "flex max-w-7xl gap-8 px-4 py-8"}`}>
        {!isHome && <Sidebar />}
        <main id="main" className={isHome ? "" : "min-w-0 flex-1"}><Outlet /></main>
      </div>
      <Footer />
    </div>
  );
}
