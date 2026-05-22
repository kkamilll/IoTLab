import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import TextField from "@mui/material/TextField";

import ReCAPTCHA from "react-google-recaptcha";

const phoneRegex = /^\d{9,10}$/;

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
  const today = new Date().toISOString().split("T")[0];
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
    // if (recaptchaRef.current) recaptchaRef.current.reset();
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
      // Check if cart is empty
      if (!cart.length) return alert("Your cart is empty!");

      // Validate required customer fields
      const requiredFields = [
        "firstName",
        //"lastName",
        //"index",
        //"semester",
        //"yearOfStudy",
        //"fieldOfStudy",
        //"specialization",
        //"phoneNumber",
        "email",
        "purpose",
      ];

      const missingField = requiredFields.find(
        (field) => !orderCustomer[field] || orderCustomer[field].trim() === "",
      );

      if (missingField) {
        return alert(`Please fill in your ${missingField}!`);
      }

      // reCAPTCHA validation when configured
      const token = recaptchaKey ? recaptchaRef.current?.getValue() : null;
      if (recaptchaKey && !token) {
        alert("Please verify that you are human!");
        return;
      }

      if (phoneRegex) {
        if (!phoneRegex.test(orderCustomer.phoneNumber)) {
          return alert("Phone number must be 9–10 digits");
        }
      }

      // Date validation
      if (!orderDates.startDate || !orderDates.endDate)
        return alert("Please select start and end dates for the order!");
      if (orderDates.startDate > orderDates.endDate)
        return alert("Start date cannot be after end date!");

      // Prepare items
      const items = cart.map((item) => ({
        product: item._id,
        requestedQuantity: item.quantity,
      }));

      // Send order to backend
      const res = await apiClient.post("/orders/create", {
        token: token || "",
        customer: orderCustomer,
        items,
        requestedStartDate: orderDates.startDate,
        requestedEndDate: orderDates.endDate,
      });

      alert("Order submitted and emailed!");
      setCart([]);
      localStorage.removeItem("cart");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || error.message || "Order error");
    } finally {
      recaptchaRef.current.reset();
      setLoading(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back
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
  const canCheckout =
    cart.length > 0 && orderDates.startDate && orderDates.endDate && !loading;

  const isQuantityDisabled = (item) => {
    return !(orderDates?.startDate && orderDates?.endDate);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Your Cart</h1>
            <p className="mt-2 text-sm text-slate-500">
              Review selected objects, choose rental dates, and submit an order.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 transition"
          >
            Back to Home
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                    Cart Summary
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    Owners: {totalOwners}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    Dates selected:{" "}
                    {orderDates.startDate && orderDates.endDate ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {Object.entries(groupedCart).map(([owner, products]) => (
              <div
                key={owner}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Owner: {owner}
                  </h3>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {products.length} object{products.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-4">
                  {products.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        {item.images?.length ? (
                          <img
                            src={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/uploads/products/${item.images[0].filename}`}
                            alt={item.name}
                            className="h-24 w-24 rounded-3xl object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-200 text-slate-500">
                            No Image
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3
                            className="truncate text-lg font-semibold text-slate-900"
                            title={item.name}
                          >
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {availability[item._id] === undefined
                              ? "Select dates to check availability"
                              : availability[item._id] === 0
                                ? "Currently unavailable"
                                : `Available: ${availability[item._id]}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:items-end">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item._id, -1)}
                            className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isQuantityDisabled(item)}
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] text-center text-lg font-semibold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item._id, 1)}
                            className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={
                              isQuantityDisabled(item) ||
                              (availability[item._id] !== undefined &&
                                item.quantity >= availability[item._id])
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item._id)}
                          className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Order Details
              </h3>
              <div className="space-y-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Email:</span>{" "}
                  {orderCustomer.email || "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Phone:</span>{" "}
                  {orderCustomer.phoneNumber || "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">
                    Requested dates:
                  </span>{" "}
                  {orderDates.startDate && orderDates.endDate
                    ? `${new Date(orderDates.startDate).toLocaleString()} → ${new Date(orderDates.endDate).toLocaleString()}`
                    : "Not selected"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Purpose:</span>{" "}
                  {orderCustomer.purpose || "No purpose entered"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Customer Information
              </h3>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span>First Name</span>
                    <input
                      name="firstName"
                      value={orderCustomer.firstName}
                      onChange={handleCustomerChange}
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span>Last Name</span>
                    <input
                      name="lastName"
                      value={orderCustomer.lastName}
                      onChange={handleCustomerChange}
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span>Phone Number</span>
                    <input
                      name="phoneNumber"
                      value={orderCustomer.phoneNumber}
                      onChange={handleCustomerChange}
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span>Email</span>
                    <input
                      name="email"
                      type="email"
                      value={orderCustomer.email}
                      onChange={handleCustomerChange}
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  <span>Purpose / Notes</span>
                  <textarea
                    name="purpose"
                    value={orderCustomer.purpose}
                    onChange={handleCustomerChange}
                    rows={4}
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Date Selection
              </h3>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <div className="grid gap-4">
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span>Start Date</span>
                    <DateTimePicker
                      value={
                        orderDates.startDate
                          ? new Date(orderDates.startDate)
                          : null
                      }
                      onChange={(newValue) =>
                        setOrderDates((prev) => ({
                          ...prev,
                          startDate: newValue ? newValue.toISOString() : "",
                        }))
                      }
                      ampm={false}
                      minDateTime={new Date()}
                      maxDateTime={
                        orderDates.endDate ? new Date(orderDates.endDate) : null
                      }
                      format="dd/MM/yyyy HH:mm"
                      renderInput={(params) => (
                        <TextField {...params} className="w-full" />
                      )}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    <span>End Date</span>
                    <DateTimePicker
                      value={
                        orderDates.endDate ? new Date(orderDates.endDate) : null
                      }
                      onChange={(newValue) =>
                        setOrderDates((prev) => ({
                          ...prev,
                          endDate: newValue ? newValue.toISOString() : "",
                        }))
                      }
                      ampm={false}
                      minDateTime={
                        orderDates.startDate
                          ? new Date(orderDates.startDate)
                          : new Date()
                      }
                      format="dd/MM/yyyy HH:mm"
                      renderInput={(params) => (
                        <TextField {...params} className="w-full" />
                      )}
                    />
                  </label>
                </div>
              </LocalizationProvider>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                Verification
              </h3>
              <div className="flex flex-col gap-4">
                {recaptchaKey ? (
                  <ReCAPTCHA ref={recaptchaRef} sitekey={recaptchaKey} />
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    reCAPTCHA is not configured for this environment, so human
                    verification is skipped.
                  </div>
                )}
                <button
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className="w-full rounded-2xl bg-green-600 px-5 py-3 text-base font-semibold text-white shadow-lg hover:bg-green-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Placing order..." : "Place Order"}
                </button>
                {!orderDates.startDate || !orderDates.endDate ? (
                  <p className="text-sm text-slate-500">
                    Select start and end dates to enable checkout.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
