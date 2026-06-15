import React, { useEffect, useState, useRef } from "react";
import apiClient from "../api/apiClient";
import LabRoomsDropdown from "../components/users/LabRoomsDropdown";
import ActionMenu from "../components/users/ActionMenu";
import UserForm from "../components/users/UserForm";
import PageHeader from "../components/layout/PageHeader";
import FilterBar from "../components/layout/FilterBar";
import Pagination from "../components/layout/Pagination";
import Btn from "../components/layout/Btn";

const USERS_PER_PAGE = 10;

const Users = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "", labRooms: [], isActive: true,
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
  const [editingUserId, setEditingUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const labDropdownRef = useRef();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/users");
      setUsers(res.data.users || []);
      setFilteredUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch users.");
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddLabRoom = () => {
    if (!newLabRoom) return;
    if (!formData.labRooms.includes(newLabRoom)) {
      setFormData((prev) => ({ ...prev, labRooms: [...prev.labRooms, newLabRoom] }));
      setNewLabRoom("");
    } else {
      alert("This lab room is already added.");
    }
  };

  const handleRemoveLabRoom = (roomToRemove) => {
    setFormData((prev) => ({
      ...prev,
      labRooms: prev.labRooms.filter((room) => room !== roomToRemove),
    }));
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "", labRooms: [], isActive: true });
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
          alert("All fields are required!"); setSubmitLoading(false); return;
        }
        const res = await apiClient.post("/users/create", formData);
        if (res.data.success) { alert("User added successfully!"); resetForm(); setShowForm(false); fetchUsers(); }
      } else {
        if (!formData.name || !formData.email || !formData.role) {
          alert("Name, Email, and Role are required!"); setSubmitLoading(false); return;
        }
        const dataToSend = { ...formData };
        if (!dataToSend.password?.trim()) delete dataToSend.password;
        if (dataToSend.email === "admin@gmail.com") dataToSend.isActive = true;
        const res = await apiClient.put(`/users/${editingUserId}`, dataToSend);
        if (res.data.success) { alert("User updated successfully!"); resetForm(); setShowForm(false); fetchUsers(); }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Server error.");
    }
    setSubmitLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setDeleteLoadingId(id);
    try {
      const res = await apiClient.delete(`/users/${id}`);
      if (res.data.success) { fetchUsers(); alert("User deleted successfully!"); }
      else alert(res.data.message || "Delete failed.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Server error.");
    }
    setDeleteLoadingId(null);
  };

  const startEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({ ...user, password: "", isActive: user.isActive ?? true });
    setNewLabRoom("");
    setShowForm(true);
  };

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE
  );

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center p-20 text-slate-400 font-semibold">
      Loading users...
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 md:p-8 bg-slate-50/30 dark:bg-slate-900/10">
      <PageHeader title="User Management" subtitle="Create, edit, activate, or assign permissions to system users">
        {!showForm ? (
          <Btn variant="primary" onClick={handleAddUserClick}>➕ Add User</Btn>
        ) : (
          <Btn variant="danger-outline" onClick={handleCancel}>❌ Cancel</Btn>
        )}
      </PageHeader>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        searchPlaceholder="Search users by name..."
      >
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role:</span>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-250 outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[120px]"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="lecturer">Lecturer</option>
        </select>
      </FilterBar>

      {showForm && (
        <UserForm
          editingUserId={editingUserId}
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 hidden md:table-cell">#</th>
                <th className="p-4">Name</th>
                <th className="p-4 hidden lg:table-cell">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 hidden lg:table-cell">Lab Rooms</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedUsers.map((user, idx) => (
                <tr key={user._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition">
                  <td className="p-4 text-xs text-slate-500 dark:text-slate-450 hidden md:table-cell">
                    {(currentPage - 1) * USERS_PER_PAGE + idx + 1}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</td>
                  <td className="p-4 text-xs text-slate-600 dark:text-slate-400 hidden lg:table-cell">{user.email}</td>
                  <td className="p-4 text-xs">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${user.role === "admin" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/30" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-750"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${user.isActive ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/30" : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-900/30"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-xs hidden lg:table-cell">
                    {user.labRooms?.length > 0 ? <LabRoomsDropdown rooms={user.labRooms} /> : "—"}
                  </td>
                  <td className="p-4 text-center text-xs">
                    <ActionMenu user={user} onEdit={startEdit} onDelete={handleDelete} loadingId={deleteLoadingId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          onPage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Users;