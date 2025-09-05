import React, { useEffect, useState } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);

  const USERS_PER_PAGE = 2;

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())));
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, users]);

  const addUser = async () => {
    setSubmitLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3500/users/create",
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
        }
      );
      setSubmitLoading(false);
      return res.data;
    } catch (err) {
      setSubmitLoading(false);
      throw err;
    }
  };

  const deleteUser = async (id) => {
    setDeleteLoadingId(id);
    try {
      const res = await axios.delete(`http://localhost:3500/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
      });
      setDeleteLoadingId(null);
      return res.data;
    } catch (err) {
      setDeleteLoadingId(null);
      throw err;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLabRoom = () => {
    if (newLabRoom && !formData.labRooms.includes(newLabRoom)) {
      setFormData(prev => ({ ...prev, labRooms: [...prev.labRooms, newLabRoom] }));
      setNewLabRoom("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await addUser();
      if (data.success) {
        alert("User added successfully!");
        setFormData({ name: "", email: "", password: "", role: "", labRooms: [] });
        fetchUsers();
      } else alert("Failed to add user. Please try again.");
    } catch (err) {
      console.error(err);
      alert("Server error. See console for details.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const data = await deleteUser(id);
        if (data.success) {
          alert("User deleted successfully!");
          fetchUsers();
        } else alert("Failed to delete user. Please try again.");
      } catch (err) {
        console.error(err);
        alert("Server error. See console for details.");
      }
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);
  const goPrev = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };
  const goNext = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };

  if (loading) return <div className="p-8 text-center text-gray-600 font-semibold text-lg">Loading users...</div>;

  return ( 
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-6xl space-y-8">

        <h1 className="text-4xl font-extrabold text-blue-700 text-center">👥 User Management</h1>

        <input
          type="text"
          placeholder="Search users by name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {/* Users Table */}
        <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mt-6">
  <table className="min-w-full text-left">
    <thead className="bg-blue-50 text-blue-700">
      <tr>
        <th className="p-4 rounded-tl-2xl">#</th>
        <th className="p-4">Name</th>
        <th className="p-4">Email</th>
        <th className="p-4">Role</th>
        <th className="p-4">Lab Rooms</th>
        <th className="p-4 rounded-tr-2xl text-center">Action</th>
      </tr>
    </thead>
    <tbody>
      {paginatedUsers.length === 0 ? (
        <tr>
          <td colSpan={6} className="text-center p-6 text-gray-400 italic">No users found.</td>
        </tr>
      ) : (
        paginatedUsers.map((user, idx) => (
          <tr key={user._id} className="bg-gray-50 hover:bg-blue-50 transition rounded-xl">
            <td className="p-4 font-semibold">{(currentPage - 1) * USERS_PER_PAGE + idx + 1}</td>
            <td className="p-4 font-medium">{user.name}</td>
            <td className="p-4 text-gray-700">{user.email}</td>
            <td className="p-4 capitalize text-blue-600">{user.role}</td>
            <td className="p-4 flex flex-wrap gap-1">
              {user.labRooms?.map((room, i) => (
                <span key={i} className="bg-blue-100 px-2 py-1 rounded-xl text-sm">{room}</span>
              ))}
            </td>
            <td className="p-4 text-center">
              <button
                onClick={() => handleDelete(user._id)}
                disabled={deleteLoadingId === user._id}
                className={`px-4 py-2 rounded-xl text-white font-semibold transition-colors duration-200 ${deleteLoadingId === user._id ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
              >
                {deleteLoadingId === user._id ? "Deleting..." : "🗑️ Delete"}
              </button>
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
            <button onClick={goPrev} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 rounded-xl disabled:opacity-50">Previous</button>
            <span className="px-4 py-2">{currentPage} / {totalPages}</span>
            <button onClick={goNext} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 rounded-xl disabled:opacity-50">Next</button>
          </div>
        )}

        {/* Add User Form */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-gray-50 p-6 rounded-2xl shadow-lg">
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <select name="role" value={formData.role} onChange={handleChange} required className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="lecturer">Lecturer</option>
          </select>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Add lab room" value={newLabRoom} onChange={e => setNewLabRoom(e.target.value)} className="border p-2 rounded-xl flex-1 min-w-[120px]" />
              <button type="button" onClick={handleAddLabRoom} className="px-3 py-1 bg-gray-500 text-white rounded-xl hover:bg-gray-600">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.labRooms.map((room, idx) => (
                <span key={idx} className="bg-blue-200 px-2 py-1 rounded-xl flex items-center gap-1 max-w-[150px] truncate" title={room}>
                  <span className="truncate">{room}</span>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, labRooms: prev.labRooms.filter(r => r !== room) }))} className="text-red-600 font-bold">x</button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitLoading} className={`p-3 rounded-xl text-white font-semibold ${submitLoading ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} transition-colors duration-200`}>
            {submitLoading ? "Adding..." : "➕ Add User"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Users;
