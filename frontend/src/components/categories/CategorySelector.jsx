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
    <div>
      <div className="p-4 border rounded max-w-md max-h-96 overflow-y-auto">
        <CategoryTree
          categoryTree={categoryTree}
          selectedIds={formData.categories}
          expandedIds={expandedIds}
          onSelect={handleSelect}
          onExpand={handleExpand}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm font-medium">Auto-collapse:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={autoCollapse}
            onChange={() => setAutoCollapse(!autoCollapse)}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
          <div
            className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform 
          ${autoCollapse ? "translate-x-5" : "translate-x-0"}`}
          ></div>
        </label>
      </div>
    </div>
  );
}
