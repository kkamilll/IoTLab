import React, { useState } from "react";
import { Calendar, User, AlertTriangle, Minus, Plus, Trash2, ArrowRight, Check, Package } from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import ConfirmDialog from "../layout/ConfirmDialog";
const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

const getImageUrl = (item) => {
  if (item?.image) {
    if (typeof item.image === "string") {
      if (item.image.startsWith("http://") || item.image.startsWith("https://")) return item.image;
      const fName = item.image.split(/[/\\]/).pop();
      return `${API_BASE}/uploads/products/${fName}`;
    }
  }
  if (!item || !item.images || !Array.isArray(item.images) || item.images.length === 0) {
    return null;
  }
  const imgObj = item.images.find((i) => i && (i.isVisible || i.visible)) || item.images[0];
  if (!imgObj) return null;

  let rawPath = "";
  if (typeof imgObj === "string") {
    rawPath = imgObj;
  } else if (typeof imgObj === "object") {
    rawPath = imgObj.filename || imgObj.path || imgObj.url || imgObj.src || imgObj.originalName || "";
  }

  if (!rawPath) return null;
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return rawPath;
  }

  const fileName = rawPath.includes("/") || rawPath.includes("\\")
    ? rawPath.split(/[/\\]/).pop()
    : rawPath;

  if (!fileName) return null;
  return `${API_BASE}/uploads/products/${fileName}`;
};

const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());

const CartStepItems = ({
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 select-none border-b border-slate-100 dark:border-slate-800 pb-3">
            <Calendar className="w-4.5 h-4.5 text-indigo-500" />
            {t("cart.dateSelection")}
          </h3>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.startDate")}
                <DatePicker
                  value={orderDates.startDate ? new Date(orderDates.startDate) : null}
                  onChange={(newValue) => {
                    if (!newValue || !isValidDate(newValue)) {
                      setOrderDates((prev) => ({ ...prev, startDate: "" }));
                      return;
                    }
                    const d = new Date(newValue);
                    d.setHours(0, 0, 0, 0);
                    setOrderDates((prev) => ({
                      ...prev,
                      startDate: d.toISOString(),
                    }));
                  }}
                  minDate={new Date()}
                  maxDate={orderDates.endDate ? new Date(orderDates.endDate) : null}
                  format="dd/MM/yyyy"
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
                <DatePicker
                  value={orderDates.endDate ? new Date(orderDates.endDate) : null}
                  onChange={(newValue) => {
                    if (!newValue || !isValidDate(newValue)) {
                      setOrderDates((prev) => ({ ...prev, endDate: "" }));
                      return;
                    }
                    const d = new Date(newValue);
                    d.setHours(23, 59, 59, 999);
                    setOrderDates((prev) => ({
                      ...prev,
                      endDate: d.toISOString(),
                    }));
                  }}
                  minDate={orderDates.startDate ? new Date(orderDates.startDate) : new Date()}
                  format="dd/MM/yyyy"
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-center shrink-0 shadow-2xs">
                    {products[0]?.owner?.profileImage ? (
                      <img
                        src={`${API_BASE}/uploads/users/${products[0].owner.profileImage}`}
                        alt={owner}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.classList.remove("hidden");
                          }
                        }}
                      />
                    ) : null}
                    <User className={`w-3.5 h-3.5 text-indigo-500/80 dark:text-indigo-400 ${products[0]?.owner?.profileImage ? "hidden" : ""}`} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/35">
                      {language === "pl" ? "Opiekun" : "Supervisor"}
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-[320px]" title={owner}>
                      {owner}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/40 dark:border-indigo-900/20 text-[10px] font-extrabold shrink-0">
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
                      <div className="flex-shrink-0 relative">
                        {(() => {
                          const imgUrl = getImageUrl(item);
                          return imgUrl ? (
                            <>
                              <img
                                src={imgUrl}
                                alt={item.name}
                                className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.nextElementSibling;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                              <div
                                className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700"
                                style={{ display: "none" }}
                              >
                                <Package className="w-6 h-6" />
                              </div>
                            </>
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                              <Package className="w-6 h-6" />
                            </div>
                          );
                        })()}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.category?.name && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.category.name}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {isChecking ? (
                              <span className="text-slate-400">{language === "pl" ? "Wybierz daty" : "Select dates"}</span>
                            ) : isOutOfStock ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                {language === "pl" ? "Brak w magazynie" : "Out of stock"}
                              </span>
                            ) : (
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                {language === "pl" ? "Dostępne:" : "Available:"} {availableCount} szt.
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between sm:justify-start gap-4 flex-shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 pt-3 sm:pt-0">
                        {/* Pill Picker */}
                        <div className="flex items-center border rounded-xl overflow-hidden qty-stepper-active transition-all duration-200">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, -1)}
                            disabled={item.quantity <= 1}
                            className="qty-stepper-btn"
                            title={language === "pl" ? "Zmniejsz ilość" : "Decrease quantity"}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="qty-stepper-val">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, 1)}
                            disabled={!isChecking && availableCount !== undefined && item.quantity >= availableCount}
                            className="qty-stepper-btn"
                            title={language === "pl" ? "Zwiększ ilość" : "Increase quantity"}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => askRemove(item._id, item.name)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100/30 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 transition cursor-pointer"
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
            <span className="font-extrabold text-slate-900 dark:text-slate-200">{totalOwners}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{language === "pl" ? "Okres rezerwacji" : "Reservation Period"}:</span>
            {orderDates.startDate && orderDates.endDate ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100/40 dark:border-emerald-900/20 text-[9px] font-bold">
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
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                {new Date(orderDates.startDate).toLocaleDateString()} → {new Date(orderDates.endDate).toLocaleDateString()}
              </span>
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
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <span>{language === "pl" ? "Przejdź do danych" : "Continue to checkout"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {(!orderDates.startDate || !orderDates.endDate) && (
            <div className="flex items-center gap-2 bg-amber-50/70 dark:bg-amber-950/25 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 font-medium select-none">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{language === "pl" ? "Wybierz daty, aby kontynuować" : "Select dates to proceed"}</span>
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
