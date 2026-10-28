import React from "react";
import Input, { Select } from "../layout/FormFields";
import Btn from "../layout/Btn";
import { useLanguage } from "../../context/LanguageContext";
import {
  User,
  Mail,
  Lock,
  Shield,
  Building2,
  Camera,
  Trash2,
  X,
  Check,
  Plus,
  AlertCircle,
} from "lucide-react";

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

  let statusExplanation = "";
  if (disabledStatus) {
    if (isSelf) {
      statusExplanation = language === "pl" ? "Nie można wyłączyć własnego konta" : "Cannot deactivate your own account";
    } else if (isAdmin) {
      statusExplanation = language === "pl" ? "Nie można wyłączyć konta administratora" : "Cannot deactivate admin account";
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/50 dark:bg-slate-950/70 animate-in fade-in duration-200"
      onClick={handleCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto text-left"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingUserId
                  ? (language === "pl" ? "Edycja użytkownika" : "Edit User")
                  : (language === "pl" ? "Nowy użytkownik" : "New User")}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {editingUserId
                  ? (language === "pl" ? "Zaktualizuj uprawnienia i dane profilowe" : "Update user details and permissions")
                  : (language === "pl" ? "Wypełnij dane, aby utworzyć konto w systemie" : "Fill details to create a system account")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Image Section */}
        <div className="flex items-center gap-4 p-3 bg-slate-50/80 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-2xs group">
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
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <span className="text-sm text-indigo-600 dark:text-indigo-400 font-black">
                {formData.name
                  ? formData.name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
                  : <Camera className="w-6 h-6 text-slate-400" />}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t("users.profileImage") || (language === "pl" ? "Zdjęcie profilowe" : "Profile Picture")}
            </span>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleChange({ target: { name: "profileImageFile", value: file } });
                }
                e.target.value = "";
              }}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="profileImage"
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === "pl" ? "Wybierz plik" : "Choose file"}</span>
              </label>
              {(formData.profileImageFile || formData.profileImage) && (
                <button
                  type="button"
                  onClick={() => {
                    handleChange({ target: { name: "profileImageFile", value: null } });
                    handleChange({ target: { name: "profileImage", value: "" } });
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === "pl" ? "Usuń" : "Remove"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Basic Fields */}
        <Input label={t("users.name")} id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="np. Jan Kowalski" />
        <Input label={t("users.email")} id="email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="np. j.kowalski@uczelnia.pl" />
        <div>
          <Input
            label={t("profile.password") + (editingUserId ? (language === "pl" ? " (pozostaw puste, aby nie zmieniać)" : " (leave blank to keep current)") : "")}
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-1">
            {language === "pl"
              ? "Wymóg: min. 8 znaków, co najmniej 1 cyfra i 1 wielka litera."
              : "Requirement: min. 8 characters, at least 1 digit and 1 uppercase letter."}
          </p>
        </div>

        {/* Role Selection */}
        <Select label={t("users.role")} id="role" name="role" value={formData.role} onChange={handleChange}>
          <option value="">{language === "pl" ? "Wybierz rolę w systemie" : "Select Role"}</option>
          <option value="lecturer">{language === "pl" ? "Wykładowca / Opiekun laboratorium" : "Lecturer / Supervisor"}</option>
          <option value="admin">{language === "pl" ? "Administrator systemu" : "Administrator"}</option>
        </Select>

        {/* Account Status Switch */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === "pl" ? "Status konta" : "Account Status"}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {formData.isActive ? (language === "pl" ? "Aktywne (dostęp do systemu)" : "Active") : (language === "pl" ? "Zablokowane" : "Inactive")}
            </span>
            {statusExplanation && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3" />
                <span>{statusExplanation}</span>
              </p>
            )}
          </div>
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
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors duration-200"></div>
          </label>
        </div>

        {/* Lab Rooms Tag Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="labRoom" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === "pl" ? "Pokoje / Laboratoria" : "Lab Rooms"}</span>
          </label>
          <div className="flex gap-2">
            <input
              id="labRoom"
              type="text"
              value={newLabRoom}
              onChange={(e) => setNewLabRoom(e.target.value)}
              placeholder={language === "pl" ? "np. 101, A-204" : "e.g. 101, A-204"}
              className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddLabRoom(); } }}
            />
            <button
              type="button"
              onClick={handleAddLabRoom}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === "pl" ? "Dodaj" : "Add"}</span>
            </button>
          </div>

          {formData.labRooms.length > 0 && (
            <div ref={labDropdownRef} className="flex flex-wrap gap-1.5 mt-1">
              {formData.labRooms.map((room, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30 rounded-lg text-xs font-bold shadow-2xs"
                >
                  <span>Sala {room}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLabRoom(room)}
                    className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition p-0.5 rounded-md hover:bg-rose-100/50 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          <Btn type="button" variant="ghost" onClick={handleCancel} className="flex-1 font-bold">
            {t("common.cancel")}
          </Btn>
          <Btn type="submit" variant="primary" disabled={submitLoading} className="flex-1 font-bold flex items-center justify-center gap-1.5">
            {submitLoading ? (
              <span>{editingUserId ? (language === "pl" ? "Zapisywanie..." : "Saving...") : (language === "pl" ? "Dodawanie..." : "Adding...")}</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{editingUserId ? t("profile.saveChanges") : t("users.addUser")}</span>
              </>
            )}
          </Btn>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
