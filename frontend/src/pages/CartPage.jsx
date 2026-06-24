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
import CartStepItems from "../components/cart/CartStepItems";
import CartStepForm from "../components/cart/CartStepForm";

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
      // Navigate back to guest products so user can place more orders
      navigate("/guest-products");
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
      "text-xs border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition w-full shadow-xs";

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
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 transition cursor-pointer"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                type="button"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Language Switcher */}
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-55 dark:bg-slate-900 text-[10px] font-bold h-10 p-0.5">
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
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-105 dark:bg-slate-900 dark:hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 shadow-sm transition duration-100 cursor-pointer flex items-center gap-1.5"
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
            <CartStepItems
              cart={cart}
              groupedCart={groupedCart}
              availability={availability}
              orderDates={orderDates}
              setOrderDates={setOrderDates}
              handleQuantityChange={handleQuantityChange}
              handleRemove={handleRemove}
              isQuantityDisabled={isQuantityDisabled}
              theme={theme}
              t={t}
              language={language}
              setCheckoutStep={setCheckoutStep}
              totalItems={totalItems}
              totalOwners={totalOwners}
              showToast={showToast}
            />
          )}

          {/* STEP 2: CUSTOMER DETAILS */}
          {checkoutStep === 2 && (
            <CartStepForm
              orderCustomer={orderCustomer}
              handleCustomerChange={handleCustomerChange}
              cart={cart}
              orderDates={orderDates}
              recaptchaKey={recaptchaKey}
              recaptchaRef={recaptchaRef}
              handleCheckout={handleCheckout}
              loading={loading}
              canCheckout={canCheckout}
              setCheckoutStep={setCheckoutStep}
              t={t}
              language={language}
            />
          )}
        </div>
      </div>
    );
  };
export default CartPage;
