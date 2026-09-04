import React from "react";

/**
 * Standardowe przyciski akcji — używaj wszędzie.
 * variant: "primary" | "secondary" | "dark" | "danger" | "danger-outline" | "success" | "warning" | "sky" | "ghost"
 */
const Btn = ({ children, variant = "primary", size = "normal", className = "", ...props }) => {
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-[9px] sm:text-[10px] gap-1 rounded-full",
    normal: "px-5 py-2.5 text-[10px] sm:text-xs gap-1.5 rounded-full",
    lg: "px-6 py-3.5 text-xs sm:text-sm gap-2 rounded-full",
  };
  const base = `font-bold tracking-wider uppercase transition-all duration-250 active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center cursor-pointer select-none hover:-translate-y-0.5 shadow-sm hover:shadow-md ${sizeClasses[size] ?? sizeClasses.normal}`;
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 shadow-md hover:shadow-indigo-500/25 border border-indigo-500/10",
    secondary: "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-350 dark:hover:border-slate-700",
    dark: "bg-slate-950 dark:bg-slate-900 text-white hover:bg-slate-900 dark:hover:bg-slate-850 border border-slate-850 dark:border-slate-800 hover:shadow-md",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-rose-500/25 border border-red-500/10",
    "danger-outline": "bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 hover:bg-red-100/60 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300",
    success: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-emerald-500/25 border border-emerald-500/10",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-orange-500/25 border border-amber-500/10",
    sky: "bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:from-sky-500 hover:to-blue-600 shadow-md hover:shadow-blue-500/25 border border-sky-500/10",
    ghost: "bg-transparent text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800/60",
  };
  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Btn;
