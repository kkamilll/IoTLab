import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/layout/PageHeader";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
];

const Dashboard = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [owners, setOwners] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCategoryStatus, setSelectedCategoryStatus] =
    useState("pending");
  const [selectedTopProductStatus, setSelectedTopProductStatus] =
    useState("pending");

  // Fetch products and owners
  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get("/products/private");
      if (!res.data.success) {
        showToast(res.data.message || "Error fetching products", "error");
        return;
      }
      setProducts(res.data.products);
      const uniqueOwners = Array.from(
        new Set(res.data.products.map((p) => p.owner?._id)),
      ).map((id) => {
        const owner = res.data.products.find((p) => p.owner?._id === id).owner;
        return owner;
      });
      setOwners(uniqueOwners);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || "Error fetching products", "error");
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/orders/stats", {
        params: { ownerId: selectedOwnerId, productId: selectedProductId },
      });
      if (res.data.success) setStats(res.data.response);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedOwnerId, selectedProductId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium">
        Loading statistics...
      </div>
    );
  if (!stats)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500 font-medium">
        No statistics data available.
      </div>
    );

  // Pie chart for overall status
  const pieData = [
    { name: "Requested", value: stats.totalItemsRequested || 0 },
    { name: "Approved", value: stats.totalItemsApproved || 0 },
    { name: "Rented", value: stats.totalItemsRented || 0 },
    { name: "Returned", value: stats.totalItemsReturned || 0 },
    { name: "Rejected", value: stats.totalItemsRejected || 0 },
  ].filter((d) => d.value > 0);

  // Category chart for selected status
  const statusOptions = Object.keys(stats.statisticMap || {});
  const categoryData =
    stats.statisticMap?.[selectedCategoryStatus]?.map((cat) => ({
      name: cat._id,
      requested: cat.totalRequested,
      returned: cat.totalAssigned,
    })) || [];

  // Top products chart for selected status
  const topProductStatusOptions = Object.keys(stats.topProducts || {});
  const topProductsData =
    stats.topProducts?.[selectedTopProductStatus]?.map((p) => ({
      name: p._id,
      totalQuantity: p.totalQuantity,
    })) || [];

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col transition-colors duration-300">
        {/* Header & Global Filters */}
        <PageHeader
          title={"📊 " + t("nav.statistics")}
          subtitle="Real-time overview of laboratory orders, items, and popular categories"
        >
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Owner:
            </span>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All</option>
              {owners.map((owner) => (
                <option key={owner._id} value={owner._id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Product:
            </span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[200px]"
            >
              <option value="">All</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PageHeader>

      {/* Charts Grid */}
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        {/* Status Pie Chart */}
        <div className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
            Registered Orders by Status
          </h2>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Category Chart */}
        <div className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Category Popularity
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Status:
              </span>
              <select
                value={selectedCategoryStatus}
                onChange={(e) => setSelectedCategoryStatus(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 px-2 py-1 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[350px] flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">
                No data recorded for this status.
              </p>
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
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, "Requested"]} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Top Products by Status
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Status:
            </span>
            <select
              value={selectedTopProductStatus}
              onChange={(e) => setSelectedTopProductStatus(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 px-2 py-1 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {topProductStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-[350px] flex items-center justify-center">
          {topProductsData.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium">
              No top products recorded for this status.
            </p>
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
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {topProductsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, "Quantity"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default Dashboard;
