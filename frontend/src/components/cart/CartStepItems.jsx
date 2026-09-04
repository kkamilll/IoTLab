import React, { useState } from "react";
import { Calendar, User, AlertTriangle, Minus, Plus, Trash2, ArrowRight, Check } from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import TextField from "@mui/material/TextField";
import ConfirmDialog from "../layout/ConfirmDialog";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3500";

const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());

const CartStepItems = ({
  cart,
  groupedCart,
  availability,
  orderDates,
  setOrderDates,
  handleQuantityChange,
  handleRemove,
  isQuantityDisabled,
  theme,
  t,
  language,
  setCheckoutStep,
  totalItems,
  totalOwners,
  showToast,
}) => {
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, productId: null, productName: "" });

  const askRemove = (productId, productName) => setRemoveConfirm({ open: true, productId, productName });
  const cancelRemove = () => setRemoveConfirm({ open: false, productId: null, productName: "" });
  const confirmRemove = () => {
    if (removeConfirm.productId) handleRemove(removeConfirm.productId);
    cancelRemove();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_360px] items-start w-full">
      {/* LEFT – Dates Selection & Cart Items */}
      <div className="flex flex-col gap-6 min-w-0">
        {/* Date Selection Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-4 flex items-center gap-2 select-none border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Calendar className="w-4.5 h-4.5 text-indigo-500" />
            {t("cart.dateSelection")}
          </h3>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.startDate")}
                <DateTimePicker
                  value={orderDates.startDate ? new Date(orderDates.startDate) : null}
                  onChange={(newValue) =>
                    setOrderDates((prev) => ({
                      ...prev,
                      startDate: newValue && isValidDate(newValue) ? newValue.toISOString() : "",
                    }))
                  }
                  ampm={false}
                  minDateTime={new Date()}
                  maxDateTime={orderDates.endDate ? new Date(orderDates.endDate) : null}
                  format="dd/MM/yyyy HH:mm"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      className="w-full"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          backgroundColor: theme === "dark" ? "#0b0f19" : "#f8fafc",
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                          "& fieldset": { borderColor: theme === "dark" ? "#1e293b" : "#e2e8f0" },
                          "&:hover fieldset": { borderColor: theme === "dark" ? "#4f46e5" : "#6366f1" },
                          "&.Mui-focused fieldset": { borderColor: theme === "dark" ? "#4f46e5" : "#6366f1" },
                        },
                        "& .MuiInputBase-input": {
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                          padding: "10.5px 14px",
                        },
                        "& .MuiSvgIcon-root": { color: theme === "dark" ? "#64748b" : "#94a3b8" },
                      }}
                    />
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.endDate")}
                <DateTimePicker
                  value={orderDates.endDate ? new Date(orderDates.endDate) : null}
                  onChange={(newValue) =>
                    setOrderDates((prev) => ({
                      ...prev,
                      endDate: newValue && isValidDate(newValue) ? newValue.toISOString() : "",
                    }))
                  }
                  ampm={false}
                  minDateTime={orderDates.startDate ? new Date(orderDates.startDate) : new Date()}
                  format="dd/MM/yyyy HH:mm"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      className="w-full"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          backgroundColor: theme === "dark" ? "#0b0f19" : "#f8fafc",
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                          "& fieldset": { borderColor: theme === "dark" ? "#1e293b" : "#e2e8f0" },
                          "&:hover fieldset": { borderColor: theme === "dark" ? "#4f46e5" : "#6366f1" },
                          "&.Mui-focused fieldset": { borderColor: theme === "dark" ? "#4f46e5" : "#6366f1" },
                        },
                        "& .MuiInputBase-input": {
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                          padding: "10.5px 14px",
                        },
                        "& .MuiSvgIcon-root": { color: theme === "dark" ? "#64748b" : "#94a3b8" },
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </LocalizationProvider>
        </div>

        {/* Owner Groups and Items */}
        <div className="flex flex-col gap-5">
          {Object.entries(groupedCart).map(([owner, products]) => (
            <div
              key={owner}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800/85 pb-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  {t("cart.owner")}: <span className="font-extrabold text-indigo-650 dark:text-indigo-400">{owner}</span>
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-350 border border-indigo-100/40 dark:border-indigo-900/20 text-[10px] font-extrabold">
                  {products.length} {products.length !== 1 ? t("cart.items") : t("cart.item")}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {products.map((item) => {
                  const availableCount = availability[item._id];
                  const isChecking = availableCount === undefined;
                  const isOutOfStock = availableCount === 0;

                  return (
                    <div
                      key={item._id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 p-4 hover:border-slate-200 dark:hover:border-slate-700 transition"
                    >
                      {/* Product Thumbnail */}
                      <div className="flex-shrink-0">
                        {item.images?.length ? (
                          <img
                            src={`${API_BASE}/uploads/products/${item.images.find(i => i.isVisible)?.filename || item.images[0].filename}`}
                            alt={item.name}
                            className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-tr from-indigo-50 to-slate-200 dark:from-slate-850 dark:to-slate-800 flex items-center justify-center text-xl select-none">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">
                          {isChecking ? (
                            <span className="text-slate-400">{t("cart.selectDatesCheck")}</span>
                          ) : isOutOfStock ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              {t("cart.currentlyUnavailable")}
                            </span>
                          ) : (
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {t("cart.available")}: {availableCount}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between sm:justify-start gap-4 flex-shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 pt-3 sm:pt-0">
                        {/* Pill Picker */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, -1)}
                            disabled={isQuantityDisabled()}
                            className="p-1.5 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-8 text-center text-xs font-black text-slate-800 dark:text-slate-200 select-none">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, 1)}
                            disabled={isQuantityDisabled() || (!isChecking && item.quantity >= availableCount)}
                            className="p-1.5 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => askRemove(item._id, item.name)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100/30 dark:border-rose-900/30 text-rose-650 dark:text-rose-400 transition cursor-pointer"
                          title={t("cart.remove")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDEBAR – Summary Period */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-4 sticky top-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 select-none">{t("cart.summary")}</p>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {totalItems} {totalItems !== 1 ? t("cart.items") : t("cart.item")}
        </h2>

        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className="flex justify-between">
            <span>{t("cart.owners")}:</span>
            <span className="font-extrabold text-slate-850 dark:text-slate-200">{totalOwners}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{language === "pl" ? "Okres rezerwacji" : "Reservation Period"}:</span>
            {orderDates.startDate && orderDates.endDate ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-350 border border-emerald-100/40 dark:border-emerald-900/20 text-[9px] font-bold">
                <Check className="w-2.5 h-2.5" />
                {language === "pl" ? "Określono" : "Set"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[9px] font-bold">
                {language === "pl" ? "Brak" : "None"}
              </span>
            )}
          </div>

          {orderDates.startDate && orderDates.endDate && (
            <div className="text-[10px] leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 mt-1 font-mono">
              <span className="font-sans block font-bold text-slate-400 uppercase tracking-wider text-[8px] mb-1">{language === "pl" ? "Wybrany termin" : "Selected dates"}</span>
              <span>Pocz: {new Date(orderDates.startDate).toLocaleString()}</span>
              <span className="block mt-0.5">Koniec: {new Date(orderDates.endDate).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          <button
            type="button"
            onClick={() => {
              if (!orderDates.startDate || !orderDates.endDate) {
                showToast(t("cart.selectDatesAlert"), "warning");
                return;
              }
              const now = new Date();
              const start = new Date(orderDates.startDate);
              const end = new Date(orderDates.endDate);
              const bufferTime = new Date(now.getTime() - 60000);

              if (start < bufferTime) {
                showToast(t("cart.startDatePastAlert"), "error");
                return;
              }
              if (end <= start) {
                showToast(t("cart.endDateBeforeStartAlert"), "error");
                return;
              }
              setCheckoutStep(2);
            }}
            disabled={!(orderDates.startDate && orderDates.endDate)}
            className="w-full rounded-xl bg-indigo-650 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <span>{language === "pl" ? "Przejdź do danych" : "Continue to checkout"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {(!orderDates.startDate || !orderDates.endDate) && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-100/50 dark:border-amber-900/20 text-[10px] text-amber-850 dark:text-amber-300 font-semibold select-none leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{t("cart.selectDatesEnable")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Remove item confirmation dialog */}
      <ConfirmDialog
        open={removeConfirm.open}
        title={language === "pl" ? "Usuń z koszyka?" : "Remove from cart?"}
        message={
          language === "pl"
            ? `Czy na pewno chcesz usunąć "${removeConfirm.productName}" z koszyka?`
            : `Are you sure you want to remove "${removeConfirm.productName}" from the cart?`
        }
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />
    </div>
  );
};

export default CartStepItems;
