import React, { useEffect, useState, useCallback, useRef } from "react";
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

const truncateText = (text, maxLength = 12) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const Dashboard = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [stats1, setStats1] = useState(null);
  const [stats2, setStats2] = useState(null);
  const [stats3, setStats3] = useState(null);

  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [loading3, setLoading3] = useState(true);

  const [owners, setOwners] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [ownerId1, setOwnerId1] = useState("");
  const [productId1, setProductId1] = useState("");

  const [ownerId2, setOwnerId2] = useState("");
  const [selectedCategoryStatus, setSelectedCategoryStatus] = useState("pending");

  const [ownerId3, setOwnerId3] = useState("");
  const [selectedTopProductStatus, setSelectedTopProductStatus] = useState("pending");

  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef(null);

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
        new Set(res.data.products.map((p) => p.owner?._id).filter(Boolean)),
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

  // Fetch stats for Card 1
  const fetchStats1 = useCallback(async () => {
    setLoading1(true);
    try {
      const res = await apiClient.get("/orders/stats", {
        params: { ownerId: ownerId1, productId: productId1 },
      });
      if (res.data.success) setStats1(res.data.response);
    } catch (err) {
      console.error("Error fetching stats 1:", err);
    } finally {
      setLoading1(false);
    }
  }, [ownerId1, productId1]);

  // Fetch stats for Card 2
  const fetchStats2 = useCallback(async () => {
    setLoading2(true);
    try {
      const res = await apiClient.get("/orders/stats", {
        params: { ownerId: ownerId2 },
      });
      if (res.data.success) setStats2(res.data.response);
    } catch (err) {
      console.error("Error fetching stats 2:", err);
    } finally {
      setLoading2(false);
    }
  }, [ownerId2]);

  // Fetch stats for Card 3
  const fetchStats3 = useCallback(async () => {
    setLoading3(true);
    try {
      const res = await apiClient.get("/orders/stats", {
        params: { ownerId: ownerId3 },
      });
      if (res.data.success) setStats3(res.data.response);
    } catch (err) {
      console.error("Error fetching stats 3:", err);
    } finally {
      setLoading3(false);
    }
  }, [ownerId3]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchStats1();
  }, [fetchStats1]);

  useEffect(() => {
    fetchStats2();
  }, [fetchStats2]);

  useEffect(() => {
    fetchStats3();
  }, [fetchStats3]);

  // Reset selected product if selected owner changes and doesn't own that product
  useEffect(() => {
    if (ownerId1 && productId1) {
      const activeProduct = products.find((p) => p._id === productId1);
      if (activeProduct && activeProduct.owner?._id !== ownerId1) {
        setProductId1("");
      }
    }
  }, [ownerId1, productId1, products]);

  // Handle click outside for searchable product dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const translateStatus = (statusKey) => {
    if (!statusKey) return "";
    const lowerKey = statusKey.toLowerCase();
    const map = {
      requested: "pending",
      pending: "pending",
      approved: "approved",
      prepared: "prepared",
      rented: "rented",
      returned: "returned",
      rejected: "rejected",
      changed: "changed",
      reserved: "approved"
    };
    const mappedKey = map[lowerKey] || lowerKey;
    return t(`statuses.${mappedKey}`) || statusKey;
  };

  // Sort owners alphabetically
  const sortedOwners = [...owners].sort((a, b) =>
    (a?.name || "").localeCompare(b?.name || "", language)
  );

  // Filter products by owner, then sort alphabetically
  const filteredProducts = products
    .filter((p) => !ownerId1 || p.owner?._id === ownerId1)
    .sort((a, b) => (a?.name || "").localeCompare(b?.name || "", language));

  // Filter products by search query (checks product name and category names)
  const searchedProducts = filteredProducts.filter((p) => {
    if (!productSearch) return true;
    const query = productSearch.toLowerCase();
    const matchName = (p.name || "").toLowerCase().includes(query);
    const matchCategory = (p.categories || []).some((cat) =>
      (cat?.name || "").toLowerCase().includes(query)
    );
    return matchName || matchCategory;
  });

  // Group filtered/searched products by category
  const groupedProducts = searchedProducts.reduce((acc, product) => {
    const catName = product.categories?.[0]?.name || "Uncategorized";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(product);
    return acc;
  }, {});

  const selectedProduct = products.find((p) => p._id === productId1);
  const selectedProductLabel = selectedProduct
    ? selectedProduct.name
    : language === "pl"
    ? "Wszystkie"
    : "All";

  const loading = loading1 || loading2 || loading3;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium">
        Loading statistics...
      </div>
    );
  if (!stats1 || !stats2 || !stats3)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500 font-medium">
        No statistics data available.
      </div>
    );

  // Pie chart for overall status
  const pieData = [
    { name: translateStatus("pending"), value: stats1.totalItemsRequested || 0 },
    { name: translateStatus("approved"), value: stats1.totalItemsApproved || 0 },
    { name: translateStatus("rented"), value: stats1.totalItemsRented || 0 },
    { name: translateStatus("returned"), value: stats1.totalItemsReturned || 0 },
    { name: translateStatus("rejected"), value: stats1.totalItemsRejected || 0 },
  ].filter((d) => d.value > 0);

  // Category chart for selected status
  const statusOptions = Object.keys(stats2.statisticMap || {});
  const categoryData =
    stats2.statisticMap?.[selectedCategoryStatus]?.map((cat) => ({
      name: cat._id,
      requested: cat.totalRequested,
      returned: cat.totalAssigned,
    })) || [];

  // Top products chart for selected status
  const topProductStatusOptions = Object.keys(stats3.topProducts || {});
  const topProductsData =
    stats3.topProducts?.[selectedTopProductStatus]?.map((p) => ({
      name: p._id,
      totalQuantity: p.totalQuantity,
    })) || [];

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6 transition-colors duration-300">
        {/* Header */}
        <PageHeader
          title={"📊 " + t("nav.statistics")}
          subtitle={t("statistics.subtitle")}
        />

      {/* Charts Grid */}
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        {/* Status Pie Chart */}
        <div className="relative flex-1 min-w-0 overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {t("statistics.registeredOrders")}
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              {/* Owner Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {language === "pl" ? "Właściciel:" : "Owner:"}
                </span>
                <div className="relative select-none flex items-center">
                  <select
                    value={ownerId1}
                    onChange={(e) => setOwnerId1(e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer min-w-[100px] max-w-[140px] truncate"
                  >
                    <option value="">{language === "pl" ? "Wszyscy" : "All"}</option>
                    {sortedOwners.map((owner) => (
                      <option key={owner._id} value={owner._id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {language === "pl" ? "Produkt:" : "Product:"}
                </span>
                <div className="static sm:relative" ref={productDropdownRef}>
                  <button
                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                    type="button"
                    className="text-xs text-left border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 cursor-pointer min-w-[120px] max-w-[180px] truncate relative"
                  >
                    <span>{selectedProductLabel}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                {isProductDropdownOpen && (
                  <div className="absolute left-6 right-6 sm:left-auto sm:right-0 mt-2 z-50 w-auto sm:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 flex flex-col gap-2">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={t("statistics.searchPlaceholder")}
                      className="text-xs border border-slate-255 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      autoFocus
                    />

                    <div className="max-h-60 overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      <button
                        onClick={() => {
                          setProductId1("");
                          setIsProductDropdownOpen(false);
                          setProductSearch("");
                        }}
                        type="button"
                        className={`text-left text-xs px-3 py-2 rounded-xl transition-all duration-100 font-semibold cursor-pointer ${
                          productId1 === ""
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {language === "pl" ? "Wszystkie" : "All"}
                      </button>

                      {Object.keys(groupedProducts).length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
                          {language === "pl" ? "Brak wyników" : "No products found"}
                        </div>
                      ) : (
                        Object.entries(groupedProducts).map(([category, items]) => (
                          <div key={category} className="flex flex-col gap-1">
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-1 select-none">
                              {category}
                            </span>
                            {items.map((product) => (
                              <button
                                key={product._id}
                                onClick={() => {
                                  setProductId1(product._id);
                                  setIsProductDropdownOpen(false);
                                  setProductSearch("");
                                }}
                                type="button"
                                className={`text-left text-xs px-3 py-2 rounded-xl transition-all duration-100 truncate cursor-pointer ${
                                  productId1 === product._id
                                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                                    : "text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                }`}
                                title={product.name}
                              >
                                {product.name}
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
          <div className="h-[385px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  label={({ name, percent }) =>
                    percent > 0.05
                      ? `${truncateText(name, 24)} (${(percent * 100).toFixed(0)}%)`
                      : ""
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  formatter={(value) => (
                    <span
                      className="text-slate-600 dark:text-slate-400 font-semibold select-none cursor-help hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title={value}
                    >
                      {truncateText(value, 28)}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Category Chart */}
        <div className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {t("statistics.categoryPopularity")}
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              {/* Owner Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {language === "pl" ? "Właściciel:" : "Owner:"}
                </span>
                <div className="relative select-none flex items-center">
                  <select
                    value={ownerId2}
                    onChange={(e) => setOwnerId2(e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer min-w-[100px] max-w-[140px] truncate"
                  >
                    <option value="">{language === "pl" ? "Wszyscy" : "All"}</option>
                    {sortedOwners.map((owner) => (
                      <option key={owner._id} value={owner._id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Status:
                </span>
                <div className="relative select-none flex items-center">
                  <select
                    value={selectedCategoryStatus}
                    onChange={(e) => setSelectedCategoryStatus(e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {translateStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[385px] relative">
            {categoryData.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium absolute inset-0 flex items-center justify-center">
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
                    cy="45%"
                    outerRadius={75}
                    label={({ name, percent }) =>
                      percent > 0.05
                        ? `${truncateText(name, 24)} (${(percent * 100).toFixed(0)}%)`
                        : ""
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, language === "pl" ? "Wnioskowane" : "Requested"]} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                    formatter={(value) => (
                      <span
                        className="text-slate-600 dark:text-slate-400 font-semibold select-none cursor-help hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={value}
                      >
                        {truncateText(value, 28)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {t("statistics.topProducts")}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            {/* Owner Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {language === "pl" ? "Właściciel:" : "Owner:"}
              </span>
              <div className="relative select-none flex items-center">
                <select
                  value={ownerId3}
                  onChange={(e) => setOwnerId3(e.target.value)}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer min-w-[100px] max-w-[140px] truncate"
                >
                  <option value="">{language === "pl" ? "Wszyscy" : "All"}</option>
                  {sortedOwners.map((owner) => (
                    <option key={owner._id} value={owner._id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none">▼</span>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Status:
              </span>
              <div className="relative select-none flex items-center">
                <select
                  value={selectedTopProductStatus}
                  onChange={(e) => setSelectedTopProductStatus(e.target.value)}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  {topProductStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {translateStatus(status)}
                    </option>
                  ))}
                </select>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none">▼</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[385px] relative">
          {topProductsData.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium absolute inset-0 flex items-center justify-center">
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
                  cy="45%"
                  outerRadius={75}
                  label={({ name, percent }) =>
                    percent > 0.05
                      ? `${truncateText(name, 24)} (${(percent * 100).toFixed(0)}%)`
                      : ""
                  }
                >
                  {topProductsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, language === "pl" ? "Ilość" : "Quantity"]} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  formatter={(value) => (
                    <span
                      className="text-slate-600 dark:text-slate-400 font-semibold select-none cursor-help hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title={value}
                    >
                      {truncateText(value, 28)}
                    </span>
                  )}
                />
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
