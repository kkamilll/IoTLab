import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [availability, setAvailability] = useState({});
  const [inDemand, setInDemand] = useState({});
  const navigate = useNavigate();
  const { token } = useAuth();

  const today = new Date().toISOString().split("T")[0];

  // const [formData, setFormData] = useState({
  //     customer: {
  //   name: "",
  //   email: "",
  //   index: ""
  // },
  // items: []
  // });

  const [orderCustomer, setOrderCustomer] = useState({
    name: "",
    email: "",
    index: "",
  });

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    // ensure each cart item has rental dates
    const enriched = storedCart.map((item) => ({
      ...item,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
    }));
    setCart(enriched);
  }, []);

  // Save cart
  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  // Change quantity
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

    // setFormData(prev => ({
    //   ...prev, 
    //   items: prev.items.map(item => {
    //       if (item.product === productId) {
    //         const maxAvailable = availability[item.product] ?? Infinity;
    //         const newQuantity = Math.max(1, Math.min((item.requested.quantity || 0) + delta, maxAvailable));
    //         return {...item, requested: { ...item.requested, quantity: newQuantity }}; 
    //       } 
    //       return item;
    //     }) 
    //   }));
  };

  // Change dates per item
  const handleDateChange = (productId, field, value) => {
    const newCart = cart.map((item) =>
      item._id === productId ? { ...item, [field]: value } : item
    );
    updateCart(newCart);

  };

  // Remove product from cart
  const handleRemove = (productId) => {
    const newCart = cart.filter((item) => item._id !== productId);
    updateCart(newCart);
  };

  // Change customer data
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setOrderCustomer((prev) => ({ ...prev, [name]: value }));
    // setFormData(prev => ({ ...prev, customer: { [name]: value } }));
  };

  // Check availability for all items
  const updateAvailability = async () => {
    const newAvailability = {};
    await Promise.all(
      cart.map(async (item) => {
        if (!item.startDate || !item.endDate) {
          newAvailability[item._id] = undefined;
          return;
        }
        try {
          const res = await axios.post(
            "http://localhost:3500/products/available",
            {
              productId: item._id,
              startDate: item.startDate,
              endDate: item.endDate,
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

  const updateInDemand = async () => {
    const newInDemand = {};
    await Promise.all(
      cart.map(async (item) => {
        if (!item.startDate || !item.endDate) {
          newInDemand[item._id] = undefined;
          return;
        }
        try {
          const res = await axios.post(
            "http://localhost:3500/products/inDemand",
            {
              productId: item._id,
              startDate: item.startDate,
              endDate: item.endDate,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          newInDemand[item._id] = res.data.inDemand;
        } catch {
          newInDemand[item._id] = 0;
        }
      })
    );
    setInDemand(newInDemand);
  };

  useEffect(() => {
    updateAvailability();
    updateInDemand();
  }, [cart]);

  // Checkout
  const handleCheckout = async () => {
    if (!cart.length) return alert("Koszyk jest pusty!");
    if (!orderCustomer.email || !orderCustomer.name || !orderCustomer.index)
      return alert("Podaj dane kontaktowe!");

    const items = cart.map((item) => {
      if (!item.startDate || !item.endDate)
        throw new Error(`Brak dat dla produktu: ${item.name}`);
      if (item.startDate > item.endDate)
        throw new Error(`Niepoprawny zakres dat dla produktu: ${item.name}`);
      return {
        product: item._id,
        requested: {
          quantity: item.quantity,
          startDate: item.startDate,
          endDate: item.endDate,
        },
      };
    });

    try {
      const res = await axios.post(
        "http://localhost:3500/orders/create",
        { customer: orderCustomer, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const order = res.data.order;
      const orderId = order._id;
      await axios.post(
        "http://localhost:3500/orders/send-order-email",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Zamówienie złożone i wysłane na maila!");
      setCart([]);
      localStorage.removeItem("cart");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Błąd zamówienia");
    }
  };

  // UI
  if (!cart.length) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Twój koszyk jest pusty</h2>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Powrót do sklepu
        </button>
      </div>
    );
  }

  // Grupowanie produktów względem właściciela
  const groupByOwner = (cartItems) => {
    return cartItems.reduce((acc, item) => {
      const ownerName = item.owner?.name ?? "Brak właściciela";
      if (!acc[ownerName]) acc[ownerName] = [];
      acc[ownerName].push(item);
      return acc;
    }, {});
  };

  const groupedCart = groupByOwner(cart);

  const isQuantityDisabled = (item) => {
    const cartItem = cart.find(c => c._id === item._id);
    return !(cartItem?.startDate && cartItem?.endDate);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="p-6 text-center">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Powrót do sklepu
        </button>
      </div>
      <h2 className="text-3xl font-bold mb-6">Twój koszyk</h2>

      {/* Products list */}
      {Object.entries(groupedCart).map(([owner, products]) => (

        <div key={owner} className="mb-6">
          <h3 className="text-2xl font-semibold mb-2">Właściciel: {owner}</h3>
          <div className="space-y-4">
            {products.map((item) => (
              <div
                key={item._id}
                className="flex flex-col md:flex-row items-start justify-between p-4 border rounded gap-4"
              >
                <div className="flex items-center gap-4">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={`http://localhost:3500/uploads/products/${item.images[0].filename}`}
                      alt={item.name}
                      className="w-20 h-20 object-contain rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded text-gray-500">
                      No Image
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-red-600">
                      {availability[item._id] === undefined
                        ? "Wybierz daty"
                        : availability[item._id] === 0
                          ? "Produkt niedostępny w wybranym okresie"
                          : `Available: ${availability[item._id]}`}
                    </p>
                    <p className="text-sm text-red-600">
                      {inDemand[item._id] === undefined
                        ? "Wybierz daty"
                        : inDemand[item._id] === 0
                          ? ""
                          : `Demanded: ${inDemand[item._id]}`}
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
                        isQuantityDisabled(item) || // disable if dates not selected
                        (availability[item._id] !== undefined && item.quantity >= availability[item._id])
                      }
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemove(item._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Usuń
                    </button>
                  </div>


                  {/* Rental dates per item */}
                  <div className="flex flex-col md:flex-row gap-2">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Customer info */}
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h3 className="text-2xl font-semibold mb-4">Dane do zamówienia</h3>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Imię i nazwisko"
            value={orderCustomer.name}
            onChange={handleCustomerChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Twój e-mail"
            value={orderCustomer.email}
            onChange={handleCustomerChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="tel"
            name="index"
            placeholder="Index"
            value={orderCustomer.index}
            onChange={handleCustomerChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleCheckout}
            className="px-6 py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600"
          >
            Złóż zamówienie
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;