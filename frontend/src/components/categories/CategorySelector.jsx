import React, { useState, useEffect, useRef } from "react";
import { findParentChain, findDescendants } from "../../utils/categoryUtils";
import CategoryTree from "./CategoryTree";

export default function CategorySelector({
  categoryTree,
  flatCategories,
  formData,
  setFormData,
}) {
  const [expandedIds, setExpandedIds] = useState([]);
  const [autoCollapse, setAutoCollapse] = useState(true);
  const deselectedIdRef = useRef(null);

  // Handle collapsing descendants after deselection
  useEffect(() => {
    if (autoCollapse && deselectedIdRef.current) {
      const descendants = findDescendants(
        deselectedIdRef.current,
        flatCategories,
      );
      setExpandedIds((prev) =>
        prev.filter(
          (eid) =>
            eid !== deselectedIdRef.current && !descendants.includes(eid),
        ),
      );
      deselectedIdRef.current = null;
    }
  }, [autoCollapse, flatCategories]);

  const handleSelect = (id) => {
    const isSelected = formData.categories.includes(id);
    const descendants = findDescendants(id, flatCategories);

    setFormData((prev) => {
      if (isSelected) {
        // Deselect self + descendants
        return {
          ...prev,
          categories: prev.categories.filter(
            (cid) => cid !== id && !descendants.includes(cid),
          ),
        };
      } else {
        // Select self + all parents
        const parentChain = findParentChain(id, flatCategories);
        return {
          ...prev,
          categories: [...new Set([...prev.categories, id, ...parentChain])],
        };
      }
    });

    if (isSelected && autoCollapse) {
      setExpandedIds((prev) =>
        prev.filter((eid) => eid !== id && !descendants.includes(eid)),
      );
    }
  };

  const handleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id],
    );
  };

  return (
    <div className="w-full">
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl w-full max-h-52 overflow-y-auto shadow-2xs">
        <CategoryTree
          categoryTree={categoryTree}
          selectedIds={formData.categories}
          expandedIds={expandedIds}
          onSelect={handleSelect}
          onExpand={handleExpand}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Automatyczne zwijanie podkategorii (Auto-collapse)
        </span>
        <button
          type="button"
          onClick={() => setAutoCollapse(!autoCollapse)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            autoCollapse ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              autoCollapse ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
