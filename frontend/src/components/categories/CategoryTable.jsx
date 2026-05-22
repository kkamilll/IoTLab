import React, { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFolder,
  FaInfoCircle,
} from "react-icons/fa";

export default function CategoryCards({
  categoryTree,
  handleEdit,
  handleDelete,
  handleAdd,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showDescriptionIds, setShowDescriptionIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const toggleDescription = (id) => {
    setShowDescriptionIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  // Flatten tree iteratively
  const flattenTreeNonRecursive = (nodes) => {
    let result = [];
    let stack = nodes.map((node) => ({ ...node, level: 0 }));
    while (stack.length) {
      const current = stack.shift();
      result.push(current);
      if (
        current.children &&
        current.children.length > 0 &&
        expandedIds.has(current._id)
      ) {
        const childrenWithLevel = current.children.map((child) => ({
          ...child,
          level: current.level + 1,
        }));
        stack = [...childrenWithLevel, ...stack];
      }
    }
    return result;
  };

  const flatCategories = flattenTreeNonRecursive(categoryTree);

  const levelColors = [
    "bg-white border border-slate-200",
    "bg-slate-50/60 border border-slate-200/80",
    "bg-slate-50 border border-slate-200/60",
    "bg-slate-100/50 border border-slate-200/40"
  ];

  if (!categoryTree || categoryTree.length === 0) {
    return (
      <div className="text-slate-400 text-center p-8 font-medium">No categories created yet.</div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-3">
      {flatCategories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category._id);
        const showDescription = showDescriptionIds.has(category._id);
        const colorClass = levelColors[Math.min(category.level, levelColors.length - 1)];

        return (
          <div
            key={category._id}
            style={{ marginLeft: `${category.level * 20}px` }}
            className={`p-4 rounded-xl flex flex-col transition hover:shadow-md ${colorClass}`}
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FaFolder size={16} className="text-indigo-500 flex-shrink-0" />
                <span className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                  {category.name}
                </span>
                
                {category.isVisible ? (
                  <FaEye className="text-emerald-500 flex-shrink-0" title="Visible" size={14} />
                ) : (
                  <FaEyeSlash className="text-slate-400 flex-shrink-0" title="Hidden" size={14} />
                )}
              </div>

              <div className="flex items-center gap-2 ml-2">
                {/* Przycisk informacji */}
                {category.description && (
                  <button
                    onClick={() => toggleDescription(category._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors flex items-center justify-center"
                    title="Show description"
                  >
                    <FaInfoCircle size={15} />
                  </button>
                )}

                {/* Przycisk rozwijania dzieci */}
                {hasChildren && (
                  <button
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-bold flex items-center justify-center text-sm"
                    onClick={() => toggleExpand(category._id)}
                  >
                    {isExpanded ? "−" : "+"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 items-center">
              <ActionButton
                icon={<FaPlus size={12} />}
                label="Add Subcategory"
                color="indigo"
                onClick={() => handleAdd(category)}
              />
              <ActionButton
                icon={<FaEdit size={12} />}
                label="Edit"
                color="slate"
                onClick={() => handleEdit(category)}
              />
              <ActionButton
                icon={<FaTrash size={12} />}
                label="Delete"
                color="red"
                onClick={() => handleDelete(category._id)}
              />
            </div>

            {showDescription && category.description && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-xs sm:text-sm leading-relaxed">
                {category.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const ActionButton = ({ icon, label, color, onClick }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80",
    slate: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    red: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition ${colors[color]}`}
    >
      {icon} {label}
    </button>
  );
};
