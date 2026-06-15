import React from "react";

/**
 * Standardowy filtr-bar z polem wyszukiwania i opcjonalnymi dziećmi (dropdowny, selecty).
 */
const FilterBar = ({ searchValue, onSearchChange, searchPlaceholder = "Search...", children }) => (
  <div className="flex flex-col sm:flex-row gap-3 w-full justify-between items-center bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
    <input
      type="text"
      placeholder={searchPlaceholder}
      value={searchValue}
      onChange={onSearchChange}
      className="border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:max-w-xs"
    />
    {children && (
      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
        {children}
      </div>
    )}
  </div>
);

export default FilterBar;
