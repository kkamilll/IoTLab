import React from "react";

/**
 * Standardowe przyciski akcji — używaj wszędzie.
 * variant: "primary" | "secondary" | "danger" | "success" | "ghost"
 */
const Btn = ({ children, variant = "primary", className = "", ...props }) => {
  const base = "px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200/60 hover:bg-slate-200",
    dark: "bg-slate-800 text-white hover:bg-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
    "danger-outline": "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    sky: "bg-sky-600 text-white hover:bg-sky-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-slate-200",
  };
  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Btn;
