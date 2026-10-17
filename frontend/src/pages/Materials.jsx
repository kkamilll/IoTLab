import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/layout/ConfirmModal";
import { useLanguage } from "../context/LanguageContext";
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

// Sortable gallery item
const SortableItem = ({
  mat,
  index,
  materials,
  setMaterials,
  deleteMaterial,
  setPreviewImage,
}) => {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: mat._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.replaceWith(
      Object.assign(document.createElement("div"), {
        innerText: "NO IMAGE",
        className:
          "w-full h-48 flex items-center justify-center bg-slate-100 text-red-600 font-bold rounded-xl mt-4",
      }),
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
    >
      <div
        {...listeners}
        {...attributes}
        className="absolute top-4 left-4 bg-slate-800/80 hover:bg-slate-800 text-white w-9 h-9 rounded-full cursor-grab flex items-center justify-center z-10 transition shadow-sm"
      >
        ☰
      </div>
      <button
        onClick={() => deleteMaterial(mat._id)}
        className="absolute top-4 right-4 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition shadow-sm"
      >
        ✕
      </button>
      <div className="absolute top-4 left-16 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">
        {index + 1}
      </div>

      {mat.path ? (
        <img
          src={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/${mat.path}`}
          alt={mat.filename || "material"}
          className="w-full h-48 object-cover rounded-xl cursor-pointer select-none mt-6"
          onClick={() =>
            setPreviewImage(
              `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/${mat.path}`,
            )
          }
          onError={handleImageError}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-slate-100 text-red-600 font-bold rounded-xl mt-6">
          NO IMAGE
        </div>
      )}

      <input
        type="url"
        value={mat.link || ""}
        onChange={(e) =>
          setMaterials((prev) =>
            prev.map((m) =>
              m._id === mat._id ? { ...m, link: e.target.value } : m,
            ),
          )
        }
        placeholder="Enter link (e.g., https://example.com)"
        className="mt-4 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-gray-900 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 truncate overflow-x-auto"
        style={{ whiteSpace: "nowrap" }}
      />

      <button
        onClick={async () => {
          try {
            const currentMaterial = materials.find((m) => m._id === mat._id);
            await apiClient.patch(`/materials/${mat._id}`, {
              link: currentMaterial.link,
            });
            showToast(t("materials.linkUpdated", "Link updated!"), "success");
          } catch (err) {
            console.error(err);
            showToast(t("materials.errorLink", "Error updating link"), "error");
          }
        }}
        className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-xl shadow-sm transition"
      >
        {t("common.save", "Save")}
      </button>
    </div>
  );
};

// Main Materials component
const Materials = () => {
  const { t } = useLanguage();
  const [materials, setMaterials] = useState([]);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });
  const { token } = useAuth();
  const { showToast } = useToast();

  const fetchMaterials = async () => {
    try {
      const res = await apiClient.get("/materials");
      if (res.data.success)
        setMaterials(res.data.data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error(
        "Fetch materials error:",
        error.response?.data || error.message,
      );
      showToast("Error fetching materials", "error");
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  const addMaterial = async () => {
    if (!file) {
      showToast("Select a file to add", "warning");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("link", link);

    try {
      setLoading(true);
      const res = await apiClient.post("/materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setMaterials((prev) => [{ ...res.data.data }, ...prev]);
        setFile(null);
        setLink("");

        // Reset file input to allow same file selection again
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error(
        "Add material error:",
        error.response?.data || error.message,
      );
      showToast("Error adding material", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete", "Usuń zdjęcie"),
      message: t("components.deleteFileConfirm", "Are you sure you want to delete this image?"),
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/materials/${id}`);
          setMaterials((prev) => prev.filter((m) => m._id !== id));
          showToast("Image deleted", "success");
        } catch (error) {
          console.error(
            "Delete material error:",
            error.response?.data || error.message,
          );
          showToast("Error deleting material", "error");
        }
      }
    });
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = materials.findIndex((m) => m._id === active.id);
    const newIndex = materials.findIndex((m) => m._id === over.id);
    if (oldIndex !== newIndex) {
      const newMaterials = arrayMove(materials, oldIndex, newIndex);
      setMaterials(newMaterials);
      try {
        const reorderPayload = newMaterials.map((mat, idx) => ({
          id: mat._id,
          order: idx + 1,
        }));
        await apiClient.patch("/materials/reorder", {
          materials: reorderPayload,
        });
      } catch (err) {
        console.error("Error saving order:", err);
        showToast("Failed to save image order!", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col items-center p-6 md:p-8">
      <div className="w-full max-w-7xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4 w-full">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              📸 {t("materials.title", "Your Slider")}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {t("materials.subtitle", "Upload and organize images for your laboratory slider.")}
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
          {/* File Input */}
          <div className="flex flex-col w-full">
            <label
              htmlFor="image-upload"
              className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
            >
              {t("materials.uploadImage", "Upload Image")}
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                  const minWidth = 800,
                    minHeight = 600;
                  if (img.width < minWidth || img.height < minHeight) {
                    showToast(
                      `Image too small! Minimum: ${minWidth}x${minHeight}px`,
                      "warning"
                    );
                    setFile(null);
                  } else {
                    setFile(file);
                  }
                  URL.revokeObjectURL(img.src);
                };
              }}
              className="border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {/* Link Input */}
          <div className="flex flex-col w-full">
            <label
              htmlFor="material-link"
              className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
            >
              {t("materials.sliderLink", "Slider Link")}
            </label>
            <input
              id="material-link"
              type="url"
              placeholder="e.g. https://example.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {/* Add Button */}
          <div className="flex items-end w-full">
            <button
              onClick={addMaterial}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              {loading ? "..." : t("materials.addImage", "Add Image")}
            </button>
          </div>
        </div>

        {/* Gallery */}
        {materials.length === 0 ? (
          <div className="text-center text-slate-400 py-16 select-none italic font-medium">
            {t("materials.noImages", "No images in slider.")}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={materials.map((m) => m._id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {materials.map((mat, index) => (
                  <SortableItem
                    key={mat._id}
                    mat={mat}
                    index={index}
                    materials={materials}
                    setMaterials={setMaterials}
                    deleteMaterial={deleteMaterial}
                    setPreviewImage={setPreviewImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-slate-950/50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden flex items-center justify-center">
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl"
              />
            </div>
          </div>
        )}
      </div>
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

export default Materials;
