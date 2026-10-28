import React, { useState } from "react";
import apiClient from "../../api/apiClient";
import { useLanguage } from "../../context/LanguageContext";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Btn from "../layout/Btn";

const ForgotPassword = ({ onOtpSent }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiClient.post("/auth/forgot-password", { email: email.trim() });
      if (response.data.success) {
        setMessage(t("passwordReset.codeSent"));
        setTimeout(() => {
          onOtpSent(email.trim());
        }, 600);
      } else {
        setError(response.data.message || "Failed to send code");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not send verification code. Please check your email or try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40 mb-3 shadow-xs">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t("passwordReset.forgotTitle")}
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {t("passwordReset.forgotSubtitle")}
        </p>
      </div>

      {/* Alerts */}
      {message && (
        <div className="mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40 px-4 py-3 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/40 px-4 py-3 text-center text-xs font-semibold text-red-650 dark:text-red-400 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t("login.email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              placeholder={t("passwordReset.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
            />
          </div>
        </div>

        <Btn
          type="submit"
          variant="primary"
          className="w-full py-3 text-xs font-bold mt-3 flex items-center justify-center gap-2 shadow-md"
          disabled={loading || !email.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("passwordReset.sending")}</span>
            </>
          ) : (
            <>
              <span>{t("passwordReset.sendCode")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Btn>
      </form>
    </div>
  );
};

export default ForgotPassword;
