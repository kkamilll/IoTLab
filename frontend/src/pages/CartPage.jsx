import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import TextField from '@mui/material/TextField';

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
    endDate: ""
  });

  const navigate = useNavigate();
  const { token } = useAuth();
  const today = new Date().toISOString().split("T")[0];

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
          const res = await axios.post(
            `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/available`,
            {
              productId: item._id,
              startDate: orderDates.startDate,
              endDate: orderDates.endDate,
            }
          );
          newAvailability[item._id] = res.data.available;
        } catch {
          newAvailability[item._id] = 0;
        }
      })
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
        (field) => !orderCustomer[field] || orderCustomer[field].trim() === ""
      );

      if (missingField) {
        return alert(`Please fill in your ${missingField}!`);
      }

      // reCAPTCHA validation
      const token = recaptchaRef.current.getValue();
      if (!token) {
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
      const res = await axios.post(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/create`,
        {
          token,
          customer: orderCustomer,
          items,
          requestedStartDate: orderDates.startDate,
          requestedEndDate: orderDates.endDate,
        }
      );

      recaptchaRef.current.reset();

      alert("Order submitted and emailed!");
      setCart([]);
      localStorage.removeItem("cart");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || error.message || "Order error");
    } finally {
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

  const isQuantityDisabled = (item) => {
    // const cartItem = cart.find((c) => c._id === item._id);
    return !(orderDates?.startDate && orderDates?.endDate);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="p-6 text-center">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back
        </button>
      </div>

      <h2 className="text-3xl font-bold mb-6">Your Cart</h2>

      {Object.entries(groupedCart).map(([owner, products]) => (
        <div key={owner} className="mb-6">
          <h3 className="text-2xl font-semibold mb-2">Owner: {owner}</h3>
          <div className="space-y-4">
            {products.map((item) => (
              <div
                key={item._id}
                className="flex flex-col md:flex-row items-start justify-between p-4 border rounded gap-4"
              >
                <div className="flex items-center gap-4">
                  {item.images?.length ? (
                    <img
                      src={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/uploads/products/${item.images[0].filename}`}
                      alt={item.name}
                      className="w-20 h-20 object-contain rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded text-gray-500">
                      No Image
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold truncate overflow-hidden whitespace-nowrap max-w-[150px] sm:max-w-[200px]" title={item.name}>{item.name}</h3>
                    <p className="text-sm text-red-600">
                      {availability[item._id] === undefined
                        ? "Select dates"
                        : availability[item._id] === 0
                          ? "Product unavailable"
                          : `Available: ${availability[item._id]}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item._id, -1)}
                      className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={isQuantityDisabled(item)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item._id, 1)}
                      className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={
                        isQuantityDisabled(item) ||
                        (availability[item._id] !== undefined &&
                          item.quantity >= availability[item._id])
                      }
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemove(item._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  {/* <div className="flex flex-col md:flex-row gap-2">
                    <input
                      type="datetime-local"
                      value={item.startDate}
                      onChange={(e) =>
                        handleDateChange(item._id, "startDate", e.target.value)
                      }
                      min={today}
                      className="border p-2 rounded"
                    />
                    <input
                      type="datetime-local"
                      value={item.endDate}
                      onChange={(e) =>
                        handleDateChange(item._id, "endDate", e.target.value)
                      }
                      min={item.startDate || today}
                      className="border p-2 rounded"
                    />
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Customer info */}
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h3 className="text-2xl font-semibold mb-4">Customer Information</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">

            <div className="flex-1 flex flex-col">
              <label htmlFor="firstName" className="mb-1 font-medium text-gray-700">First Name</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={orderCustomer.firstName}
                onChange={handleCustomerChange}
                className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label htmlFor="lastName" className="mb-1 font-medium text-gray-700">Last Name</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={orderCustomer.lastName}
                onChange={handleCustomerChange}
                className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* University Info */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <label htmlFor="index" className="mb-1 font-medium text-gray-700">Index</label>
              <input
                id="index"
                type="text"
                name="index"
                value={orderCustomer.index}
                onChange={handleCustomerChange}
                className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label htmlFor="semester" className="mb-1 font-medium text-gray-700">Semester</label>
              <input
                id="semester"
                type="text"
                name="semester"
                value={orderCustomer.semester}
                onChange={handleCustomerChange}
                className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <label htmlFor="yearOfStudy" className="mb-1 font-medium text-gray-700">Year of Study</label>
              <input
                id="yearOfStudy"
                type="text"
                name="yearOfStudy"
                value={orderCustomer.yearOfStudy}
                onChange={handleCustomerChange}
                className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label htmlFor="fieldOfStudy" className="mb-1 font-medium text-gray-700">Field of Study</label>
              <input
                id="fieldOfStudy"
                type="text"
                name="fieldOfStudy"
                value={orderCustomer.fieldOfStudy}
                onChange={handleCustomerChange}
                className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <label htmlFor="specialization" className="mb-1 font-medium text-gray-700">Specialization</label>
              <input
                id="specialization"
                type="text"
                name="specialization"
                value={orderCustomer.specialization}
                onChange={handleCustomerChange}
                className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label htmlFor="phoneNumber" className="mb-1 font-medium text-gray-700">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={orderCustomer.phoneNumber}
                onChange={handleCustomerChange}
                className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 font-medium text-gray-700">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={orderCustomer.email}
              onChange={handleCustomerChange}
              className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
            />
          </div>

          {/* Purpose */}
          <div className="flex flex-col">
            <label htmlFor="purpose" className="mb-1 font-medium text-gray-700">Purpose / Notes</label>
            <textarea
              id="purpose"
              name="purpose"
              value={orderCustomer.purpose}
              onChange={handleCustomerChange}
              className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
            />
          </div>

          {/* Dates */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Start Date</label>
                <DateTimePicker
                  value={orderDates.startDate ? new Date(orderDates.startDate) : null}
                  onChange={(newValue) =>
                    setOrderDates((prev) => ({
                      ...prev,
                      startDate: newValue ? newValue.toISOString() : "",
                    }))
                  }
                  ampm={false}
                  minDateTime={new Date()}
                  maxDateTime={orderDates.endDate ? new Date(orderDates.endDate) : null}
                  renderInput={(params) => <TextField {...params} className="w-full" />}
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="mb-1 font-medium text-gray-700">End Date</label>
                <DateTimePicker
                  value={orderDates.endDate ? new Date(orderDates.endDate) : null}
                  onChange={(newValue) =>
                    setOrderDates((prev) => ({
                      ...prev,
                      endDate: newValue ? newValue.toISOString() : "",
                    }))
                  }
                  ampm={false}
                  minDateTime={orderDates.startDate ? new Date(orderDates.startDate) : new Date()}
                  renderInput={(params) => <TextField {...params} className="w-full" />}
                />
              </div>
            </div>
          </LocalizationProvider>

          {/* CAPTCHA */}
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_PUBLIC_KEY}
          />

          <button
            onClick={handleCheckout}
            className="px-6 py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600 mt-4"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;