import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import apiClient from "../api/apiClient";
import Sidebar from "../components/layout/Sidebar";

const Users = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "", labRooms: [], isActive: true
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

  const USERS_PER_PAGE = 10;

  // --- Fetch users ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users');
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
    let filtered = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (roleFilter) filtered = filtered.filter(u => u.role === roleFilter);
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, users]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (labDropdownRef.current && !labDropdownRef.current.contains(e.target)) {
        // setLabDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLabRoom = () => {
    if (!newLabRoom) return;
    if (!formData.labRooms.includes(newLabRoom)) {
      setFormData(prev => ({ ...prev, labRooms: [...prev.labRooms, newLabRoom] }));
      setNewLabRoom("");
    } else {
      alert("This lab room is already added.");
    }
  };

  const handleRemoveLabRoom = (roomToRemove) => {
    setFormData(prev => ({
      ...prev,
      labRooms: prev.labRooms.filter(room => room !== roomToRemove)
    }));
  };


  // --- Reset form ---
  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "", labRooms: [], isActive: true });
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
          alert("All fields are required!");
          setSubmitLoading(false);
          return;
        }
        const res = await apiClient.post('/users/create', formData);
        if (res.data.success) {
          alert("User added successfully!");
          resetForm();
          setShowForm(false);
          fetchUsers();
        }
      } else {
        if (!formData.name || !formData.email || !formData.role) {
          alert("Name, Email, and Role are required!");
          setSubmitLoading(false);
          return;
        }
        const dataToSend = { ...formData };
        if (!dataToSend.password?.trim()) delete dataToSend.password;
        if (dataToSend.email === "admin@gmail.com") dataToSend.isActive = true;

        const res = await apiClient.put(`/users/${editingUserId}`, dataToSend);

        if (res.data.success) {
          alert("User updated successfully!");
          resetForm();
          setShowForm(false);
          fetchUsers();
        }
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
      if (res.data.success) {
        fetchUsers();
        alert("User deleted successfully!");
      } else {
        alert(res.data.message || "Delete failed.");
      }
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
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  if (loading) return <div className="p-8 text-center text-gray-600 font-semibold text-lg">Loading users...</div>;

  // --- LabRoomsDropdown Component ---
  const LabRoomsDropdown = ({ rooms }) => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef();
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (buttonRef.current && !buttonRef.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = rooms.length * 32 + 16;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = dropdownHeight > spaceBelow;
      setCoords({
        top: showAbove ? rect.top + window.scrollY - dropdownHeight : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      setOpen(prev => !prev);
    };

    return (
      <>
        <button ref={buttonRef} onClick={toggleDropdown} className="bg-blue-200 px-2 py-1 rounded-xl text-sm hover:bg-blue-300">
          ALL LABS ▼
        </button>
        {open && ReactDOM.createPortal(
          <div
            className="absolute bg-white border border-blue-300 rounded-xl shadow-lg p-2 flex flex-col gap-1 z-[9999]"
            style={{ top: coords.top, left: coords.left, minWidth: "120px" }}
          >
            {rooms.map((room, i) => (
              <span key={i} className="bg-yellow-200 px-2 py-1 rounded-xl text-sm font-semibold whitespace-nowrap">{room}</span>
            ))}
          </div>,
          document.body
        )}
      </>
    );
  };

  // --- ActionMenu Component ---
  const ActionMenu = ({ user, onEdit, onDelete, loadingId }) => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef();
    const menuRef = useRef();
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (
          buttonRef.current && !buttonRef.current.contains(e.target) &&
          menuRef.current && !menuRef.current.contains(e.target)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleMenu = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 80;
      const menuWidth = 140;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = menuHeight > spaceBelow;

      setCoords({
        top: showAbove ? rect.top + window.scrollY - menuHeight : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - menuWidth + rect.width
      });

      setOpen(prev => !prev);
    };

    return (
      <div className="relative">
        <div className="hidden md:flex justify-center gap-2">
          <button onClick={() => onEdit(user)} className="bg-blue-600 text-white px-3 py-1 rounded-xl hover:bg-blue-700">Edit</button>
          <button onClick={() => onDelete(user._id)} disabled={loadingId === user._id} className={`px-3 py-1 rounded-xl text-white ${loadingId === user._id ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>
            {loadingId === user._id ? "Deleting..." : "Delete"}
          </button>
        </div>

        <div className="md:hidden relative">
          <button ref={buttonRef} onClick={toggleMenu} className="px-2 py-1 bg-gray-300 rounded-xl">⋮</button>
          {open && ReactDOM.createPortal(
            <div ref={menuRef} className="absolute bg-white border border-gray-300 rounded-xl shadow-lg p-2 flex flex-col gap-1 z-[9999]"
              style={{ top: coords.top, left: coords.left, width: '140px' }}
            >
              <button onClick={() => { onEdit(user); setOpen(false); }} className="px-3 py-1 hover:bg-blue-100 rounded">Edit</button>
              <button onClick={() => { onDelete(user._id); setOpen(false); }} disabled={loadingId === user._id} className={`px-3 py-1 rounded ${loadingId === user._id ? "bg-red-300 cursor-not-allowed" : "hover:bg-red-100"}`}>
                {loadingId === user._id ? "Deleting..." : "Delete"}
              </button>
            </div>,
            document.body
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50/30">

      <main className="flex-1 p-6 md:p-8 overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">User Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Create, edit, activate, or assign permissions to system users</p>
          </div>
        </div>

        {/* Filters and add */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-between items-center bg-white p-3 border border-slate-200 rounded-xl shadow-sm mb-6">
          <input
            type="text"
            placeholder="Search users by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[120px]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="lecturer">Lecturer</option>
            </select>
            {!showForm ? (
              <button
                onClick={handleAddUserClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-sm transition whitespace-nowrap ml-auto"
              >
                ➕ Add User
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="bg-red-50 text-red-650 border border-red-155 hover:bg-red-100 text-xs font-bold px-4 py-1.5 rounded-xl transition whitespace-nowrap ml-auto"
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              {editingUserId ? "Edit User Account Details" : "Create New User Account"}
            </h3>

            <div className="flex flex-col">
              <label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="role" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="lecturer">Lecturer</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 py-1">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                disabled={formData.name === "admin" && formData.email === "admin@gmail.com"}
              />
              <label
                htmlFor="isActive"
                className={`text-xs font-bold text-slate-600 uppercase tracking-wider select-none ${formData.name === "admin" && formData.email === "admin@gmail.com" ? "opacity-50" : ""}`}
              >
                Active Account
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="labRoom" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add lab room</label>
              <div className="flex gap-2">
                <input
                  id="labRoom"
                  type="text"
                  value={newLabRoom}
                  onChange={e => setNewLabRoom(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLabRoom();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddLabRoom}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm transition"
                >
                  Add
                </button>
              </div>

              {formData.labRooms.length > 0 && (
                <div ref={labDropdownRef} className="flex flex-wrap gap-2 mt-2">
                  {formData.labRooms.map((room, i) => (
                    <span
                      key={i}
                      className="bg-indigo-50 text-indigo-750 border border-indigo-100/50 px-3 py-1 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      {room}
                      <button
                        type="button"
                        onClick={() => handleRemoveLabRoom(room)}
                        className="text-red-500 font-bold hover:text-red-700 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className={`p-3 rounded-xl text-xs font-bold text-white transition ${submitLoading ? "bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-700 shadow-sm"}`}
            >
              {submitLoading ? (editingUserId ? "Saving..." : "Adding...") : (editingUserId ? "💾 Save Changes" : "➕ Add User")}
            </button>
          </form>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-705 text-slate-500 text-xs font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user, idx) => (
                  <tr key={user._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 text-xs text-slate-550 hidden md:table-cell">{(currentPage - 1) * USERS_PER_PAGE + idx + 1}</td>
                    <td className="p-4 text-xs font-bold text-slate-800">{user.name}</td>
                    <td className="p-4 text-xs text-slate-600 hidden lg:table-cell">{user.email}</td>
                    <td className="p-4 text-xs">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${user.isActive ? 'bg-emerald-50 text-emerald-705 text-emerald-700 border-emerald-200/50' : 'bg-red-50 text-red-700 border-red-200/50'}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-xs hidden lg:table-cell">{user.labRooms?.length > 0 ? <LabRoomsDropdown rooms={user.labRooms} /> : "—"}</td>
                    <td className="p-4 text-center text-xs"><ActionMenu user={user} onEdit={startEdit} onDelete={handleDelete} loadingId={deleteLoadingId} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4 border-t border-slate-150 bg-slate-50/20">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${currentPage === i + 1 ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Users;