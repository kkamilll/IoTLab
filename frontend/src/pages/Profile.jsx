import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import Btn from "../components/layout/Btn";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Plus,
  DoorOpen,
  FlaskConical,
  Pencil,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  Sparkles,
  Info
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

const Profile = () => {
  const { token, updateUser: updateAuthUser } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  // --- State ---
  const [user, setUser] = useState({
    _id: "",
    name: "",
    email: "",
    password: "",
    role: "",
    labRooms: [],
    profileImage: "",
    profileImageFile: null,
  });

  const [initialUser, setInitialUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newLabRoom, setNewLabRoom] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // --- Fetch user profile on mount ---
  const fetchUser = async () => {
    try {
      setFetching(true);
      const res = await apiClient.get("/users/profile");
      if (res.data.success && res.data.user) {
        const u = res.data.user;
        const userData = {
          _id: u._id || "",
          name: u.name || "",
          email: u.email || "",
          password: "",
          role: u.role || "",
          labRooms: Array.isArray(u.labRooms) ? u.labRooms : [],
          profileImage: u.profileImage || "",
          profileImageFile: null,
        };
        setUser(userData);
        setInitialUser(userData);
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      showToast(t("profile.errorFetch") || "Error fetching profile", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  // --- Handlers ---
  const handleSave = async () => {
    if (!user.name.trim() || !user.email.trim()) {
      showToast(t("profile.nameEmailRequired") || "Name and email are required", "warning");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", user.name.trim());
      formData.append("email", user.email.trim());

      if (user.password.trim()) {
        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPasswordRegex.test(user.password.trim())) {
          showToast(
            language === "pl"
              ? "Hasło musi mieć co najmniej 8 znaków, zawierać co najmniej 1 cyfrę i 1 wielką literę."
              : "Password must be at least 8 characters long and contain at least 1 digit and 1 uppercase letter.",
            "warning"
          );
          setLoading(false);
          return;
        }
        formData.append("password", user.password.trim());
      }

      formData.append("labRooms", JSON.stringify(user.labRooms || []));

      if (user.profileImageFile) {
        formData.append("profileImage", user.profileImageFile);
      } else if (user.profileImage === "") {
        formData.append("profileImage", "");
        formData.append("deleteProfileImage", "true");
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const res = await apiClient.put("/users/profile", formData, config);

      if (res.data.success) {
        showToast(t("profile.successUpdate") || "Profile updated successfully!", "success");
        setEditMode(false);
        const updatedUser = res.data.user || {};
        const updatedImg = updatedUser.profileImage ?? "";
        const updatedRooms = Array.isArray(updatedUser.labRooms) ? updatedUser.labRooms : user.labRooms;

        const newUserData = {
          ...user,
          name: updatedUser.name || user.name,
          email: updatedUser.email || user.email,
          password: "",
          labRooms: updatedRooms,
          profileImage: updatedImg,
          profileImageFile: null,
        };

        setUser(newUserData);
        setInitialUser(newUserData);

        if (updateAuthUser) {
          updateAuthUser({
            name: updatedUser.name || user.name,
            email: updatedUser.email || user.email,
            profileImage: updatedImg,
          });
        }
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      showToast(err.response?.data?.message || t("profile.errorUpdate") || "Error updating profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    if (initialUser) {
      setUser({
        ...initialUser,
        password: "",
        profileImageFile: null,
      });
    }
    setEditMode(false);
    setNewLabRoom("");
    setShowPassword(false);
  };

  const handleAddLabRoom = () => {
    const trimmed = newLabRoom.trim();
    if (trimmed && !user.labRooms.includes(trimmed)) {
      setUser((prev) => ({
        ...prev,
        labRooms: [...prev.labRooms, trimmed],
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
      if (file.size > 5 * 1024 * 1024) {
        showToast(language === "pl" ? "Zdjęcie jest za duże! Maksymalny rozmiar to 5MB." : "Image is too large! Maximum size is 5MB.", "warning");
        return;
      }
      setUser((prev) => ({
        ...prev,
        profileImageFile: file,
      }));
    }
  };

  const handleRemovePhoto = () => {
    setUser((prev) => ({
      ...prev,
      profileImage: "",
      profileImageFile: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Avatar Image Source calculation
  const avatarSrc = user.profileImageFile
    ? URL.createObjectURL(user.profileImageFile)
    : user.profileImage
    ? `${API_BASE}/uploads/users/${user.profileImage}`
    : null;

  const userInitials = user.name
    ? user.name
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  if (fetching) {
    return (
      <div className="w-full min-h-screen bg-slate-50/40 dark:bg-slate-950/40 flex items-center justify-center p-12 text-slate-400 font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-xs">{language === "pl" ? "Ładowanie profilu..." : "Loading profile..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/40 dark:bg-slate-950/40 transition-colors">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        
        {/* Page Header */}
        <PageHeader
          title={"👤 " + (t("profile.title") || "Mój profil")}
          subtitle={t("profile.subtitle") || "Zarządzaj swoimi danymi konta, pokojami laboratoryjnymi i bezpieczeństwem"}
        />

        {/* ============================================================== */}
        {/* CARD 1: HERO PROFILE BANNER (Stacked Top Card)                 */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200">
          {/* Top Decorative Gradient Line */}
          <div className="h-2.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            
            {/* Avatar & User Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
              
              {/* Avatar Container */}
              <div className="relative group flex-shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md border-3 border-indigo-100 dark:border-slate-800"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl sm:text-4xl font-black text-white shadow-md border-3 border-white dark:border-slate-800">
                    {userInitials}
                  </div>
                )}

                {/* Online Status Dot */}
                <div
                  className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-1 -right-1 shadow-xs"
                  title={t("profile.activeAccount")}
                />

                {/* Quick Camera Overlay in Edit Mode */}
                {editMode && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
                    title={t("profile.choosePhoto")}
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {language === "pl" ? "Zmień" : "Change"}
                    </span>
                  </button>
                )}
              </div>

              {/* Identity Info */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                    {user.name || "—"}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    {user.role === "admin"
                      ? t("profile.adminRole") || "Administrator"
                      : t("profile.lecturerRole") || "Wykładowca"}
                  </span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="select-all">{user.email || "—"}</span>
                </div>

                {/* Lab Rooms Pill & Active status */}
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      {user.labRooms?.length || 0} {t("profile.assignedLabs")}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t("profile.activeAccount")}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button on Top Card */}
            <div className="flex items-center gap-2.5 self-center sm:self-start">
              {!editMode ? (
                <Btn
                  variant="primary"
                  onClick={() => setEditMode(true)}
                  className="px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{t("profile.editProfile")}</span>
                </Btn>
              ) : (
                <div className="flex items-center gap-2">
                  <Btn
                    variant="ghost"
                    onClick={cancelEdit}
                    className="px-4 py-2.5 text-xs font-semibold"
                  >
                    {t("common.cancel")}
                  </Btn>
                  <Btn
                    variant="primary"
                    onClick={handleSave}
                    disabled={loading}
                    className="px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t("profile.saving")}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t("profile.saveChanges")}</span>
                      </>
                    )}
                  </Btn>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 2: DANE OSOBOWE I LOGOWANIE (Stacked Card 2)              */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                {t("profile.personalData")}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("profile.personalDataSubtitle")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {t("profile.name")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={user.name}
                  disabled={!editMode}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  placeholder={t("profile.name")}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 pl-10 pr-3.5 py-3 font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {t("profile.email")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={user.email}
                  disabled={!editMode}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  placeholder={t("profile.email")}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 pl-10 pr-3.5 py-3 font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* System Role Informational Card */}
            <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t("profile.role")}:
                  </span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {user.role === "admin" ? t("profile.adminRole") : t("profile.lecturerRole")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {user.role === "admin"
                    ? t("profile.adminRoleDesc")
                    : t("profile.lecturerRoleDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 3: ZDJĘCIE PROFILOWE (Stacked Card 3 - Visible in Edit)  */}
        {/* ============================================================== */}
        {editMode && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-fadeIn">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                  {t("profile.profilePicture")}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {t("profile.profilePictureSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Photo Thumbnail */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>

              {/* Action Buttons & Requirements */}
              <div className="flex flex-col gap-2.5 flex-1 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t("profile.choosePhoto")}</span>
                  </button>

                  {(user.profileImage || user.profileImageFile) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("profile.removePhoto")}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{t("profile.photoRequirements")}</span>
                </div>

                {user.profileImageFile && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === "pl" ? "Wybrano plik:" : "Selected file:"} {user.profileImageFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CARD 4: BEZPIECZEŃSTWO I HASŁO (Stacked Card 4)                */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                {t("profile.security")}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("profile.securitySubtitle")}
              </p>
            </div>
          </div>

          {!editMode ? (
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {t("profile.password")}
                  </span>
                  <span className="text-sm font-mono tracking-widest text-slate-400 dark:text-slate-500 block select-none">
                    ••••••••••••
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditMode(true);
                  setTimeout(() => {
                    passwordInputRef.current?.focus();
                  }, 100);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer self-start sm:self-auto shadow-xs"
              >
                {language === "pl" ? "Zmień hasło" : "Change Password"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                {t("profile.password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={user.password}
                  onChange={(e) => setUser({ ...user, password: e.target.value })}
                  placeholder={language === "pl" ? "Wprowadź nowe hasło (opcjonalnie)..." : "Enter new password (optional)..."}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 pl-10 pr-10 py-3 font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-1">
                {t("profile.passwordHint")}
              </p>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* CARD 5: POKOJE LABORATORYJNE (Stacked Card 5)                  */}
        {/* ============================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
                <DoorOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                    {t("profile.labRooms")}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {user.labRooms?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {t("profile.labRoomsSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Add Lab Room Field in Edit Mode */}
          {editMode && (
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={t("profile.newLabRoomPlaceholder")}
                  value={newLabRoom}
                  onChange={(e) => setNewLabRoom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLabRoom();
                    }
                  }}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 pl-10 pr-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleAddLabRoom}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-850 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("profile.addLab")}</span>
              </button>
            </div>
          )}

          {/* Lab Rooms Chips Grid */}
          <div className="flex flex-wrap gap-2 pt-1">
            {user.labRooms?.length > 0 ? (
              user.labRooms.map((room, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{room}</span>
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLabRoom(room)}
                      className="ml-0.5 p-0.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      title={language === "pl" ? "Usuń salę" : "Remove room"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="w-full p-6 text-center rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic">
                {t("profile.noLabRooms")}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM ACTION BAR (When Edit Mode is active)                    */}
        {/* ============================================================== */}
        {editMode && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>
                {language === "pl"
                  ? "Pamiętaj o zapisaniu wprowadzonych zmian w danych profilu."
                  : "Remember to save changes to apply them to your profile."}
              </span>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <Btn
                variant="ghost"
                onClick={cancelEdit}
                className="px-5 py-2.5 text-xs font-semibold"
              >
                {t("common.cancel")}
              </Btn>

              <Btn
                variant="primary"
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t("profile.saving")}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t("profile.saveChanges")}</span>
                  </>
                )}
              </Btn>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
