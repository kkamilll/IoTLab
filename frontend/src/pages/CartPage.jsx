import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // jeśli używasz kontekstu do tokena

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
  const { user, token } = useAuth(); // token do autoryzacji

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleQuantityChange = (productId, delta) => {
    const newCart = cart.map((item) => {
      if (item._id === productId) {
        const newQuantity = item.quantity + delta;
        return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
      }
      return item;
    });
    updateCart(newCart);
  };

  const handleRemove = (productId) => {
    const newCart = cart.filter((item) => item._id !== productId);
    updateCart(newCart);
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!user || !token) {
      alert("Musisz być zalogowany, aby złożyć zamówienie");
      navigate("/login");
      return;
    }

    try {
      // Przesyłamy każdy produkt jako osobne zamówienie
      const promises = cart.map((item) =>
        axios.post(
          "http://localhost:3500/orders/add",
          { productId: item._id, quantity: item.quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      await Promise.all(promises);
      alert("Zamówienie zostało złożone!");
      setCart([]);
      localStorage.removeItem("cart");
      navigate("/orders"); // opcjonalnie przeniesienie do strony zamówień
    } catch (err) {
      console.error("Błąd składania zamówienia:", err);
      alert(err.response?.data?.error || "Błąd składania zamówienia");
    }
  };

  if (cart.length === 0) {
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Twój koszyk</h2>
      <div className="space-y-4">
        {cart.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between p-4 border rounded"
          >
            <div className="flex items-center gap-4">
              {item.image && (
                <img
                  src={`http://localhost:3500/uploads/${item.image}`}
                  alt={item.name}
                  className="w-20 h-20 object-contain rounded"
                />
              )}
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">
                  Cena: {item.price ? item.price + " zł" : "Brak ceny"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item._id, -1)}
                className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item._id, 1)}
                className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
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
          </div>
        ))}
      </div>

      <div className="mt-6 text-right">
        <h3 className="text-xl font-bold">Łączna wartość: {totalPrice} zł</h3>
        <button
          onClick={handleCheckout}
          className="mt-4 px-6 py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600"
        >
          Przejdź do płatności
        </button>
      </div>
    </div>
  );
};

export default CartPage;
