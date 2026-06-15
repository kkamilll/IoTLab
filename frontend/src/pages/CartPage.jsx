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

const phoneRegex = /^\d{9,10}$/;
const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [availability, setAvailability] = useState({});
  const [orderCustomer, setOrderCustomer] = useState({
    firstName: "",
    lastName: "",
    index: "",
    semester: "",
    yearOfStudy: "",
    fieldOfStudy: "",
    specialization: "",
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
        showToast(language === "pl" ? "Twój koszyk jest pusty!" : "Your cart is empty!", "warning");
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
        showToast(
          language === "pl"
            ? `Proszę wypełnić pole: ${fieldLabel}!`
            : `Please fill in your ${fieldLabel}!`,
          "warning"
        );
        return;
      }

      // reCAPTCHA validation when configured
      const captchaToken = recaptchaKey ? recaptchaRef.current?.getValue() : null;
      if (recaptchaKey && !captchaToken) {
        showToast(
          language === "pl" ? "Proszę zweryfikować, że nie jesteś robotem!" : "Please verify that you are human!",
          "warning"
        );
        return;
      }

      if (orderCustomer.phoneNumber && !phoneRegex.test(orderCustomer.phoneNumber)) {
        showToast(
          language === "pl" ? "Numer telefonu musi składać się z 9–10 cyfr" : "Phone number must be 9–10 digits",
          "error"
        );
        return;
      }

      const indexRegex = /^\d{6}$/;
      if (orderCustomer.index && !indexRegex.test(orderCustomer.index)) {
        showToast(
          language === "pl" ? "Numer indeksu musi składać się z dokładnie 6 cyfr" : "Index must be exactly 6 digits",
          "error"
        );
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (orderCustomer.email && !emailRegex.test(orderCustomer.email)) {
        showToast(
          language === "pl" ? "Proszę podać poprawny adres e-mail" : "Please enter a valid email address",
          "error"
        );
        return;
      }

      if (!orderDates.startDate || !orderDates.endDate) {
        showToast(
          language === "pl"
            ? "Proszę wybrać datę rozpoczęcia i zakończenia zamówienia!"
            : "Please select start and end dates for the order!",
          "warning"
        );
        return;
      }

      const now = new Date();
      const start = new Date(orderDates.startDate);
      const end = new Date(orderDates.endDate);
      const bufferTime = new Date(now.getTime() - 60000);

      if (start < bufferTime) {
        showToast(
          language === "pl" ? "Data rozpoczęcia nie może być w przeszłości!" : "Start date cannot be in the past!",
          "error"
        );
        return;
      }
      if (end <= start) {
        showToast(
          language === "pl" ? "Data zakończenia musi być po dacie rozpoczęcia!" : "End date must be after start date!",
          "error"
        );
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

      showToast(
        language === "pl" ? "Zamówienie zostało złożone i wysłane e-mailem!" : "Order submitted and emailed!",
        "success"
      );
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 flex flex-col justify-center items-center gap-4 transition-colors duration-300">
        <div className="text-6xl mb-2">🛒</div>
        <h2 className="text-2xl font-bold">{t("cart.emptyTitle")}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md text-center">{t("cart.subtitle")}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:bg-indigo-700 transition cursor-pointer"
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
    "rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors duration-300 w-full";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl">

        {/* Header toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">{t("cart.title")}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("cart.subtitle")}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-200 transition-colors cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              type="button"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m14.071-5.071l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white/50 dark:bg-slate-800 text-xs font-bold h-10">
              <button
                onClick={() => setLanguage("pl")}
                className={`px-3 h-full uppercase transition-colors cursor-pointer ${language === "pl" ? "bg-indigo-600 text-white" : "text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                type="button"
              >PL</button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 h-full uppercase transition-colors cursor-pointer ${language === "en" ? "bg-indigo-600 text-white" : "text-slate-555 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                type="button"
              >EN</button>
            </div>

            <button
              onClick={() => navigate("/")}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-750 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {t("common.backToHome")}
            </button>
          </div>
        </div>

        {/* Main layout: left = items, right = sticky form */}
        <div className="grid gap-6 xl:grid-cols-[1fr_420px] items-start">

          {/* LEFT – Cart Items */}
          <div className="space-y-5">
            {/* Cart Summary */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{t("cart.summary")}</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {totalItems} {totalItems !== 1 ? t("cart.items") : t("cart.item")}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 px-3 py-1">
                  {t("cart.owners")}: {totalOwners}
                </span>
                <span className={`rounded-full border px-3 py-1 font-medium ${orderDates.startDate && orderDates.endDate ? "border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800"}`}>
                  {t("cart.datesSelected")}:{" "}
                  {orderDates.startDate && orderDates.endDate
                    ? (language === "pl" ? "✓ Tak" : "✓ Yes")
                    : (language === "pl" ? "Nie" : "No")}
                </span>
              </div>
            </div>

            {/* Owner Groups */}
            {Object.entries(groupedCart).map(([owner, products]) => (
              <div
                key={owner}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-5 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-slate-400">👤</span>
                    {t("cart.owner")}: {owner}
                  </h3>
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                    {products.length} {products.length !== 1 ? t("cart.items") : t("cart.item")}
                  </span>
                </div>

                <div className="space-y-3">
                  {products.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4"
                    >
                      {/* Product image / placeholder */}
                      <div className="flex-shrink-0">
                        {item.images?.length ? (
                          <img
                            src={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/uploads/products/${item.images[0].filename}`}
                            alt={item.name}
                            className="h-20 w-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-slate-200 dark:from-indigo-900/40 dark:to-slate-800 flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {availability[item._id] === undefined
                            ? t("cart.selectDatesCheck")
                            : availability[item._id] === 0
                              ? <span className="text-red-500">{t("cart.currentlyUnavailable")}</span>
                              : `${t("cart.available")}: ${availability[item._id]}`}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                          <button
                            onClick={() => handleQuantityChange(item._id, -1)}
                            className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer text-lg leading-none"
                            disabled={isQuantityDisabled()}
                          >−</button>
                          <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item._id, 1)}
                            className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer text-lg leading-none"
                            disabled={
                              isQuantityDisabled() ||
                              (availability[item._id] !== undefined && item.quantity >= availability[item._id])
                            }
                          >+</button>
                        </div>
                        <button
                          onClick={() => handleRemove(item._id)}
                          className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition cursor-pointer"
                          title={t("cart.remove")}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT – Sticky Form Panel */}
          <div className="xl:sticky xl:top-6 space-y-4">

            {/* Order Preview */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">{t("cart.orderDetails")}</h3>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-350">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("cart.email")}:</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
                    {orderCustomer.email || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("cart.phoneNumber")}:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{orderCustomer.phoneNumber || "—"}</span>
                </div>
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  {orderDates.startDate && orderDates.endDate
                    ? `📅 ${new Date(orderDates.startDate).toLocaleString()} → ${new Date(orderDates.endDate).toLocaleString()}`
                    : (language === "pl" ? "Brak wybranych dat" : "No dates selected")}
                </div>
              </div>
            </div>

            {/* Customer Form */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{t("cart.customerInfo")}</h3>
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.firstName")}
                    <input name="firstName" value={orderCustomer.firstName} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.lastName")}
                    <input name="lastName" value={orderCustomer.lastName} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.phoneNumber")}
                    <input name="phoneNumber" value={orderCustomer.phoneNumber} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.email")}
                    <input name="email" type="email" value={orderCustomer.email} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.studentIndex")}
                    <input name="index" value={orderCustomer.index} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.fieldOfStudy")}
                    <input name="fieldOfStudy" value={orderCustomer.fieldOfStudy} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.yearOfStudy")}
                    <input name="yearOfStudy" type="number" min="1" max="7" value={orderCustomer.yearOfStudy} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.semester")}
                    <input name="semester" type="number" min="1" max="14" value={orderCustomer.semester} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("cart.specialization")}
                    <input name="specialization" value={orderCustomer.specialization} onChange={handleCustomerChange} className={inputClass} />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {t("cart.purpose")}
                  <textarea
                    name="purpose"
                    value={orderCustomer.purpose}
                    onChange={handleCustomerChange}
                    rows={3}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            {/* Date Picker */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{t("cart.dateSelection")}</h3>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <div className="grid gap-4">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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
                              borderRadius: "1rem",
                              backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
                              color: theme === "dark" ? "#f8fafc" : "#0f172a",
                              "& fieldset": { borderColor: theme === "dark" ? "#334155" : "#cbd5e1" },
                              "&:hover fieldset": { borderColor: theme === "dark" ? "#6366f1" : "#3b82f6" },
                              "&.Mui-focused fieldset": { borderColor: theme === "dark" ? "#6366f1" : "#3b82f6" },
                            },
                            "& .MuiInputBase-input": { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
                            "& .MuiSvgIcon-root": { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                          }}
                        />
                      )}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
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
                              borderRadius: "1rem",
                              backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
                              color: theme === "dark" ? "#f8fafc" : "#0f172a",
                              "& fieldset": { borderColor: theme === "dark" ? "#334155" : "#cbd5e1" },
                              "&:hover fieldset": { borderColor: theme === "dark" ? "#6366f1" : "#3b82f6" },
                              "&.Mui-focused fieldset": { borderColor: theme === "dark" ? "#6366f1" : "#3b82f6" },
                            },
                            "& .MuiInputBase-input": { color: theme === "dark" ? "#f8fafc" : "#0f172a" },
                            "& .MuiSvgIcon-root": { color: theme === "dark" ? "#94a3b8" : "#64748b" },
                          }}
                        />
                      )}
                    />
                  </label>
                </div>
              </LocalizationProvider>
            </div>

            {/* Submit Card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{t("cart.verification")}</h3>
              <div className="flex flex-col gap-4">
                {recaptchaKey ? (
                  <ReCAPTCHA ref={recaptchaRef} sitekey={recaptchaKey} />
                ) : (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                    {t("cart.recaptchaNotConfigured")}
                  </div>
                )}
                <button
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3.5 text-base font-bold text-white shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("cart.placingOrder")}
                    </span>
                  ) : t("cart.placeOrder")}
                </button>
                {(!orderDates.startDate || !orderDates.endDate) && (
                  <p className="text-xs text-slate-500 dark:text-slate-450 text-center">{t("cart.selectDatesEnable")}</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
