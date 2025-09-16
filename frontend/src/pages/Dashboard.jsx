import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#BB33FF", "#FF3366"];

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [owners, setOwners] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCategoryStatus, setSelectedCategoryStatus] = useState("pending");
  const [selectedTopProductStatus, setSelectedTopProductStatus] = useState("pending");

  // Fetch products and owners
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/private`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
  }, [token]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { ownerId: selectedOwnerId, productId: selectedProductId }
        }
      );
      if (res.data.success) setStats(res.data.response);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedOwnerId, selectedProductId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <p className="text-center text-gray-500">Loading data...</p>;
  if (!stats) return <p className="text-center text-red-500">No data available</p>;

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-8">Orders Statistics</h1>

      {/* Global filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div>
          <label className="mr-2 font-semibold">Owner:</label>
          <select
            value={selectedOwnerId}
            onChange={e => setSelectedOwnerId(e.target.value)}
            className="border rounded p-1"
          >
            <option value="">All</option>
            {owners.map(owner => (
              <option key={owner._id} value={owner._id}>{owner.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 font-semibold">Product:</label>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="border rounded p-1"
          >
            <option value="">All</option>
            {products.map(product => (
              <option key={product._id} value={product._id}>{product.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Status Pie Chart */}
        <div className="flex-1 bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4 text-center">Registered Orders by Status</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
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

        {/* Interactive Category Chart */}
        <div className="flex-1 bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-center">Category Popularity</h2>
            <div>
              <label className="mr-2 font-semibold">Status:</label>
              <select
                value={selectedCategoryStatus}
                onChange={e => setSelectedCategoryStatus(e.target.value)}
                className="border rounded p-1"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <p className="text-center text-gray-500 mt-20">No data recorded for this status.</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="requested"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, "Requested"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="mt-8 bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-center">Top Products by Status</h2>
          <div>
            <label className="mr-2 font-semibold">Status:</label>
            <select
              value={selectedTopProductStatus}
              onChange={e => setSelectedTopProductStatus(e.target.value)}
              className="border rounded p-1"
            >
              {topProductStatusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {topProductsData.length === 0 ? (
          <p className="text-center text-gray-500 mt-20">No top products recorded for this status.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={topProductsData}
                dataKey="totalQuantity"  // <- updated to match backend
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {topProductsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, "Quantity"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};

export default Dashboard;