import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { token } = useAuth();
  const [user, setUser] = useState({ name: "", email: "", password: "", labRooms: [] });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newLabRoom, setNewLabRoom] = useState("");
  const [open, setOpen] = useState(false);
const [showPassword, setShowPassword] = useState(false);

  const ref = useRef(null);

  const axiosInstance = axios.create({
    baseURL: "http://localhost:3500",
    headers: { Authorization: `Bearer ${token}` },
  });

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setEditMode(false);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center items-start p-10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-10 text-base">
        <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">👤 Profile</h2>

        <input
          type="text"
          value={user.name}
          disabled={!editMode}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
          className="w-full mb-5 px-5 py-4 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
          placeholder="Name"
        />

        <input
          type="email"
          value={user.email}
          disabled={!editMode}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          className="w-full mb-5 px-5 py-4 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
          placeholder="Email"
        />
        
{editMode && (
  <div className="mb-5">
  <input
    type="password"
    value={user.password}
    onChange={(e) => setUser({ ...user, password: e.target.value })}
    className="w-full px-5 py-4 border border-gray-300 rounded-2xl text-lg focus:ring-2 focus:ring-gray-400"
    placeholder="Password"
  />
</div>
)}


        {editMode && (
          <div className="mb-6">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                placeholder="Add lab room"
                value={newLabRoom}
                onChange={(e) => setNewLabRoom(e.target.value)}
                className="border p-3 rounded-2xl flex-1 text-lg"
              />
              <button
                type="button"
                onClick={handleAddLabRoom}
                className="px-5 py-3 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 text-lg"
              >
                Add
              </button>
            </div>

            {/* Dropdown ALL LABS */}
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="bg-blue-200 px-4 py-2 rounded-2xl text-base font-medium w-full text-left hover:bg-blue-300 transition"
              >
                ALL LABS
              </button>

              {open && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-2xl shadow-lg p-4 flex flex-col gap-3 z-50 w-full max-h-80 overflow-y-auto">
                  {user.labRooms.length === 0 && (
                    <span className="text-gray-500 text-sm italic">No labs</span>
                  )}
                  {user.labRooms.map((room, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-blue-100 px-4 py-2 rounded-2xl text-base font-medium shadow-sm hover:bg-blue-200 transition"
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

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="w-full bg-blue-500 text-white py-4 rounded-2xl text-lg hover:bg-blue-600"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-4 mt-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-500 text-white py-4 rounded-2xl text-lg hover:bg-green-600"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 bg-red-500 text-white py-4 rounded-2xl text-lg hover:bg-red-600"
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
