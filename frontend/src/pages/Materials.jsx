import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const axiosInstance = axios.create({
    baseURL: "http://localhost:3500",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Pobieranie zdjęć
  const fetchMaterials = async () => {
    try {
      const res = await axiosInstance.get("/materials");
      if (res.data.success) setMaterials(res.data.data);
    } catch (error) {
      console.error("Fetch materials error:", error.response?.data || error.message);
      alert("Błąd podczas pobierania materiałów");
    }
  };

  // Dodawanie zdjęcia
  const addMaterial = async () => {
    if (!file) return alert("Wybierz plik do dodania");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axiosInstance.post("/materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setMaterials(prev => [res.data.data, ...prev]);
        setFile(null);
      }
    } catch (error) {
      console.error("Add material error:", error.response?.data || error.message);
      alert("Błąd podczas dodawania materiału");
    } finally {
      setLoading(false);
    }
  };

  // Usuwanie zdjęcia
  const deleteMaterial = async (id) => {
    if (!window.confirm("Czy na pewno usunąć to zdjęcie?")) return;
    try {
      await axiosInstance.delete(`/materials/${id}`);
      setMaterials(prev => prev.filter(m => m._id !== id));
    } catch (error) {
      console.error("Delete material error:", error.response?.data || error.message);
      alert("Błąd podczas usuwania materiału");
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-4xl font-extrabold text-blue-700 mb-10 text-center">
          📸 Twoje Materiały
        </h2>

        {/* Upload */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="flex-grow border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            disabled={loading}
          />
          <button
            onClick={addMaterial}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Dodaję..." : "Dodaj zdjęcie"}
          </button>
        </div>

        {/* Galeria */}
        {materials.length === 0 ? (
          <div className="text-center text-gray-400 py-16 select-none italic">
            Brak materiałów — dodaj zdjęcia!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {materials.map((mat) => (
              <div key={mat._id} className="relative group overflow-hidden rounded-2xl shadow-lg">
                <img
  src={`http://localhost:3500/${mat.path}`}
  alt={mat.filename || "material"}
  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
/>

                <button
                  onClick={() => deleteMaterial(mat._id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                  title="Usuń zdjęcie"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Materials;
