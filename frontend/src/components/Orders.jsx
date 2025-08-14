import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Orders = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:3500/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setOrders(res.data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:3500/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productsList = res.data.products || [];
      setProducts(productsList.filter((p) => !p.isDeleted));
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleAddOrder = async () => {
    if (!productId || quantity < 1) {
      alert("Wybierz produkt i podaj poprawną ilość");
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:3500/orders/add",
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("Zamówienie dodane");
        setProductId("");
        setQuantity(1);
        fetchOrders();
        fetchProducts();
        setModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Błąd dodawania zamówienia");
      console.error(err);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć to zamówienie?")) return;
    try {
      const res = await axios.delete(`http://localhost:3500/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        alert("Zamówienie usunięte");
        fetchOrders();
        fetchProducts();
      }
    } catch (err) {
      alert("Błąd usuwania zamówienia");
      console.error(err);
    }
  };

  const handleReturnOrder = async (orderId) => {
    if (!window.confirm("Czy na pewno chcesz zwrócić to zamówienie?")) return;
    try {
      const res = await axios.post(
        "http://localhost:3500/orders/returned",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert("Zamówienie zwrócone");
        // Usuń zamówienie lokalnie z listy
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      }
    } catch (err) {
      console.error("Błąd zwracania:", err);
      alert(err.response?.data?.error || "Błąd zwracania zamówienia");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl bg-white rounded shadow-md p-8 flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">
          Zarządzanie Zamówieniami
        </h1>

        {user?.role === "admin" && (
          <button
            onClick={() => setModalOpen(true)}
            className="self-start bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow transition"
          >
            Dodaj zamówienie
          </button>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-blue-50">
              <tr>
                <th className="border border-gray-300 p-3 text-left">Produkt</th>
                <th className="border border-gray-300 p-3 text-right">Ilość</th>
                <th className="border border-gray-300 p-3 text-left">Opis</th>
                <th className="border border-gray-300 p-3 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-500">
                    Brak zamówień
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-3">
                      {order.productRef?.name || "Usunięty produkt"}
                    </td>
                    <td className="border border-gray-300 p-3 text-right">{order.quantity}</td>
                    <td className="border border-gray-300 p-3">
                      {order.productRef?.description || "Brak opisu"}
                    </td>
                    <td className="border border-gray-300 p-3 text-center flex justify-center gap-2">
                      {user?.role === "admin" && (
                        <>
                          <button
                            onClick={() => handleDeleteOrder(order._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                          >
                            Usuń
                          </button>
                          <button
                            onClick={() => handleReturnOrder(order._id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                            disabled={order.isReturned}
                          >
                            Zwróć
                          </button>
                        </>
                      )}
                      {user?.role !== "admin" && <span>-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-white bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <h2 className="text-2xl font-bold mb-6">Nowe zamówienie</h2>

            <div className="max-h-64 overflow-y-auto mb-6 border rounded p-2">
              {products.length === 0 ? (
                <p className="text-center text-gray-500">Brak produktów</p>
              ) : (
                products.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => {
                      if (p.stock === 0) return;
                      setProductId(p._id);
                      setQuantity(1);
                    }}
                    className={`cursor-pointer p-3 rounded mb-2 border
                      ${p._id === productId ? "border-blue-600 bg-blue-50" : "border-gray-300"}
                      ${p.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={p.stock === 0 ? "Produkt niedostępny" : ""}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-gray-600">{p.description || "Brak opisu"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{p.price} PLN</p>
                        <p className={`text-xs ${p.stock === 0 ? "text-red-600" : "text-green-600"}`}>
                          {p.stock === 0 ? "Niedostępny" : `Dostępny: ${p.stock}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mb-6 flex items-center space-x-4">
              <label className="font-semibold">Ilość:</label>
              <button
                onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={productId ? products.find((p) => p._id === productId)?.stock || 1 : 1}
                value={quantity}
                onChange={(e) => {
                  let val = Number(e.target.value);
                  const max = productId ? products.find((p) => p._id === productId)?.stock || 1 : 1;
                  if (val < 1) val = 1;
                  if (val > max) val = max;
                  setQuantity(val);
                }}
                className="w-16 text-center border rounded p-1"
                disabled={!productId}
              />
              <button
                onClick={() => {
                  const max = productId ? products.find((p) => p._id === productId)?.stock || 1 : 1;
                  setQuantity((q) => (q < max ? q + 1 : q));
                }}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                disabled={!productId || quantity >= (products.find((p) => p._id === productId)?.stock || 1)}
              >
                +
              </button>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddOrder}
                disabled={!productId}
                className={`px-6 py-2 rounded text-white ${productId ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
