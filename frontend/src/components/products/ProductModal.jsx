import React, { useState, useMemo } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import {
  FaCube,
  FaCubes,
  FaHandshake,
  FaEye,
  FaEyeSlash,
  FaTag,
} from "react-icons/fa";
import { FaUserShield, FaUserLock } from "react-icons/fa6";
import {
  Globe,
  Lock,
  FileText,
  Package,
  SlidersHorizontal,
  Paperclip,
  ChevronRight,
  ChevronLeft,
  Check,
  UploadCloud,
  X,
  Trash2,
  MapPin,
  User,
  Image,
  File,
  AlertCircle,
} from "lucide-react";
import CategorySelector from "../categories/CategorySelector";
import { useLanguage } from "../../context/LanguageContext";

const ProductModal = ({
  closeModal,
  editProduct,
  formData,
  setFormData,
  handleChange,
  handleSubmit,
  extraColumns,
  columnConfigs = {},
  handleExtraFieldChange,
  categoryTree,
  normalizedCategories,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  handleFilesChange,
  labRooms,
  users,
  isAdmin,
  handleOwnerChange,
  truncateFileName,
  MAX_FILE_NAME_LENGTH,
}) => {
  const { t, language } = useLanguage();
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("basic");

  // Determine list of active tabs in sequence
  const tabsList = useMemo(() => {
    const list = [
      {
        id: "basic",
        label: language === "pl" ? "Podstawowe dane" : "Basic Info",
        icon: FileText,
        badge: null,
        hasError: !!errors.name,
      },
      {
        id: "inventory",
        label: language === "pl" ? "Inwentarz & Tagi" : "Inventory & Tags",
        icon: Package,
        badge: (formData.categories?.length || 0) + (formData.tags?.length || 0) || null,
        hasError: !!(errors.stockTotal || errors.stockForRent),
      },
    ];
    if (extraColumns && extraColumns.length > 0) {
      list.push({
        id: "custom",
        label: language === "pl" ? "Pola własne" : "Custom Fields",
        icon: SlidersHorizontal,
        badge: extraColumns.length,
        hasError: false,
      });
    }
    list.push({
      id: "media",
      label: language === "pl" ? "Media & Pliki" : "Media & Files",
      icon: Paperclip,
      badge: (formData.images?.length || 0) + (formData.attachments?.length || 0) || null,
      hasError: false,
    });
    return list;
  }, [extraColumns, formData.categories, formData.tags, formData.images, formData.attachments, language, errors]);

  const currentTabIndex = tabsList.findIndex((tab) => tab.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabsList.length - 1;

  const handleNextTab = () => {
    if (currentTabIndex < tabsList.length - 1) {
      setActiveTab(tabsList[currentTabIndex + 1].id);
      const scrollWrapper = document.getElementById("product-modal-scroll-wrapper");
      if (scrollWrapper) scrollWrapper.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabsList[currentTabIndex - 1].id);
      const scrollWrapper = document.getElementById("product-modal-scroll-wrapper");
      if (scrollWrapper) scrollWrapper.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("productModal.errNameRequired");
    }

    if (!formData.isSerialized) {
      const total = Number(formData.stockTotal);
      if (isNaN(total) || total < 1) {
        newErrors.stockTotal = t("productModal.errStockMin");
      }

      if (formData.isRentable) {
        const forRent = Number(formData.stockForRent);
        if (isNaN(forRent) || forRent < 0) {
          newErrors.stockForRent = t("productModal.errRentNegative");
        } else if (forRent > total) {
          newErrors.stockForRent = t("productModal.errRentExceedsTotal");
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Auto-switch to the tab with errors
      if (newErrors.name) {
        setActiveTab("basic");
      } else if (newErrors.stockTotal || newErrors.stockForRent) {
        setActiveTab("inventory");
      }
      // Scroll to top of modal to see errors
      const scrollWrapper = document.getElementById("product-modal-scroll-wrapper");
      if (scrollWrapper) scrollWrapper.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrors({});
    handleSubmit(e);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6 backdrop-blur-md bg-slate-950/50 transition-all duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="product-modal-box"
        className="bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-200/90 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden relative flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4.5 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{editProduct ? "✏️" : "✨"}</span>
              <span>{editProduct ? t("productModal.editTitle") : t("productModal.addTitle")}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {editProduct ? t("productModal.editSubtitle") : t("productModal.addSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
            title={language === "pl" ? "Zamknij" : "Close"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intuitive Segmented Subpages / Tabs Bar */}
        <div className="px-6 pt-3.5 pb-2 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/70 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-900/80 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 overflow-x-auto">
            {tabsList.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[140px] sm:min-w-0 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700/60 scale-[1.01]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-colors shrink-0 ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-300/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                  <span className="truncate">{tab.label}</span>
                  {tab.hasError && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" title="Błędy w tym kroku" />
                  )}
                  {tab.badge !== null && tab.badge > 0 && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50"
                          : "bg-slate-300/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Form with Scrollable Content and Fixed Sticky Footer */}
        <form onSubmit={handleLocalSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable Tab Content Body */}
          <div id="product-modal-scroll-wrapper" className="overflow-y-auto flex-1 p-6 sm:p-7 flex flex-col gap-6">
            {hasErrors && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 rounded-2xl p-4 text-xs sm:text-sm font-semibold shadow-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{t("productModal.errorsHeader")}</span>
                  <ul className="list-disc ml-4 mt-1 font-medium text-xs">
                    {Object.values(errors).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 1: INFORMACJE OGÓLNE (BASIC INFO) */}
            {activeTab === "basic" && (
              <div className="flex flex-col gap-5">
                {/* 1. Name & Core Identification */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>{language === "pl" ? "Główne dane obiektu" : "Core Information"}</span>
                  </h3>

                  {/* Product Name */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      {t("productModal.fieldName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="e.g. Arduino Uno R3, Raspberry Pi 4 Model B..."
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={100}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs font-medium ${
                        errors.name ? "border-red-400 dark:border-red-800" : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold px-0.5">
                      <span>{language === "pl" ? "Nazwa widoczna w tabeli i katalogu" : "Name shown in table and catalog"}</span>
                      <span>{formData.name.length} / 100</span>
                    </div>
                  </div>

                  {/* Owner & Lab Room in a 2-Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="owner" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t("productModal.fieldOwner")}</span>
                      </label>
                      <select
                        id="owner"
                        name="owner"
                        value={formData.owner}
                        onChange={handleOwnerChange}
                        disabled={!isAdmin}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer font-medium"
                      >
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email || user.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="labRoom" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t("productModal.fieldLabRoom")}</span>
                      </label>
                      <select
                        id="labRoom"
                        name="labRoom"
                        value={formData.labRoom}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs cursor-pointer font-medium"
                      >
                        <option value="">{t("productModal.roomNone")}</option>
                        {labRooms?.map((room) => (
                          <option key={room} value={room}>
                            {room}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      {t("productModal.fieldDescription")}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Szczegółowy opis, zastosowanie, parametry techniczne..."
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      maxLength={1000}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y min-h-[90px] shadow-2xs font-medium"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 text-right">
                      {formData.description.length} / 1000
                    </p>
                  </div>
                </div>

                {/* 2. Visibility & Access Permissions */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span>{language === "pl" ? "Widoczność i dostęp" : "Visibility & Access"}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Visible Toggle */}
                    <div
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                        formData.isVisible
                          ? "border-blue-400/80 bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/10"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isVisible: !formData.isVisible,
                          isShared: !prev.isVisible ? true : prev.isShared,
                        }))
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            formData.isVisible
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200/70"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200/60 dark:border-slate-700"
                          }`}
                        >
                          {formData.isVisible ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-slate-850 dark:text-slate-100">
                            {t("productModal.toggleVisible")}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                            {t("productModal.toggleVisibleDesc")}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                          formData.isVisible ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                            formData.isVisible ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Shared Toggle */}
                    <div
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                        formData.isShared
                          ? "border-purple-400/80 bg-purple-50/40 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/10"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isShared: !formData.isShared,
                          isVisible: prev.isShared ? false : prev.isVisible,
                        }))
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            formData.isShared
                              ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200/70"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200/60 dark:border-slate-700"
                          }`}
                        >
                          {formData.isShared ? <FaUserShield size={16} /> : <FaUserLock size={16} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-slate-850 dark:text-slate-100">
                            {t("productModal.toggleShared")}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                            {t("productModal.toggleSharedDesc")}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                          formData.isShared ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                            formData.isShared ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INWENTARZ & KATEGORIE (INVENTORY & CATEGORIES) */}
            {activeTab === "inventory" && (
              <div className="flex flex-col gap-5">
                {/* 1. Inventory & Stock Mode Card */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <span>{language === "pl" ? "Typ zasobu i zapasy" : "Inventory & Stock Settings"}</span>
                  </h3>

                  {/* Mode Selector Cards: Serialized vs Multi-Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Multi-Stock Item */}
                    <div
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isSerialized: false,
                        }))
                      }
                      className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 select-none ${
                        !formData.isSerialized
                          ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200/60">
                        <FaCubes size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {language === "pl" ? "Inwentarz wielosztukowy" : "Batch Quantity"}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug mt-0.5">
                          {language === "pl"
                            ? "Wiele sztuk o wspólnym stanie magazynowym (np. czujniki, kable)"
                            : "Multiple items sharing stock (e.g. sensors, cables)"}
                        </div>
                      </div>
                      {!formData.isSerialized && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />}
                    </div>

                    {/* Serialized Item */}
                    <div
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isSerialized: true,
                          stockTotal: 1,
                          stockForRent: prev.isRentable ? 1 : 0,
                        }))
                      }
                      className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 select-none ${
                        formData.isSerialized
                          ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200/60">
                        <FaCube size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {t("productModal.toggleUnique")}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug mt-0.5">
                          {t("productModal.toggleUniqueDesc")}
                        </div>
                      </div>
                      {formData.isSerialized && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />}
                    </div>
                  </div>

                  {/* Rentable Toggle */}
                  <div
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      formData.isRentable
                        ? "border-emerald-400/80 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/10"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 shadow-2xs"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isRentable: !prev.isRentable,
                        stockForRent: !prev.isRentable ? (prev.isSerialized ? "1" : prev.stockForRent) : "0",
                      }))
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          formData.isRentable
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200/70"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200/60 dark:border-slate-700"
                        }`}
                      >
                        <FaHandshake size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-850 dark:text-slate-100">
                          {t("productModal.toggleRentable")}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                          {t("productModal.toggleRentableDesc")}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        formData.isRentable ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                          formData.isRentable ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Stock Quantities Input Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label htmlFor="stockTotal" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        {t("productModal.fieldTotalStock")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="stockTotal"
                        type="number"
                        name="stockTotal"
                        value={formData.stockTotal}
                        onChange={handleChange}
                        min={1}
                        disabled={formData.isSerialized}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-2xs font-bold ${
                          errors.stockTotal ? "border-red-400 dark:border-red-800" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="stockForRent" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        {t("productModal.fieldStockForRent")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="stockForRent"
                        type="number"
                        name="stockForRent"
                        value={formData.stockForRent}
                        onChange={handleChange}
                        min={0}
                        max={formData.stockTotal}
                        disabled={formData.isSerialized || !formData.isRentable}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-2xs font-bold ${
                          errors.stockForRent ? "border-red-400 dark:border-red-800" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Categories Card */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>🏷️</span>
                      <span>{t("productModal.fieldCategories")}</span>
                    </h3>
                    <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400">
                      {formData.categories?.length || 0} {language === "pl" ? "wybranych" : "selected"}
                    </span>
                  </div>

                  <CategorySelector
                    categoryTree={categoryTree}
                    flatCategories={normalizedCategories}
                    formData={formData}
                    setFormData={setFormData}
                  />
                </div>

                {/* 3. Tags Card */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FaTag className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t("productModal.fieldTags")}</span>
                  </h3>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FaTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                      <input
                        id="tags"
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        maxLength={100}
                        placeholder={t("productModal.tagPlaceholder")}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs font-medium"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                    >
                      {t("productModal.tagAdd")}
                    </button>
                  </div>

                  {formData.tags?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formData.tags.map((tag, index) => {
                        const name = tag.toString();
                        const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 rounded-lg text-xs font-bold shadow-2xs transition"
                            title={name}
                          >
                            <span>🏷️</span>
                            <span>{displayName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5 rounded-full hover:bg-white/60 dark:hover:bg-slate-800 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {language === "pl" ? "Brak tagów. Wpisz tag i kliknij Dodaj." : "No tags added yet."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CECHY WŁASNE (CUSTOM FIELDS) */}
            {activeTab === "custom" && extraColumns && extraColumns.length > 0 && (
              <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-500" />
                  <span>{t("productModal.customProperties")}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {extraColumns.map((col, idx) => {
                    const isGuest = Boolean(columnConfigs?.[col.toLowerCase()]);
                    return (
                      <div key={idx} className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor={`extra-${col}`} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider" title={col}>
                            {col}
                          </label>
                          <span
                            title={
                              isGuest
                                ? (language === "pl" ? "Widoczna dla gości" : "Visible to guests")
                                : (language === "pl" ? "Widoczna tylko dla admina" : "Admin only")
                            }
                            className={`p-1 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${
                              isGuest
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                                : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            }`}
                          >
                            {isGuest ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{isGuest ? (language === "pl" ? "Gość" : "Guest") : "Admin"}</span>
                          </span>
                        </div>
                        <textarea
                          id={`extra-${col}`}
                          name={col}
                          placeholder={t("productModal.customPlaceholder", { col })}
                          value={formData.extraFields?.[col] || ""}
                          onChange={(e) => handleExtraFieldChange(col, e.target.value)}
                          rows={2}
                          maxLength={1000}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y min-h-[50px] font-medium"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: MEDIA & DOKUMENTY (MEDIA & FILES) */}
            {activeTab === "media" && (
              <div className="flex flex-col gap-5">
                {/* File Upload Drop Area */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center hover:border-indigo-400 transition cursor-pointer relative group">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-2xs">
                    <UploadCloud size={24} />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-white mb-1">
                    {t("productModal.uploadFiles")}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mb-3">
                    {language === "pl"
                      ? "Zdjęcia obiektów (JPG, PNG) oraz dokumenty i specyfikacje (PDF)"
                      : "Object photos (JPG, PNG) and documents/datasheets (PDF)"}
                  </p>
                  <label htmlFor="files" className="px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 shadow-2xs cursor-pointer">
                    {language === "pl" ? "Wybierz pliki z dysku" : "Select files"}
                  </label>
                  <input
                    id="files"
                    type="file"
                    accept="*"
                    multiple
                    onChange={handleFilesChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>

                {/* Uploaded Images Section */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Image className="w-4 h-4 text-indigo-500" />
                      <span>{t("productModal.listImages", { count: formData.images?.length || 0 })}</span>
                    </span>
                  </div>

                  {formData.images?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {formData.images.map((imageObj) => {
                        const name = imageObj.originalName;
                        const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                        return (
                          <div
                            key={imageObj.uniqueKey}
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs"
                            title={name}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className="text-lg">🖼️</span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {displayName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    images: prev.images.map((file) =>
                                      file === imageObj ? { ...file, isVisible: !imageObj.isVisible } : file
                                    ),
                                  }))
                                }
                                className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                  imageObj.isVisible
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-slate-100 text-slate-400 border-slate-200"
                                }`}
                                title={imageObj.isVisible ? "Widoczne dla gości" : "Ukryte przed gośćmi"}
                              >
                                {imageObj.isVisible ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    images: prev.images.filter((file) => file !== imageObj),
                                  }))
                                }
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                                title="Usuń plik"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {language === "pl" ? "Brak dodanych zdjęć." : "No images uploaded."}
                    </p>
                  )}
                </div>

                {/* Uploaded Attachments Section */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <File className="w-4 h-4 text-blue-500" />
                      <span>{t("productModal.listAttachments", { count: formData.attachments?.length || 0 })}</span>
                    </span>
                  </div>

                  {formData.attachments?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {formData.attachments.map((attachmentObj) => {
                        const name = attachmentObj.originalName;
                        const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                        return (
                          <div
                            key={attachmentObj.uniqueKey}
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs"
                            title={name}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className="text-lg">📄</span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {displayName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    attachments: prev.attachments.map((file) =>
                                      file === attachmentObj ? { ...file, isVisible: !attachmentObj.isVisible } : file
                                    ),
                                  }))
                                }
                                className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                  attachmentObj.isVisible
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-slate-100 text-slate-400 border-slate-200"
                                }`}
                                title={attachmentObj.isVisible ? "Widoczne dla gości" : "Ukryte przed gośćmi"}
                              >
                                {attachmentObj.isVisible ? <FiEye size={13} /> : <FiEyeOff size={13} />}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    attachments: prev.attachments.filter((file) => file !== attachmentObj),
                                  }))
                                }
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                                title="Usuń plik"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {language === "pl" ? "Brak dodanych załączników (PDF)." : "No attachments uploaded."}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Fixed Modal Wizard Navigation Footer */}
          <div className="shrink-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
            >
              {t("productModal.btnCancel")}
            </button>

            <div className="flex items-center gap-2">
              {!isFirstTab && (
                <button
                  type="button"
                  onClick={handlePrevTab}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{language === "pl" ? "Wstecz" : "Back"}</span>
                </button>
              )}

              {!isLastTab && (
                <button
                  type="button"
                  onClick={handleNextTab}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 transition cursor-pointer"
                >
                  <span>{language === "pl" ? "Dalej" : "Next"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 sm:px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editProduct ? t("productModal.btnSave") : t("productModal.btnCreate")}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
