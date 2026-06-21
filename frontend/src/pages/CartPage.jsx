import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import TextField from "@mui/material/TextField";

import ReCAPTCHA from "react-google-recaptcha";
import { Calendar, User, ArrowLeft, ArrowRight, Trash2, Plus, Minus, Check, ShoppingCart, Moon, Sun, AlertTriangle, Info, HelpCircle } from "lucide-react";

const phoneRegex = /^\d{9,10}$/;
const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Items & Dates, 2 = Customer details
  const [availability, setAvailability] = useState({});
  const [orderCustomer, setOrderCustomer] = useState({
    firstName: "",
    lastName: "",
    index: "",
    semester: "",
    yearOfStudy: "",
    fieldOfStudy: "",
    phoneNumber: "",
    email: "",
    purpose: "",
    notes: "",
  });

  const [orderDates, setOrderDates] = useState({
    startDate: "",
    endDate: "",
  });

  const navigate = useNavigate();
  const { token } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_PUBLIC_KEY;

  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef(null);

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    const enriched = storedCart.map((item) => ({
      ...item,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
    }));
    setCart(enriched);
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleQuantityChange = (productId, delta) => {
    const newCart = cart.map((item) => {
      if (item._id === productId) {
        const maxAvailable = availability[item._id] ?? Infinity;
        let newQuantity = item.quantity + delta;
        if (newQuantity > maxAvailable) newQuantity = maxAvailable;
        if (newQuantity < 1) newQuantity = 1;
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart(newCart);
  };

  const handleRemove = (productId) => {
    const newCart = cart.filter((item) => item._id !== productId);
    updateCart(newCart);
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setOrderCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const updateAvailability = async () => {
    if (!orderDates.startDate || !orderDates.endDate) return;

    const newAvailability = {};
    await Promise.all(
      cart.map(async (item) => {
        try {
          const res = await apiClient.post("/products/available", {
            productId: item._id,
            startDate: orderDates.startDate,
            endDate: orderDates.endDate,
          });
          newAvailability[item._id] = res.data.available;
        } catch {
          newAvailability[item._id] = 0;
        }
      }),
    );
    setAvailability(newAvailability);
  };

  useEffect(() => {
    updateAvailability();
  }, [cart, orderDates]);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      if (!cart.length) {
        showToast(t("cart.emptyAlert"), "warning");
        return;
      }

      const requiredFields = [
        "firstName", "lastName", "index", "semester",
        "yearOfStudy", "fieldOfStudy", "phoneNumber", "email", "purpose",
      ];

      const missingField = requiredFields.find(
        (field) => !orderCustomer[field] || orderCustomer[field].trim() === "",
      );

      if (missingField) {
        const fieldLabel = t(`cart.${missingField}`) || missingField;
        showToast(t("cart.fillField", { field: fieldLabel }), "warning");
        return;
      }

      // reCAPTCHA validation when configured
      const captchaToken = recaptchaKey ? recaptchaRef.current?.getValue() : null;
      if (recaptchaKey && !captchaToken) {
        showToast(t("cart.recaptchaAlert"), "warning");
        return;
      }

      if (orderCustomer.phoneNumber && !phoneRegex.test(orderCustomer.phoneNumber)) {
        showToast(t("cart.phoneDigitsAlert"), "error");
        return;
      }

      const indexRegex = /^\d{6}$/;
      if (orderCustomer.index && !indexRegex.test(orderCustomer.index)) {
        showToast(t("cart.indexDigitsAlert"), "error");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (orderCustomer.email && !emailRegex.test(orderCustomer.email)) {
        showToast(t("cart.emailValidAlert"), "error");
        return;
      }

      const year = parseInt(orderCustomer.yearOfStudy, 10);
      if (isNaN(year) || year < 1 || year > 7) {
        showToast(
          language === "pl"
            ? "Rok studiów musi być liczbą od 1 do 7."
            : "Year of study must be a number between 1 and 7.",
          "error"
        );
        return;
      }

      const sem = parseInt(orderCustomer.semester, 10);
      if (isNaN(sem) || sem < 1 || sem > 14) {
        showToast(
          language === "pl"
            ? "Semestr musi być liczbą od 1 do 14."
            : "Semester must be a number between 1 and 14.",
          "error"
        );
        return;
      }

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

      const items = cart.map((item) => ({
        product: item._id,
        requestedQuantity: item.quantity,
      }));

      await apiClient.post("/orders/create", {
        token: captchaToken || "",
        customer: orderCustomer,
        items,
        requestedStartDate: orderDates.startDate,
        requestedEndDate: orderDates.endDate,
      });

      showToast(t("cart.orderSuccessAlert"), "success");
      setCart([]);
      localStorage.removeItem("cart");
      navigate("/");
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || error.message || "Order error", "error");
    } finally {
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setLoading(false);
    }
  };

  if (!cart.length) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-6 flex flex-col justify-center items-center gap-4 transition-colors duration-300">
          <div className="text-6xl mb-2 select-none animate-bounce">🛒</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t("cart.emptyTitle")}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md text-center leading-relaxed">{t("cart.subtitle")}</p>
          <button
            onClick={() => navigate(token ? "/admin-dashboard/products" : "/guest-products")}
            className="mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
          >
            {t("cart.back")}
          </button>
        </div>
      );
    }

    const groupByOwner = (cartItems) =>
      cartItems.reduce((acc, item) => {
        const ownerName = item.owner?.name ?? "No Owner";
        if (!acc[ownerName]) acc[ownerName] = [];
        acc[ownerName].push(item);
        return acc;
      }, {});

    const groupedCart = groupByOwner(cart);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalOwners = Object.keys(groupedCart).length;
    const canCheckout = cart.length > 0 && orderDates.startDate && orderDates.endDate && !loading;

    const isQuantityDisabled = () => !(orderDates?.startDate && orderDates?.endDate);

    const inputClass =
      "text-xs border border-slate-205 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-955/40 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition w-full shadow-xs";

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-7xl flex flex-col gap-6">

          {/* Header Toolbar */}
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition duration-200">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">{t("cart.title")}</h1>
              <p className="mt-1 text-xs text-slate-550 dark:text-slate-400">{t("cart.subtitle")}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 transition cursor-pointer"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                type="button"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Language Switcher */}
              <div className="flex items-center rounded-xl border border-slate-205 dark:border-slate-800 overflow-hidden bg-slate-55 dark:bg-slate-900 text-[10px] font-bold h-10 p-0.5">
                <button
                  onClick={() => setLanguage("pl")}
                  className={`px-3 h-full uppercase transition rounded-lg cursor-pointer font-extrabold ${language === "pl" ? "bg-indigo-650 text-white shadow-xs" : "text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"}`}
                  type="button"
                >PL</button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 h-full uppercase transition rounded-lg cursor-pointer font-extrabold ${language === "en" ? "bg-indigo-650 text-white shadow-xs" : "text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"}`}
                  type="button"
                >EN</button>
              </div>

              <button
                onClick={() => navigate(-1)}
                className="rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50 hover:bg-slate-105 dark:bg-slate-900 dark:hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 shadow-sm transition duration-150 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("common.back")}
              </button>
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="mb-4 max-w-md mx-auto relative px-4 select-none w-full">
            {/* Progress Line */}
            <div className="absolute top-[17px] left-12 right-12 h-0.5 bg-slate-200 dark:bg-slate-800 z-0">
              <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: checkoutStep === 2 ? "100%" : "0%" }}></div>
            </div>

            <div className="flex justify-between items-center relative z-10 w-full">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 shadow-sm border ${checkoutStep >= 1
                    ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/10"
                    : "bg-slate-105 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}>
                  {checkoutStep > 1 ? <Check className="w-4 h-4" /> : "1"}
                </div>
                <span className={`text-[9px] uppercase font-black tracking-wider mt-2 transition ${checkoutStep === 1 ? "text-indigo-650 dark:text-indigo-400" : "text-slate-400 dark:text-slate-550"
                  }`}>
                  {language === "pl" ? "Koszyk i Termin" : "Cart & Date"}
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 shadow-sm border ${checkoutStep >= 2
                    ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/10"
                    : "bg-slate-105 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}>
                  {checkoutStep > 2 ? <Check className="w-4 h-4" /> : "2"}
                </div>
                <span className={`text-[9px] uppercase font-black tracking-wider mt-2 transition ${checkoutStep === 2 ? "text-indigo-650 dark:text-indigo-400" : "text-slate-400 dark:text-slate-550"
                  }`}>
                  {language === "pl" ? "Dane klienta" : "Customer details"}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 1: ITEMS & DATES */}
          {checkoutStep === 1 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
              {/* LEFT – Dates Selection & Cart Items */}
              <div className="flex flex-col gap-6">
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-805/85 pb-3">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {t("cart.owner")}: <span className="font-extrabold text-indigo-650 dark:text-indigo-400">{owner}</span>
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-350 border border-indigo-150/40 dark:border-indigo-900/20 text-[10px] font-extrabold">
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
                              className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-805/60 bg-slate-50/50 dark:bg-slate-955/20 p-4 hover:border-slate-200 dark:hover:border-slate-750 transition"
                            >
                              {/* Product Thumbnail */}
                              <div className="flex-shrink-0">
                                {item.images?.length ? (
                                  <img
                                    src={`${API_BASE}/uploads/products/${item.images.find(i => i.isVisible)?.filename || item.images[0].filename}`}
                                    alt={item.name}
                                    className="h-16 w-16 rounded-xl object-cover border border-slate-205 dark:border-slate-750"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-xl bg-gradient-to-tr from-indigo-50 to-slate-205 dark:from-slate-850 dark:to-slate-800 flex items-center justify-center text-xl select-none">
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
                                    <span className="text-rose-600 dark:text-rose-455 font-bold flex items-center gap-1">
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
                                <div className="flex items-center border border-slate-200 dark:border-slate-750 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
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
                                  onClick={() => handleRemove(item._id)}
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-955/40 border border-rose-150/30 dark:border-rose-900/30 text-rose-650 dark:text-rose-455 transition cursor-pointer"
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
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-350 border border-emerald-150/40 dark:border-emerald-900/20 text-[9px] font-bold">
                        <Check className="w-2.5 h-2.5" />
                        {language === "pl" ? "Określono" : "Set"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-805 text-slate-500 dark:text-slate-400 border border-slate-205 dark:border-slate-750 text-[9px] font-bold">
                        {language === "pl" ? "Brak" : "None"}
                      </span>
                    )}
                  </div>

                  {orderDates.startDate && orderDates.endDate && (
                    <div className="text-[10px] leading-relaxed bg-slate-50 dark:bg-slate-955/40 p-3 rounded-xl border border-slate-100 dark:border-slate-805 text-slate-500 dark:text-slate-400 mt-1 font-mono">
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
            </div>
          )}

          {/* STEP 2: CUSTOMER DETAILS */}
          {checkoutStep === 2 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
              {/* LEFT – Customer Form & Items Recap */}
              <div className="flex flex-col gap-6">
                {/* Customer Details Form */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-4 flex items-center gap-2 select-none border-b border-slate-100 dark:border-slate-805/85 pb-3">
                    <User className="w-4.5 h-4.5 text-indigo-500" />
                    {t("cart.customerInfo")}
                  </h3>
                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.firstName")}
                        <input name="firstName" value={orderCustomer.firstName} onChange={handleCustomerChange} className={inputClass} placeholder="np. Jan" required />
                      </label>
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.lastName")}
                        <input name="lastName" value={orderCustomer.lastName} onChange={handleCustomerChange} className={inputClass} placeholder="np. Kowalski" required />
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.phoneNumber")}
                        <input name="phoneNumber" value={orderCustomer.phoneNumber} onChange={handleCustomerChange} className={inputClass} placeholder="np. 500600700" required />
                      </label>
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.email")}
                        <input name="email" type="email" value={orderCustomer.email} onChange={handleCustomerChange} className={inputClass} placeholder="np. student@uczelnia.pl" required />
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.studentIndex")}
                        <input name="index" value={orderCustomer.index} onChange={handleCustomerChange} className={inputClass} placeholder="np. 123456" required />
                      </label>
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.fieldOfStudy")}
                        <input name="fieldOfStudy" value={orderCustomer.fieldOfStudy} onChange={handleCustomerChange} className={inputClass} placeholder="np. Informatyka" required />
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.yearOfStudy")}
                        <input name="yearOfStudy" type="number" min="1" max="7" value={orderCustomer.yearOfStudy} onChange={handleCustomerChange} className={inputClass} placeholder="np. 3" required />
                      </label>
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.semester")}
                        <input name="semester" type="number" min="1" max="14" value={orderCustomer.semester} onChange={handleCustomerChange} className={inputClass} placeholder="np. 5" required />
                      </label>
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("cart.specialization")}
                        <input name="specialization" value={orderCustomer.specialization} onChange={handleCustomerChange} className={inputClass} placeholder="np. IoT" />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t("cart.purpose")}
                      <textarea
                        name="purpose"
                        value={orderCustomer.purpose}
                        onChange={handleCustomerChange}
                        rows={3}
                        className="text-xs border border-slate-205 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-955/40 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition w-full resize-none shadow-xs"
                        placeholder="Podaj cel rezerwacji / przeznaczenie wypożyczanego sprzętu..."
                        required
                      />
                    </label>
                  </div>
                </div>

                {/* Items Recap */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white border-b border-slate-105 dark:border-slate-805 pb-3 flex items-center gap-2 select-none">
                    <span>📦</span> {language === "pl" ? "Przegląd rezerwowanych obiektów" : "Selected items review"}
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-805/85">
                    {cart.map((item) => (
                      <div key={item._id} className="py-2.5 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                        <span className="font-mono font-extrabold text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-450 select-none">
                          {item.quantity} szt.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR – Recap, Recaptcha & checkout button */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-4 sticky top-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 select-none">{t("cart.orderDetails")}</h3>

                <div className="flex flex-col gap-3 text-xs font-semibold text-slate-650 dark:text-slate-350 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{language === "pl" ? "Osoba" : "Customer"}:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]">
                      {orderCustomer.firstName || orderCustomer.lastName ? `${orderCustomer.firstName} ${orderCustomer.lastName}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{t("cart.email")}:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]" title={orderCustomer.email}>
                      {orderCustomer.email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">{t("cart.studentIndex")}:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{orderCustomer.index || "—"}</span>
                  </div>

                  <div className="text-[10px] leading-relaxed bg-slate-50 dark:bg-slate-955/40 p-3 rounded-xl border border-slate-100 dark:border-slate-805 text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    <span className="font-sans block font-bold text-slate-400 uppercase tracking-wider text-[8px] mb-1">{language === "pl" ? "Wybrany termin" : "Selected dates"}</span>
                    <span>Pocz: {new Date(orderDates.startDate).toLocaleString()}</span>
                    <span className="block mt-0.5">Koniec: {new Date(orderDates.endDate).toLocaleString()}</span>
                  </div>
                </div>

                {/* Bot / Human verification */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider select-none">{t("cart.verification")}</span>
                  {recaptchaKey ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 flex justify-center scale-90 sm:scale-100 origin-center shadow-inner">
                      <ReCAPTCHA ref={recaptchaRef} sitekey={recaptchaKey} />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-955/10 p-3 text-[10px] text-amber-800 dark:text-amber-350 font-semibold select-none leading-relaxed italic">
                      {t("cart.recaptchaNotConfigured")}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={handleCheckout}
                    disabled={loading || !canCheckout}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 py-3.5 text-xs font-extrabold text-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t("cart.placingOrder")}
                      </span>
                    ) : (
                      <span>{t("cart.placeOrder")}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="w-full rounded-xl border border-slate-205 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition duration-150 cursor-pointer text-center"
                  >
                    {language === "pl" ? "← Wstecz do koszyka" : "← Back to cart"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
export default CartPage;
