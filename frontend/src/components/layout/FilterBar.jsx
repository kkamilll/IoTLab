import React from "react";

/**
 * Standardowy filtr-bar z polem wyszukiwania i opcjonalnymi dziećmi (dropdowny, selecty).
 */
const FilterBar = ({ searchValue, onSearchChange, searchPlaceholder = "Search...", searchLabel, children }) => (
  <div className="w-full bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div className="flex flex-col gap-1 w-full md:max-w-xs">
      {searchLabel && (
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
          {searchLabel}
        </label>
      )}
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={onSearchChange}
        className="border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full"
      />
    </div>
    {children && (
      <div className="flex flex-wrap items-end gap-3 w-full md:w-auto justify-start md:justify-end">
        {children}
      </div>
    )}
  </div>
);

export default FilterBar;
