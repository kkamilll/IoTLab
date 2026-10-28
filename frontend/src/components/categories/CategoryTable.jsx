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
  selectedCategoryId,
  onSelectCategory,
  categoryProductsMap,
  onToggleVisibility,
  t,
}) => {
  const { language } = useLanguage();
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds ? expandedIds.has(category._id) : true;
  const showDescription = showDescriptionIds ? showDescriptionIds.has(category._id) : false;
  const isSelected = selectedCategoryId && selectedCategoryId.toString() === category._id.toString();
  const productCount = categoryProductsMap?.[category._id.toString()]?.length || 0;

  // Get card styles and badges based on nesting depth level
  const getLevelStyles = (lvl) => {
    if (lvl === 0) {
      return {
        cardClass: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-600 dark:border-l-indigo-500 shadow-sm p-4.5 rounded-2xl",
        badge: (
          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
            {t("categories.mainCategory") || "Główna"}
          </span>
        ),
      };
    } else if (lvl === 1) {
      return {
        cardClass: "bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/85 border-l-4 border-l-blue-500 p-4 rounded-xl shadow-xs",
        badge: (
          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/35 text-blue-650 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/25">
            {t("categories.subcategory") || "Podkategoria"}
          </span>
        ),
      };
    } else {
      return {
        cardClass: "bg-slate-100/40 dark:bg-slate-900/25 border border-slate-200/60 dark:border-slate-800/70 border-l-4 border-l-purple-500 p-3.5 rounded-xl",
        badge: (
          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 border border-purple-100/60 dark:border-purple-900/20">
            {t("categories.nestedSubcategory") || "Głęboka"}
          </span>
        ),
      };
    }
  };

  const { cardClass, badge } = getLevelStyles(level);

  return (
    <div className="flex flex-col w-full transition-all duration-200">
      {/* Category Card */}
      <div
        onClick={() => onSelectCategory && onSelectCategory(category)}
        className={`${cardClass} flex flex-col gap-3 hover:shadow-md transition-all duration-200 ${
          onSelectCategory ? "cursor-pointer select-none" : ""
        } ${
          isSelected
            ? "ring-2 ring-indigo-500 border-indigo-400 dark:border-indigo-500 shadow-md bg-indigo-50/40 dark:bg-indigo-950/25"
            : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3 w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(category._id);
                }}
                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center cursor-pointer shadow-xs border-0 shrink-0"
                title={isExpanded ? "Zwiń" : "Rozwiń"}
              >
                <FaChevronRight
                  size={10}
                  className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                />
              </button>
            ) : (
              <div className="w-6 h-6 shrink-0" />
            )}

            <FaFolder size={16} className={`${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-500 dark:text-indigo-450"} shrink-0`} />

            {/* Category Name & English Name */}
            <div className="flex flex-col min-w-[120px] pr-2 flex-1">
              <span className="font-extrabold text-slate-850 dark:text-slate-100 text-sm sm:text-base break-words whitespace-normal leading-snug">
                {category.name}
              </span>
              {category.nameEn && category.nameEn !== category.name && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {category.nameEn}
                </span>
              )}
            </div>

            {/* Level Badge */}
            {badge}

            {/* Products Count Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${
                productCount > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/50 dark:border-slate-700/50"
              }`}
              title={`${productCount} obiektów w tej kategorii i podkategoriach`}
            >
              <span>📦</span>
              <span>{productCount} {t("categories.objectsCount") || "obiektów"}</span>
            </span>

            {/* Interactive Visibility Badge Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility && onToggleVisibility(category);
              }}
              title={
                category.isVisible
                  ? (language === "pl" ? "Widoczna w katalogu. Kliknij, aby ukryć." : "Visible. Click to hide.")
                  : (language === "pl" ? "Ukryta. Kliknij, aby pokazać w katalogu." : "Hidden. Click to make visible.")
              }
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs transition-all cursor-pointer ${
                category.isVisible
                  ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              {category.isVisible ? <FaEye size={10} /> : <FaEyeSlash size={10} />}
              <span className="hidden sm:inline">{category.isVisible ? t("categories.visible") : t("categories.hidden")}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Description Details Toggle */}
            {(language === "en" ? category.descriptionEn || category.description : category.description) && (
              <button
                type="button"
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
        <div className="flex flex-wrap gap-2 items-center pt-1" onClick={(e) => e.stopPropagation()}>
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
        <div className="ml-3 sm:ml-5 pl-2.5 sm:pl-3.5 border-l-2 border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col gap-3 mt-3 relative">
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
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              categoryProductsMap={categoryProductsMap}
              onToggleVisibility={onToggleVisibility}
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
  selectedCategoryId,
  onSelectCategory,
  categoryProductsMap,
  onToggleVisibility,
  expandedIds,
  setExpandedIds,
}) {
  const { t } = useLanguage();
  const [internalExpandedIds, setInternalExpandedIds] = useState(new Set());
  const [showDescriptionIds, setShowDescriptionIds] = useState(new Set());

  const currentExpandedIds = expandedIds || internalExpandedIds;
  const currentSetExpandedIds = setExpandedIds || setInternalExpandedIds;

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

  // Expand all parent nodes by default on initial load if not set
  useEffect(() => {
    if (categoryTree && categoryTree.length > 0 && currentExpandedIds.size === 0) {
      const parentIds = getAllParentIds(categoryTree);
      currentSetExpandedIds(new Set(parentIds));
    }
  }, [categoryTree]);

  const toggleExpand = (id) => {
    currentSetExpandedIds((prev) => {
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
      <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-medium shadow-sm w-full">
        <div className="text-4xl mb-3">🏷️</div>
        <p>{t("categories.noCategories") || "Brak kategorii do wyświetlenia."}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3.5">
      {categoryTree.map((category) => (
        <CategoryNode
          key={category._id}
          category={category}
          level={0}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleAdd={handleAdd}
          expandedIds={currentExpandedIds}
          toggleExpand={toggleExpand}
          showDescriptionIds={showDescriptionIds}
          toggleDescription={toggleDescription}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
          categoryProductsMap={categoryProductsMap}
          onToggleVisibility={onToggleVisibility}
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
