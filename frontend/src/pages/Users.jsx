import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import UserForm from "../components/users/UserForm";
import PageHeader from "../components/layout/PageHeader";
import FilterBar from "../components/layout/FilterBar";
import Pagination from "../components/layout/Pagination";
import Btn from "../components/layout/Btn";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/layout/ConfirmModal";
import {
  Shield,
  GraduationCap,
  CheckCircle,
  XCircle,
  Mail,
  Trash2,
  Edit2,
  ChevronDown,
  Users as UsersIcon,
  Package,
  ClipboardList,
  Building2,
  Copy,
  Check,
  UserPlus,
  RotateCcw,
  X,
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const getAvatarColor = (name) => {
  if (!name) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  const colors = [
    "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30",
    "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-650 dark:text-emerald-300 border border-emerald-100/50 dark:border-emerald-900/30",
    "bg-amber-50 dark:bg-amber-950/60 text-amber-650 dark:text-amber-300 border border-amber-100/50 dark:border-amber-900/30",
    "bg-rose-50 dark:bg-rose-950/60 text-rose-650 dark:text-rose-300 border border-rose-100/50 dark:border-rose-900/30",
    "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-650 dark:text-cyan-300 border border-cyan-100/50 dark:border-cyan-900/30",
    "bg-violet-50 dark:bg-violet-950/60 text-violet-650 dark:text-violet-300 border border-violet-100/50 dark:border-violet-900/30",
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const Users = () => {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    labRooms: [],
    isActive: true,
    profileImage: "",
    profileImageFile: null,
  });

  const [newLabRoom, setNewLabRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "active" | "inactive"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const labDropdownRef = useRef();
  const [roomsModalData, setRoomsModalData] = useState({
    isOpen: false,
    userName: "",
    labRooms: [],
  });

  const currentUserId = currentUser?._id || currentUser?.id;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/users");
      setUsers(res.data.users || []);
      setFilteredUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      showToast(t("users.failedFetch"), "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search, role, and active status
  useEffect(() => {
    let filtered = users.filter((u) => {
      const query = searchTerm.toLowerCase().trim();
      if (!query) return true;
      const matchName = u.name?.toLowerCase().includes(query);
      const matchEmail = u.email?.toLowerCase().includes(query);
      const matchRoom = u.labRooms?.some((r) => r.toLowerCase().includes(query));
      return matchName || matchEmail || matchRoom;
    });

    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((u) => u.isActive !== false);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((u) => u.isActive === false);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const nextData = { ...prev, [name]: value };
      if (name === "role" && value === "admin") {
        nextData.isActive = true;
      }
      return nextData;
    });
  };

  const handleAddLabRoom = () => {
    if (!newLabRoom.trim()) return;
    const formatted = newLabRoom.trim();
    if (!formData.labRooms.includes(formatted)) {
      setFormData((prev) => ({ ...prev, labRooms: [...prev.labRooms, formatted] }));
      setNewLabRoom("");
    } else {
      showToast(t("users.labAlreadyAdded"), "warning");
    }
  };

  const handleRemoveLabRoom = (roomToRemove) => {
    setFormData((prev) => ({
      ...prev,
      labRooms: prev.labRooms.filter((room) => room !== roomToRemove),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
      labRooms: [],
      isActive: true,
      profileImage: "",
      profileImageFile: null,
    });
    setNewLabRoom("");
    setEditingUserId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddUserClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (!editingUserId) {
        if (!formData.name || !formData.email || !formData.password || !formData.role) {
          showToast(t("users.allFieldsRequired"), "warning");
          setSubmitLoading(false);
          return;
        }
      } else {
        if (!formData.name || !formData.email || !formData.role) {
          showToast(t("users.requiredFields"), "warning");
          setSubmitLoading(false);
          return;
        }
      }

      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("role", formData.role);
      form.append("isActive", String(formData.isActive ?? true));
      form.append("labRooms", JSON.stringify(formData.labRooms || []));

      const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
      const passToCheck = editingUserId ? formData.password?.trim() : formData.password;
      if (passToCheck && !strongPasswordRegex.test(passToCheck)) {
        showToast(
          language === "pl"
            ? "Hasło musi mieć co najmniej 8 znaków, zawierać co najmniej 1 cyfrę i 1 wielką literę."
            : "Password must be at least 8 characters long and contain at least 1 digit and 1 uppercase letter.",
          "warning"
        );
        setSubmitLoading(false);
        return;
      }

      if (editingUserId) {
        if (formData.password?.trim()) {
          form.append("password", formData.password.trim());
        }
      } else {
        form.append("password", formData.password.trim());
      }

      if (formData.profileImageFile) {
        form.append("profileImage", formData.profileImageFile);
      } else if (formData.profileImage === "") {
        form.append("profileImage", "");
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      const res = editingUserId
        ? await apiClient.put(`/users/${editingUserId}`, form, config)
        : await apiClient.post("/users/create", form, config);

      if (res.data.success) {
        showToast(editingUserId ? t("users.updateSuccess") : t("users.addSuccess"), "success");
        resetForm();
        setShowForm(false);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || t("users.serverError"), "error");
    }
    setSubmitLoading(false);
  };

  const handleDelete = (id) => {
    if (id === currentUserId) {
      showToast(
        language === "pl" ? "Nie możesz usunąć własnego konta!" : "You cannot delete your own account!",
        "warning"
      );
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń użytkownika",
      message: t("users.deleteConfirm") || "Czy na pewno chcesz usunąć tego użytkownika? Wszystkie powiązane uprawnienia zostaną cofnięte.",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setDeleteLoadingId(id);
        try {
          const res = await apiClient.delete(`/users/${id}`);
          if (res.data.success) {
            fetchUsers();
            showToast(t("users.deleteSuccess"), "success");
          } else {
            showToast(res.data.message || t("users.deleteFailed"), "error");
          }
        } catch (err) {
          console.error(err);
          showToast(err.response?.data?.message || t("users.serverError"), "error");
        }
        setDeleteLoadingId(null);
      },
    });
  };

  const startEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({
      ...user,
      password: "",
      isActive: user.isActive ?? true,
      profileImageFile: null,
    });
    setNewLabRoom("");
    setShowForm(true);
  };

  const handleCopyEmail = (e, email) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    showToast(
      language === "pl" ? "Skopiowano adres e-mail!" : "Email copied to clipboard!",
      "success"
    );
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAnyFilterActive = Boolean(searchTerm || roleFilter || statusFilter);

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-20 gap-3 text-slate-400 font-bold">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p>{t("users.loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6 max-w-[1920px] mx-auto">
        {/* Page Header */}
        <PageHeader
          title={"👥 " + t("users.title")}
          subtitle={t("users.subtitle")}
        >
          {!showForm ? (
            <button
              type="button"
              onClick={handleAddUserClick}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition duration-200 shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("users.addUser")}</span>
            </button>
          ) : (
            <Btn variant="danger-outline" onClick={handleCancel}>
              {t("users.cancel")}
            </Btn>
          )}
        </PageHeader>

        {/* Filter Bar with Search, Role, Status, and Reset */}
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder={language === "pl" ? "Szukaj po nazwisku, e-mailu lub sali..." : "Search by name, email, or room..."}
          searchLabel={language === "pl" ? "Szukaj użytkownika:" : "Search user:"}
        >
          {/* Role Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 select-none">
              {t("users.roleLabel")}
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer min-w-[130px] w-full sm:w-auto"
            >
              <option value="">{t("users.allRoles")}</option>
              <option value="admin">{language === "pl" ? "Administrator" : "Admin"}</option>
              <option value="lecturer">{language === "pl" ? "Wykładowca" : "Lecturer"}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Status:" : "Status:"}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer min-w-[130px] w-full sm:w-auto"
            >
              <option value="">{language === "pl" ? "Wszystkie statusy" : "All statuses"}</option>
              <option value="active">{language === "pl" ? "Tylko aktywni" : "Active only"}</option>
              <option value="inactive">{language === "pl" ? "Tylko zablokowani" : "Inactive only"}</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {isAnyFilterActive && (
            <div className="flex flex-col justify-end w-full sm:w-auto">
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === "pl" ? "Wyczyść filtry" : "Clear filters"}</span>
              </button>
            </div>
          )}
        </FilterBar>

        {/* Modal Form for Add / Edit User */}
        {showForm && (
          <UserForm
            editingUserId={editingUserId}
            currentUserId={currentUserId}
            formData={formData}
            newLabRoom={newLabRoom}
            setNewLabRoom={setNewLabRoom}
            handleChange={handleChange}
            handleAddLabRoom={handleAddLabRoom}
            handleRemoveLabRoom={handleRemoveLabRoom}
            handleSubmit={handleSubmit}
            handleCancel={handleCancel}
            submitLoading={submitLoading}
            labDropdownRef={labDropdownRef}
          />
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-medium shadow-sm flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {language === "pl" ? "Nie znaleziono użytkowników" : "No users found"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === "pl" ? "Spróbuj zmienić parametry wyszukiwania lub filtry." : "Try adjusting your search query or filters."}
              </p>
            </div>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-xs font-bold transition border border-indigo-200 dark:border-indigo-900/30 cursor-pointer"
              >
                {language === "pl" ? "Zresetuj filtry" : "Reset filters"}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-fixed w-full text-left text-xs border-collapse min-w-[950px]">
                  <colgroup>
                    <col style={{ width: "48px" }} />
                    <col style={{ width: "27%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "13%" }} />
                  </colgroup>
                  <thead className="bg-slate-50/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3 text-center">#</th>
                      <th className="py-3 px-4">{language === "pl" ? "Użytkownik" : "User"}</th>
                      <th className="py-3 px-3">{t("users.role")}</th>
                      <th className="py-3 px-3">{t("users.status")}</th>
                      <th className="py-3 px-3">{t("users.productCount")}</th>
                      <th className="py-3 px-3">{t("users.activeOrderCount")}</th>
                      <th className="py-3 px-3">{t("users.labRooms")}</th>
                      <th className="py-3 px-4 text-center">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedUsers.map((u, idx) => {
                      const isSelf = u._id === currentUserId;
                      return (
                        <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                          {/* Row Number */}
                          <td className="py-3.5 px-3 text-center font-mono font-medium text-slate-400 dark:text-slate-500">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>

                          {/* User Avatar, Name, Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                {u.profileImage ? (
                                  <img
                                    src={`${API_BASE}/uploads/users/${u.profileImage}`}
                                    alt={u.name}
                                    className="w-9 h-9 rounded-full object-cover shadow-2xs border border-slate-200 dark:border-slate-700"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      if (e.currentTarget.nextElementSibling) {
                                        e.currentTarget.nextElementSibling.classList.remove("hidden");
                                      }
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-2xs ${getAvatarColor(
                                    u.name
                                  )} ${u.profileImage ? "hidden" : ""}`}
                                >
                                  {getInitials(u.name)}
                                </div>
                                {/* Active Status Dot */}
                                <span
                                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                    u.isActive !== false ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                                  title={u.isActive !== false ? "Aktywny" : "Zablokowany"}
                                />
                              </div>

                              <div className="min-w-0 flex flex-col">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                    {u.name}
                                  </span>
                                  {isSelf && (
                                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 select-none">
                                      {language === "pl" ? "Ty" : "You"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{u.email}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyEmail(e, u.email)}
                                    className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                                    title={language === "pl" ? "Kopiuj e-mail" : "Copy email"}
                                  >
                                    {copiedEmail === u.email ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                u.role === "admin"
                                  ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-900/30"
                                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/30"
                              }`}
                            >
                              {u.role === "admin" ? (
                                <>
                                  <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span>{language === "pl" ? "Administrator" : "Admin"}</span>
                                </>
                              ) : (
                                <>
                                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>{language === "pl" ? "Wykładowca" : "Lecturer"}</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                u.isActive !== false
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/30"
                                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/30"
                              }`}
                            >
                              {u.isActive !== false ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{t("users.active")}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                  <span>{t("users.inactive")}</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Products Count - Interactive */}
                          <td className="py-3.5 px-3">
                            <button
                              type="button"
                              onClick={() =>
                                navigate("/admin-dashboard/products", {
                                  state: { ownerId: u._id, ownerName: u.name },
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30 font-bold transition shadow-2xs hover:shadow-xs cursor-pointer group"
                              title={language === "pl" ? "Pokaż obiekty w magazynie przypisane do tego użytkownika" : "Show products owned by this user"}
                            >
                              <Package className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                              <span className="font-mono">{u.productCount || 0}</span>
                              <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 font-semibold">
                                {language === "pl" ? "szt." : "pcs"}
                              </span>
                            </button>
                          </td>

                          {/* Active Orders Count - Interactive */}
                          <td className="py-3.5 px-3">
                            <button
                              type="button"
                              onClick={() =>
                                navigate("/admin-dashboard/orders", {
                                  state: { ownerId: u._id, ownerName: u.name },
                                })
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition shadow-2xs hover:shadow-xs cursor-pointer group ${
                                (u.activeOrderCount || 0) > 0
                                  ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30"
                                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                              }`}
                              title={language === "pl" ? "Pokaż zamówienia przypisane do tego opiekuna" : "Show orders for this owner"}
                            >
                              <ClipboardList className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                              <span className="font-mono">{u.activeOrderCount || 0}</span>
                              <span className="text-[10px] opacity-70 font-semibold">
                                {language === "pl" ? "aktywne" : "active"}
                              </span>
                            </button>
                          </td>

                          {/* Lab Rooms */}
                          <td className="py-3.5 px-3">
                            {u.labRooms?.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {u.labRooms.slice(0, 2).map((room, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono border border-slate-200 dark:border-slate-700"
                                  >
                                    <Building2 className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                    <span>{room}</span>
                                  </span>
                                ))}
                                {u.labRooms.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRoomsModalData({
                                        isOpen: true,
                                        userName: u.name,
                                        labRooms: u.labRooms,
                                      })
                                    }
                                    className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-650 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer transition"
                                  >
                                    +{u.labRooms.length - 2}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 font-bold">—</span>
                            )}
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEdit(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition shadow-2xs cursor-pointer"
                                title={t("common.edit")}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{t("common.edit")}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(u._id)}
                                disabled={deleteLoadingId === u._id || isSelf}
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold transition shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  isSelf
                                    ? (language === "pl" ? "Nie możesz usunąć własnego konta" : "Cannot delete your own account")
                                    : t("common.delete")
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-3.5">
              {paginatedUsers.map((u) => {
                const isSelf = u._id === currentUserId;
                return (
                  <div
                    key={u._id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-3.5"
                  >
                    {/* User Header */}
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {u.profileImage ? (
                          <img
                            src={`${API_BASE}/uploads/users/${u.profileImage}`}
                            alt={u.name}
                            className="w-11 h-11 rounded-full object-cover shadow-2xs border border-slate-200 dark:border-slate-800"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.classList.remove("hidden");
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shadow-2xs ${getAvatarColor(
                            u.name
                          )} ${u.profileImage ? "hidden" : ""}`}
                        >
                          {getInitials(u.name)}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            u.isActive !== false ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 dark:text-white truncate text-sm">
                            {u.name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                              {language === "pl" ? "Ty" : "You"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 truncate mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </span>
                      </div>
                    </div>

                    {/* Role & Status Row */}
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          u.role === "admin"
                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/50"
                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/50"
                        }`}
                      >
                        {u.role === "admin" ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                        <span>{u.role === "admin" ? (language === "pl" ? "Administrator" : "Admin") : (language === "pl" ? "Wykładowca" : "Lecturer")}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          u.isActive !== false
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50"
                        }`}
                      >
                        {u.isActive !== false ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.isActive !== false ? t("users.active") : t("users.inactive")}</span>
                      </span>
                    </div>

                    {/* KPI Blocks */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/admin-dashboard/products", {
                            state: { ownerId: u._id, ownerName: u.name },
                          })
                        }
                        className="flex flex-col text-left hover:bg-white dark:hover:bg-slate-800/60 p-1.5 rounded-lg transition cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Package className="w-3 h-3 text-indigo-500" />
                          <span>{t("users.productCount")}</span>
                        </span>
                        <span className="text-sm font-extrabold text-indigo-650 dark:text-indigo-400 mt-0.5">
                          {u.productCount || 0} szt.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate("/admin-dashboard/orders", {
                            state: { ownerId: u._id, ownerName: u.name },
                          })
                        }
                        className="flex flex-col text-left hover:bg-white dark:hover:bg-slate-800/60 p-1.5 rounded-lg transition cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <ClipboardList className="w-3 h-3 text-amber-500" />
                          <span>{t("users.activeOrderCount")}</span>
                        </span>
                        <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                          {u.activeOrderCount || 0}
                        </span>
                      </button>
                    </div>

                    {/* Lab Rooms */}
                    {u.labRooms?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          {t("users.labRooms")}:
                        </span>
                        {u.labRooms.slice(0, 3).map((room, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono border border-slate-200 dark:border-slate-700"
                          >
                            Sala {room}
                          </span>
                        ))}
                        {u.labRooms.length > 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              setRoomsModalData({
                                isOpen: true,
                                userName: u.name,
                                labRooms: u.labRooms,
                              })
                            }
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
                          >
                            +{u.labRooms.length - 3}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Mobile Action Buttons */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(u)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t("common.edit")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u._id)}
                        disabled={deleteLoadingId === u._id || isSelf}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t("common.delete")}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer: Pagination & Items Per Page */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>{t("products.itemsPerPage") || "Elementów na stronie:"}</span>
            <div className="relative select-none flex items-center">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pl-3 pr-8 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            onPage={setCurrentPage}
          />

          {/* Total Counter info */}
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {language === "pl"
              ? `Łącznie: ${filteredUsers.length} użytkowników`
              : `Total: ${filteredUsers.length} users`}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Lab Rooms Modal */}
      {roomsModalData.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/50 dark:bg-slate-950/70 animate-in fade-in duration-200"
          onClick={() => setRoomsModalData({ isOpen: false, userName: "", labRooms: [] })}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {language === "pl"
                    ? `Pokoje: ${roomsModalData.userName}`
                    : `Rooms: ${roomsModalData.userName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRoomsModalData({ isOpen: false, userName: "", labRooms: [] })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 py-2 max-h-60 overflow-y-auto">
              {roomsModalData.labRooms.map((room, i) => (
                <span
                  key={i}
                  className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs font-mono"
                >
                  Sala {room}
                </span>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRoomsModalData({ isOpen: false, userName: "", labRooms: [] })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {language === "pl" ? "Zamknij" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
