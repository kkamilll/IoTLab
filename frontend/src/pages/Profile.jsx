import axios from "axios";
import React, { useEffect, useState } from "react";

const Profile = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [edit, setEdit] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:3500/users/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
      });

      if (res.data.success) {
        setUser({
          name: res.data.user.name,
          email: res.data.user.email,
          password: "",
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      alert("Error fetching user profile. Please try again.");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(
        "http://localhost:3500/users/profile",
        user,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
          },
        }
      );

      if (res.data.success) {
        alert("Profile updated successfully!");
        setEdit(false);
      }
      else{
        alert('Failed to update profile')
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  return (
    <div className="p-5">
      <form
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="font-bold text-2xl mb-6">User Profile</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={user.name}
            disabled={!edit}
            onChange={(e) => setUser({ ...user, [e.target.name]: e.target.value })}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={user.email}
            disabled={!edit}
            onChange={(e) => setUser({ ...user, [e.target.name]: e.target.value })}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div className="mb-6">
          
         
        </div>

        {edit && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter new password (optional)"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {!edit ? (
          <button
            type="button"
            onClick={() => setEdit(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 cursor-pointer"
          >
            Edit Profile
          </button>
        ) : (
          <>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 cursor-pointer mr-2"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => setEdit(false)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default Profile;
