import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import CategoryTable from "../components/categories/CategoryTable";
import { buildTree, findDescendants } from "../utils/categoryUtils";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Categories = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryData, setCategoryData] = useState({
    name: "",
    description: "",
    parent: null,
    isVisible: false,
  });

  const MAX_LENGTH = 20;

  useEffect(() => {
    fetchCategories();
  }, []);

  const normalizedCategories = useMemo(
    () =>
      categories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        description: c.description,
        parent: c.parent?._id?.toString() || null,
        isVisible: c.isVisible || false,
      })),
    [categories]
  );

  const categoryTree = useMemo(
    () => buildTree(normalizedCategories),
    [normalizedCategories]
  );

  const excludedIds = useMemo(() => {
    return editCategory
      ? [editCategory, ...findDescendants(editCategory, normalizedCategories)]
      : [];
  }, [editCategory, normalizedCategories]);

  const fetchCategories = async () => {
    try {
<<<<<<< HEAD
      const res = await apiClient.get('/categories/private');
=======
      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/private`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      alert(err.response?.data?.message || "Failed to fetch categories");
    }
  };

  const handleAdd = (selectedCategory) => {
    setCategoryData({
      name: "",
      description: "",
      parent: selectedCategory?._id?.toString() || null,
      isVisible: false,
    });
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
    if (!categoryData.name.trim()) {
      alert("Category name is required");
      return;
    }

    try {
<<<<<<< HEAD
      const res = editCategory
        ? await apiClient.patch(`/categories/${editCategory}`, categoryData)
        : await apiClient.post('/categories/create', categoryData);
=======
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = editCategory
        ? await axios.patch(
            `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/${editCategory}`,
            categoryData,
            config
          )
        : await axios.post(
            `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/create`,
            categoryData,
            config
          );
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21

      if (res.data.success) {
        alert(editCategory ? "Category updated" : "Category added");
        closeModal();
        fetchCategories();
      }
    } catch (err) {
      console.error("Error saving category:", err);
      alert(err.response?.data?.error || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
<<<<<<< HEAD
      const res = await apiClient.delete(`/categories/${id}`);
=======
      const res = await axios.delete(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
      if (res.data.success) {
        alert("Category deleted");
        fetchCategories();
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col items-center p-6 md:p-8">
      <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Category Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage hierarchical categorization of laboratory resources</p>
          </div>

<<<<<<< HEAD
          <button
            onClick={() => { setEditCategory(null); setModalOpen(true); }}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
=======
        {/* Add Category po prawej */}
        <div className="flex justify-end">
          <button
            onClick={() => { setEditCategory(null); setModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow transition transform hover:scale-105"
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
          >
            Add Category
          </button>
        </div>

        {/* Category table */}
        <CategoryTable
          categoryTree={categoryTree}
          handleEdit={handleEdit}
          handleDelete={handleDeleteCategory}
          handleAdd={handleAdd}
        />
      </div>

      {/* Category Modal */}
      {modalOpen && (
        <div
<<<<<<< HEAD
          className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-md bg-slate-950/40"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg p-6 relative"
=======
          className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-lg bg-opacity-70 "
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative"
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitCategory}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-950">
                  {editCategory ? "Edit Category" : "Add Category"}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setCategoryData((prev) => ({ ...prev, isVisible: !prev.isVisible }))
                  }
<<<<<<< HEAD
                  className="p-2 rounded-xl hover:bg-slate-100 transition text-2xl"
=======
                  className="p-2 rounded-full hover:bg-gray-200 text-3xl"
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
                  title="Visible (allow category to be visible to everyone)"
                >
                  {categoryData.isVisible ? (
                    <FaEye className="text-indigo-600" />
                  ) : (
                    <FaEyeSlash className="text-slate-400" />
                  )}
                </button>
              </div>

<<<<<<< HEAD
              <div className="mb-4">
                <label className="block mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name:</label>
                <input
                  type="text"
                  value={categoryData.name}
                  onChange={(e) =>
                    setCategoryData((prev) => ({ ...prev, name: e.target.value.slice(0, MAX_LENGTH) }))
                  }
                  maxLength={MAX_LENGTH}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g., Electronics"
                />
                <p className="text-right text-[10px] text-slate-400 mt-1 font-bold">
                  {categoryData.name.length} / {MAX_LENGTH}
                </p>
              </div>
=======
            

<div className="mb-4">
  <label className="block mb-1 font-semibold">Name:</label>
  <input
    type="text"
    value={categoryData.name}
    onChange={(e) =>
      setCategoryData((prev) => ({ ...prev, name: e.target.value.slice(0, MAX_LENGTH) }))
    }
    maxLength={MAX_LENGTH}
    className="w-full border rounded p-2"
    placeholder="e.g., Electronics"
  />
  <p className="text-sm text-gray-500 mt-1">
    {categoryData.name.length} / {MAX_LENGTH}
  </p>
</div>


>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21

              <div className="mb-6">
                <label className="block mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description:</label>
                <textarea
                  value={categoryData.description}
                  onChange={(e) =>
                    setCategoryData((prev) => ({ ...prev, description: e.target.value }))
                  }
<<<<<<< HEAD
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
=======
                  className="w-full border rounded p-2"
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
                  placeholder="e.g., Phones, Laptops..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
                >
                  {editCategory ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;