import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import Btn from "../components/layout/Btn";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-12 flex items-center justify-center transition-colors duration-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch">
        
        {/* Left Card - Branding Info */}
        <div className="flex-1 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
          <div className="p-10 sm:p-14 lg:p-16">
            <div className="inline-flex items-center gap-3 rounded-full bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-100 border border-indigo-500/25">
              <span className="text-lg">💡</span>
              {t("login.access")}
            </div>
            <h1 className="mt-10 text-5xl font-black leading-tight sm:text-6xl">
              {t("login.welcomeBack")}
            </h1>
            <p className="mt-6 max-w-xl text-sm text-slate-300 sm:text-base">
              {t("login.infoText")}
            </p>

            <div className="mt-12 grid gap-4 text-sm text-slate-400">
              <div className="rounded-3xl bg-slate-900/80 p-5 border border-slate-800">
                <p className="font-semibold text-slate-100">
                  {t("login.card1Title")}
                </p>
                <p className="mt-2 leading-snug">
                  {t("login.card1Text")}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5 border border-slate-800">
                <p className="font-semibold text-slate-100">
                  {t("login.card2Title")}
                </p>
                <p className="mt-2 leading-snug">
                  {t("login.card2Text")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card - Form */}
        <div className="flex-1 rounded-[2rem] bg-white dark:bg-slate-850 p-8 shadow-2xl sm:p-10 border border-transparent dark:border-slate-800/80 transition-colors duration-300 relative flex flex-col justify-center">
          
          {/* Theme & Language Switchers top right inside Form card */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-200 transition-colors cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              type="button"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m14.071-5.071l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white/50 dark:bg-slate-900/50 text-[10px] font-bold">
              <button
                onClick={() => setLanguage("pl")}
                className={`px-2 py-1 uppercase transition-colors cursor-pointer ${
                  language === "pl"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-105 dark:hover:bg-slate-800"
                }`}
                type="button"
              >
                PL
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 uppercase transition-colors cursor-pointer ${
                  language === "en"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-105 dark:hover:bg-slate-800"
                }`}
                type="button"
              >
                EN
              </button>
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-4">{t("login.title")}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("login.subtitle")}
          </p>

          {error && (
            <div className="mt-6 rounded-2xl bg-red-100 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 px-4 py-3 text-center text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("login.email")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-3 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors duration-300"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-755 dark:text-slate-300">
              {t("login.password")}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="mt-3 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors duration-300"
                required
              />
            </label>

            <Btn
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? t("login.loggingIn") : t("login.button")}
            </Btn>
          </form>

          <Btn
            onClick={handleForgotPassword}
            variant="secondary"
            className="mt-6 w-full py-3 text-sm font-semibold"
            type="button"
          >
            {t("login.forgotPassword")}
          </Btn>

          {/* Back to Home Button */}
          <Btn
            onClick={() => navigate("/")}
            variant="secondary"
            className="mt-3 w-full py-3 text-sm font-semibold"
            type="button"
          >
            {t("common.backToHome")}
          </Btn>
        </div>
      </div>
    </div>
  );
};

export default Login;
