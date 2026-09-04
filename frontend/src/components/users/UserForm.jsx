import React from "react";
import Input, { Select } from "../layout/FormFields";
import Btn from "../layout/Btn";
import { useLanguage } from "../../context/LanguageContext";

const API_BASE = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

const UserForm = ({
  editingUserId,
  currentUserId,
  formData,
  newLabRoom,
  setNewLabRoom,
  handleChange,
  handleAddLabRoom,
  handleRemoveLabRoom,
  handleSubmit,
  handleCancel,
  submitLoading,
  labDropdownRef,
}) => {
  const { t, language } = useLanguage();
  const isSelf = editingUserId && currentUserId && editingUserId === currentUserId;
  const isAdmin = formData.role === "admin";
  const disabledStatus = isSelf || isAdmin;

  let statusLabel = formData.isActive ? (language === "pl" ? "Aktywne" : "Active") : (language === "pl" ? "Nieaktywne" : "Inactive");
  if (disabledStatus) {
    if (isSelf) {
      statusLabel += ` (${language === "pl" ? "Nie można wyłączyć własnego konta" : "Cannot deactivate your own account"})`;
    } else if (isAdmin) {
      statusLabel += ` (${language === "pl" ? "Nie można wyłączyć konta administratora" : "Cannot deactivate admin account"})`;
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 dark:bg-slate-950/60"
      onClick={handleCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[1.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
          <h3 className="text-base font-extrabold text-slate-850 dark:text-white">
            {editingUserId ? (language === "pl" ? "👤 Edytuj użytkownika" : "👤 Edit User") : (language === "pl" ? "👤 Dodaj nowego użytkownika" : "👤 Add New User")}
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 font-bold transition text-xl cursor-pointer"
          >
            ×
          </button>
        </div>

        <Input label={t("users.name")} id="name" type="text" name="name" value={formData.name} onChange={handleChange} />
        <Input label={t("users.email")} id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
        <Input 
          label={t("profile.password") + (editingUserId ? (language === "pl" ? " (pozostaw puste, aby nie zmieniać)" : " (leave blank to keep current)") : "")} 
          id="password" 
          type="password" 
          name="password" 
          value={formData.password} 
          onChange={handleChange} 
        />

        {/* Profile Image Section */}
        <div className="flex flex-col gap-2 py-1">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider pl-1">
            {language === "pl" ? "Zdjęcie profilowe" : "Profile Picture"}
          </label>
          <div className="flex items-center gap-4 w-full">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-dashed border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center flex-shrink-0">
              {formData.profileImageFile ? (
                <img
                  src={URL.createObjectURL(formData.profileImageFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : formData.profileImage ? (
                <img
                  src={`${API_BASE}/uploads/users/${formData.profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-600 font-semibold uppercase">{language === "pl" ? "Brak" : "None"}</span>
              )}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleChange({ target: { name: "profileImageFile", value: file } });
                  }
                }}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <label
                  htmlFor="profileImage"
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition duration-155 cursor-pointer shadow-xs"
                >
                  {language === "pl" ? "Wybierz plik" : "Choose File"}
                </label>
                {(formData.profileImageFile || formData.profileImage) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleChange({ target: { name: "profileImageFile", value: null } });
                      handleChange({ target: { name: "profileImage", value: "" } });
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-xs font-bold rounded-xl transition duration-155 cursor-pointer"
                  >
                    {language === "pl" ? "Usuń" : "Remove"}
                  </button>
                )}
              </div>
              {formData.profileImageFile && (
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium truncate">
                  {formData.profileImageFile.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <Select label={t("users.role")} id="role" name="role" value={formData.role} onChange={handleChange}>
          <option value="">{language === "pl" ? "Wybierz rolę" : "Select Role"}</option>
          <option value="admin">{language === "pl" ? "Administrator" : "Admin"}</option>
          <option value="lecturer">{language === "pl" ? "Wykładowca" : "Lecturer"}</option>
        </Select>

        <div className="flex items-center justify-between py-2 border-t border-b border-slate-100 dark:border-slate-800/80 my-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider select-none">
            {language === "pl" ? "Status konta" : "Account Status"}
          </span>
          <label
            htmlFor="isActive"
            className={`relative inline-flex items-center cursor-pointer select-none ${
              disabledStatus ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => {
                if (disabledStatus) return;
                handleChange({ target: { name: "isActive", value: e.target.checked } });
              }}
              className="sr-only peer"
              disabled={disabledStatus}
            />
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors duration-200"></div>
            <span className="ml-3 text-xs font-semibold text-slate-700 dark:text-slate-305">
              {statusLabel}
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="labRoom" className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider pl-1">
            {language === "pl" ? "Dodaj pokój laboratoryjny" : "Add Lab Room"}
          </label>
          <div className="flex gap-2">
            <input
              id="labRoom"
              type="text"
              value={newLabRoom}
              onChange={(e) => setNewLabRoom(e.target.value)}
              className="border border-slate-250/70 dark:border-slate-850/80 bg-slate-50/40 dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2 text-sm hover:bg-slate-50/80 dark:hover:bg-slate-950 hover:border-slate-350 dark:hover:border-slate-755 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 shadow-sm focus:shadow-md flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddLabRoom(); } }}
            />
            <Btn type="button" variant="dark" onClick={handleAddLabRoom}>{language === "pl" ? "Dodaj" : "Add"}</Btn>
          </div>

          {formData.labRooms.length > 0 && (
            <div ref={labDropdownRef} className="flex flex-wrap gap-2 mt-2">
              {formData.labRooms.map((room, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30 rounded-full text-xs font-semibold shadow-sm transition hover:bg-indigo-100/50 dark:hover:bg-indigo-950/70">
                  {room}
                  <button type="button" onClick={() => handleRemoveLabRoom(room)} className="text-rose-500 dark:text-rose-400 font-bold hover:text-rose-700 dark:hover:text-rose-300 transition duration-100 text-sm leading-none flex items-center justify-center p-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full w-4 h-4 cursor-pointer">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-2">
          <Btn type="button" variant="ghost" onClick={handleCancel} className="flex-1">{t("common.cancel")}</Btn>
          <Btn type="submit" variant="primary" disabled={submitLoading} className="flex-1">
            {submitLoading ? (editingUserId ? (language === "pl" ? "Zapisywanie..." : "Saving...") : (language === "pl" ? "Dodawanie..." : "Adding...")) : (editingUserId ? ("💾 " + t("profile.saveChanges")) : t("users.addUser"))}
          </Btn>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
