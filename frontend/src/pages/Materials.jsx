import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable gallery item
const SortableItem = ({ mat, index, materials, setMaterials, axiosInstance, deleteMaterial, setPreviewImage }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: mat._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.replaceWith(
      Object.assign(document.createElement("div"), {
        innerText: "NO IMAGE",
        className: "w-full h-48 flex items-center justify-center bg-gray-200 text-red-600 font-bold rounded-none mt-4",
      })
    );
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group overflow-hidden rounded-none shadow-lg p-2 flex flex-col">
      <div {...listeners} {...attributes} className="absolute top-2 left-2 bg-gray-300 w-6 h-6 rounded-full cursor-grab flex items-center justify-center z-10 hover:bg-gray-400 transition">☰</div>
      <button onClick={() => deleteMaterial(mat._id)} className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 hover:bg-red-700 transition">✕</button>
      <div className="absolute top-2 left-10 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">{index + 1}</div>

      {mat.path ? (
       <img
  src={`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/${mat.path}`}

  alt={mat.filename || "material"}
  className="w-full h-48 object-contain cursor-pointer select-none mt-4"
  style={{ borderRadius: 0 }}
  onClick={() => setPreviewImage(`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/${mat.path}`)}
  onError={handleImageError}
  loading="lazy"
  draggable={false}
/>

      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-200 text-red-600 font-bold rounded-none mt-4">NO IMAGE</div>
      )}

      <input
        type="url"
        value={mat.link || ""}
        onChange={(e) => setMaterials(prev => prev.map(m => (m._id === mat._id ? { ...m, link: e.target.value } : m)))}
        placeholder="Enter link (e.g., https://example.com)"
        className="mt-2 w-full border border-gray-300 rounded-none px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 truncate overflow-x-auto"
        style={{ whiteSpace: "nowrap" }}
      />

      <button
        onClick={async () => {
          try {
            const currentMaterial = materials.find((m) => m._id === mat._id);
            await axiosInstance.patch(`/materials/${mat._id}`, { link: currentMaterial.link });
            alert("Link updated!");
          } catch (err) { console.error(err); alert("Error updating link"); }
        }}
        className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-none shadow-md transition"
      >
        Save
      </button>
    </div>
  );
};

// Main Materials component
const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { token } = useAuth();

  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}`,
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchMaterials = async () => {
    try {
      const res = await axiosInstance.get("/materials");
      if (res.data.success) setMaterials(res.data.data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Fetch materials error:", error.response?.data || error.message);
      alert("Error fetching materials");
    }
  };

  useEffect(() => { fetchMaterials(); }, [token]);

  const addMaterial = async () => {
  if (!file) return alert("Select a file to add");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("link", link);

  try {
    setLoading(true);
    const res = await axiosInstance.post("/materials", formData, { headers: { "Content-Type": "multipart/form-data" } });
    if (res.data.success) {
      setMaterials(prev => [{ ...res.data.data }, ...prev]);
      setFile(null);
      setLink("");

      // Reset file input to allow same file selection again
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    }
  } catch (error) {
    console.error("Add material error:", error.response?.data || error.message);
    alert("Error adding material");
  } finally {
    setLoading(false);
  }
};


  const deleteMaterial = async (id) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try { await axiosInstance.delete(`/materials/${id}`); setMaterials(prev => prev.filter(m => m._id !== id)); }
    catch (error) { console.error("Delete material error:", error.response?.data || error.message); alert("Error deleting material"); }
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = materials.findIndex(m => m._id === active.id);
    const newIndex = materials.findIndex(m => m._id === over.id);
    if (oldIndex !== newIndex) {
      const newMaterials = arrayMove(materials, oldIndex, newIndex);
      setMaterials(newMaterials);
      try {
        const reorderPayload = newMaterials.map((mat, idx) => ({ id: mat._id, order: idx + 1 }));
        await axiosInstance.patch("/materials/reorder", { materials: reorderPayload });
      } catch (err) { console.error("Error saving order:", err); alert("Failed to save image order!"); }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-4xl font-extrabold text-blue-700 mb-10 text-center">📸 Your Materials</h2>

        {/* Upload */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="file" accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0]; if (!file) return;
              const img = new Image(); img.src = URL.createObjectURL(file);
              img.onload = () => {
                const minWidth = 800, minHeight = 600;
                if (img.width < minWidth || img.height < minHeight) { alert(`Image too small! Minimum: ${minWidth}x${minHeight}px`); setFile(null); }
                else setFile(file);
                URL.revokeObjectURL(img.src);
              };
            }}
            className="flex-grow border border-gray-300 rounded-none px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            disabled={loading}
          />

          <input
            type="url" placeholder="Enter link (e.g., https://example.com)" value={link}
            onChange={(e) => setLink(e.target.value)}
            className="flex-grow border border-gray-300 rounded-none px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            disabled={loading}
          />

          <button onClick={addMaterial} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-none shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Adding..." : "Add Image"}
          </button>
        </div>

        {/* Gallery */}
        {materials.length === 0 ? <div className="text-center text-gray-400 py-16 select-none italic">No materials — add images!</div> :
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={materials.map(m => m._id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {materials.map((mat, index) => <SortableItem key={mat._id} mat={mat} index={index} materials={materials} setMaterials={setMaterials} axiosInstance={axiosInstance} deleteMaterial={deleteMaterial} setPreviewImage={setPreviewImage} />)}
              </div>
            </SortableContext>
          </DndContext>
        }

        {/* Preview Modal */}
        {previewImage && <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-none shadow-lg" />
        </div>}
      </div>
    </div>
  );
};

export default Materials;
