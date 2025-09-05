import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

const Users = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "", labRooms: [] });
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

  const USERS_PER_PAGE = 3;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3500/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
      });
      setUsers(res.data.users || []);
      setFilteredUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const url = editingUserId
        ? `http://localhost:3500/users/${editingUserId}`
        : `http://localhost:3500/users/create`;
      const method = editingUserId ? "put" : "post";
      const dataToSend = { ...formData };

      if (editingUserId && !formData.password.trim()) delete dataToSend.password;

      if (!editingUserId) {
        if (!dataToSend.name.trim() || !dataToSend.email.trim() || !dataToSend.password.trim() || !dataToSend.role.trim()) {
          alert("All fields are required for new users!");
          setSubmitLoading(false);
          return;
        }
      } else {
        if (!dataToSend.name.trim() || !dataToSend.email.trim() || !dataToSend.role.trim()) {
          alert("Name, Email and Role are required!");
          setSubmitLoading(false);
          return;
        }
      }

      const res = await axios({ method, url, data: dataToSend, headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } });

      if (res.data.success) {
        alert(editingUserId ? "User updated successfully!" : "User added successfully!");
        setFormData({ name: "", email: "", password: "", role: "", labRooms: [] });
        setEditingUserId(null);
        fetchUsers();
      } else {
        alert(res.data.message || "Operation failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Server error. See console for details.");
    }

    setSubmitLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setDeleteLoadingId(id);
    try {
      const res = await axios.delete(`http://localhost:3500/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
      });
      if (res.data.success) fetchUsers();
      else alert("Delete failed. Try again.");
    } catch (err) {
      console.error(err);
      alert("Server error. See console for details.");
    }
    setDeleteLoadingId(null);
  };

  const startEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({ ...user, password: "" });
  };

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  if (loading) return <div className="p-8 text-center text-gray-600 font-semibold text-lg">Loading users...</div>;

  // --- DROPDOWN Z LABROOMS ---
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
          ALL LABS
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

  // --- ACTION MENU ---
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
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = menuHeight > spaceBelow;
      setCoords({
        top: showAbove ? rect.top + window.scrollY - menuHeight : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      setOpen(prev => !prev);
    };

    return (
      <div className="relative">
        {/* Desktop */}
        <div className="hidden md:flex justify-center gap-2">
          <button onClick={() => onEdit(user)} className="bg-blue-600 text-white px-3 py-1 rounded-xl hover:bg-blue-700">Edit</button>
          <button onClick={() => onDelete(user._id)} disabled={loadingId === user._id} className={`px-3 py-1 rounded-xl text-white ${loadingId === user._id ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>
            {loadingId === user._id ? "Deleting..." : "Delete"}
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden relative">
          <button ref={buttonRef} onClick={toggleMenu} className="px-2 py-1 bg-gray-300 rounded-xl">⋮</button>
          {open && ReactDOM.createPortal(
            <div ref={menuRef} className="absolute bg-white border border-gray-300 rounded-xl shadow-lg p-2 flex flex-col gap-1 z-[9999]" style={{ top: coords.top, left: coords.left }}>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-6xl space-y-8">
        <h1 className="text-4xl font-extrabold text-blue-700 text-center">👥 User Management</h1>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-xl"/>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="p-3 border border-gray-300 rounded-xl">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="lecturer">Lecturer</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg mt-6 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-blue-50 text-blue-700">
              <tr>
                <th className="p-4 rounded-tl-2xl">#</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 hidden md:table-cell">Lab Rooms</th>
                <th className="p-4 rounded-tr-2xl text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-gray-400 italic">No users found.</td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => (
                  <tr key={user._id} className="bg-gray-50 hover:bg-blue-50 transition">
                    <td className="p-4 font-semibold">{(currentPage - 1) * USERS_PER_PAGE + idx + 1}</td>
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-gray-700">{user.email}</td>
                    <td className="p-4 capitalize text-blue-600">{user.role}</td>
                    <td className="p-4 hidden md:flex flex-wrap gap-1">
                      {user.labRooms?.length ? <LabRoomsDropdown rooms={user.labRooms} /> : <span className="text-gray-400 italic">No labs</span>}
                    </td>
                    <td className="p-4 text-center">
                      <ActionMenu user={user} onEdit={startEdit} onDelete={handleDelete} loadingId={deleteLoadingId}/>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 rounded-xl disabled:opacity-50">Prev</button>
            <span className="px-4 py-2">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 rounded-xl disabled:opacity-50">Next</button>
          </div>
        )}

        {/* Add / Edit User Form */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-gray-50 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
            {editingUserId ? (
              <>
                <span>✏️ Edit User</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUserId(null);
                    setFormData({ name: "", email: "", password: "", role: "", labRooms: [] });
                  }}
                  className="text-red-600 hover:text-red-800 font-bold text-lg"
                  title="Cancel editing"
                >
                  ⏪
                </button>
              </>
            ) : "➕ Add User"}
          </h2>

          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="p-3 border border-gray-300 rounded-xl" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="p-3 border border-gray-300 rounded-xl" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="p-3 border border-gray-300 rounded-xl" />
          <select name="role" value={formData.role} onChange={handleChange} className="p-3 border border-gray-300 rounded-xl">
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="lecturer">Lecturer</option>
          </select>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Add lab room" value={newLabRoom} onChange={e => setNewLabRoom(e.target.value)} className="border p-2 rounded-xl flex-1" />
              <button type="button" onClick={handleAddLabRoom} className="px-3 py-1 bg-gray-500 text-white rounded-xl">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.labRooms.map((room, idx) => (
                <span key={idx} className="bg-blue-200 px-2 py-1 rounded-xl flex items-center gap-1">
                  {room}
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, labRooms: prev.labRooms.filter(r => r !== room) }))} className="text-red-600 font-bold">x</button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitLoading} className={`p-3 rounded-xl text-white font-semibold ${submitLoading ? "bg-green-300" : "bg-green-600 hover:bg-green-700"}`}>
            {submitLoading ? (editingUserId ? "Saving..." : "Adding...") : (editingUserId ? "💾 Save Changes" : "➕ Add User")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Users;
