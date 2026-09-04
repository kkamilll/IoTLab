import React, { useState } from "react";
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
      if(scrollWrapper) scrollWrapper.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors({});
    handleSubmit(e);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-slate-900/50 transition-all duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="product-modal-box"
        className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between rounded-t-[1.5rem]">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {editProduct ? t("productModal.editTitle") : t("productModal.addTitle")}
            </h2>
            <p className="text-sm text-slate-550 dark:text-slate-400 mt-1 font-medium">
              {editProduct ? t("productModal.editSubtitle") : t("productModal.addSubtitle")}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Container to prevent scrollbar corner bleeding */}
        <div id="product-modal-scroll-wrapper" className="overflow-y-auto flex-1 flex flex-col">
          {/* Tab Selection Navigation Bar */}
          <div className="flex w-full border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 sticky top-0 z-10 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setActiveTab("basic")}
              className={`flex-1 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                activeTab === "basic"
                  ? "border-indigo-650 text-indigo-700 dark:text-indigo-405"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t("productModal.tabInfo")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`flex-1 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                activeTab === "inventory"
                  ? "border-indigo-650 text-indigo-700 dark:text-indigo-405"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t("productModal.tabInventory")}
            </button>
            {extraColumns && extraColumns.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`flex-1 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                  activeTab === "custom"
                    ? "border-indigo-650 text-indigo-700 dark:text-indigo-405"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t("productModal.tabCustom")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                activeTab === "media"
                  ? "border-indigo-650 text-indigo-700 dark:text-indigo-405"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t("productModal.tabMedia")}
            </button>
          </div>

        {/* Modal Form */}
        <form className="p-6 md:p-8 flex flex-col gap-6 min-h-[550px] flex-1" onSubmit={handleLocalSubmit}>
          {hasErrors && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 rounded-xl p-4 text-sm font-semibold shadow-sm">
              {t("productModal.errorsHeader")}
              <ul className="list-disc ml-5 mt-2 font-medium">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 1: BASIC INFO */}
          {activeTab === "basic" && (
            <div className="flex flex-col gap-6">
              {/* Settings / Toggles */}
              <div className="bg-slate-50/50 dark:bg-slate-950/35 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Serialized Toggle */}
                <div 
                  className={`flex flex-col items-center justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 min-h-[160px] ${formData.isSerialized ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20" : "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-350 dark:hover:border-slate-700"}`}
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    isSerialized: !prev.isSerialized,
                    stockTotal: !prev.isSerialized ? 1 : prev.stockTotal,
                    stockForRent: !prev.isSerialized ? (prev.isRentable ? 1 : 0) : prev.stockForRent,
                  }))}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className={`p-2.5 rounded-full mb-2 ${formData.isSerialized ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                      {formData.isSerialized ? <FaCube size={18} /> : <FaCubes size={18} />}
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{t("productModal.toggleUnique")}</span>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 text-center mt-1 leading-normal">{t("productModal.toggleUniqueDesc")}</span>
                  </div>
                  <div className={`mt-3 w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${formData.isSerialized ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${formData.isSerialized ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>

                {/* Rentable Toggle */}
                <div 
                  className={`flex flex-col items-center justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 min-h-[160px] ${formData.isRentable ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20" : "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-350 dark:hover:border-slate-700"}`}
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    isRentable: !prev.isRentable,
                    stockForRent: !prev.isRentable ? (prev.isSerialized ? "1" : prev.stockForRent) : "0",
                  }))}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className={`p-2.5 rounded-full mb-2 ${formData.isRentable ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-650 dark:text-emerald-450" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                      <FaHandshake size={18} />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{t("productModal.toggleRentable")}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-1 leading-normal">{t("productModal.toggleRentableDesc")}</span>
                  </div>
                  <div className={`mt-3 w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${formData.isRentable ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${formData.isRentable ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>

                {/* Visible Toggle */}
                <div 
                  className={`flex flex-col items-center justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 min-h-[160px] ${formData.isVisible ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20" : "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-350 dark:hover:border-slate-700"}`}
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    isVisible: !formData.isVisible,
                    isShared: !prev.isVisible ? true : prev.isShared,
                  }))}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className={`p-2.5 rounded-full mb-2 ${formData.isVisible ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                      {formData.isVisible ? <FaEye size={18} /> : <FaEyeSlash size={18} />}
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{t("productModal.toggleVisible")}</span>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 text-center mt-1 leading-normal">{t("productModal.toggleVisibleDesc")}</span>
                  </div>
                  <div className={`mt-3 w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${formData.isVisible ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${formData.isVisible ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>

                {/* Shared Toggle */}
                <div 
                  className={`flex flex-col items-center justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 min-h-[160px] ${formData.isShared ? "border-violet-500 bg-violet-50/30 dark:bg-violet-950/20" : "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-350 dark:hover:border-slate-700"}`}
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    isShared: !formData.isShared,
                    isVisible: prev.isShared ? false : prev.isVisible,
                  }))}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className={`p-2.5 rounded-full mb-2 ${formData.isShared ? "bg-violet-100 dark:bg-violet-950 text-violet-650 dark:text-violet-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                      {formData.isShared ? <FaUserShield size={18} /> : <FaUserLock size={18} />}
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{t("productModal.toggleShared")}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-550 text-center mt-1 leading-normal">{t("productModal.toggleSharedDesc")}</span>
                  </div>
                  <div className={`mt-3 w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${formData.isShared ? "bg-violet-500" : "bg-slate-200 dark:bg-slate-800"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${formData.isShared ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t("productModal.fieldName")} <span className="text-red-500">*</span></label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="e.g. Arduino Uno R3"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition ${errors.name ? 'border-red-400 dark:border-red-900/60' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 text-right">{formData.name.length}/100</p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t("productModal.fieldDescription")}</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Provide details about the object..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y min-h-[100px]"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 text-right">{formData.description.length}/1000</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="owner" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t("productModal.fieldOwner")}</label>
                    <select
                      id="owner"
                      name="owner"
                      value={formData.owner}
                      onChange={handleOwnerChange}
                      disabled={!isAdmin}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="labRoom" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t("productModal.fieldLabRoom")}</label>
                    <select
                      id="labRoom"
                      name="labRoom"
                      value={formData.labRoom}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                    >
                      <option value="">{t("productModal.roomNone")}</option>
                      {labRooms?.map((room) => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & CATEGORIES */}
          {activeTab === "inventory" && (
            <div className="flex flex-col gap-6">
              {/* Card 1: Stock Configuration */}
              <div className="bg-slate-50/50 dark:bg-slate-950/35 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FaCubes className="w-4 h-4 text-indigo-500" />
                  {language === "pl" ? "Konfiguracja zapasów" : "Inventory Settings"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="stockTotal" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition ${errors.stockTotal ? 'border-red-450 dark:border-red-900/60' : 'border-slate-200 dark:border-slate-800'}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="stockForRent" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition ${errors.stockForRent ? 'border-red-450 dark:border-red-900/60' : 'border-slate-200 dark:border-slate-800'}`}
                    />
                  </div>
                </div>
                {formData.isSerialized && (
                  <p className="mt-3 text-xs text-indigo-650 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                    <span>💡</span>
                    {language === "pl"
                      ? "Opcje zablokowane: to urządzenie jest unikalne (pojedynczy przedmiot)."
                      : "Options disabled: this device is tracked individually (unique item)."}
                  </p>
                )}
              </div>

              {/* Card 2: Categories */}
              <div className="bg-slate-50/50 dark:bg-slate-950/35 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📂</span>
                  {t("productModal.fieldCategories")}
                </h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950/20 max-h-64 overflow-y-auto shadow-xs">
                  <CategorySelector
                    categoryTree={categoryTree}
                    flatCategories={normalizedCategories}
                    formData={formData}
                    setFormData={setFormData}
                  />
                </div>
              </div>

              {/* Card 3: Tags */}
              <div className="bg-slate-50/50 dark:bg-slate-950/35 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FaTag className="w-3.5 h-3.5 text-indigo-500" />
                  {t("productModal.fieldTags")}
                </h3>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <FaTag className="w-3.5 h-3.5" />
                    </span>
                    <input
                      id="tags"
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      maxLength={100}
                      placeholder={t("productModal.tagPlaceholder")}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition shadow-sm"
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
                    className="px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow hover:shadow-md transition whitespace-nowrap cursor-pointer"
                  >
                    {t("productModal.tagAdd")}
                  </button>
                </div>

                {formData.tags?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/60">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2.5 uppercase tracking-wider">
                      {language === "pl" ? "Przypisane tagi:" : "Assigned tags:"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => {
                        const name = tag.toString();
                        const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-305 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl text-xs font-bold shadow-sm hover:border-indigo-200 hover:bg-indigo-100/30 transition-all duration-200"
                            title={name}
                          >
                            <span>🏷️</span>
                            <span>{displayName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-500 focus:outline-none cursor-pointer p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM PROPERTIES */}
          {activeTab === "custom" && extraColumns && extraColumns.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-105 dark:border-slate-800 pb-2">{t("productModal.customProperties")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {extraColumns.map((col, idx) => (
                  <div key={idx} className="flex flex-col">
                    <label htmlFor={`extra-${col}`} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" title={col}>
                      {col.length > 30 ? col.slice(0, 27) + "…" : col}
                    </label>
                    <textarea
                      id={`extra-${col}`}
                      name={col}
                      placeholder={t("productModal.customPlaceholder", { col })}
                      value={formData.extraFields?.[col] || ""}
                      onChange={(e) => handleExtraFieldChange(col, e.target.value)}
                      rows={1}
                      maxLength={1000}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y min-h-[42px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FILES & MEDIA */}
          {activeTab === "media" && (
            <div className="space-y-6">
              <div className="bg-slate-50/50 dark:bg-slate-950/35 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
                <div>
                  <label htmlFor="files" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t("productModal.uploadFiles")}</label>
                  <input
                    id="files"
                    type="file"
                    accept="*"
                    multiple
                    onChange={handleFilesChange}
                    className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/50 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/40 transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Images List */}
              {formData.images?.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("productModal.listImages", { count: formData.images.length })}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {formData.images.map((imageObj) => {
                      const name = imageObj.originalName;
                      const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                      return (
                        <span key={imageObj.uniqueKey} className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300" title={name}>
                          {displayName}
                          <div className="w-px h-4 bg-slate-200 dark:bg-slate-850 mx-1"></div>
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
                            className={`${imageObj.isVisible ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'} hover:text-indigo-700 dark:hover:text-indigo-300 transition cursor-pointer`}
                          >
                            {imageObj.isVisible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                images: prev.images.filter((file) => file !== imageObj),
                              }))
                            }
                            className="text-red-500 hover:text-red-700 transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attachments List */}
              {formData.attachments?.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("productModal.listAttachments", { count: formData.attachments.length })}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {formData.attachments.map((attachmentObj) => {
                      const name = attachmentObj.originalName;
                      const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                      return (
                        <span key={attachmentObj.uniqueKey} className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300" title={name}>
                          {displayName}
                          <div className="w-px h-4 bg-slate-200 dark:bg-slate-850 mx-1"></div>
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
                            className={`${attachmentObj.isVisible ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'} hover:text-indigo-700 dark:hover:text-indigo-300 transition cursor-pointer`}
                          >
                            {attachmentObj.isVisible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                attachments: prev.attachments.filter((file) => file !== attachmentObj),
                              }))
                            }
                            className="text-red-500 hover:text-red-700 transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {t("productModal.btnCancel")}
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-indigo-650 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              {editProduct ? t("productModal.btnSave") : t("productModal.btnCreate")}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
