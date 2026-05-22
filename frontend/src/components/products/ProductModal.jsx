import React from "react";
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
  return (
    <div
      className="fixed inset-0 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-4"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white p-6 rounded shadow-lg w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto my-8 max-h-[90vh] overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {editProduct ? "Edit Object" : "Add Object"}
            </h2>

            <div className="flex gap-2">
              {/* Toggles */}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isSerialized: !prev.isSerialized,
                    stockTotal: !prev.isSerialized ? 1 : prev.stockTotal,
                    stockForRent: !prev.isSerialized
                      ? prev.isRentable
                        ? 1
                        : 0
                      : prev.stockForRent,
                  }))
                }
                className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                title="Serializable (Track individually vs grouped)"
              >
                {formData.isSerialized ? (
                  <FaCube className="text-blue-500 text-3xl" />
                ) : (
                  <FaCubes className="text-gray-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isRentable: !prev.isRentable,
                    stockForRent: !prev.isRentable
                      ? prev.isSerialized
                        ? "1"
                        : prev.stockForRent
                      : "0",
                  }))
                }
                className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                title="Rentable (allow item for rent)"
              >
                <FaHandshake
                  className={
                    formData.isRentable ? "text-green-500" : "text-gray-500"
                  }
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isVisible: !formData.isVisible,
                    isShared: !prev.isVisible ? true : prev.isShared,
                  }))
                }
                className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                title="Visible (allow item to be visible for everyone)"
              >
                {formData.isVisible ? (
                  <FaEye className="text-indigo-500" />
                ) : (
                  <FaEyeSlash className="text-gray-500" />
                )}
              </button>

              <button
                type="button"
                name="isShared"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isShared: !formData.isShared,
                    isVisible: prev.isShared ? false : prev.isVisible,
                  }))
                }
                className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                title="Shared (allow item to be visible for other users)"
              >
                {formData.isShared ? (
                  <FaUserShield className="text-indigo-500" />
                ) : (
                  <FaUserLock className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="font-semibold">
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                maxLength={100}
                required
                className="border p-2 rounded w-full"
              />
              <p className="text-sm text-gray-500">
                {formData.name.length}/100
              </p>
            </div>

            <div>
              <label htmlFor="stockTotal" className="font-semibold">
                Stock Total
              </label>
              <input
                id="stockTotal"
                type="number"
                name="stockTotal"
                placeholder="Stock Total"
                value={formData.stockTotal}
                onChange={handleChange}
                min={1}
                required
                disabled={formData.isSerialized}
                className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
            </div>

            <div className="xl:col-span-2">
              <label htmlFor="description" className="font-semibold">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                className="border p-2 rounded w-full resize-y"
              />
              <p className="text-sm text-gray-500">
                {formData.description.length}/1000
              </p>
            </div>

            <div>
              <label htmlFor="stockForRent" className="font-semibold">
                Stock For Rent
              </label>
              <input
                id="stockForRent"
                type="number"
                name="stockForRent"
                placeholder="Stock For Rent"
                value={formData.stockForRent}
                onChange={handleChange}
                min={0}
                max={formData.stockTotal}
                required
                disabled={formData.isSerialized || !formData.isRentable}
                className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Extra Columns */}
          {extraColumns.map((col, idx) => (
            <div key={idx} className="flex flex-col gap-1 mb-2">
              <label
                htmlFor={`extra-${col}`}
                className="font-semibold"
                title={col}
              >
                {col.length > 30 ? col.slice(0, 27) + "…" : col}
              </label>

              <textarea
                id={`extra-${col}`}
                name={col}
                placeholder={col}
                value={formData.extraFields?.[col] || ""}
                onChange={(e) => handleExtraFieldChange(col, e.target.value)}
                rows={1}
                maxLength={1000}
                className="border p-2 rounded w-full resize-y"
              />

              <p className="text-sm text-gray-500">
                {formData.extraFields?.[col]?.length || 0}/1000
              </p>
            </div>
          ))}

          {/* Categories */}
          <div>
            <label className="font-semibold">Categories</label>
            <CategorySelector
              categoryTree={categoryTree}
              flatCategories={normalizedCategories}
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <label htmlFor="tags" className="font-semibold text-gray-700">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                id="tags"
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                maxLength={100}
                placeholder="Enter a tag"
                className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                className="px-3 py-1 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
              >
                Add
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">{newTag.length}/100</p>
            {formData.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => {
                  const name = tag.toString();
                  const displayName = truncateFileName(
                    name,
                    MAX_FILE_NAME_LENGTH,
                  );

                  return (
                    <span
                      key={index}
                      className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1"
                      title={name}
                    >
                      {displayName}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-red-600 font-bold hover:text-red-700"
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="files" className="font-semibold">
              Upload Files
            </label>
            <input
              id="files"
              type="file"
              accept="*"
              multiple
              onChange={handleFilesChange}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* Images Display */}
          {formData.images?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-2">Images:</p>
              <div className="flex flex-wrap gap-3">
                {formData.images.map((imageObj) => {
                  const name = imageObj.originalName;
                  const displayName = truncateFileName(
                    name,
                    MAX_FILE_NAME_LENGTH,
                  );
                  return (
                    <span
                      key={imageObj.uniqueKey}
                      className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1"
                      title={name}
                    >
                      {displayName}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            images: prev.images.map((file) =>
                              file === imageObj
                                ? { ...file, isVisible: !imageObj.isVisible }
                                : file,
                            ),
                          }))
                        }
                        className="text-gray-700 hover:text-blue-500"
                      >
                        {imageObj.isVisible ? (
                          <FiEye className="w-5 h-5" />
                        ) : (
                          <FiEyeOff className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            images: prev.images.filter(
                              (file) => file !== imageObj,
                            ),
                          }))
                        }
                        className="text-red-600 font-bold hover:text-red-700"
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attachments Display */}
          {formData.attachments?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-2">Attachments:</p>
              <div className="flex flex-wrap gap-3">
                {formData.attachments.map((attachmentObj) => {
                  const name = attachmentObj.originalName;
                  const displayName = truncateFileName(
                    name,
                    MAX_FILE_NAME_LENGTH,
                  );
                  return (
                    <span
                      key={attachmentObj.uniqueKey}
                      className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1"
                      title={name}
                    >
                      {displayName}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            attachments: prev.attachments.map((file) =>
                              file === attachmentObj
                                ? {
                                    ...file,
                                    isVisible: !attachmentObj.isVisible,
                                  }
                                : file,
                            ),
                          }))
                        }
                        className="text-gray-700 hover:text-blue-500"
                      >
                        {attachmentObj.isVisible ? (
                          <FiEye className="w-5 h-5" />
                        ) : (
                          <FiEyeOff className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter(
                              (file) => file !== attachmentObj,
                            ),
                          }))
                        }
                        className="text-red-600 font-bold"
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lab Room */}
          <div>
            <label htmlFor="labRoom" className="font-semibold">
              Lab Room
            </label>
            <select
              id="labRoom"
              name="labRoom"
              value={formData.labRoom}
              onChange={handleChange}
              className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">None</option>
              {labRooms?.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>

          {/* Owner */}
          <div>
            <label htmlFor="owner" className="font-semibold">
              Owner
            </label>
            <select
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={handleOwnerChange}
              className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={!isAdmin}
            >
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
