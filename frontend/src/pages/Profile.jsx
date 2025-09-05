import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const [user, setUser] = useState({ name: "", email: "", password: "" });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const axiosInstance = axios.create({
    baseURL: "http://localhost:3500",
    headers: { Authorization: `Bearer ${token}` },
  });

  const passwordRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("/users/profile");
      if (res.data.success) {
        setUser({
          name: res.data.user.name,
          email: res.data.user.email,
          password: "",
        });
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Error fetching profile");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const handleSave = async () => {
    if (!user.name.trim() || !user.email.trim()) return alert("Name and email cannot be empty");
    try {
      setLoading(true);
      const res = await axiosInstance.put("/users/profile", user);
      if (res.data.success) {
        alert("Profile updated successfully!");
        setEditMode(false);
        setUser((prev) => ({ ...prev, password: "" }));
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    fetchUser();
    setEditMode(false);
  };

  return (
 <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center items-center p-5">
  <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">👤 Profile</h2>

    <input
      type="text"
      value={user.name}
      disabled={!editMode}
      onChange={(e) => setUser({ ...user, name: e.target.value })}
      className="w-full mb-5 px-4 py-3 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
      placeholder="Name"
    />

    <input
      type="email"
      value={user.email}
      disabled={!editMode}
      onChange={(e) => setUser({ ...user, email: e.target.value })}
      className="w-full mb-5 px-4 py-3 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
      placeholder="Email"
    />

    {editMode && (
      <input
        type="password"
        value={user.password}
        onChange={(e) => setUser({ ...user, password: e.target.value })}
        className="w-full mb-6 px-4 py-3 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400"
        placeholder="Password"
      />
    )}

    {!editMode ? (
      <button
        onClick={() => setEditMode(true)}
        className="w-full bg-blue-500 text-white py-3 rounded-2xl text-lg hover:bg-blue-600"
      >
        Edit
      </button>
    ) : (
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-500 text-white py-3 rounded-2xl text-lg hover:bg-green-600"
        >
          Save
        </button>
        <button
          onClick={cancelEdit}
          className="flex-1 bg-red-500 text-white py-3 rounded-2xl text-lg hover:bg-red-600"
        >
          Cancel
        </button>
      </div>
    )}
  </div>
</div>


  );
};

export default Profile;
