import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import Btn from "../components/layout/Btn";
import { Mail, Lock, ArrowLeft, Sun, Moon, Eye, EyeOff, AlertCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 flex items-center justify-center transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Centered Login Card */}
        <div className="rounded-[2rem] bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-2xl border border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
          
          {/* Top Bar: Back Button & Settings (Theme & Language) */}
          <div className="flex items-center justify-between mb-8 gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
              type="button"
              title={t("common.backToHome")}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("common.back")}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Theme switcher */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                type="button"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600" />
                )}
              </button>

              {/* Language Switcher */}
              <div className="flex items-center rounded-full border border-slate-200/90 dark:border-slate-700 overflow-hidden bg-white/80 dark:bg-slate-800 shadow-2xs p-0.5">
                <button
                  onClick={() => setLanguage("pl")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all duration-200 rounded-full cursor-pointer ${
                    language === "pl"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  type="button"
                >
                  PL
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all duration-200 rounded-full cursor-pointer ${
                    language === "en"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  type="button"
                >
                  EN
                </button>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40 mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {t("login.title")}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {t("login.subtitle")}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/40 px-4 py-3 text-center text-xs font-semibold text-red-650 dark:text-red-400 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t("login.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t("login.password")}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {t("login.forgotPassword")}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Btn
              type="submit"
              variant="primary"
              className="w-full py-3 text-xs font-bold mt-2"
              disabled={loading}
            >
              {loading ? t("login.loggingIn") : t("login.button")}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
