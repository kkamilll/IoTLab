import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import ForgotPassword from "../components/auth/ForgotPassword";
import ResetPassword from "../components/auth/ResetPassword";

export default function PasswordResetFlow() {
  const [email, setEmail] = useState(null);
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 flex items-center justify-center transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Centered Reset Card */}
        <div className="rounded-[2rem] bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-2xl border border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
          
          {/* Top Bar: Back Button & Settings (Theme & Language) */}
          <div className="flex items-center justify-between mb-8 gap-3">
            <button
              onClick={() => {
                if (email) {
                  setEmail(null);
                } else {
                  navigate("/login");
                }
              }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
              type="button"
              title={email ? t("passwordReset.changeEmail") : t("common.back")}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{email ? t("passwordReset.changeEmail") : t("common.back")}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                type="button"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600" />
                )}
              </button>

              {/* Language Switcher */}
              <div className="flex items-center p-0.5 rounded-full border border-slate-200/90 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs">
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

          {/* Content Step */}
          {!email ? (
            <ForgotPassword onOtpSent={(sentEmail) => setEmail(sentEmail)} />
          ) : (
            <ResetPassword email={email} onChangeEmail={() => setEmail(null)} />
          )}

          {/* Back to Login link */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              {t("passwordReset.backToLogin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
