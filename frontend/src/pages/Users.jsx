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
import { Shield, GraduationCap, CheckCircle, XCircle, Mail, Trash2, Edit2 } from "lucide-react";

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
    "bg-amber-50 dark:bg-amber-950/60 text-amber-650 dark:text-amber-305 border border-amber-100/50 dark:border-amber-900/30",
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "", labRooms: [], isActive: true, profileImage: "", profileImageFile: null
  });
  const [newLabRoom, setNewLabRoom] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const labDropdownRef = useRef();
  const [roomsModalData, setRoomsModalData] = useState({ isOpen: false, userName: "", labRooms: [] });

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

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let filtered = users.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (roleFilter) filtered = filtered.filter((u) => u.role === roleFilter);
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, users]);

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
    if (!newLabRoom) return;
    if (!formData.labRooms.includes(newLabRoom)) {
      setFormData((prev) => ({ ...prev, labRooms: [...prev.labRooms, newLabRoom] }));
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
    setFormData({ name: "", email: "", password: "", role: "", labRooms: [], isActive: true, profileImage: "", profileImageFile: null });
    setNewLabRoom("");
    setEditingUserId(null);
  };

  const handleCancel = () => { resetForm(); setShowForm(false); };
  const handleAddUserClick = () => { resetForm(); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (!editingUserId) {
        if (!formData.name || !formData.email || !formData.password || !formData.role) {
          showToast(t("users.allFieldsRequired"), "warning"); setSubmitLoading(false); return;
        }
      } else {
        if (!formData.name || !formData.email || !formData.role) {
          showToast(t("users.requiredFields"), "warning"); setSubmitLoading(false); return;
        }
      }

      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("role", formData.role);
      form.append("isActive", String(formData.isActive ?? true));
      form.append("labRooms", JSON.stringify(formData.labRooms || []));
      
      if (editingUserId) {
        if (formData.password?.trim()) {
          form.append("password", formData.password);
        }
      } else {
        form.append("password", formData.password);
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
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń",
      message: t("users.deleteConfirm") || "Czy na pewno chcesz usunąć tego użytkownika?",
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
      }
    });
  };

  const startEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({ ...user, password: "", isActive: user.isActive ?? true, profileImageFile: null });
    setNewLabRoom("");
    setShowForm(true);
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  );

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center p-20 text-slate-400 font-semibold">
      {t("users.loading")}
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"👥 " + t("users.title")}
          subtitle={t("users.subtitle")}
        >
          {!showForm ? (
            <Btn variant="primary" onClick={handleAddUserClick}>{t("users.addUser")}</Btn>
          ) : (
            <Btn variant="danger-outline" onClick={handleCancel}>{t("users.cancel")}</Btn>
          )}
        </PageHeader>

        <FilterBar
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder={t("users.searchPlaceholder")}
          searchLabel={language === "pl" ? "Szukaj użytkownika:" : "Search user:"}
        >
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              {t("users.roleLabel")}
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer min-w-[120px] w-full sm:w-auto"
            >
              <option value="">{t("users.allRoles")}</option>
              <option value="admin">{language === "pl" ? "Administrator" : "Admin"}</option>
              <option value="lecturer">{language === "pl" ? "Wykładowca" : "Lecturer"}</option>
            </select>
          </div>
        </FilterBar>

        {showForm && (
          <UserForm
            editingUserId={editingUserId}
            currentUserId={user?._id || user?.id}
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

        {/* Desktop View */}
        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">{t("users.name")}</th>
                  <th className="p-4">{t("users.role")}</th>
                  <th className="p-4">{t("users.status")}</th>
                  <th className="p-4">{t("users.productCount")}</th>
                  <th className="p-4">{t("users.activeOrderCount")}</th>
                  <th className="p-4">{t("users.labRooms")}</th>
                  <th className="p-4 text-center">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedUsers.map((user, idx) => (
                  <tr key={user._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition">
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-450">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img
                            src={`${API_BASE}/uploads/users/${user.profileImage}`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200/80 dark:border-slate-800"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${getAvatarColor(user.name)}`}>
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${user.role === "admin" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100/40 dark:border-indigo-900/30" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>
                        {user.role === "admin" ? (
                          <>
                            <Shield className="w-3 h-3 text-indigo-650 dark:text-indigo-400" />
                            {language === "pl" ? "Administrator" : "Admin"}
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-3 h-3 text-slate-500 dark:text-slate-405" />
                            {language === "pl" ? "Wykładowca" : "Lecturer"}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${user.isActive ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100/40 dark:border-emerald-900/30" : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100/40 dark:border-rose-900/30"}`}>
                        {user.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {t("users.active")}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            {t("users.inactive")}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <button
                        type="button"
                        onClick={() => navigate("/admin-dashboard/products", { state: { ownerId: user._id, ownerName: user.name } })}
                        className="bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-100/55 dark:border-indigo-900/35 cursor-pointer font-extrabold transition shadow-xs hover:shadow-sm"
                        title={language === "pl" ? "Pokaż obiekty użytkownika" : "Show user's objects"}
                      >
                        {user.productCount || 0}
                      </button>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className={`px-2.5 py-0.5 rounded-lg border ${user.activeOrderCount > 0 ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30" : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700"}`}>
                        {user.activeOrderCount || 0}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {user.labRooms?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                          {user.labRooms.slice(0, 2).map((room, i) => (
                            <span key={i} className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-755 dark:text-indigo-305 border border-indigo-100/30 dark:border-indigo-900/20 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                              {room}
                            </span>
                          ))}
                          {user.labRooms.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setRoomsModalData({ isOpen: true, userName: user.name, labRooms: user.labRooms })}
                              className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-650 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30 px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors"
                            >
                              +{user.labRooms.length - 2}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <Btn onClick={() => startEdit(user)} variant="primary" size="sm">
                          {t("common.edit")}
                        </Btn>
                        <Btn
                          onClick={() => handleDelete(user._id)}
                          disabled={deleteLoadingId === user._id}
                          variant="danger"
                          size="sm"
                        >
                          {deleteLoadingId === user._id ? (language === "pl" ? "Usuwanie..." : "Deleting...") : t("common.delete")}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col gap-4">
          {paginatedUsers.map((user) => (
            <div key={user._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3.5">
                {user.profileImage ? (
                  <img
                    src={`${API_BASE}/uploads/users/${user.profileImage}`}
                    alt={user.name}
                    className="w-11 h-11 rounded-full object-cover shadow-sm border border-slate-200/80 dark:border-slate-800"
                  />
                ) : (
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${getAvatarColor(user.name)}`}>
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 truncate mt-0.5">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${user.role === "admin" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100/40 dark:border-indigo-900/30" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>
                  {user.role === "admin" ? (
                    <>
                      <Shield className="w-3 h-3 text-indigo-650 dark:text-indigo-400" />
                      {language === "pl" ? "Administrator" : "Admin"}
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-3 h-3 text-slate-555 dark:text-slate-405" />
                      {language === "pl" ? "Wykładowca" : "Lecturer"}
                    </>
                  )}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${user.isActive ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100/40 dark:border-emerald-900/30" : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 border-rose-100/40 dark:border-rose-900/30"}`}>
                  {user.isActive ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {t("users.active")}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      {t("users.inactive")}
                    </>
                  )}
                </span>
              </div>

              {/* Stats KPI Block */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    {t("users.productCount")}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/admin-dashboard/products", { state: { ownerId: user._id, ownerName: user.name } })}
                    className="text-xs font-extrabold text-indigo-650 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer text-left w-fit transition-colors"
                  >
                    {user.productCount || 0}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    {t("users.activeOrderCount")}
                  </span>
                  <span className={`text-xs font-extrabold ${user.activeOrderCount > 0 ? "text-amber-600 dark:text-amber-450" : "text-slate-755 dark:text-slate-200"}`}>
                    {user.activeOrderCount || 0}
                  </span>
                </div>
              </div>

              {user.labRooms?.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    {t("users.labRooms")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.labRooms.slice(0, 3).map((room, i) => (
                      <span key={i} className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-755 dark:text-indigo-305 border border-indigo-100/30 dark:border-indigo-900/20 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                        {room}
                      </span>
                    ))}
                    {user.labRooms.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setRoomsModalData({ isOpen: true, userName: user.name, labRooms: user.labRooms })}
                        className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-650 dark:text-indigo-300 border border-indigo-100/40 dark:border-indigo-900/30 px-2 py-0.5 rounded-lg text-xs font-extrabold cursor-pointer transition-colors"
                      >
                        +{user.labRooms.length - 3}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3.5 flex gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => startEdit(user)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition duration-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(user._id)}
                  disabled={deleteLoadingId === user._id}
                  className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100/30 dark:border-rose-900/30 text-rose-650 dark:text-rose-400 text-xs font-bold rounded-xl transition duration-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleteLoadingId === user._id ? (language === "pl" ? "Usuwanie..." : "Deleting...") : t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination & items per page footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-550 dark:text-slate-400">
            <span>{t("products.itemsPerPage") || "Elementów na stronie:"}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            onPage={setCurrentPage}
          />

          {/* Total Counter info */}
          <div className="text-xs font-bold text-slate-450 dark:text-slate-505">
            {language === "pl"
              ? `Razem: ${filteredUsers.length} użytkowników`
              : `Total: ${filteredUsers.length} users`}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
      {roomsModalData.isOpen && (
        <div
          className="fixed inset-0 z-55 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40 dark:bg-slate-950/60"
          onClick={() => setRoomsModalData({ isOpen: false, userName: "", labRooms: [] })}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[1.5rem] shadow-2xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-white">
                {language === "pl" ? `Pokoje użytkownika: ${roomsModalData.userName}` : `Rooms for: ${roomsModalData.userName}`}
              </h3>
              <button
                type="button"
                onClick={() => setRoomsModalData({ isOpen: false, userName: "", labRooms: [] })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold transition text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto pr-1 py-1 max-h-[45vh]">
              {roomsModalData.labRooms.map((room, i) => (
                <span
                  key={i}
                  className="bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/40 dark:border-indigo-900/30 px-3 py-1 rounded-xl text-xs font-bold shadow-xs animate-fadeIn"
                >
                  {room}
                </span>
              ))}
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRoomsModalData({ isOpen: false, userName: "", labRooms: [] })}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition duration-100 cursor-pointer"
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
