import React, { useEffect, useState } from "react";
import axios from "axios";

const Users = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "", labRooms: [] });
  const [newLabRoom, setNewLabRoom] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())));
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
      setFormData(prev => ({
        ...prev,
        labRooms: [...prev.labRooms, newLabRoom],
      }));
      setNewLabRoom(""); // clear input
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
      } else {
        alert("Failed to add user. Please try again.");
      }
    } catch (err) {
      console.error("Error adding user:", err);
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
        } else {
          alert("Failed to delete user. Please try again.");
        }
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Server error. See console for details.");
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-600 font-semibold text-lg">Loading users...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-extrabold text-blue-800 text-center">User Management</h1>

      {/* Search input */}
      <input
        type="text"
        placeholder="Search users by name..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-blue-100 text-blue-800">
              <th className="border p-3 text-left">#</th>
              <th className="border p-3 text-left">Name</th>
              <th className="border p-3 text-left">Email</th>
              <th className="border p-3 text-left">Role</th>
              <th className="border p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-500 italic">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, idx) => (
                <tr
                  key={user._id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border p-3">{idx + 1}</td>
                  <td className="border p-3">{user.name}</td>
                  <td className="border p-3">{user.email}</td>
                  <td className="border p-3 capitalize">{user.role}</td>
                  <td className="border p-3 text-center">
                    <button
                      onClick={() => handleDelete(user._id)}
                      disabled={deleteLoadingId === user._id}
                      className={`px-4 py-1 rounded text-white font-semibold transition-colors duration-200 ${deleteLoadingId === user._id
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                        }`}
                      title="Delete user"
                    >
                      {deleteLoadingId === user._id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form - one column, inputs full width */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-white p-6 rounded shadow">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="lecturer">Lecturer</option>
        </select>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add lab room"
              value={newLabRoom}
              onChange={e => setNewLabRoom(e.target.value)}
              className="border p-2 rounded flex-1 min-w-[120px]"
            />
            <button
              type="button"
              onClick={handleAddLabRoom}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.labRooms.map((room, idx) => (
              <span
                key={idx}
                className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1 max-w-[150px] truncate"
                title={room} 
              >
                <span className="truncate">{room}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    labRooms: prev.labRooms.filter(r => r !== room),
                  }))}
                  className="text-red-600 font-bold"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitLoading}
          className={`p-3 rounded text-white font-semibold ${submitLoading ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            } transition-colors duration-200`}
        >
          {submitLoading ? "Adding..." : "Add User"}
        </button>
      </form>
    </div>
  );
};

export default Users;
