import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient";
import CategoryTable from "../components/categories/CategoryTable";
import { buildTree, getDescendantCategoryIds } from "../utils/categoryUtils";
import {
  FaEye,
  FaEyeSlash,
  FaFolder,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronRight,
  FaChevronDown,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaSearch,
  FaTimes,
  FaSitemap,
  FaCheckCircle,
} from "react-icons/fa";
import PageHeader from "../components/layout/PageHeader";
import Btn from "../components/layout/Btn";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/layout/ConfirmModal";

const Categories = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "root" | "visible" | "hidden"
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [categoryData, setCategoryData] = useState({
    name: "",
    nameEn: "",
    description: "",
    descriptionEn: "",
    parent: null,
    isVisible: true,
  });

  const MAX_LENGTH = 50;

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/categories/private");
      const cats = res.data.categories || [];
      setCategories(cats);
    } catch (err) {
      console.error("Error fetching categories:", err);
      showToast(err.response?.data?.message || "Failed to fetch categories", "error");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get("/products/private");
      if (res.data?.success && Array.isArray(res.data.products)) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const normalizedCategories = useMemo(
    () =>
      categories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        nameEn: c.nameEn || "",
        description: c.description || "",
        descriptionEn: c.descriptionEn || "",
        parent: c.parent?._id?.toString() || (c.parent ? c.parent.toString() : null),
        isVisible: c.isVisible !== undefined ? c.isVisible : false,
      })),
    [categories]
  );


  // Map each category to all products assigned to it or its descendants
  const categoryProductsMap = useMemo(() => {
    const map = {};
    if (!products || !normalizedCategories) return map;

    normalizedCategories.forEach((cat) => {
      const catIdStr = cat._id.toString();
      const descendantIds = new Set(
        getDescendantCategoryIds(catIdStr, normalizedCategories).map((id) => id.toString())
      );
      descendantIds.add(catIdStr);

      const matching = products.filter((p) => {
        const directCatIds = (p.categories || []).map((c) => (c._id || c).toString());
        return directCatIds.some((id) => descendantIds.has(id));
      });

      map[catIdStr] = matching;
    });

    return map;
  }, [products, normalizedCategories]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = normalizedCategories.length;
    const roots = normalizedCategories.filter((c) => !c.parent).length;
    const subs = total - roots;
    const visible = normalizedCategories.filter((c) => c.isVisible).length;
    const hidden = total - visible;

    // Unique products categorized
    const categorizedProductIds = new Set();
    Object.values(categoryProductsMap).forEach((prodList) => {
      prodList.forEach((p) => categorizedProductIds.add(p._id));
    });

    return {
      totalCategories: total,
      rootCategories: roots,
      subcategories: subs,
      visibleCategories: visible,
      hiddenCategories: hidden,
      assignedProductsCount: categorizedProductIds.size,
      totalProductsCount: products.length,
    };
  }, [normalizedCategories, categoryProductsMap, products]);

  const categoryTree = useMemo(() => buildTree(normalizedCategories), [normalizedCategories]);

  // Filter category tree based on search and tab filter
  const filteredTree = useMemo(() => {
    let tree = categoryTree;

    // Filter by mode
    if (filterMode === "root") {
      tree = tree.map((node) => ({ ...node, children: [] }));
    } else if (filterMode === "visible") {
      const filterVisibleNodes = (nodes) =>
        nodes
          .filter((n) => n.isVisible)
          .map((n) => ({ ...n, children: filterVisibleNodes(n.children || []) }));
      tree = filterVisibleNodes(tree);
    } else if (filterMode === "hidden") {
      const filterHiddenNodes = (nodes) =>
        nodes
          .map((n) => {
            const children = filterHiddenNodes(n.children || []);
            if (!n.isVisible || children.length > 0) {
              return { ...n, children };
            }
            return null;
          })
          .filter(Boolean);
      tree = filterHiddenNodes(tree);
    }

    if (!searchQuery.trim()) return tree;
    const lowerQuery = searchQuery.toLowerCase();

    const filterNodes = (nodes) => {
      return nodes
        .map((node) => {
          const isMatch =
            node.name.toLowerCase().includes(lowerQuery) ||
            node.nameEn?.toLowerCase().includes(lowerQuery) ||
            node.description?.toLowerCase().includes(lowerQuery) ||
            node.descriptionEn?.toLowerCase().includes(lowerQuery);
          const filteredChildren = filterNodes(node.children || []);

          if (isMatch || filteredChildren.length > 0) {
            return { ...node, children: isMatch ? node.children : filteredChildren };
          }
          return null;
        })
        .filter(Boolean);
    };

    return filterNodes(tree);
  }, [categoryTree, searchQuery, filterMode]);


  // Expand / Collapse all handlers
  const handleExpandAll = () => {
    const allIds = new Set(normalizedCategories.map((c) => c._id));
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Direct 1-Click Visibility Toggle
  const handleToggleVisibility = async (category) => {
    const newVisibility = !category.isVisible;
    try {
      const res = await apiClient.patch(`/categories/${category._id}`, {
        name: category.name,
        nameEn: category.nameEn || "",
        description: category.description || "",
        descriptionEn: category.descriptionEn || "",
        parent: category.parent || null,
        isVisible: newVisibility,
      });

      if (res.data?.success) {
        showToast(
          newVisibility
            ? (language === "pl"
                ? `Kategoria "${category.name}" jest teraz widoczna w katalogu`
                : `Category "${category.name}" is now visible`)
            : (language === "pl"
                ? `Kategoria "${category.name}" została ukryta w katalogu`
                : `Category "${category.name}" is now hidden`),
          "success"
        );
        fetchCategories();
      }
    } catch (err) {
      console.error("Error updating category visibility:", err);
      showToast(err.response?.data?.message || "Failed to update category visibility", "error");
    }
  };

  const handleAdd = (parentCat = null) => {
    setCategoryData({
      name: "",
      nameEn: "",
      description: "",
      descriptionEn: "",
      parent: parentCat?._id?.toString() || null,
      isVisible: true,
    });
    setEditCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (cat) => {
    setCategoryData({
      name: cat.name || "",
      nameEn: cat.nameEn || "",
      description: cat.description || "",
      descriptionEn: cat.descriptionEn || "",
      parent: cat.parent?.toString() || null,
      isVisible: cat.isVisible !== undefined ? cat.isVisible : true,
    });
    setEditCategory(cat._id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditCategory(null);
    setCategoryData({
      name: "",
      nameEn: "",
      description: "",
      descriptionEn: "",
      parent: null,
      isVisible: true,
    });
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!categoryData.name.trim()) {
      showToast(language === "pl" ? "Nazwa kategorii jest wymagana" : "Category name is required", "warning");
      return;
    }
    try {
      const res = editCategory
        ? await apiClient.patch(`/categories/${editCategory}`, categoryData)
        : await apiClient.post("/categories/create", categoryData);

      if (res.data.success) {
        showToast(
          editCategory
            ? (language === "pl" ? "Kategoria zaktualizowana" : "Category updated")
            : (language === "pl" ? "Kategoria dodana" : "Category added"),
          "success"
        );
        closeModal();
        fetchCategories();
      }
    } catch (err) {
      console.error("Error saving category:", err);
      showToast(err.response?.data?.error || err.response?.data?.message || "Failed to save category", "error");
    }
  };

  const handleDeleteCategory = (id) => {
    const catToDelete = normalizedCategories.find((c) => c._id === id);
    const catName = catToDelete ? `"${catToDelete.name}"` : "";

    setConfirmConfig({
      isOpen: true,
      title: t("categories.deleteCategory") || "Usuń kategorię",
      message: language === "pl"
        ? `Czy na pewno chcesz usunąć kategorię ${catName}? Jeśli kategoria posiada podkategorie, zostaną one odłączone.`
        : `Are you sure you want to delete category ${catName}? Any subcategories will become root categories.`,
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await apiClient.delete(`/categories/${id}`);
          if (res.data.success) {
            showToast(language === "pl" ? "Kategoria usunięta" : "Category deleted", "success");
            fetchCategories();
          }
        } catch (err) {
          console.error("Error deleting category:", err);
          showToast(err.response?.data?.message || "Failed to delete category", "error");
        }
      },
    });
  };


  return (
    <div className="w-full min-h-full flex flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-slate-50/40 dark:bg-slate-950/20">
      {/* Page Header */}
      <PageHeader
        title={"🏷️ " + (t("categories.title") || "Zarządzanie Kategoriami")}
        subtitle={t("categories.subtitle") || "Zarządzaj hierarchiczną kategoryzacją zasobów laboratoryjnych"}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExpandAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs transition cursor-pointer"
            title={t("categories.expandAll") || "Rozwiń wszystko"}
          >
            <FaChevronDown size={11} className="text-slate-400" />
            <span>{t("categories.expandAll") || "Rozwiń wszystko"}</span>
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs transition cursor-pointer"
            title={t("categories.collapseAll") || "Zwiń wszystko"}
          >
            <FaChevronRight size={11} className="text-slate-400" />
            <span>{t("categories.collapseAll") || "Zwiń wszystko"}</span>
          </button>
          <Btn variant="primary" onClick={() => handleAdd(null)}>
            <FaPlus className="mr-1.5" size={11} />
            {t("categories.addCategory") || "Dodaj kategorię"}
          </Btn>
        </div>
      </PageHeader>

      {/* Full-Width Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 w-full">
        {/* Search Bar with Clear Icon */}
        <div className="relative flex-1 min-w-[260px]">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("categories.searchPlaceholder") || "Szukaj kategorii..."}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Wyczyść szukanie"
            >
              <FaTimes size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/70 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <FilterTabButton
            active={filterMode === "all"}
            onClick={() => setFilterMode("all")}
            label={t("categories.allFilter") || "Wszystkie"}
            count={stats.totalCategories}
          />
          <FilterTabButton
            active={filterMode === "root"}
            onClick={() => setFilterMode("root")}
            label={t("categories.rootCategories") || "Główne"}
            count={stats.rootCategories}
          />
          <FilterTabButton
            active={filterMode === "visible"}
            onClick={() => setFilterMode("visible")}
            label={t("categories.visibleFilter") || "Widoczne"}
            count={stats.visibleCategories}
          />
          <FilterTabButton
            active={filterMode === "hidden"}
            onClick={() => setFilterMode("hidden")}
            label={t("categories.hiddenFilter") || "Ukryte"}
            count={stats.hiddenCategories}
          />
        </div>
      </div>

      {/* Category Hierarchy Tree - Full Width */}
      <div className="flex flex-col gap-3 w-full pb-10">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FaSitemap className="text-indigo-500" />
            <span>{t("categories.categoryHierarchy") || "Hierarchia kategorii"}</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({filteredTree.length} {language === "pl" ? "gałęzi głównych" : "root branches"})
            </span>
          </span>
        </div>

        <CategoryTable
          categoryTree={filteredTree}
          handleEdit={handleEdit}
          handleDelete={handleDeleteCategory}
          handleAdd={handleAdd}
          categoryProductsMap={categoryProductsMap}
          onToggleVisibility={handleToggleVisibility}
          expandedIds={expandedIds}
          setExpandedIds={setExpandedIds}
        />
      </div>

      {/* Category Modal - Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-md bg-slate-950/40 p-4">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitCategory}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <FaFolder className="text-indigo-600" />
                  <span>
                    {editCategory
                      ? (t("categories.editCategory") || "Edytuj kategorię")
                      : (t("categories.addCategory") || "Dodaj kategorię")}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setCategoryData((prev) => ({ ...prev, isVisible: !prev.isVisible }))
                  }
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-2xl cursor-pointer"
                  title="Przełącz widoczność w katalogu"
                >
                  {categoryData.isVisible ? (
                    <FaEye className="text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <FaEyeSlash className="text-slate-400 dark:text-slate-500" />
                  )}
                </button>
              </div>

              {/* Parent category selector */}
              <div className="mb-4">
                <label className="block mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === "pl" ? "Kategoria nadrzędna:" : "Parent category:"}
                </label>
                <select
                  value={categoryData.parent || ""}
                  onChange={(e) =>
                    setCategoryData((prev) => ({
                      ...prev,
                      parent: e.target.value ? e.target.value : null,
                    }))
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 cursor-pointer"
                >
                  <option value="">
                    {language === "pl" ? "-- Brak (Kategoria główna) --" : "-- None (Root category) --"}
                  </option>
                  {normalizedCategories
                    .filter((c) => c._id !== editCategory)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Name PL */}
              <div className="mb-4">
                <label className="block mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === "pl" ? "Nazwa (PL):" : "Name (PL):"} *
                </label>
                <input
                  type="text"
                  value={categoryData.name}
                  onChange={(e) =>
                    setCategoryData((prev) => ({
                      ...prev,
                      name: e.target.value.slice(0, MAX_LENGTH),
                    }))
                  }
                  maxLength={MAX_LENGTH}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="np. Mikrokontrolery"
                  required
                />
                <p className="text-right text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
                  {categoryData.name.length} / {MAX_LENGTH}
                </p>
              </div>

              {/* Name EN */}
              <div className="mb-4">
                <label className="block mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === "pl" ? "Nazwa (EN):" : "Name (EN):"}
                </label>
                <input
                  type="text"
                  value={categoryData.nameEn}
                  onChange={(e) =>
                    setCategoryData((prev) => ({
                      ...prev,
                      nameEn: e.target.value.slice(0, MAX_LENGTH),
                    }))
                  }
                  maxLength={MAX_LENGTH}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g., Microcontrollers"
                />
                <p className="text-right text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
                  {categoryData.nameEn.length} / {MAX_LENGTH}
                </p>
              </div>

              {/* Description PL */}
              <div className="mb-4">
                <label className="block mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === "pl" ? "Opis (PL):" : "Description (PL):"}
                </label>
                <textarea
                  value={categoryData.description}
                  onChange={(e) =>
                    setCategoryData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[70px]"
                  placeholder="Krótki opis kategorii..."
                />
              </div>

              {/* Description EN */}
              <div className="mb-5">
                <label className="block mb-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === "pl" ? "Opis (EN):" : "Description (EN):"}
                </label>
                <textarea
                  value={categoryData.descriptionEn}
                  onChange={(e) =>
                    setCategoryData((prev) => ({ ...prev, descriptionEn: e.target.value }))
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[70px]"
                  placeholder="English description..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Btn type="button" variant="secondary" onClick={closeModal}>
                  {t("common.cancel") || "Anuluj"}
                </Btn>
                <Btn type="submit" variant="primary">
                  {editCategory ? (t("common.save") || "Zapisz") : (t("common.add") || "Dodaj")}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

const FilterTabButton = ({ active, onClick, label, count }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
        active
          ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            active
              ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
              : "bg-slate-200/70 dark:bg-slate-800 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default Categories;
