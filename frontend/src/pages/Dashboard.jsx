import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get("http://localhost:3500/orders", {
          headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
        }),
        axios.get("http://localhost:3500/products", {
          headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
        }),
      ]);

      if (ordersRes.data.success) setOrders(ordersRes.data.orders);
      if (productsRes.data.success) setProducts(productsRes.data.products);
    } catch (error) {
      console.error("fetchData error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // odśwież co 30 sekund
    return () => clearInterval(interval);
  }, []);

  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  if (loading) {
    return <div className="p-6 text-gray-700">Ładowanie danych...</div>;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

     

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Liczba zamówień</h2>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Liczba produktów</h2>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Łączna ilość w magazynie</h2>
          <p className="text-2xl font-bold">{totalStock}</p>
        </div>
        <div className="p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Średnia ilość na produkt</h2>
          <p className="text-2xl font-bold">
            {products.length ? (totalStock / products.length).toFixed(2) : 0}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Ostatnie zamówienia</h2>
        {orders.length === 0 ? (
          <p>Brak zamówień</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-blue-50">
              <tr>
                <th className="border border-gray-300 p-2 text-left">Produkt</th>
                <th className="border border-gray-300 p-2 text-right">Ilość</th>
              </tr>
            </thead>
            <tbody>
              {[...orders].slice(-5).reverse().map((o) => (
                <tr key={o._id} className="hover:bg-gray-100">
                  <td className="border border-gray-300 p-2">{o.product?.name || "Usunięty produkt"}</td>
                  <td className="border border-gray-300 p-2 text-right">{o.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
