import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Components = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [fileInputs, setFileInputs] = useState({}); // dla wielu kategorii

  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`,
    headers: { Authorization: `Bearer ${token}` },
  });

  // Pobierz kategorie
  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/components");
      if (res.data.success) setCategories(res.data.data);
    } catch {
      alert("Error fetching categories");
    }
  };

  // Dodaj kategorię
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await axiosInstance.post("/components/create", { name: newCategory });
      if (res.data.success) {
        setCategories(prev => [...prev, res.data.data]);
        setNewCategory("");
      }
    } catch {
      alert("Error adding category");
    }
  };

  // Upload pliku
  const addFile = async (categoryId) => {
    const file = fileInputs[categoryId];
    if (!file) return alert("Choose a file first!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post(`/components/${categoryId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setCategories(prev =>
          prev.map(cat =>
            cat._id === categoryId ? { ...cat, files: [...cat.files, res.data.data] } : cat
          )
        );
        setFileInputs(prev => ({ ...prev, [categoryId]: null }));
      }
    } catch {
      alert("Error uploading file");
    }
  };

  // Usuń plik
  const deleteFile = async (categoryId, fileId) => {
    try {
      await axiosInstance.delete(`/components/${categoryId}/files/${fileId}`);
      setCategories(prev =>
        prev.map(cat =>
          cat._id === categoryId
            ? { ...cat, files: cat.files.filter(f => f._id !== fileId) }
            : cat
        )
      );
    } catch {
      alert("Error deleting file");
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-700">📂 Components</h2>
        {/* Dodaj kategorię */}
        <div className="flex gap-3">
          <input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="New category..."
            className="flex-1 border rounded-xl px-3 py-2"
          />
          <button onClick={addCategory} className="bg-blue-600 text-white px-4 py-2 rounded-xl">
            Add
          </button>
        </div>

        {/* Lista kategorii */}
        {categories.map(category => (
          <div key={category._id} className="border rounded-xl p-4 bg-gray-50">
            <button
              onClick={() => setExpanded(expanded === category._id ? null : category._id)}
              className="text-lg font-semibold text-blue-900 flex-1 text-left"
            >
              {expanded === category._id ? "▼" : "▶"} {category.name}
            </button>

            {expanded === category._id && (
              <div className="mt-3">
                {/* Pliki */}
                {category.files.map(file => (
                  <div key={file._id} className="flex justify-between items-center bg-white p-2 rounded mb-2">
                    <a
                      href={`/${file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {file.name}
                    </a>
                    <button
                      onClick={() => deleteFile(category._id, file._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                {/* Dodaj plik */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="file"
                    onChange={e => setFileInputs(prev => ({ ...prev, [category._id]: e.target.files[0] }))}
                    className="flex-1"
                  />
                  <button
                    onClick={() => addFile(category._id)}
                    className="bg-green-500 text-white px-3 py-2 rounded"
                  >
                    Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Components;
