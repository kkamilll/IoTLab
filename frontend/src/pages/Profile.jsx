import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, ChevronUp } from "lucide-react";

const Profile = () => {
  const { token } = useAuth();

  // --- State ---
  const [user, setUser] = useState({ name: "", email: "", password: "", labRooms: [] });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newLabRoom, setNewLabRoom] = useState("");
  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  // --- Axios instance ---
  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`,
    headers: { Authorization: `Bearer ${token}` },
  });

  // --- Fetch user profile on mount ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/users/profile");
        if (res.data.success) {
          setUser({
            name: res.data.user.name,
            email: res.data.user.email,
            password: "",
            labRooms: res.data.user.labRooms || [],
          });
        }
      } catch (err) {
        console.error(err.response?.data || err.message);
        alert("Error fetching profile");
      }
    };
    fetchUser();
  }, [token]);

  // --- Handle click outside dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers ---
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

  const cancelEdit = () => setEditMode(false);

  const handleAddLabRoom = () => {
    if (newLabRoom && !user.labRooms.includes(newLabRoom)) {
      setUser((prev) => ({ ...prev, labRooms: [...prev.labRooms, newLabRoom] }));
      setNewLabRoom("");
    }
  };

  const handleRemoveLabRoom = (room) => {
    setUser((prev) => ({ ...prev, labRooms: prev.labRooms.filter((r) => r !== room) }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center items-start px-4 sm:px-6 lg:px-10 py-10">
      <div className="w-full max-w-lg sm:max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-10 text-base">

        {/* --- Header --- */}
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">👤 Profile</h2>

        {/* --- User Info Inputs --- */}
        <div className="mb-5">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={user.name}
            disabled={!editMode}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full px-5 py-4 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
            placeholder="Enter your name"
          />
        </div>

        <div className="mb-5">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            disabled={!editMode}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className="w-full px-5 py-4 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
            placeholder="Enter your email"
          />
        </div>

        {editMode && (
          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="w-full px-5 py-4 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400"
              placeholder="Enter new password"
            />
          </div>
        )}

       {/* --- Lab Rooms --- */}
{editMode && (
  <div className="mb-6">
    {/* Add new lab room */}
    <div className="flex gap-3 mb-3">
      <div className="flex-1">
        <label htmlFor="lab-room" className="block text-sm font-medium text-gray-700 mb-1">
          New Lab Room
        </label>
        <input
          id="lab-room"
          type="text"
          placeholder="e.g. Lab A"
          value={newLabRoom}
          onChange={(e) => setNewLabRoom(e.target.value)}
          className="border px-4 py-3 rounded-xl text-base w-full"
        />
      </div>
      <button
        type="button"
        onClick={handleAddLabRoom}
        className="self-end px-5 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 text-base font-medium transition"
      >
        Add
      </button>
    </div>

    {/* Dropdown for all labs */}
 {/* Dropdown for all labs (accordion style) */}
<div className="mb-3" ref={ref}>
  <button
    onClick={() => setOpen((prev) => !prev)}
    className="flex items-center justify-between bg-blue-200 px-4 py-3 rounded-xl text-base font-medium w-full hover:bg-blue-300 transition"
  >
    <span>ALL LABS</span>
    <span className="ml-2 text-gray-700">{open ? "▲" : "▼"}</span>
  </button>

  {open && (
    <div className="mt-2 bg-white border border-gray-300 rounded-xl shadow-md p-3 flex flex-col gap-2 w-full max-h-64 overflow-y-auto">
      {user.labRooms.length === 0 && (
        <span className="text-gray-500 text-sm italic">No labs</span>
      )}
      {user.labRooms.map((room, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-blue-100 px-3 py-2 rounded-lg text-base font-medium shadow-sm hover:bg-blue-200 transition"
        >
          <span>{room}</span>
          <button
            onClick={() => handleRemoveLabRoom(room)}
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
)}


        {/* --- Action Buttons --- */}
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="w-full bg-blue-500 text-white py-3 rounded-xl text-base font-medium hover:bg-blue-600 transition"
          >
            Edit
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-500 text-white py-3 rounded-xl text-base font-medium hover:bg-green-600 transition"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl text-base font-medium hover:bg-red-600 transition"
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