import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Reusable confirmation dialog modal.
 *
 * Props:
 *  - open: boolean – whether the dialog is shown
 *  - title: string – dialog title
 *  - message: string – body text
 *  - confirmLabel: string (optional) – label for confirm button
 *  - cancelLabel: string (optional) – label for cancel button
 *  - variant: "danger" | "warning" | "info" (default "danger")
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  const { t, language } = useLanguage();

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: "bg-red-50 dark:bg-red-950/40 text-red-500",
      confirmBtn:
        "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20",
    },
    warning: {
      icon: "bg-amber-50 dark:bg-amber-950/40 text-amber-500",
      confirmBtn:
        "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20",
    },
    info: {
      icon: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500",
      confirmBtn:
        "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20",
    },
  };

  const styles = variantStyles[variant] ?? variantStyles.danger;
  const defaultConfirm = t("common.confirm") || (language === "pl" ? "Potwierdź" : "Confirm");
  const defaultCancel  = t("common.cancel")  || (language === "pl" ? "Anuluj"    : "Cancel");

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col gap-5">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <span className={`flex-shrink-0 p-3 rounded-2xl ${styles.icon}`}>
            <AlertTriangle className="w-5 h-5" />
          </span>
          <h2
            id="confirm-dialog-title"
            className="text-base font-black text-slate-900 dark:text-white leading-tight"
          >
            {title || (language === "pl" ? "Czy jesteś pewny?" : "Are you sure?")}
          </h2>
        </div>

        {/* Message */}
        {message && (
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm py-2.5 transition cursor-pointer"
          >
            {cancelLabel || defaultCancel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-2xl font-bold text-sm py-2.5 transition cursor-pointer ${styles.confirmBtn}`}
          >
            {confirmLabel || defaultConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
