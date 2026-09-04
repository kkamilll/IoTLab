import React from "react";

/**
 * Standardowe wejście tekstowe. Używaj wszędzie w formularzach.
 */
const Input = ({ label, id, className = "", ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`border border-slate-250/70 dark:border-slate-850/80 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 hover:bg-slate-50/80 dark:hover:bg-slate-950/50 hover:border-slate-350 dark:hover:border-slate-755 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:bg-slate-900/60 transition-all duration-200 shadow-sm focus:shadow-md ${className}`}
      {...props}
    />
  </div>
);

export const Textarea = ({ label, id, className = "", ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
        {label}
      </label>
    )}
    <textarea
      id={id}
      className={`border border-slate-250/70 dark:border-slate-850/80 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 hover:bg-slate-50/80 dark:hover:bg-slate-950/50 hover:border-slate-350 dark:hover:border-slate-755 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:bg-slate-900/60 transition-all duration-200 resize-none shadow-sm focus:shadow-md ${className}`}
      {...props}
    />
  </div>
);

export const Select = ({ label, id, children, className = "", ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider pl-1">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`border border-slate-250/70 dark:border-slate-850/80 rounded-xl px-3.5 py-2.5 pr-10 text-sm bg-slate-50/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 hover:bg-slate-50/80 dark:hover:bg-slate-950/50 hover:border-slate-350 dark:hover:border-slate-755 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:bg-slate-900/60 transition-all duration-200 shadow-sm focus:shadow-md appearance-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export default Input;
