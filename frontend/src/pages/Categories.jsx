import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import CategoryTable from "../components/categories/CategoryTable";
import { buildTree, findDescendants } from "../utils/categoryUtils";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PageHeader from "../components/layout/PageHeader";
import Btn from "../components/layout/Btn";

const Categories = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryData, setCategoryData] = useState({
    name: "", description: "", parent: null, isVisible: false,
  });

  const MAX_LENGTH = 20;

  useEffect(() => { fetchCategories(); }, []);

  const normalizedCategories = useMemo(
    () => categories.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      description: c.description,
      parent: c.parent?._id?.toString() || null,
      isVisible: c.isVisible || false,
    })),
    [categories]
  );

  const categoryTree = useMemo(() => buildTree(normalizedCategories), [normalizedCategories]);

  const excludedIds = useMemo(() =>
    editCategory ? [editCategory, ...findDescendants(editCategory, normalizedCategories)] : [],
    [editCategory, normalizedCategories]
  );

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/categories/private");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      alert(err.response?.data?.message || "Failed to fetch categories");
    }
  };

  const handleAdd = (selectedCategory) => {
    setCategoryData({ name: "", description: "", parent: selectedCategory?._id?.toString() || null, isVisible: false });
    setEditCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (selectedCategory) => {
    setCategoryData({
      name: selectedCategory.name || "",
      description: selectedCategory.description || "",
      parent: selectedCategory?.parent?.toString() || null,
      isVisible: selectedCategory?.isVisible || false,
    });
    setEditCategory(selectedCategory._id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditCategory(null);
    setCategoryData({ name: "", description: "", parent: null, isVisible: false });
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!categoryData.name.trim()) { alert("Category name is required"); return; }
    try {
      const res = editCategory
        ? await apiClient.patch(`/categories/${editCategory}`, categoryData)
        : await apiClient.post("/categories/create", categoryData);
      if (res.data.success) {
        alert(editCategory ? "Category updated" : "Category added");
        closeModal(); fetchCategories();
      }
    } catch (err) {
      console.error("Error saving category:", err);
      alert(err.response?.data?.error || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await apiClient.delete(`/categories/${id}`);
      if (res.data.success) { alert("Category deleted"); fetchCategories(); }
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category");
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 md:p-8 bg-slate-50/30 dark:bg-slate-900/10">
      <PageHeader title="Category Management" subtitle="Manage hierarchical categorization of laboratory resources">
        <Btn variant="primary" onClick={() => { setEditCategory(null); setModalOpen(true); }}>
          + Add Category
        </Btn>
      </PageHeader>

      <CategoryTable
        categoryTree={categoryTree}
        handleEdit={handleEdit}
        handleDelete={handleDeleteCategory}
        handleAdd={handleAdd}
      />

      {/* Category Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-md bg-slate-950/40"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl w-full max-w-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitCategory}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  {editCategory ? "Edit Category" : "Add Category"}
                </h2>
                <button
                  type="button"
                  onClick={() => setCategoryData((prev) => ({ ...prev, isVisible: !prev.isVisible }))}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-2xl cursor-pointer"
                  title="Toggle visibility to all users"
                >
                  {categoryData.isVisible ? (
                    <FaEye className="text-indigo-650 dark:text-indigo-400" />
                  ) : (
                    <FaEyeSlash className="text-slate-450 dark:text-slate-500" />
                  )}
                </button>
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Name:</label>
                <input
                  type="text"
                  value={categoryData.name}
                  onChange={(e) => setCategoryData((prev) => ({ ...prev, name: e.target.value.slice(0, MAX_LENGTH) }))}
                  maxLength={MAX_LENGTH}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g., Electronics"
                />
                <p className="text-right text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-bold">
                  {categoryData.name.length} / {MAX_LENGTH}
                </p>
              </div>

              <div className="mb-6">
                <label className="block mb-1 text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Description:</label>
                <textarea
                  value={categoryData.description}
                  onChange={(e) => setCategoryData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
                  placeholder="e.g., Phones, Laptops..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Btn type="button" variant="secondary" onClick={closeModal}>Cancel</Btn>
                <Btn type="submit" variant="primary">{editCategory ? "Save" : "Add"}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;