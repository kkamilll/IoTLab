import React, { useEffect, useState, useCallback } from "react";
<<<<<<< HEAD
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"];
=======
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from "recharts";
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
  const [owners, setOwners] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCategoryStatus, setSelectedCategoryStatus] = useState("pending");
  const [selectedTopProductStatus, setSelectedTopProductStatus] = useState("pending");

  // Fetch products and owners
  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get("/products/private");
      if (!res.data.success) return alert(res.data.message || "Error fetching products");

      setProducts(res.data.products);
      const uniqueOwners = Array.from(new Set(res.data.products.map(p => p.owner?._id))).map(id => {
        const owner = res.data.products.find(p => p.owner?._id === id).owner;
        return owner;
      });
      setOwners(uniqueOwners);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/orders/stats", {
        params: { ownerId: selectedOwnerId, productId: selectedProductId }
      });
      if (res.data.success) setStats(res.data.response);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedOwnerId, selectedProductId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium">Loading statistics...</div>;
  if (!stats) return <div className="flex items-center justify-center min-h-[400px] text-red-500 font-medium">No statistics data available.</div>;

  // Pie chart for overall status
  const pieData = [
    { name: "Requested", value: stats.totalItemsRequested || 0 },
    { name: "Approved", value: stats.totalItemsApproved || 0 },
    { name: "Rented", value: stats.totalItemsRented || 0 },
    { name: "Returned", value: stats.totalItemsReturned || 0 },
    { name: "Rejected", value: stats.totalItemsRejected || 0 }
  ].filter(d => d.value > 0);

  // Category chart for selected status
  const statusOptions = Object.keys(stats.statisticMap || {});
  const categoryData = stats.statisticMap?.[selectedCategoryStatus]?.map(cat => ({
    name: cat._id,
    requested: cat.totalRequested,
    returned: cat.totalAssigned
  })) || [];

  // Top products chart for selected status
  const topProductStatusOptions = Object.keys(stats.topProducts || {});
  const topProductsData = stats.topProducts?.[selectedTopProductStatus]?.map(p => ({
    name: p._id,
    totalQuantity: p.totalQuantity
  })) || [];
=======
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
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21

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
<<<<<<< HEAD
    <div className="min-h-screen bg-slate-50/30 p-6 md:p-8">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders Statistics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time overview of laboratory orders, items, and popular categories</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner:</span>
            <select
              value={selectedOwnerId}
              onChange={e => setSelectedOwnerId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All</option>
              {owners.map(owner => (
                <option key={owner._id} value={owner._id}>{owner.name}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product:</span>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[200px]"
            >
              <option value="">All</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Status Pie Chart */}
        <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Registered Orders by Status</h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Category Chart */}
        <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Category Popularity</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
              <select
                value={selectedCategoryStatus}
                onChange={e => setSelectedCategoryStatus(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg bg-slate-50 px-2 py-1 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[350px] flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">No data recorded for this status.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="requested"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, "Requested"]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Top Products by Status</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={selectedTopProductStatus}
              onChange={e => setSelectedTopProductStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg bg-slate-50 px-2 py-1 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {topProductStatusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-[350px] flex items-center justify-center">
          {topProductsData.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium">No top products recorded for this status.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProductsData}
                  dataKey="totalQuantity"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {topProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, "Quantity"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

=======
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
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
    </div>
  );
};

<<<<<<< HEAD
export default Dashboard;
=======
const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded shadow">
    <h2 className="text-2xl font-semibold mb-4 text-center">{title}</h2>
    {children}
  </div>
);

export default Dashboard;
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
