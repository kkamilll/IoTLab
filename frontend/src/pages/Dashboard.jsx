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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  // Statystyki produktów
  const productStats = orders.reduce((acc, order) => {
    const name = order.product?.name || "Usunięty produkt";
    acc[name] = (acc[name] || 0) + order.quantity;
    return acc;
  }, {});
  const barData = Object.entries(productStats).map(([name, qty]) => ({ name, qty }));

  // Statystyki zwrotów
  const returnedCount = orders.filter(o => o.isReturned).length;
  const pieData = [
    { name: "Zwrócone", value: returnedCount },
    { name: "Nie zwrócone", value: orders.length - returnedCount },
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
            <h2 className="text-2xl font-semibold mb-4 text-center">Ilość zamówionych produktów</h2>
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
                    <th className="border border-gray-300 p-3 text-left">Produkt</th>
                    <th className="border border-gray-300 p-3 text-right">Ilość</th>
                    <th className="border border-gray-300 p-3 text-left">Opis</th>
                    <th className="border border-gray-300 p-3 text-left">Historia działań</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-100">
                      <td className="border border-gray-300 p-3">{order.product?.name || "Usunięty produkt"}</td>
                      <td className="border border-gray-300 p-3 text-right">{order.quantity}</td>
                      <td className="border border-gray-300 p-3">{order.product?.description || "Brak opisu"}</td>
                      <td className="border border-gray-300 p-3">
                        {order.history?.length ? (
                          <ul className="list-disc ml-5 space-y-1">
                            {order.history
                              .sort((a, b) => new Date(a.date) - new Date(b.date))
                              .map((event, idx) => (
                                <li key={idx}>
                                  {new Date(event.date).toLocaleString("pl-PL")} – {event.action}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
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
