import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:3500/login", {
        email,
        password,
      });

      const { success, user, token, message } = response.data;

      if (success) {
        await login(user, token);
        if (user.role === "admin") {
          navigate("/home-admin");
        } else {
          navigate("/home");
        }
      } else {
        setError(message || "Login failed");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Something went wrong");
      } else {
        setError("Server is not responding");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-600 to-gray-100 space-y-6">
      <h2 className="text-3xl text-white font-semibold">Inventory Management System</h2>

      <div className="w-80 bg-white p-6 rounded shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Login</h3>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
