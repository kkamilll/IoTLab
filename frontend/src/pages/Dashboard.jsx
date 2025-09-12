import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from "recharts";

const Dashboard = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) setOrders(res.data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) return <p className="text-center text-gray-500">Loading data...</p>;

  // --- Products statistics ---
  const productStats = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const name = item.product?.name || "Deleted Product";
      acc[name] = (acc[name] || 0) + (item.requested?.quantity || 1);
    });
    return acc;
  }, {});
  const barData = Object.entries(productStats).map(([name, qty]) => ({ name, qty }));
  const topProducts = [...barData].sort((a, b) => b.qty - a.qty).slice(0, 5);

  // --- Returns ---
  const returnedCount = orders.filter(o => o.isReturned).length;
  const pieData = [
    { name: "Returned", value: returnedCount },
    { name: "Not Returned", value: orders.length - returnedCount },
  ].filter(d => d.value > 0);
  const COLORS = ["#0088FE", "#FF8042"];

  // --- Order statuses ---
  const statusStats = orders.reduce((acc, order) => {
    const status = order.isReturned ? "RETURNED" : order.status || "PENDING";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusStats).map(([status, count]) => ({ status, count }));

  // --- Orders over time ---
  const ordersByDate = {};
  orders.forEach(order => {
    const date = new Date(order.createdAt).toLocaleDateString("en-US");
    ordersByDate[date] = (ordersByDate[date] || 0) + 1;
  });
  const lineData = Object.entries(ordersByDate)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, count]) => ({ date, count }));

  // --- Products by category ---
  const categoryStats = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const category = item.product?.category?.name || "No Category";
      categoryStats[category] = (categoryStats[category] || 0) + (item.requested?.quantity || 1);
    });
  });
  const categoryData = Object.entries(categoryStats).map(([category, qty]) => ({ category, qty }));

  // --- Average products per order ---
  const avgProductsData = orders.map(order => ({
    id: order._id,
    avgQty: order.items.reduce((sum, i) => sum + (i.requested?.quantity || 1), 0) / order.items.length
  }));

  // --- Top clients ---
  const clientStats = {};
  orders.forEach(order => {
    const email = order.customer?.email || "No Email";
    clientStats[email] = (clientStats[email] || 0) + 1;
  });
  const topClients = Object.entries(clientStats)
    .map(([email, count]) => ({ email, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-center mb-8">Orders Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <ChartCard title="Number of Ordered Products">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="qty" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 Products">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="qty" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Return Percentage">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Statuses">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Products by Category">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="qty" fill="#ff7f50" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Average Products per Order">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgProductsData}>
              <XAxis dataKey="id" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgQty" fill="#00c49f" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Clients by Number of Orders">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClients}>
              <XAxis dataKey="email" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ffbb28" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-white p-6 rounded shadow col-span-1 lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 text-center">Orders Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded shadow">
    <h2 className="text-2xl font-semibold mb-4 text-center">{title}</h2>
    {children}
  </div>
);

export default Dashboard;
