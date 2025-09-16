import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import CategoryTable from "../components/CategoryTable";
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
      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/private`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      const res = await axios.delete(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl bg-white rounded shadow-md p-8 flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold text-blue-700 text-center">
          Category Management
        </h1>

        {/* Add Category po prawej */}
        <div className="flex justify-end">
          <button
            onClick={() => { setEditCategory(null); setModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow transition transform hover:scale-105"
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
          className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-lg bg-opacity-70 "
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitCategory}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {editCategory ? "Edit Category" : "Add Category"}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setCategoryData((prev) => ({ ...prev, isVisible: !prev.isVisible }))
                  }
                  className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                  title="Visible (allow category to be visible to everyone)"
                >
                  {categoryData.isVisible ? (
                    <FaEye className="text-indigo-500" />
                  ) : (
                    <FaEyeSlash className="text-gray-500" />
                  )}
                </button>
              </div>

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

              <div className="mb-4">
                <label className="block mb-1 font-semibold">Description:</label>
                <textarea
                  value={categoryData.description}
                  onChange={(e) =>
                    setCategoryData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full border rounded p-2"
                  placeholder="e.g., Phones, Laptops..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
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