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

  const renderCard = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category._id);
    const showDescription = showDescriptionIds.has(category._id);

    const gradients = [
      "from-blue-100 via-blue-200 to-blue-300",
      "from-blue-200 via-blue-300 to-blue-400",
      "from-blue-300 via-blue-400 to-blue-500",
      "from-blue-400 via-blue-500 to-blue-600",
    ];
    const gradient = gradients[level % gradients.length];

    return (
      <div key={category._id} className="mb-4 w-full">
        <div
          className={`p-4 rounded-xl shadow-md flex flex-col transition-transform transform hover:scale-105 hover:shadow-lg bg-gradient-to-br ${gradient}`}
          style={{ paddingLeft: 16 + level * 16, paddingRight: 16 }}
        >
          {/* Nagłówek */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FaFolder size={18} className="text-blue-700 flex-shrink-0" />
              <span className="font-medium text-base sm:text-lg truncate">
                {category.name}
              </span>
            </div>

            {hasChildren && (
              <button
                className="ml-2 px-4 py-1 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition-colors font-bold flex-shrink-0"
                onClick={() => toggleExpand(category._id)}
              >
                {isExpanded ? "−" : "+"}
              </button>
            )}
          </div>

          {/* Akcje i widoczność */}
          <div className="flex gap-2 flex-wrap mt-2 items-center">
            {/* Widoczność jako kolorowa ikona */}
            {category.isVisible ? (
              <FaEye className="text-green-600" title="Widoczna" />
            ) : (
              <FaEyeSlash className="text-gray-400" title="Ukryta" />
            )}

            <ActionButton
              icon={<FaPlus className="text-xs" />}
              label="Dodaj"
              color="green"
              onClick={() => handleAdd(category)}
            />
            <ActionButton
              icon={<FaEdit className="text-xs" />}
              label="Edytuj"
              color="blue"
              onClick={() => handleEdit(category)}
            />
            <ActionButton
              icon={<FaTrash className="text-xs" />}
              label="Usuń"
              color="red"
              onClick={() => handleDelete(category._id)}
            />
            {category.description && (
              <button
                className="flex items-center gap-1 px-2 py-1 text-white bg-gray-600 hover:bg-gray-700 rounded-lg text-sm"
                onClick={() => toggleDescription(category._id)}
              >
                <FaInfoCircle /> Opis
              </button>
            )}
          </div>

          {/* Opis kategorii */}
          {showDescription && category.description && (
            <div className="mt-2 p-2 bg-white rounded-md shadow-inner text-gray-700">
              {category.description}
            </div>
          )}

          {/* Dzieci */}
          {hasChildren && isExpanded && (
            <div className="mt-2 border-l-2 border-blue-300 w-full">
              {category.children.map((child) => renderCard(child, level + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!categoryTree || categoryTree.length === 0) {
    return (
      <div className="text-gray-500 text-center p-6 italic">Brak kategorii</div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 flex flex-col gap-4">
      {categoryTree.map((root) => renderCard(root))}
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
      className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg text-sm transition ${colors[color]}`}
    >
      {icon} {label}
    </button>
  );
};
