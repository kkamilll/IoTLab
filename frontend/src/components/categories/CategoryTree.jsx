import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";

export default function CategoryTree({ categoryTree = [], selectedIds, expandedIds, onSelect, onExpand }) {
  const { language } = useLanguage();
  return (
    <ul className="space-y-1.5 list-none pl-1">
      {categoryTree.map(cat => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expandedIds.includes(cat._id);
        const isSelected = selectedIds.includes(cat._id);

        return (
          <li key={cat._id.toString()} className="flex flex-col">
            <div className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/40 transition group">
              {/* Expand/collapse button */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => onExpand(cat._id)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="w-6 h-6 flex-shrink-0" />
              )}

              {/* Folder Icon representing hierarchy */}
              <span className="text-indigo-500/70 dark:text-indigo-405/75 flex-shrink-0 flex items-center justify-center">
                {hasChildren ? (
                  isExpanded ? <FolderOpen size={15} /> : <Folder size={15} />
                ) : (
                  <span className="text-slate-450 dark:text-slate-500 text-xs">📄</span>
                )}
              </span>

              {/* Checkbox and Category Name */}
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelect(cat._id)}
                  className="rounded border-slate-350 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/10 focus:ring-offset-0 w-4.5 h-4.5 cursor-pointer accent-indigo-600 transition"
                />
                <span className="group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition">
                  {language === "en" && cat.nameEn ? cat.nameEn : cat.name}
                </span>
              </label>
            </div>

            {/* Render children recursively if expanded */}
            {isExpanded && hasChildren && (
              <div className="ml-4 pl-2.5 border-l border-slate-200/80 dark:border-slate-800/80 mt-1">
                <CategoryTree
                  categoryTree={cat.children}
                  selectedIds={selectedIds}
                  expandedIds={expandedIds}
                  onSelect={onSelect}
                  onExpand={onExpand}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
