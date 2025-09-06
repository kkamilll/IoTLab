import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

const Users = () => {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "", 
    labRooms: [],
    isActive: true // nowy stan konta
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

  // Lab dropdown state for form
  const [labDropdownOpen, setLabDropdownOpen] = useState(false);
  const labDropdownRef = useRef();

  const USERS_PER_PAGE = 2;

  // Fetch users from API
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

  // Filter users by search & role
  useEffect(() => {
    let filtered = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (roleFilter) filtered = filtered.filter(u => u.role === roleFilter);
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, users]);

  // Close lab dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (labDropdownRef.current && !labDropdownRef.current.contains(e.target)) {
        setLabDropdownOpen(false);
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

 const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitLoading(true);

  try {
    if (!editingUserId) {
      // Dodawanie nowego użytkownika
      if (!formData.name || !formData.email || !formData.password || !formData.role) {
        alert("All fields are required for new users!");
        setSubmitLoading(false);
        return;
      }

      const res = await axios.post(
        "http://localhost:3500/users/create",
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
      );

      if (res.data.success) {
        alert("User added successfully!");
        setFormData({ name: "", email: "", password: "", role: "", labRooms: [], isActive: true });
        fetchUsers();
      } else {
        alert(res.data.message || "Adding user failed.");
      }

    } else {
      // Edycja istniejącego użytkownika
      if (!formData.name || !formData.email || !formData.role) {
        alert("Name, Email and Role are required!");
        setSubmitLoading(false);
        return;
      }

     const dataToSend = { ...formData };
if (!dataToSend.password?.trim()) delete dataToSend.password;

// Wymuś aktywność dla admin@gmail.com
if (dataToSend.email === "admin@gmail.com") dataToSend.isActive = true;

const res = editingUserId
  ? await axios.put(`http://localhost:3500/users/${editingUserId}`, dataToSend, { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } })
  : await axios.post("http://localhost:3500/users/create", dataToSend, { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } });


      if (res.data.success) {
        alert("User updated successfully!");
        setFormData({ name: "", email: "", password: "", role: "", labRooms: [], isActive: true });
        setEditingUserId(null);
        fetchUsers();
      } else {
        alert(res.data.message || "Updating user failed.");
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
    const res = await axios.delete(`http://localhost:3500/users/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
    });

    if (res.data.success) {
      fetchUsers();
      alert("User deleted successfully!");
    } else if (res.data.error === "HAS_PRODUCTS") {
      alert("Cannot delete user: they have associated products.");
    } else {
      alert(res.data.message || "Delete failed. Try again.");
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Server error. See console for details.");
  }

  setDeleteLoadingId(null);
};


  const startEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({ ...user, password: "", isActive: user.isActive ?? true });
  };

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  if (loading) return <div className="p-8 text-center text-gray-600 font-semibold text-lg">Loading users...</div>;

  // --- LabRooms Dropdown Component for Table ---
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

  // --- Action Menu Component ---
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
  const menuHeight = 80; // wysokość menu w px
  const menuWidth = 140; // szerokość menu w px

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
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-300 rounded-xl shadow-lg p-2 flex flex-col gap-1 z-[9999]"
      style={{
        top: coords.top,
        left: coords.left,
        width: '140px' // ustalona szerokość menu
      }}
    >
      <button
        onClick={() => { onEdit(user); setOpen(false); }}
        className="px-3 py-1 hover:bg-blue-100 rounded"
      >
        Edit
      </button>
      <button
        onClick={() => { onDelete(user._id); setOpen(false); }}
        disabled={loadingId === user._id}
        className={`px-3 py-1 rounded ${loadingId === user._id ? "bg-red-300 cursor-not-allowed" : "hover:bg-red-100"}`}
      >
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
    <th className="p-3 rounded-tl-2xl hidden md:table-cell">#</th>
    <th className="p-3">Name</th>
    <th className="p-3 hidden md:table-cell">Email</th>
    <th className="p-3">Role</th>
    <th className="p-3">Status</th>
    <th className="p-3 hidden md:table-cell">Lab Rooms</th>
    <th className="p-3 rounded-tr-2xl text-center">Actions</th>
  </tr>
</thead>
<tbody>
  {paginatedUsers.map((user, idx) => (
    <tr key={user._id} className="bg-gray-50 hover:bg-blue-50 transition">
      <td className="p-3 font-semibold hidden md:table-cell">
        {(currentPage - 1) * USERS_PER_PAGE + idx + 1}
      </td>
      <td className="p-3 font-medium">{user.name}</td>
      <td className="p-3 text-gray-700">{user.email}</td>
      <td className="p-3 capitalize text-blue-600">{user.role}</td>
      <td className="p-3 hidden md:table-cell">
        {user.isActive ? (
          <span className="text-green-600 font-semibold">Active</span>
        ) : (
          <span className="text-red-600 font-semibold">Inactive</span>
        )}
      </td>
      <td className="p-3 hidden md:flex flex-wrap gap-1">
        {user.labRooms?.length ? <LabRoomsDropdown rooms={user.labRooms} /> : <span className="text-gray-400 italic">No labs</span>}
      </td>
      <td className="p-3 text-center">
        <ActionMenu user={user} onEdit={startEdit} onDelete={handleDelete} loadingId={deleteLoadingId}/>
      </td>
    </tr>
  ))}
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
                    setFormData({ name: "", email: "", password: "", role: "", labRooms: [], isActive: true });
                  }}
                  className="text-red-600 hover:text-red-800 font-bold text-lg"
                  title="Cancel editing"
                >
                  ⏪
                </button>
              </>
            ) : "➕ Add User"}
          </h2>

          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange}  maxLength={15} className="p-3 border border-gray-300 rounded-xl" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="p-3 border border-gray-300 rounded-xl" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="p-3 border border-gray-300 rounded-xl" />
          <select name="role" value={formData.role} onChange={handleChange} className="p-3 border border-gray-300 rounded-xl">
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="lecturer">Lecturer</option>
          </select>

          {/* Checkbox Active / Inactive */}
          <div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="isActive"
    name="isActive"
    checked={formData.isActive}
    onChange={(e) => {
      if (formData.email !== "admin@gmail.com") {
        setFormData(prev => ({ ...prev, isActive: e.target.checked }));
      }
    }}
    disabled={formData.email === "admin@gmail.com"} // zawsze aktywne dla admin@gmail.com
    className="w-5 h-5"
  />
  <label htmlFor="isActive" className="text-gray-700 font-medium">
    Active Account
  </label>
</div>


          {/* Lab Rooms Dropdown in Add/Edit Form */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add lab room"
                value={newLabRoom}
                onChange={e => setNewLabRoom(e.target.value)}
                maxLength={10}
                className="border p-2 rounded-xl flex-1"
              />
              <button
                type="button"
                onClick={handleAddLabRoom}
                className="px-3 py-1 bg-gray-500 text-white rounded-xl"
              >
                Add
              </button>
            </div>

            <div className="relative" ref={labDropdownRef}>
              <button
                type="button"
                onClick={() => setLabDropdownOpen(prev => !prev)}
                className="bg-blue-200 px-4 py-2 rounded-2xl text-base font-medium w-full text-left hover:bg-blue-300 transition"
              >
                ALL LABS
              </button>

              {formData.labRooms.length > 0 && labDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-2xl shadow-lg p-4 flex flex-col gap-3 z-50 w-full max-h-80 overflow-y-auto">
                  {formData.labRooms.map((room, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-blue-100 px-4 py-2 rounded-2xl text-base font-medium shadow-sm hover:bg-blue-200 transition"
                    >
                      <span>{room}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            labRooms: prev.labRooms.filter(r => r !== room)
                          }))
                        }
                        className="ml-2 text-red-600 font-bold hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
