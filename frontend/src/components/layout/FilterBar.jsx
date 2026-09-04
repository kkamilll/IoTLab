import React from "react";
import { FaSearch } from "react-icons/fa";

/**
 * Standardowy filtr-bar z polem wyszukiwania i opcjonalnymi dziećmi (dropdowny, selecty).
 */
const FilterBar = ({ searchValue, onSearchChange, searchPlaceholder = "Search...", searchLabel, children }) => (
  <div className="w-full bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-wrap items-end gap-3 md:gap-4">
    <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[200px] md:min-w-[280px]">
      {searchLabel && (
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
          {searchLabel}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <FaSearch className="text-slate-400 dark:text-slate-500" size={13} />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
          className="border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all duration-200 w-full"
        />
      </div>
    </div>
    {children}
  </div>
);

export default FilterBar;
