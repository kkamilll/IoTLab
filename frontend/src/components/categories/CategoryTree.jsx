import React from "react";

export default function CategoryTree({ categoryTree = [], selectedIds, expandedIds, onSelect, onExpand }) {
  return (
    <ul className="pl-4 list-none">
      {categoryTree.map(cat => (
        <li key={cat._id.toString()}>
          <div className="flex items-center gap-2">
            {/* Expand/collapse button if has children */}
            {cat.children && cat.children.length > 0 ? (
              <button
                type="button"
                onClick={() => onExpand(cat._id)}
                className="w-5 text-xs"
              >
                {expandedIds.includes(cat._id) ? "▼" : "▶"}
              </button>
            ) : (
              <span className="w-5 inline-block"></span> 
            )}

            {/* Category checkbox */}
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(cat._id)}
                onChange={() => onSelect(cat._id)}
                className="mr-1"
              />
              {cat.name}
            </label>
          </div>

          {/* Render children recursively if expanded */}
          {expandedIds.includes(cat._id) && cat.children && cat.children.length > 0 && (
            <CategoryTree
              categoryTree={cat.children}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onExpand={onExpand}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
