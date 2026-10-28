import React from "react";

/**
 * Standardowe przyciski akcji — używaj wszędzie.
 * variant: "primary" | "secondary" | "dark" | "danger" | "danger-outline" | "success" | "warning" | "sky" | "ghost"
 */
const Btn = ({ children, variant = "primary", size = "normal", className = "", ...props }) => {
  const sizeClasses = {
    sm: "h-8 px-3.5 text-[9px] sm:text-[10px] gap-1.5 rounded-full",
    normal: "h-10 px-4 sm:px-5 text-xs gap-2 rounded-full",
    lg: "h-12 px-6 text-sm gap-2.5 rounded-full",
  };
  const base = `font-bold tracking-wider uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 inline-flex items-center justify-center cursor-pointer select-none hover:-translate-y-0.5 shadow-sm hover:shadow-md box-border shrink-0 ${sizeClasses[size] ?? sizeClasses.normal}`;
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 shadow-md hover:shadow-indigo-500/25 border border-indigo-500/20",
    secondary: "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-350 dark:hover:border-slate-600",
    dark: "bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-850 dark:hover:bg-slate-750 border border-slate-800 dark:border-slate-700 hover:shadow-md",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-rose-500/25 border border-red-500/20",
    "danger-outline": "bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 hover:bg-red-100/60 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300",
    success: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-emerald-500/25 border border-emerald-500/20",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-orange-500/25 border border-amber-500/20",
    sky: "bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:from-sky-500 hover:to-blue-600 shadow-md hover:shadow-blue-500/25 border border-sky-500/20",
    ghost: "bg-transparent text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-800/60",
  };
  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Btn;
