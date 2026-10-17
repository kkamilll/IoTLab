import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  type = "danger", // "danger" | "warning" | "info"
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-xs transition-opacity" />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden z-10 transition-all duration-200 animate-in fade-in-50 zoom-in-95">
        {/* Header/Close */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Icon Badge */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            type === "danger" 
              ? "bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400"
              : type === "warning"
              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
              : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400"
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-850 dark:text-slate-50 mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl transition-all cursor-pointer"
            >
              {cancelText || t("common.cancel") || "Anuluj"}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-xs ${
                type === "danger"
                  ? "bg-red-600 hover:bg-red-700 shadow-sm"
                  : type === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 shadow-sm"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              }`}
            >
              {confirmText || t("common.confirm") || "Potwierdź"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
