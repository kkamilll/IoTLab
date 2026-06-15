import React from "react";

/**
 * Standardowe wejście tekstowe. Używaj wszędzie w formularzach.
 */
const Input = ({ label, id, className = "", ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:bg-slate-900 transition ${className}`}
      {...props}
    />
  </div>
);

export const Textarea = ({ label, id, className = "", ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
        {label}
      </label>
    )}
    <textarea
      id={id}
      className={`border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:bg-slate-900 transition resize-none ${className}`}
      {...props}
    />
  </div>
);

export const Select = ({ label, id, children, className = "", ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:bg-slate-900 transition ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export default Input;
