import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import TextField from '@mui/material/TextField';

import ReCAPTCHA from "react-google-recaptcha";

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [availability, setAvailability] = useState({});
  const [orderCustomer, setOrderCustomer] = useState({
    name: "",
    email: "",
    index: "",
  });
  const [orderDates, setOrderDates] = useState({
    startDate: "",
    endDate: ""
  });


  // CAPTCHA states
  // const [captchaText, setCaptchaText] = useState("");
  // const [captchaInput, setCaptchaInput] = useState("");

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

  // const handleDateChange = (productId, field, value) => {
  //   const newCart = cart.map((item) =>
  //     item._id === productId ? { ...item, [field]: value } : item
  //   );
  //   updateCart(newCart);
  // };

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
    // if (recaptchaRef.current) recaptchaRef.current.reset();
  }, [cart, orderDates]);

  // CAPTCHA
  // const generateCaptcha = () => {
  //   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; // ABCDEFGHJKLMNPQRSTUVWXYZ23456789
  //   let text = "";
  //   for (let i = 0; i < 5; i++) {
  //     text += chars.charAt(Math.floor(Math.random() * chars.length));
  //   }
  //   setCaptchaText(text);
  // };

  // const drawCaptcha = () => {
  //   const canvas = document.getElementById("captchaCanvas");
  //   if (!canvas) return;
  //   const ctx = canvas.getContext("2d");
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   ctx.fillStyle = "#f2f2f2";
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);
  //   ctx.font = "30px Arial";
  //   ctx.fillStyle = "#000";
  //   ctx.fillText(captchaText, 10, 35);

  //   for (let i = 0; i < 5; i++) {
  //     ctx.strokeStyle = `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`;
  //     ctx.beginPath();
  //     ctx.moveTo(Math.random()*150, Math.random()*50);
  //     ctx.lineTo(Math.random()*150, Math.random()*50);
  //     ctx.stroke();
  //   }
  // };

  // useEffect(() => generateCaptcha(), []);
  // useEffect(() => drawCaptcha(), [captchaText]);

  const handleCheckout = async () => {
    setLoading(true);
    // console.log("token: ", recaptchaRef.current.getValue(), typeof recaptchaRef.current.getValue());

    try {
      if (!cart.length) return alert("Your cart is empty!");
      if (!orderCustomer.email || !orderCustomer.name || !orderCustomer.index)
        return alert("Please fill in your contact information!");
      // if (captchaInput.toUpperCase() !== captchaText)
      //   return alert("Invalid CAPTCHA!");

      const token = recaptchaRef.current.getValue();

      if (!token) {
        alert("Please verify that you are human!");
        return;
      }

      if (!orderDates.startDate || !orderDates.endDate)
        return alert("Please select start and end dates for the order!");
      if (orderDates.startDate > orderDates.endDate)
        return alert("Start date cannot be after end date!");

      const items = cart.map((item) => ({
        product: item._id,
        requestedQuantity: item.quantity,
      }));


      const res = await axios.post(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/create`,
        { token, customer: orderCustomer, items, requestedStartDate: orderDates.startDate, requestedEndDate: orderDates.endDate }
      );

      recaptchaRef.current.reset();

      const orderId = res.data.order._id;
      await axios.post(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/send-order-email`,
        { orderId }
      );

      alert("Order submitted and emailed!");
      setCart([]);
      localStorage.removeItem("cart");
      // setCaptchaInput("");
      // generateCaptcha();
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
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={orderCustomer.name}
              onChange={handleCustomerChange}
              className="flex-1 border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={orderCustomer.email}
              onChange={handleCustomerChange}
              className="flex-1 border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="tel"
              name="index"
              placeholder="Index"
              value={orderCustomer.index}
              onChange={handleCustomerChange}
              className="flex-1 border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            {/* <div className="flex flex-col md:flex-row gap-4"> */}
              {/* Start Date */}
                <DateTimePicker
                  label="Start Date"
                  value={orderDates.startDate ? new Date(orderDates.startDate) : null}
                  onChange={(newValue) => {
                    setOrderDates((prev) => ({
                      ...prev,
                      startDate: newValue ? newValue.toISOString() : ""
                    }));
                  }}
                  ampm={false}
                  minDateTime={new Date()}
                  maxDateTime={orderDates.endDate ? new Date(orderDates.endDate) : null}
                  renderInput={(params) => <TextField {...params} className="w-full" />}
                />

              {/* End Date */}
                <DateTimePicker
                  label="End Date"
                  value={orderDates.endDate ? new Date(orderDates.endDate) : null}
                  onChange={(newValue) => {
                    setOrderDates((prev) => ({
                      ...prev,
                      endDate: newValue ? newValue.toISOString() : ""
                    }));
                  }}
                  ampm={false}
                  minDateTime={orderDates.startDate ? new Date(orderDates.startDate) : new Date()}
                  renderInput={(params) => <TextField {...params} className="w-full" />}
                />
            {/* </div> */}
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