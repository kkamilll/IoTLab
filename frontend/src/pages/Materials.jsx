import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/apiClient";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/layout/PageHeader";
import ConfirmModal from "../components/layout/ConfirmModal";
import Btn from "../components/layout/Btn";
import NavArrowBtn from "../components/layout/NavArrowBtn";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
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
import {
  ImageIcon,
  Plus,
  Trash2,
  ExternalLink,
  GripVertical,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Check,
  ZoomIn,
  X,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowLeft,
  ArrowRight,
  Info,
  Maximize2,
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

/* ── Sortable Gallery Item ─────────────────────────────────── */
const SortableItem = ({
  mat,
  index,
  totalItems,
  setMaterials,
  deleteMaterial,
  setPreviewImage,
  onMove,
  t,
  language,
}) => {
  const { showToast } = useToast();
  const [editingLink, setEditingLink] = useState(mat.link || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditingLink(mat.link || "");
  }, [mat.link]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mat._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : 1,
    opacity: isDragging ? 0.7 : 1,
  };

  const imageUrl = mat.path ? `${API_BASE}/${mat.path}` : "";

  const handleSaveLink = async () => {
    try {
      setIsSaving(true);
      await apiClient.patch(`/materials/${mat._id}`, { link: editingLink.trim() });
      setMaterials((prev) =>
        prev.map((m) => (m._id === mat._id ? { ...m, link: editingLink.trim() } : m))
      );
      showToast(t("materials.linkUpdated"), "success");
    } catch (err) {
      console.error(err);
      showToast(t("materials.errorLink"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getDomain = (url) => {
    if (!url) return "";
    try {
      if (url.startsWith("/")) return url;
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname.replace("www.", "");
    } catch {
      return url.length > 25 ? url.substring(0, 22) + "..." : url;
    }
  };

  const isLinkModified = editingLink.trim() !== (mat.link || "").trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col justify-between rounded-3xl border bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-lg transition-all duration-300 ${
        isDragging
          ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-102"
          : "border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800"
      }`}
    >
      {/* Top Card Bar: Drag Handle, Slide Badge, Shift Arrows, Delete */}
      <div className="flex items-center justify-between gap-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          {/* Drag Handle */}
          <div
            {...listeners}
            {...attributes}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing transition shadow-2xs"
            title={t("materials.dragHint")}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Slide Index Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 text-xs font-black shadow-2xs">
            #{index + 1}
          </span>
        </div>

        {/* Quick Shift buttons & Delete */}
        <div className="flex items-center gap-1">
          {index > 0 && (
            <button
              type="button"
              onClick={() => onMove(index, index - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={language === "pl" ? "Przesuń w lewo" : "Move left"}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {index < totalItems - 1 && (
            <button
              type="button"
              onClick={() => onMove(index, index + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={language === "pl" ? "Przesuń w prawo" : "Move right"}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => deleteMaterial(mat._id)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            title={t("common.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Container with Zoom Lightbox Overlay */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 shadow-inner group/img">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={mat.filename || "Slide"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.classList.remove("hidden");
              }
            }}
          />
        ) : null}

        <div
          className={`hidden w-full h-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-rose-500 font-bold text-xs ${
            !imageUrl ? "!flex" : ""
          }`}
        >
          {language === "pl" ? "Brak podglądu" : "No preview"}
        </div>

        {/* Hover Zoom Overlay */}
        {imageUrl && (
          <div
            onClick={() => setPreviewImage(imageUrl)}
            className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer backdrop-blur-2xs"
            title={language === "pl" ? "Kliknij, aby powiększyć" : "Click to enlarge"}
          >
            <span className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white shadow-md">
              <ZoomIn className="w-4 h-4" />
            </span>
          </div>
        )}

        {/* Status Pill on bottom corner */}
        <div className="absolute bottom-2 left-2 pointer-events-none">
          {mat.link ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-bold shadow-sm backdrop-blur-xs">
              <LinkIcon className="w-2.5 h-2.5" />
              <span>{getDomain(mat.link)}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/70 text-slate-200 text-[10px] font-medium shadow-sm backdrop-blur-xs">
              {t("materials.noLinkAssigned")}
            </span>
          )}
        </div>
      </div>

      {/* Target URL Input and Action */}
      <div className="mt-4 flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <LinkIcon className="w-3 h-3 text-indigo-500" />
            <span>{t("materials.sliderLink")}</span>
          </span>
          {mat.link && (
            <a
              href={mat.link.startsWith("http") ? mat.link : `https://${mat.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 normal-case font-bold"
              title={t("materials.testLink")}
            >
              <span>{t("materials.testLink")}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </label>

        <div className="flex items-center gap-1.5">
          <input
            type="url"
            value={editingLink}
            onChange={(e) => setEditingLink(e.target.value)}
            placeholder={t("materials.sliderLinkPlaceholder")}
            className="flex-1 min-w-0 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/15 transition truncate shadow-2xs"
          />

          <button
            type="button"
            onClick={handleSaveLink}
            disabled={isSaving || !isLinkModified}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs ${
              isLinkModified
                ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
            }`}
            title={t("materials.saveLink")}
          >
            {isSaving ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("common.save")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Materials / Slider Component ─────────────────────── */
const Materials = () => {
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Form state
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [link, setLink] = useState("");
  const fileInputRef = useRef(null);
  const [swiperInstance, setSwiperInstance] = useState(null);

  // Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  // Confirm Modal
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/materials");
      if (res.data.success) {
        setMaterials((res.data.data || []).sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (error) {
      console.error("Fetch materials error:", error);
      showToast(language === "pl" ? "Błąd pobierania slajdów" : "Error fetching slides", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Handle file selection with minimum resolution validation
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(selectedFile);
    img.src = objectUrl;

    img.onload = () => {
      const minWidth = 800;
      const minHeight = 600;
      if (img.width < minWidth || img.height < minHeight) {
        showToast(
          `${t("materials.minDimensionsError")} (${img.width}×${img.height}px)`,
          "warning"
        );
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setFile(selectedFile);
        setFilePreview(objectUrl);
      }
    };

    img.onerror = () => {
      showToast(language === "pl" ? "Nieprawidłowy plik graficzny" : "Invalid image file", "error");
      setFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
  };

  // Add new slide
  const handleAddMaterial = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      showToast(language === "pl" ? "Wybierz zdjęcie przed dodaniem" : "Please select an image", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("link", link.trim());

    try {
      setAddLoading(true);
      const res = await apiClient.post("/materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setMaterials((prev) => [...prev, res.data.data]);
        setFile(null);
        setFilePreview(null);
        setLink("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsUploaderOpen(false);
        showToast(
          language === "pl" ? "Nowy slajd został dodany do karuzeli!" : "Slide added to carousel!",
          "success"
        );
      }
    } catch (error) {
      console.error("Add material error:", error);
      showToast(
        error.response?.data?.message || (language === "pl" ? "Błąd dodawania zdjęcia" : "Error adding image"),
        "error"
      );
    } finally {
      setAddLoading(false);
    }
  };

  // Delete slide with confirmation
  const handleDeleteMaterial = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t("materials.deleteSlideTitle"),
      message: t("materials.deleteSlideConfirm"),
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/materials/${id}`);
          setMaterials((prev) => prev.filter((m) => m._id !== id));
          showToast(t("materials.deleteSuccess"), "success");
        } catch (error) {
          console.error("Delete material error:", error);
          showToast(t("materials.deleteError"), "error");
        }
      },
    });
  };

  // Move slide left/right with quick buttons
  const handleMoveSlide = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= materials.length) return;
    const newMaterials = arrayMove(materials, fromIndex, toIndex);
    setMaterials(newMaterials);

    try {
      const reorderPayload = newMaterials.map((mat, idx) => ({
        id: mat._id,
        order: idx + 1,
      }));
      await apiClient.patch("/materials/reorder", { materials: reorderPayload });
      showToast(t("materials.orderSaved"), "success");
    } catch (err) {
      console.error("Error saving order:", err);
      showToast(t("materials.orderError"), "error");
    }
  };

  // Drag and drop reorder
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

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
        await apiClient.patch("/materials/reorder", { materials: reorderPayload });
        showToast(t("materials.orderSaved"), "success");
      } catch (err) {
        console.error("Error saving order:", err);
        showToast(t("materials.orderError"), "error");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Full width container matching all dashboard views */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6 max-w-[1920px] mx-auto">
        {/* Page Header */}
        <PageHeader
          title={"📸 " + t("materials.title")}
          subtitle={t("materials.subtitle")}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {materials.length > 0 && (
              <button
                type="button"
                onClick={() => setShowLivePreview((prev) => !prev)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer ${
                  showLivePreview
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                }`}
              >
                {showLivePreview ? <EyeOff className="w-4 h-4 text-indigo-500" /> : <Eye className="w-4 h-4" />}
                <span>{showLivePreview ? t("materials.hidePreview") : t("materials.livePreview")}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsUploaderOpen((prev) => !prev)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition duration-200 shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isUploaderOpen ? (
                <>
                  <X className="w-4 h-4" />
                  <span>{t("common.cancel")}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t("materials.addSlideBtn")}</span>
                </>
              )}
            </button>
          </div>
        </PageHeader>

        {/* Live Slider Preview (Podgląd na żywo karuzeli) */}
        {showLivePreview && materials.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/40 rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{language === "pl" ? "Podgląd na żywo karuzeli strony głównej" : "Homepage Carousel Live Preview"}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                      Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {language === "pl"
                      ? "Dokładnie tak karuzela prezentuje się użytkownikom odwiedzającym stronę powitalną"
                      : "This is exactly how the carousel looks to visitors on the welcome homepage"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                {materials.length} {language === "pl" ? "slajdów" : "slides"}
              </span>
            </div>

            {/* Interactive Swiper Box */}
            <div className="relative group/preview rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 max-h-[360px] bg-slate-950">
              <NavArrowBtn
                direction="left"
                onClick={() => swiperInstance?.slidePrev()}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 shadow-md"
                ariaLabel="Previous slide"
              />
              <NavArrowBtn
                direction="right"
                onClick={() => swiperInstance?.slideNext()}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 shadow-md"
                ariaLabel="Next slide"
              />

              <Swiper
                modules={[Autoplay]}
                onSwiper={setSwiperInstance}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                loop={materials.length > 1}
                className="w-full h-[320px] sm:h-[360px]"
              >
                {materials.map((mat, idx) => (
                  <SwiperSlide key={mat._id} className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                    <img
                      src={`${API_BASE}/${mat.path}`}
                      alt={mat.filename || "slide"}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay Tag */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-950/70 text-white font-mono font-bold text-xs backdrop-blur-md shadow-md border border-white/10">
                        {language === "pl" ? `Slajd ${idx + 1} z ${materials.length}` : `Slide ${idx + 1} of ${materials.length}`}
                      </span>
                      {mat.link && (
                        <span className="px-3 py-1 rounded-xl bg-indigo-600/90 text-white font-bold text-xs backdrop-blur-md shadow-md flex items-center gap-1.5">
                          <LinkIcon className="w-3 h-3" />
                          <span>{mat.link}</span>
                        </span>
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}

        {/* Add Slide Panel (Expandable Uploader) */}
        {isUploaderOpen && (
          <form
            onSubmit={handleAddMaterial}
            className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/50 bg-white dark:bg-slate-900 shadow-md p-5 sm:p-6 transition-all duration-300 animate-in fade-in-50 zoom-in-98 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {t("materials.addMaterial")}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {language === "pl"
                      ? "Wgraj nową grafikę, która pojawi się w rotatorze na stronie powitalnej"
                      : "Upload a new image to appear in the homepage slider carousel"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploaderOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dropzone / File Picker */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("materials.uploadImage")} *
                </span>

                <input
                  ref={fileInputRef}
                  id="image-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[140px] ${
                    filePreview
                      ? "border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : "border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {filePreview ? (
                    <div className="relative w-full flex items-center justify-center gap-4">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-28 h-20 object-cover rounded-xl shadow-md border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                          {file?.name}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === "pl" ? "Zdjęcie gotowe do przesłania" : "Ready to upload"}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setFilePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="mt-2 text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>{language === "pl" ? "Wybierz inny plik" : "Choose different file"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-2">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t("materials.dropzonePrompt")}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                        {t("materials.dropzoneHint")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Target Link input */}
              <div className="flex flex-col gap-1.5 justify-between">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="slide-link-input" className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-indigo-500" />
                    <span>{t("materials.sliderLink")}</span>
                  </label>
                  <input
                    id="slide-link-input"
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder={t("materials.sliderLinkPlaceholder")}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition shadow-inner"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {language === "pl"
                      ? "Opcjonalnie: kliknięcie w slajd na stronie głównej przeniesie użytkownika pod wskazany adres URL."
                      : "Optional: clicking this slide on the homepage will redirect the user to this URL."}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <Btn
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsUploaderOpen(false);
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="px-4 py-2 font-bold"
                  >
                    {t("common.cancel")}
                  </Btn>
                  <Btn
                    type="submit"
                    disabled={addLoading || !file}
                    variant="primary"
                    className="px-6 py-2.5 font-bold flex items-center gap-1.5 shadow-md"
                  >
                    {addLoading ? (
                      <span>{t("materials.addingMaterial")}</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{t("materials.addMaterial")}</span>
                      </>
                    )}
                  </Btn>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Gallery Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>{language === "pl" ? "Ułożenie slajdów w karuzeli" : "Slide layout & order"}</span>
            </h3>
            {materials.length > 1 && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                <GripVertical className="w-3.5 h-3.5" />
                <span>{t("materials.dragHint")}</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs font-bold">
                {language === "pl" ? "Wczytywanie slajdów..." : "Loading slides..."}
              </p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center p-14 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 font-medium shadow-sm flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-3xl shadow-inner">
                📸
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {t("materials.noImages")}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  {t("materials.noImagesHelp")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploaderOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("materials.addSlideBtn")}</span>
              </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {materials.map((mat, index) => (
                    <SortableItem
                      key={mat._id}
                      mat={mat}
                      index={index}
                      totalItems={materials.length}
                      materials={materials}
                      setMaterials={setMaterials}
                      deleteMaterial={handleDeleteMaterial}
                      setPreviewImage={setPreviewImage}
                      onMove={handleMoveSlide}
                      t={t}
                      language={language}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Full Resolution Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-slate-950/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl max-h-[90vh] overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition backdrop-blur-xs cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Full Preview"
              className="max-h-[82vh] max-w-[85vw] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Materials;
