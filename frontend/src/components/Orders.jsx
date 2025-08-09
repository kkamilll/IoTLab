import React, { useEffect, useState } from "react";
import axios from "axios";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Do modalu
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
        headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
      });
      if (res.data.success) setOrders(res.data.orders);
    } catch (error) {
      console.error("fetchOrders error:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:3500/products", {
        headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
      });
      if (res.data.success) setProducts(res.data.products);
    } catch (error) {
      console.error("fetchProducts error:", error);
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
        { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
      );

      if (res.data.success) {
        alert("Zamówienie dodane");
        setProductId("");
        setQuantity(1);
        fetchOrders();
        fetchProducts();
        setModalOpen(false); // zamknij modal po dodaniu
      }
    } catch (error) {
      alert(error.response?.data?.error || "Błąd dodawania zamówienia");
      console.error(error);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć to zamówienie?")) return;

    try {
      const res = await axios.delete(
        `http://localhost:3500/orders/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
      );
      if (res.data.success) {
        alert("Zamówienie usunięte");
        fetchOrders();
        fetchProducts();
      }
    } catch (error) {
      alert("Błąd usuwania zamówienia");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl bg-white rounded shadow-md p-8 flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">
          Zarządzanie Zamówieniami
        </h1>

        <button
          onClick={() => setModalOpen(true)}
          className="self-start bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded shadow transition"
        >
          Dodaj zamówienie
        </button>

        {/* Tabela zamówień */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-blue-50">
              <tr>
                <th className="border border-gray-300 p-3 text-left">Produkt</th>
                <th className="border border-gray-300 p-3 text-right">Ilość</th>
                <th className="border border-gray-300 p-3 text-right">Cena jednostkowa</th>
                <th className="border border-gray-300 p-3 text-right">Cena łącznie</th>
                <th className="border border-gray-300 p-3 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-6 text-gray-500">
                    Brak zamówień
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-3">
                      {order.product?.name || "Usunięty produkt"}
                      {order.product?.stock === 0 && (
                        <span className="ml-2 text-sm text-red-600">(Niedostępny)</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3 text-right">{order.quantity}</td>
                    <td className="border border-gray-300 p-3 text-right">{order.product?.price} PLN</td>
                    <td className="border border-gray-300 p-3 text-right font-semibold">{order.totalPrice} PLN</td>
                    <td className="border border-gray-300 p-3 text-center">
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {/* Modal */}
{modalOpen && (
  <div
    className="fixed inset-0 flex justify-center items-center z-50"
    style={{
      backgroundColor: "rgba(255, 255, 255, 0.6)", // jasne półprzezroczyste tło
      backdropFilter: "blur(5px)", // rozmycie tła
      WebkitBackdropFilter: "blur(5px)", // Safari
    }}
  >
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
      <h2 className="text-2xl font-bold mb-6">Nowe zamówienie</h2>

      <div className="mb-4">
        <label className="block mb-2 font-semibold text-gray-700">Produkt:</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full border rounded p-3 shadow-sm focus:ring-2 focus:ring-blue-400"
        >
          {products.map((p) => (
            <option key={p._id} value={p._id} disabled={p.stock === 0}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Formularz z danymi produktu tylko do odczytu */}
      {productId && (
        <div className="mb-6 space-y-4">
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Nazwa produktu:</label>
            <input
              type="text"
              readOnly
              value={products.find((p) => p._id === productId)?.name || ""}
              className="w-full border rounded p-3 bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Cena jednostkowa:</label>
            <input
              type="text"
              readOnly
              value={products.find((p) => p._id === productId)?.price + " PLN" || ""}
              className="w-full border rounded p-3 bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Dostępny stock:</label>
            <input
              type="number"
              readOnly
              value={products.find((p) => p._id === productId)?.stock || 0}
              className="w-full border rounded p-3 bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-700">Ilość:</label>
        <input
          type="number"
          min="1"
          max={productId ? products.find((p) => p._id === productId)?.stock || 1 : 1}
          value={quantity}
          onChange={(e) => {
            const val = Number(e.target.value);
            const max = productId ? products.find((p) => p._id === productId)?.stock || 1 : 1;
            setQuantity(val > max ? max : val < 1 ? 1 : val);
          }}
          className="w-full border rounded p-3 shadow-sm focus:ring-2 focus:ring-blue-400"
        />
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
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
