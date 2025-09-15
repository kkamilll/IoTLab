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

  // Strongly different colors per level
const levelColors = [
  "bg-blue-50",   // niemal biały niebieski
  "bg-blue-200",  // jasny niebieski
  "bg-blue-300",  // średni jasny
  "bg-blue-400",  // średni
  "bg-blue-500",  // wyraźny
  "bg-blue-600",  // ciemny
  "bg-blue-700",  // bardzo ciemny
];


  if (!categoryTree || categoryTree.length === 0) {
    return (
      <div className="text-gray-500 text-center p-6 italic">No categories</div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-2 flex flex-col gap-4">
      {flatCategories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category._id);
        const showDescription = showDescriptionIds.has(category._id);
        const colorClass = levelColors[category.level % levelColors.length];

        return (
          <div
            key={category._id}
            className={`w-full p-3 sm:p-4 rounded-xl shadow-md flex flex-col transition-transform transform hover:scale-105 hover:shadow-lg ${colorClass}`}
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <FaFolder size={16} className="text-blue-700 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">
                  {category.name}
                </span>
              </div>

      <div className="flex items-center gap-2 ml-2">
  {/* Przycisk informacji */}
  {category.description && (
    <button
      onClick={() => toggleDescription(category._id)}
      className="px-2 py-1 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
      title="Show description"
    >
      <FaInfoCircle size={14} />
    </button>
  )}

  {/* Przycisk rozwijania dzieci */}
  {hasChildren && (
    <button
      className="px-3 py-1 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition-colors font-bold flex-shrink-0 text-sm sm:text-base"
      onClick={() => toggleExpand(category._id)}
    >
      {isExpanded ? "−" : "+"}
    </button>
  )}
</div>

            </div>

            <div className="flex flex-wrap gap-2 mt-2 items-center">
              {category.isVisible ? (
                <FaEye className="text-green-600" title="Visible" size={16} />
              ) : (
                <FaEyeSlash className="text-gray-400" title="Hidden" size={16} />
              )}

              <ActionButton
                icon={<FaPlus size={16} />}
                label="Add"
                color="green"
                onClick={() => handleAdd(category)}
              />
              <ActionButton
                icon={<FaEdit size={16} />}
                label="Edit"
                color="blue"
                onClick={() => handleEdit(category)}
              />
              <ActionButton
                icon={<FaTrash size={16} />}
                label="Delete"
                color="red"
                onClick={() => handleDelete(category._id)}
              />
              
            </div>

            {showDescription && category.description && (
              <div className="mt-2 p-2 bg-white rounded-md shadow-inner text-gray-700 text-sm sm:text-base">
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
    green: "bg-green-500 hover:bg-green-600",
    blue: "bg-blue-500 hover:bg-blue-600",
    red: "bg-red-600 hover:bg-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 text-white rounded-lg text-xs sm:text-sm transition ${colors[color]}`}
    >
      {icon} {label}
    </button>
  );
};
