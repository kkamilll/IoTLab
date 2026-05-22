import React, { useState } from "react";
import apiClient from "../../api/apiClient";

const ForgotPassword = ({ onOtpSent }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      setMessage("A verification code has been sent to your email.");
      onOtpSent(email); // pass email to PasswordResetFlow
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-slate-200">
        <h2 className="text-3xl font-extrabold mb-4 text-center text-slate-900">
          Forgot Your Password?
        </h2>
        <p className="mb-6 text-sm text-slate-500 text-center">
          Enter your email address and we’ll send a verification code to reset
          your password.
        </p>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-100 text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
