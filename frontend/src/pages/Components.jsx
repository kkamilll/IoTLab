import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Components = () => {
  const { token } = useAuth();
  const [collections, setCollections] = useState([]);
  const [newCollection, setNewCollection] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [fileInputs, setFileInputs] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`,
    headers: { Authorization: `Bearer ${token}` },
  });

  // Pobierz kategorie
  const fetchCollections = async () => {
    try {
      const res = await axiosInstance.get("/components");
      if (res.data.success) setCollections(res.data.data);
    } catch {
      alert("Error fetching collections");
    }
  };

  // Dodaj kategorię
  const addCollection = async () => {
    if (!newCollection.trim()) return;
    try {
      const res = await axiosInstance.post("/components/create", { name: newCollection });
      if (res.data.success) {
        setCollections(prev => [...prev, res.data.data]);
        setNewCollection("");
      }
    } catch {
      alert("Error adding collections");
    }
  };

  // Usuń kolekcję
  const deleteCollection = async (collectionId) => {
    if (!window.confirm("Are you sure you want to delete this collection?")) return;
    try {
      await axiosInstance.delete(`/components/${collectionId}`);
      setCollections(prev => prev.filter(cat => cat._id !== collectionId));
      if (expanded === collectionId) setExpanded(null);
    } catch {
      alert("Error deleting collection");
    }
  };

  // Edytuj nazwę kategorii
  const editCollectionName = async (collectionId) => {
    if (!editingName.trim()) return;
    try {
      const res = await axiosInstance.patch(`/components/${collectionId}`, { name: editingName });
      if (res.data.success) {
        setCollections(prev =>
          prev.map(cat => (cat._id === collectionId ? { ...cat, name: editingName } : cat))
        );
        setEditingId(null);
        setEditingName("");
      }
    } catch {
      alert("Error editing collection");
    }
  };

  // Upload pliku
  const addFile = async (collectionId) => {
    const file = fileInputs[collectionId];
    if (!file) return alert("Choose a file first!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post(`/components/${collectionId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setCollections(prev =>
          prev.map(cat =>
            cat._id === collectionId ? { ...cat, files: [...cat.files, res.data.data] } : cat
          )
        );
        setFileInputs(prev => ({ ...prev, [collectionId]: null }));
      }
    } catch {
      alert("Error uploading file");
    }
  };

  // Usuń plik
  const deleteFile = async (collectionId, fileId) => {
    try {
      await axiosInstance.delete(`/components/${collectionId}/files/${fileId}`);
      setCollections(prev =>
        prev.map(cat =>
          cat._id === collectionId
            ? { ...cat, files: cat.files.filter(f => f._id !== fileId) }
            : cat
        )
      );
    } catch {
      alert("Error deleting file");
    }
  };

  useEffect(() => { fetchCollections(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-700">📂 Components</h2>

        {/* Dodaj kategorię */}
        <div className="flex gap-3">
          <input
            value={newCollection}
            onChange={e => setNewCollection(e.target.value.slice(0, 25))}
            placeholder="New collection..."
            className="flex-1 border rounded-xl px-3 py-2"
          />
          <button onClick={addCollection} className="bg-blue-600 text-white px-4 py-2 rounded-xl">
            Add
          </button>
        </div>

        {/* Lista kategorii */}
        {collections.map(collection => (
          <div key={collection._id} className="border rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              {editingId === collection._id ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="flex-1 border rounded px-2 py-1"
                  />
                  <button
                    onClick={() => editCollectionName(collection._id)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditingName(""); }}
                    className="bg-gray-300 text-black px-2 py-1 rounded"
                  >
                    ❌
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setExpanded(expanded === collection._id ? null : collection._id)}
                  className="text-lg font-semibold text-blue-900 flex-1 text-left"
                >
                  {expanded === collection._id ? "▼" : "▶"} {collection.name}
                </button>
              )}

              {/* Edytuj i usuń */}
              {editingId !== collection._id && (
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => { setEditingId(collection._id); setEditingName(collection.name); }}
                    className="text-yellow-500 hover:text-yellow-700"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteCollection(collection._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>

            {expanded === collection._id && (
              <div className="mt-3">
                {/* Pliki */}
                {collection.files.map(file => (
                  <div key={file._id} className="flex justify-between items-center bg-white p-2 rounded mb-2">
                    <a
                      href={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/${file.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {file.name}
                    </a>
                    <button
                      onClick={() => deleteFile(collection._id, file._id)}
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
                    onChange={e => setFileInputs(prev => ({ ...prev, [collection._id]: e.target.files[0] }))}
                    className="flex-1"
                  />
                  <button
                    onClick={() => addFile(collection._id)}
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
