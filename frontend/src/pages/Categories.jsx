import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import CategoryTable from "../components/CategoryTable";
import { buildTree } from "../utils/categoryUtils";
import { findDescendants } from "../utils/categoryUtils";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Categories = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryData, setCategoryData] = useState({
    name: "",
    description: "",
    parent: null, // nowa właściwość dla kategorii
    isVisible: false
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const normalizedCategories = useMemo(
    () => categories.map(c => ({
      _id: c._id.toString(),
      name: c.name,
      description: c.description,
      parent: c.parent?._id?.toString() || null,
      isVisible: c.isVisible || false
    })),
    [categories]
  );
  const categoryTree = useMemo(() => buildTree(normalizedCategories), [normalizedCategories]);

  const excludedIds = useMemo(() => {
    return editCategory ? [editCategory, ...findDescendants(editCategory, normalizedCategories)] : [];
  }, [editCategory, normalizedCategories]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3500/categories/private", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Błąd pobierania kategorii:", err);
      alert(`${err.response.data.message}`);
    }
  };

  const handleAdd = (selectedCategory) => {
    setCategoryData({
      name: "",
      description: "",
      parent: selectedCategory?._id?.toString() || null,
      isVisible: false
    });
    setEditCategory(null);
    setModalOpen(true);
  }

  const handleEdit = (selectedCategory) => {
    setCategoryData({
      name: selectedCategory.name || "",
      description: selectedCategory.description || "",
      parent: selectedCategory?.parent?.toString() || null,
      isVisible: selectedCategory?.isVisible || false
    });
    setEditCategory(selectedCategory._id);
    setModalOpen(true);
  }

  const closeModal = () => {
    setModalOpen(false);
    setEditCategory(null);
    setCategoryData({ name: "", description: "", parent: null, isVisible: false });
  };

  const handleSubmitCategory = async (e) => {
    try {
      e.preventDefault()

      if (!categoryData.name.trim()) {
        alert("Nazwa kategorii jest wymagana");
        return;
      }
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
      };
      console.log(editCategory, categoryData)

      const res = editCategory
        ? await axios.patch(`http://localhost:3500/categories/${editCategory}`, categoryData, config)
        : await axios.post(`http://localhost:3500/categories/create`, categoryData, config);
      if (res.data.success) {
        alert(editCategory ? "Kategoria edytowana" : "Kategoria dodana");
        closeModal();
        fetchCategories();
      }
    } catch (err) {
      console.error("Błąd dodawania kategorii:", err);
      alert(err.response?.data?.error || "Nie udało się dodać kategorii");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Na pewno usunąć tę kategorię?")) return;
    try {
      const res = await axios.delete(
        `http://localhost:3500/categories/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert("Kategoria usunięta");
        fetchCategories();
      }
    } catch (err) {
      console.error("Błąd usuwania kategorii:", err);
      alert("Nie udało się usunąć kategorii");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl bg-white rounded shadow-md p-8 flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center">
          Zarządzanie kategoriami
        </h1>

        <button
          onClick={() => { setEditCategory(null); setModalOpen(true); }}
          className="self-start bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow"
        >
          Dodaj kategorię
        </button>

        {/* Category table with ASCII tree */}
        <CategoryTable
          categoryTree={categoryTree}
          handleEdit={handleEdit}
          handleDelete={handleDeleteCategory}
          handleAdd={handleAdd}
        />
      </div>

      {/* Modal dodawania kategorii */}
      {modalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <form onSubmit={handleSubmitCategory}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {editCategory ? "Edit category" : "Add category"}
                  </h2>
                <button
                  type="button"
                  onClick={() => setCategoryData(prev => ({ ...prev, isVisible: !prev.isVisible }))}
                  className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                  title="Visible (allow category to be vissible for everyone)"
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
                  onChange={(e) => setCategoryData((prev) => ({ ...prev, name: e.target.value }))}
                  maxLength={15}
                  className="w-full border rounded p-2"
                  placeholder="np. Elektronika"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 font-semibold">Description:</label>
                <textarea
                  value={categoryData.description}
                  onChange={(e) => setCategoryData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border rounded p-2"
                  placeholder="np. Telefony, laptopy..."
                />
              </div>

              {/* <div className="mb-4">
                <label className="block mb-1 font-semibold">Parent:</label>
                <select
                  value={categoryData.parent || ""}
                  onChange={(e) =>
                    setCategoryData(prev => ({ ...prev, parent: e.target.value || null }))
                  }
                  className="w-full border rounded p-2"
                >
                  <option value="">(None)</option>
                  {categories

                    .map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div> */}

              <div className="flex justify-end gap-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  Dodaj
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
