import React, { useEffect, useState } from "react";
import axios from "axios";

const Users = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", address: "", role: "" });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);

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
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    setFilteredUsers(users.filter((user) => user.name.toLowerCase().includes(e.target.value.toLowerCase())));
  };

  const addUser = async () => {
    const res = await axios.post("http://localhost:3500/users/add", formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
    });
    return res.data;
  };

  const deleteUser = async (id) => {
    const res = await axios.delete(`http://localhost:3500/users/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
    });
    return res.data;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await addUser();
      if (data.success) {
        alert("User added successfully");
        setFormData({ name: "", email: "", password: "", address: "", role: "" });
        fetchUsers();
      } else {
        alert("Add user failed. Please try again.");
      }
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Server error – see console.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this User?")) {
      try {
        const data = await deleteUser(id);
        if (data.success) {
          alert("User deleted successfully");
          fetchUsers();
        } else {
          alert("Delete failed. Please try again.");
        }
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Server error – see console.");
      }
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-8">User Management</h1>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/3">
          <form className="space-y-4 bg-white p-4 rounded shadow" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded" />
            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded" required>
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="lecturer">Lecturer</option>
            </select>
            <button type="submit" className="w-full bg-green-500 text-white p-3 rounded">Add User</button>
          </form>
        </div>
        <div className="lg:w-2/3">
          <input type="text" placeholder="Search" onChange={handleSearch} className="w-full mb-2 p-2 border rounded" />
          <div className="bg-white p-4 rounded shadow overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">S No</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Address</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No records</td></tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user._id}>
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2">{user.name}</td>
                      <td className="border p-2">{user.email}</td>
                      <td className="border p-2">{user.address}</td>
                      <td className="border p-2">{user.role}</td>
                      <td className="border p-2">
                        <button onClick={() => handleDelete(user._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
