import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const Dashboard = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:3500/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) setOrders(res.data.orders);
      } catch (err) {
        alert(`${err.response.data.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  // Statystyki produktów
  const productStats = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const name = item.product?.name || "Usunięty produkt";
      const qty = item.requested?.quantity || 0; // or use item.confirmed?.quantity if you prefer
      acc[name] = (acc[name] || 0) + qty;
    });
    return acc;
  }, {});

  const barData = Object.entries(productStats).map(([name, qty]) => ({ name, qty }));

  // Prepare data for PieChart (returns vs non-returns)
  const returnedCount = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (item.isReturned) acc += 1;
    });
    return acc;
  }, 0);

  const totalItems = orders.reduce((acc, order) => acc + order.items.length, 0);

  const pieData = [
    { name: "Zwrócone", value: returnedCount },
    { name: "Nie zwrócone", value: totalItems - returnedCount },
  ];
  const COLORS = ["#0088FE", "#FF8042"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-center mb-8">Dashboard Zamówień</h1>

      {loading ? (
        <p className="text-center text-gray-500">Ładowanie danych...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Wykres słupkowy */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-semibold mb-4 text-center">Liczba zamówionych produktów</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Wykres kołowy */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-semibold mb-4 text-center">Procent zwrotów</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela zamówień z historią */}
          <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-semibold mb-4 text-center">Zarządzanie zamówieniami</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="border border-gray-300 p-3 text-left">Email</th>
                    <th className="border border-gray-300 p-3 text-left">Produkt</th>
                    <th className="border border-gray-300 p-3 text-right">Request Amount</th>
                    <th className="border border-gray-300 p-3 text-right">Rented Amount</th>
                    <th className="border border-gray-300 p-3 text-left">Opis</th>
                    <th className="border border-gray-300 p-3 text-left">Historia działań</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) =>
                    order.items.map((item, idx) => (
                      <tr key={`${order._id}-${idx}`} className="hover:bg-gray-100">
                        <td className="border border-gray-300 p-3">{order?.customer?.email || "Order Deleted"}</td>
                        <td className="border border-gray-300 p-3">{item.product?.name || "Usunięty produkt"}</td>
                        <td className="border border-gray-300 p-3 text-right">{item.confirmed?.quantity || 0}</td>
                        <td className="border border-gray-300 p-3 text-right">{item.requested?.quantity || 0}</td>
                        <td className="border border-gray-300 p-3">{item.product?.description || "Brak opisu"}</td>
                        <td className="border border-gray-300 p-3">
                          {item.history?.length ? (
                            <ul className="list-disc ml-5 space-y-1">
                              {/* {item.history
                                .sort((a, b) => new Date(a.date) - new Date(b.date))
                                .map((event, idx2) => (
                                  <li key={idx2}>
                                    {new Date(event.date).toLocaleString("pl-PL")} – {event.action}
                                  </li>
                                ))} */}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Dashboard;
