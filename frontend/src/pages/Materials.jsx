import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableItem = ({ mat, index, materials, setMaterials, axiosInstance, deleteMaterial, setPreviewImage }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: mat._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group overflow-hidden rounded-2xl shadow-lg p-2 flex flex-col"
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2 left-2 bg-gray-300 w-6 h-6 rounded-full cursor-grab flex items-center justify-center z-10 hover:bg-gray-400 transition"
        title="Przeciągnij"
      >
        ☰
      </div>

      {/* Delete Button */}
      <button
        onClick={() => deleteMaterial(mat._id)}
        className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 hover:bg-red-700 transition"
        title="Usuń zdjęcie"
      >
        ✕
      </button>

      {/* Kółeczko z numerem */}
      <div className="absolute top-2 left-10 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
        {index + 1}
      </div>

      {/* Obrazek do podglądu */}
      <img
        src={`http://localhost:3500/${mat.path}`}
        alt={mat.filename || "material"}
        className="w-full h-48 object-cover rounded-xl cursor-pointer select-none mt-4"
        onClick={() => setPreviewImage(`http://localhost:3500/${mat.path}`)}
        draggable={false}
      />

      {/* Pole do edycji linku */}
      <input
        type="url"
        value={mat.link || ""}
        onChange={(e) =>
          setMaterials((prev) =>
            prev.map((m) => (m._id === mat._id ? { ...m, link: e.target.value } : m))
          )
        }
        placeholder="Podaj link (np. https://example.com)"
        className="mt-2 w-full border border-gray-300 rounded-xl px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 truncate overflow-x-auto"
        style={{ whiteSpace: "nowrap" }}
      />

      <button
        onClick={async () => {
          try {
            await axiosInstance.patch(`/materials/${mat._id}`, { link: mat.link, order: index + 1 });
            alert("Link i numer zaktualizowane!");
          } catch (err) {
            console.error(err);
            alert("Błąd podczas aktualizacji");
          }
        }}
        className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl shadow-md transition"
      >
        Zapisz
      </button>
    </div>
  );
};

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { token } = useAuth();

  const axiosInstance = axios.create({
    baseURL: "http://localhost:3500",
    headers: { Authorization: `Bearer ${token}` },
  });

const fetchMaterials = async () => {
  try {
    const res = await axiosInstance.get("/materials");
    if (res.data.success) {
      // sortowanie po order
      const sorted = res.data.data.sort((a, b) => a.order - b.order);
      setMaterials(sorted);
    }
  } catch (error) {
    console.error("Fetch materials error:", error.response?.data || error.message);
    alert("Błąd podczas pobierania materiałów");
  }
};

  const addMaterial = async () => {
    if (!file) return alert("Wybierz plik do dodania");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("link", link);

    try {
      setLoading(true);
      const res = await axiosInstance.post("/materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setMaterials((prev) => [{ ...res.data.data }, ...prev]);
        setFile(null);
        setLink("");
      }
    } catch (error) {
      console.error("Add material error:", error.response?.data || error.message);
      alert("Błąd podczas dodawania materiału");
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm("Czy na pewno usunąć to zdjęcie?")) return;
    try {
      await axiosInstance.delete(`/materials/${id}`);
      setMaterials((prev) => prev.filter((m) => m._id !== id));
    } catch (error) {
      console.error("Delete material error:", error.response?.data || error.message);
      alert("Błąd podczas usuwania materiału");
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  const sensors = useSensors(useSensor(PointerSensor));

const handleDragEnd = async (event) => {
  const { active, over } = event;
  if (!over) return;

  const oldIndex = materials.findIndex((m) => m._id === active.id);
  const newIndex = materials.findIndex((m) => m._id === over.id);
  if (oldIndex !== newIndex) {
    const newMaterials = arrayMove(materials, oldIndex, newIndex);

    // Aktualizujemy kolejność w stanie
    setMaterials(newMaterials);

    // Wysyłamy PATCH do backendu z nową kolejnością
    try {
      const reorderPayload = newMaterials.map((mat, idx) => ({
        id: mat._id,
        order: idx + 1, // numer porządkowy
      }));
      await axiosInstance.patch("/materials/reorder", { materials: reorderPayload });
    } catch (err) {
      console.error("Błąd zapisywania kolejności:", err);
      alert("Nie udało się zapisać kolejności zdjęć!");
    }
  }
};

// Przy pobieraniu materiałów sortujemy po order



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
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const minWidth = 1920;
      const minHeight = 900;

      if (img.width < minWidth || img.height < minHeight) {
        alert(`Zdjęcie jest za małe! Minimalna rozdzielczość: ${minWidth}x${minHeight}px. Twoje: ${img.width}x${img.height}px`);
        setFile(null); // resetujemy wybór pliku
      } else {
        setFile(file); // zapisujemy plik, bo jest OK
      }

      URL.revokeObjectURL(img.src); // zwalniamy pamięć
    };
  }}
  className="flex-grow border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
  disabled={loading}
/>

          <input
            type="url"
            placeholder="Podaj link (np. https://example.com)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="flex-grow border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={materials.map((m) => m._id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {materials.map((mat, index) => (
                  <SortableItem
                    key={mat._id}
                    mat={mat}
                    index={index}
                    materials={materials}
                    setMaterials={setMaterials}
                    axiosInstance={axiosInstance}
                    deleteMaterial={deleteMaterial}
                    setPreviewImage={setPreviewImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Modal podglądu */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} alt="Preview" className="max-h-[90%] max-w-[90%] rounded-xl shadow-lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Materials;
