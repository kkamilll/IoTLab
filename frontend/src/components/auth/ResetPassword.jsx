import React, { useState } from "react";
import apiClient from "../../api/apiClient";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Check } from "lucide-react";
import Btn from "../layout/Btn";

const ResetPassword = ({ email, onChangeEmail }) => {
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setError(t("passwordReset.minPasswordLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("passwordReset.passwordsMismatch"));
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post("/auth/reset-password", {
        email,
        otpCode: otp.trim(),
        newPassword,
      });

      if (response.data.success) {
        setSuccessMessage(t("passwordReset.success"));
        setTimeout(() => {
          navigate("/login");
        }, 1800);
      } else {
        setError(response.data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error occurred during password reset.");
    } finally {
      setLoading(false);
    }
  };

  const hasMinLength = newPassword.length >= 8;
  const hasDigit = /\d/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40 mb-3 shadow-xs">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t("passwordReset.resetTitle")}
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {t("passwordReset.resetSubtitle")}
        </p>

        {/* Email Pill with change option */}
        {email && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
              {email}
            </span>
            {onChangeEmail && (
              <button
                type="button"
                onClick={onChangeEmail}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {t("passwordReset.changeEmail")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/40 px-4 py-3 text-center text-xs font-semibold text-red-650 dark:text-red-400 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40 px-4 py-3 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Verification OTP Code */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t("passwordReset.otpPlaceholder")}
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={12}
              required
              autoFocus
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
            />
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t("passwordReset.newPassword")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Requirements Helper */}
          {newPassword && (
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition ${hasMinLength ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3 h-3 shrink-0 ${hasMinLength ? "opacity-100" : "opacity-30"}`} />
                <span>{t("passwordReset.passwordRequirementLength")}</span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition ${hasDigit ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3 h-3 shrink-0 ${hasDigit ? "opacity-100" : "opacity-30"}`} />
                <span>{t("passwordReset.passwordRequirementDigit")}</span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition ${hasUpper ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                <Check className={`w-3 h-3 shrink-0 ${hasUpper ? "opacity-100" : "opacity-30"}`} />
                <span>{t("passwordReset.passwordRequirementUppercase")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t("passwordReset.confirmPassword")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Btn
          type="submit"
          variant="primary"
          className="w-full py-3 text-xs font-bold mt-3 flex items-center justify-center gap-2 shadow-md"
          disabled={loading || !otp.trim() || !newPassword || !confirmPassword}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("passwordReset.resetting")}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{t("passwordReset.resetButton")}</span>
            </>
          )}
        </Btn>
      </form>
    </div>
  );
};

export default ResetPassword;
