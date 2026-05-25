import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

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
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      const { success, user, token, message } = response.data;

      if (success) {
        await login(user, token);
        navigate(
          user.role === "admin" ? "/admin-dashboard" : "/admin-dashboard",
        );
      } else {
        setError(message || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server is not responding");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle "Forgot Password" click
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch">
        <div className="flex-1 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
          <div className="p-10 sm:p-14 lg:p-16">
            <div className="inline-flex items-center gap-3 rounded-full bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-100 border border-indigo-500/25">
              <span className="text-lg">💡</span>
              IoTLab access
            </div>
            <h1 className="mt-10 text-5xl font-black leading-tight sm:text-6xl">
              Welcome back
            </h1>
            <p className="mt-6 max-w-xl text-sm text-slate-300 sm:text-base">
              Log in to manage rooms, reservations and laboratory components.
              Your admin dashboard is secure and mobile-friendly.
            </p>

            <div className="mt-12 grid gap-4 text-sm text-slate-400">
              <div className="rounded-3xl bg-slate-900/80 p-5 border border-slate-800">
                <p className="font-semibold text-slate-100">
                  One account, full access
                </p>
                <p className="mt-2 leading-snug">
                  Admin and lecturer users can manage products, materials,
                  orders and system settings.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5 border border-slate-800">
                <p className="font-semibold text-slate-100">
                  Secure authentication
                </p>
                <p className="mt-2 leading-snug">
                  Your session is validated with JWT and protected routes
                  prevent unauthorized access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-[2rem] bg-white p-8 shadow-2xl sm:p-10">
          <h2 className="text-3xl font-black text-slate-900">Login</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to continue.
          </p>

          {error && (
            <div className="mt-6 rounded-2xl bg-red-100 px-4 py-3 text-center text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <button
            onClick={handleForgotPassword}
            className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            type="button"
          >
            Forgot Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
