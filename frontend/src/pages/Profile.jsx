import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

const API_BASE = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

const Profile = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  // --- State ---
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    labRooms: [],
    profileImage: "",
    profileImageFile: null,
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newLabRoom, setNewLabRoom] = useState("");
  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  // --- Fetch user profile on mount ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/users/profile");
        if (res.data.success) {
          setUser({
            name: res.data.user.name || "",
            email: res.data.user.email || "",
            password: "",
            role: res.data.user.role || "",
            labRooms: res.data.user.labRooms || [],
            profileImage: res.data.user.profileImage || "",
            profileImageFile: null,
          });
        }
      } catch (err) {
        console.error(err.response?.data || err.message);
        showToast(t("profile.errorFetch") || "Error fetching profile", "error");
      }
    };
    fetchUser();
  }, [token]);

  // --- Handle click outside dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers ---
  const handleSave = async () => {
    if (!user.name.trim() || !user.email.trim()) {
      showToast(t("profile.nameEmailRequired") || "Name and email are required", "warning");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", user.name);
      formData.append("email", user.email);
      if (user.password.trim()) {
        formData.append("password", user.password);
      }
      formData.append("labRooms", JSON.stringify(user.labRooms || []));
      if (user.profileImageFile) {
        formData.append("profileImage", user.profileImageFile);
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const res = await apiClient.put("/users/profile", formData, config);
      if (res.data.success) {
        showToast(t("profile.successUpdate") || "Profile updated successfully!", "success");
        setEditMode(false);
        setUser((prev) => ({
          ...prev,
          password: "",
          profileImage: res.data.user.profileImage || prev.profileImage,
          profileImageFile: null,
        }));
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      showToast(err.response?.data?.message || t("profile.errorUpdate") || "Error updating profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    // Reset local password and uploaded file preview
    setUser((prev) => ({
      ...prev,
      password: "",
      profileImageFile: null,
    }));
  };

  const handleAddLabRoom = () => {
    if (newLabRoom && !user.labRooms.includes(newLabRoom)) {
      setUser((prev) => ({
        ...prev,
        labRooms: [...prev.labRooms, newLabRoom],
      }));
      setNewLabRoom("");
    }
  };

  const handleRemoveLabRoom = (room) => {
    setUser((prev) => ({
      ...prev,
      labRooms: prev.labRooms.filter((r) => r !== room),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUser((prev) => ({
        ...prev,
        profileImageFile: file,
      }));
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950/80">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"👤 " + t("nav.profile")}
          subtitle={language === "pl" ? "Zarządzaj swoimi danymi konta, pokojami laboratoryjnymi i preferencjami" : "Manage your account details, lab rooms, and preferences"}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Column 1: Profile Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center text-center">
            {/* Avatar block */}
            <div className="relative group">
              {user.profileImageFile ? (
                <img
                  src={URL.createObjectURL(user.profileImageFile)}
                  alt="Preview"
                  className="w-28 h-28 rounded-full object-cover shadow-md border-4 border-indigo-50 dark:border-slate-800"
                />
              ) : user.profileImage ? (
                <img
                  src={`${API_BASE}/uploads/users/${user.profileImage}`}
                  alt={user.name}
                  className="w-28 h-28 rounded-full object-cover shadow-md border-4 border-indigo-50 dark:border-slate-800"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-650 flex items-center justify-center text-3xl font-black text-white shadow-md border-4 border-white dark:border-slate-800">
                  {user.name ? (user.name.split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase()) : "?"}
                </div>
              )}
            </div>

            <h3 className="mt-4 text-xl font-extrabold text-slate-850 dark:text-slate-100 truncate w-full max-w-[200px]" title={user.name}>
              {user.name || "—"}
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium select-all truncate w-full max-w-[200px]" title={user.email}>
              {user.email || "—"}
            </p>

            {/* Role Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full text-xs font-bold border ${user.role === "admin" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>
              {user.role === "admin" ? (
                <>🛡️ {language === "pl" ? "Administrator" : "Admin"}</>
              ) : (
                <>🎓 {language === "pl" ? "Wykładowca" : "Lecturer"}</>
              )}
            </span>

            {/* Lab Rooms display */}
            <div className="w-full border-t border-slate-100 dark:border-slate-800 mt-6 pt-5 text-left">
              <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-3 pl-1 select-none">
                {t("profile.labRooms")}
              </p>
              {user.labRooms?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.labRooms.map((room, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-305 border border-indigo-100/30 dark:border-indigo-900/20 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    >
                      {room}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-600 italic pl-1">
                  {t("profile.noLabRooms")}
                </p>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Profile Settings Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-650 dark:text-indigo-400 select-none">
                {t("profile.settings")}
              </p>
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 mt-1">
                {editMode ? (language === "pl" ? "Edycja Ustawień Konta" : "Edit Account Settings") : (language === "pl" ? "Informacje o Koncie" : "Account Info")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                  {t("profile.name")}
                </label>
                <input
                  type="text"
                  value={user.name}
                  disabled={!editMode}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder={t("profile.name")}
                />
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                  {t("profile.email")}
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled={!editMode}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder={t("profile.email")}
                />
              </div>

              {/* Password Field (Only Edit Mode) */}
              {editMode && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                    {t("profile.password")} <span className="text-[9px] font-normal text-slate-400 dark:text-slate-500 font-sans normal-case">(zostaw puste, jeśli bez zmian / leave empty to keep current)</span>
                  </label>
                  <input
                    type="password"
                    value={user.password}
                    onChange={(e) => setUser({ ...user, password: e.target.value })}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full"
                    placeholder={t("profile.password")}
                  />
                </div>
              )}

              {/* Profile Image upload (Only Edit Mode) */}
              {editMode && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                    {language === "pl" ? "Zdjęcie profilowe:" : "Profile Picture:"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/40 dark:file:text-indigo-400"
                  />
                </div>
              )}

              {/* Lab Rooms Edit Section (Only Edit Mode) */}
              {editMode && (
                <div className="flex flex-col gap-4 md:col-span-2 border-t border-slate-100 dark:border-slate-850 mt-2 pt-4">
                  <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                    <div className="flex flex-col gap-1.5 flex-1 w-full">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                        {t("profile.newLabRoom")}
                      </label>
                      <input
                        type="text"
                        placeholder="np. Lab 204"
                        value={newLabRoom}
                        onChange={(e) => setNewLabRoom(e.target.value)}
                        className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLabRoom}
                      className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm w-full sm:w-auto h-[38px] flex items-center justify-center"
                    >
                      {t("profile.addLab")}
                    </button>
                  </div>

                  <div ref={ref} className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen((prev) => !prev)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950 px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-between shadow-xs cursor-pointer"
                    >
                      <span>{t("profile.manageLabRooms")} ({user.labRooms.length})</span>
                      <span>
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>

                    {open && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm max-h-[200px] overflow-y-auto pr-1">
                        {user.labRooms.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            {t("profile.noLabRooms")}
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {user.labRooms.map((room, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300"
                              >
                                <span className="font-semibold">{room}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLabRoom(room)}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer"
                                >
                                  {t("common.delete")}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons inside Card */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-5 flex flex-col sm:flex-row gap-2.5 justify-end">
              {!editMode ? (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  📝 {t("profile.editProfile")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    💾 {loading ? (language === "pl" ? "Zapisywanie..." : "Saving...") : t("profile.saveChanges")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {t("common.cancel")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
