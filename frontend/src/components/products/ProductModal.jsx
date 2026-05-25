import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import {
  FaCube,
  FaCubes,
  FaHandshake,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { FaUserShield, FaUserLock } from "react-icons/fa6";
import CategorySelector from "../categories/CategorySelector";

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
  const [errors, setErrors] = useState({});

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required.";
    
    if (!formData.isSerialized) {
      if (Number(formData.stockTotal) < 1) {
        newErrors.stockTotal = "Stock total must be at least 1.";
      }
      if (formData.isRentable && Number(formData.stockForRent) > Number(formData.stockTotal)) {
        newErrors.stockForRent = "Stock for rent cannot exceed total stock.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to top to see errors
      const modalBox = document.getElementById("product-modal-box");
      if(modalBox) modalBox.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors({});
    handleSubmit(e);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-slate-900/50 transition-all duration-300"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        id="product-modal-box"
        className="bg-white rounded-[1.5rem] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-center justify-between rounded-t-[1.5rem]">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {editProduct ? "Edit Object" : "Add Object"}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {editProduct ? "Modify the properties and stock of this object." : "Create a new object for the laboratory inventory."}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="p-6 md:p-8 flex flex-col gap-8" onSubmit={handleLocalSubmit}>
          {hasErrors && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm font-semibold shadow-sm">
              Please correct the following errors:
              <ul className="list-disc ml-5 mt-2 font-medium">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Settings / Toggles */}
          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Serialized Toggle */}
            <div 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition ${formData.isSerialized ? "border-indigo-500 bg-indigo-50/50" : "border-transparent bg-white shadow-sm hover:border-slate-300"}`}
              onClick={() => setFormData((prev) => ({
                ...prev,
                isSerialized: !prev.isSerialized,
                stockTotal: !prev.isSerialized ? 1 : prev.stockTotal,
                stockForRent: !prev.isSerialized ? (prev.isRentable ? 1 : 0) : prev.stockForRent,
              }))}
            >
              <div className={`p-3 rounded-full mb-2 ${formData.isSerialized ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                {formData.isSerialized ? <FaCube size={20} /> : <FaCubes size={20} />}
              </div>
              <span className="font-bold text-sm text-slate-800">Unique Item</span>
              <span className="text-[10px] text-slate-500 text-center mt-1">Tracked individually via serial number</span>
            </div>

            {/* Rentable Toggle */}
            <div 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition ${formData.isRentable ? "border-emerald-500 bg-emerald-50/50" : "border-transparent bg-white shadow-sm hover:border-slate-300"}`}
              onClick={() => setFormData((prev) => ({
                ...prev,
                isRentable: !prev.isRentable,
                stockForRent: !prev.isRentable ? (prev.isSerialized ? "1" : prev.stockForRent) : "0",
              }))}
            >
              <div className={`p-3 rounded-full mb-2 ${formData.isRentable ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                <FaHandshake size={20} />
              </div>
              <span className="font-bold text-sm text-slate-800">Rentable</span>
              <span className="text-[10px] text-slate-500 text-center mt-1">Can be requested by users</span>
            </div>

            {/* Visible Toggle */}
            <div 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition ${formData.isVisible ? "border-blue-500 bg-blue-50/50" : "border-transparent bg-white shadow-sm hover:border-slate-300"}`}
              onClick={() => setFormData((prev) => ({
                ...prev,
                isVisible: !formData.isVisible,
                isShared: !prev.isVisible ? true : prev.isShared,
              }))}
            >
              <div className={`p-3 rounded-full mb-2 ${formData.isVisible ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                {formData.isVisible ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
              </div>
              <span className="font-bold text-sm text-slate-800">Publicly Visible</span>
              <span className="text-[10px] text-slate-500 text-center mt-1">Visible to all registered users</span>
            </div>

            {/* Shared Toggle */}
            <div 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition ${formData.isShared ? "border-violet-500 bg-violet-50/50" : "border-transparent bg-white shadow-sm hover:border-slate-300"}`}
              onClick={() => setFormData((prev) => ({
                ...prev,
                isShared: !formData.isShared,
                isVisible: prev.isShared ? false : prev.isVisible,
              }))}
            >
              <div className={`p-3 rounded-full mb-2 ${formData.isShared ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-500"}`}>
                {formData.isShared ? <FaUserShield size={20} /> : <FaUserLock size={20} />}
              </div>
              <span className="font-bold text-sm text-slate-800">Shared Access</span>
              <span className="text-[10px] text-slate-500 text-center mt-1">Accessible by other admins</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* General Info */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">General Information</h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="e.g. Arduino Uno R3"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={100}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
                />
                <p className="text-[10px] text-slate-400 font-bold mt-1 text-right">{formData.name.length}/100</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Provide details about the object..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y min-h-[100px]"
                />
                <p className="text-[10px] text-slate-400 font-bold mt-1 text-right">{formData.description.length}/1000</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner" className="block text-sm font-semibold text-slate-700 mb-1">Owner</label>
                  <select
                    id="owner"
                    name="owner"
                    value={formData.owner}
                    onChange={handleOwnerChange}
                    disabled={!isAdmin}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="labRoom" className="block text-sm font-semibold text-slate-700 mb-1">Lab Room</label>
                  <select
                    id="labRoom"
                    name="labRoom"
                    value={formData.labRoom}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  >
                    <option value="">None</option>
                    {labRooms?.map((room) => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory & Taxonomy */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Inventory & Tags</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stockTotal" className="block text-sm font-semibold text-slate-700 mb-1">Total Stock <span className="text-red-500">*</span></label>
                  <input
                    id="stockTotal"
                    type="number"
                    name="stockTotal"
                    value={formData.stockTotal}
                    onChange={handleChange}
                    min={1}
                    disabled={formData.isSerialized}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition ${errors.stockTotal ? 'border-red-400' : 'border-slate-200'}`}
                  />
                </div>
                <div>
                  <label htmlFor="stockForRent" className="block text-sm font-semibold text-slate-700 mb-1">Stock for Rent <span className="text-red-500">*</span></label>
                  <input
                    id="stockForRent"
                    type="number"
                    name="stockForRent"
                    value={formData.stockForRent}
                    onChange={handleChange}
                    min={0}
                    max={formData.stockTotal}
                    disabled={formData.isSerialized || !formData.isRentable}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition ${errors.stockForRent ? 'border-red-400' : 'border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Categories</label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto">
                  <CategorySelector
                    categoryTree={categoryTree}
                    flatCategories={normalizedCategories}
                    formData={formData}
                    setFormData={setFormData}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-slate-700 mb-1">Tags</label>
                <div className="flex gap-2">
                  <input
                    id="tags"
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. microcontroller"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 text-sm font-bold bg-slate-800 text-white rounded-xl shadow-sm hover:bg-slate-900 transition whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
                {formData.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag, index) => {
                      const name = tag.toString();
                      const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                      return (
                        <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-semibold" title={name}>
                          {displayName}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-600 focus:outline-none">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Extra Fields Section */}
          {extraColumns && extraColumns.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Custom Properties</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {extraColumns.map((col, idx) => (
                  <div key={idx}>
                    <label htmlFor={`extra-${col}`} className="block text-sm font-semibold text-slate-700 mb-1" title={col}>
                      {col.length > 30 ? col.slice(0, 27) + "…" : col}
                    </label>
                    <textarea
                      id={`extra-${col}`}
                      name={col}
                      placeholder={`Value for ${col}`}
                      value={formData.extraFields?.[col] || ""}
                      onChange={(e) => handleExtraFieldChange(col, e.target.value)}
                      rows={1}
                      maxLength={1000}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media & Attachments */}
          <div className="space-y-5 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">Media & Documents</h3>
            <div>
              <label htmlFor="files" className="block text-sm font-semibold text-slate-700 mb-2">Upload Images & PDF</label>
              <input
                id="files"
                type="file"
                accept="*"
                multiple
                onChange={handleFilesChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition cursor-pointer"
              />
            </div>

            {/* Images List */}
            {formData.images?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Images ({formData.images.length})</p>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((imageObj) => {
                    const name = imageObj.originalName;
                    const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                    return (
                      <span key={imageObj.uniqueKey} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-medium text-slate-700" title={name}>
                        {displayName}
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
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
                          className={`${imageObj.isVisible ? 'text-indigo-500' : 'text-slate-400'} hover:text-indigo-700 transition`}
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
                          className="text-red-500 hover:text-red-700 transition"
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
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-500 mb-2">Attachments ({formData.attachments.length})</p>
                <div className="flex flex-wrap gap-2">
                  {formData.attachments.map((attachmentObj) => {
                    const name = attachmentObj.originalName;
                    const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);
                    return (
                      <span key={attachmentObj.uniqueKey} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-medium text-slate-700" title={name}>
                        {displayName}
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
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
                          className={`${attachmentObj.isVisible ? 'text-indigo-500' : 'text-slate-400'} hover:text-indigo-700 transition`}
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
                          className="text-red-500 hover:text-red-700 transition"
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

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              {editProduct ? "Save Changes" : "Create Object"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
