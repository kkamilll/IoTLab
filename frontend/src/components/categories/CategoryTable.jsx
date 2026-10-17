import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFolder,
  FaInfoCircle,
  FaChevronRight,
} from "react-icons/fa";

const CategoryNode = ({
  category,
  level,
  handleEdit,
  handleDelete,
  handleAdd,
  expandedIds,
  toggleExpand,
  showDescriptionIds,
  toggleDescription,
  t,
}) => {
  const { language } = useLanguage();
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category._id);
  const showDescription = showDescriptionIds.has(category._id);

  // Get card styles and badges based on nesting depth level
  const getLevelStyles = (lvl) => {
    if (lvl === 0) {
      return {
        cardClass: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-600 dark:border-l-indigo-500 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] p-5 rounded-2xl",
        badge: (
          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
            {t("categories.mainCategory")}
          </span>
        ),
      };
    } else if (lvl === 1) {
      return {
        cardClass: "bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/85 border-l-4 border-l-blue-500 p-4.5 rounded-xl shadow-xs",
        badge: (
          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/35 text-blue-650 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/25">
            {t("categories.subcategory")}
          </span>
        ),
      };
    } else {
      return {
        cardClass: "bg-slate-100/40 dark:bg-slate-900/25 border border-slate-200/60 dark:border-slate-800/70 border-l-4 border-l-purple-500 p-4 rounded-xl",
        badge: (
          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 border border-purple-100/60 dark:border-purple-900/20">
            {t("categories.nestedSubcategory")}
          </span>
        ),
      };
    }
  };

  const { cardClass, badge } = getLevelStyles(level);

  return (
    <div className="flex flex-col w-full transition-all duration-200">
      {/* Category Card */}
      <div className={`${cardClass} flex flex-col gap-3.5 hover:shadow-md transition-shadow duration-200`}>
        <div className="flex items-start justify-between gap-3 w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category._id)}
                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center cursor-pointer shadow-xs border-0"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <FaChevronRight
                  size={10}
                  className={`transition-transform duration-250 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                />
              </button>
            ) : (
              <div className="w-6 h-6" /> // Alignment spacer
            )}

            <FaFolder size={16} className="text-indigo-500 dark:text-indigo-450 flex-shrink-0" />

            {/* Category Name - wraps gracefully, does not truncate */}
            <span className="font-extrabold text-slate-850 dark:text-slate-100 text-sm sm:text-base break-words whitespace-normal leading-snug flex-1 min-w-[120px] pr-2">
              {language === "en" && category.nameEn ? category.nameEn : category.name}
            </span>

            {/* Level Badge */}
            {badge}

            {/* Visibility Badge */}
            {category.isVisible ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-450 border border-emerald-100/40 dark:border-emerald-900/20 shadow-xs">
                <FaEye size={10} />
                <span className="hidden sm:inline">{t("categories.visible")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                <FaEyeSlash size={10} />
                <span className="hidden sm:inline">{t("categories.hidden")}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Description Details Toggle */}
            {(language === "en" ? category.descriptionEn || category.description : category.description) && (
              <button
                onClick={() => toggleDescription(category._id)}
                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer border-0 ${
                  showDescription
                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={showDescription ? t("categories.hideDescription") : t("categories.showDescription")}
              >
                <FaInfoCircle size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap gap-2 items-center">
          <ActionButton
            icon={<FaPlus size={11} />}
            label={t("categories.addSubcategory")}
            color="indigo"
            onClick={() => handleAdd(category)}
          />
          <ActionButton
            icon={<FaEdit size={11} />}
            label={t("common.edit")}
            color="slate"
            onClick={() => handleEdit(category)}
          />
          <ActionButton
            icon={<FaTrash size={11} />}
            label={t("common.delete")}
            color="red"
            onClick={() => handleDelete(category._id)}
          />
        </div>

        {/* Description Panel */}
        {showDescription && (language === "en" ? category.descriptionEn || category.description : category.description) && (
          <div className="p-3 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/80 rounded-xl text-slate-650 dark:text-slate-350 text-xs sm:text-sm leading-relaxed shadow-inner">
            {language === "en" && category.descriptionEn ? category.descriptionEn : category.description}
          </div>
        )}
      </div>

      {/* Recursive Children Container with branch connector lines */}
      {isExpanded && hasChildren && (
        <div className="ml-3 sm:ml-6 pl-2.5 sm:pl-4 border-l-2 border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col gap-3 mt-3 relative">
          {category.children.map((child) => (
            <CategoryNode
              key={child._id}
              category={child}
              level={level + 1}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleAdd={handleAdd}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              showDescriptionIds={showDescriptionIds}
              toggleDescription={toggleDescription}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoryCards({
  categoryTree,
  handleEdit,
  handleDelete,
  handleAdd,
}) {
  const { t } = useLanguage();
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showDescriptionIds, setShowDescriptionIds] = useState(new Set());

  // Function to gather all category IDs that have children
  const getAllParentIds = (nodes) => {
    let ids = [];
    const traverse = (node) => {
      if (node.children && node.children.length > 0) {
        ids.push(node._id);
        node.children.forEach(traverse);
      }
    };
    nodes.forEach(traverse);
    return ids;
  };

  // Expand all parent nodes by default on load
  useEffect(() => {
    if (categoryTree && categoryTree.length > 0) {
      const parentIds = getAllParentIds(categoryTree);
      setExpandedIds(new Set(parentIds));
    }
  }, [categoryTree]);

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

  if (!categoryTree || categoryTree.length === 0) {
    return (
      <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-medium shadow-sm max-w-xl mx-auto w-full">
        <div className="text-4xl mb-3">🏷️</div>
        <p>{t("categories.noCategories")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {categoryTree.map((category) => (
        <CategoryNode
          key={category._id}
          category={category}
          level={0}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleAdd={handleAdd}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand}
          showDescriptionIds={showDescriptionIds}
          toggleDescription={toggleDescription}
          t={t}
        />
      ))}
    </div>
  );
}

const ActionButton = ({ icon, label, color, onClick }) => {
  const colors = {
    indigo: "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/35",
    slate: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/65",
    red: "bg-red-50 hover:bg-red-100 dark:bg-red-950/15 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-105 dark:border-red-900/25",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-xs border ${colors[color]}`}
    >
      {icon} <span>{label}</span>
    </button>
  );
};
