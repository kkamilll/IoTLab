import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import apiClient from "../api/apiClient";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/layout/PageHeader";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Trophy,
  Clock,
  CheckCircle2,
  RotateCcw,
  PackageCheck,
  AlertCircle,
  RefreshCw,
  X,
  Search,
  Filter,
  ChevronDown,
  Layers,
  Box,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";

// Vibrant, accessible color palette
const PALETTE = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#e11d48", // Rose
  "#84cc16", // Lime
  "#a855f7", // Violet
];

// Status specific colors
const STATUS_COLORS = {
  pending: "#f59e0b",   // Amber
  approved: "#10b981",  // Emerald
  prepared: "#14b8a6",  // Teal
  rented: "#6366f1",    // Indigo
  returned: "#0284c7",  // Sky
  rejected: "#f43f5e",  // Rose
  changed: "#8b5cf6",   // Purple
};

const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

// Custom dark/light mode tooltip for charts
const CustomChartTooltip = ({ active, payload, label, unit = "szt." }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs z-50">
      <p className="font-bold text-slate-800 dark:text-slate-100 mb-1 max-w-[220px] truncate">
        {label || data.name}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: data.fill || data.color || "#6366f1" }}
        />
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {data.dataKey === "value" || data.dataKey === "totalQuantity" ? "Ilość:" : data.name + ":"}
        </span>
        <span className="font-bold text-slate-900 dark:text-white">
          {data.value} {unit}
        </span>
      </div>
      {data.payload?.percentage !== undefined && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
          Udział: {data.payload.percentage}%
        </p>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  // Stats data from API
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter options
  const [owners, setOwners] = useState([]);
  const [products, setProducts] = useState([]);

  // Active Global Filters
  const [ownerId, setOwnerId] = useState("");
  const [productId, setProductId] = useState("");

  // Product searchable dropdown state
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef(null);

  // Section 2: Category Popularity States
  const [selectedCategoryStatus, setSelectedCategoryStatus] = useState("pending");
  const [categoryViewMode, setCategoryViewMode] = useState("bar"); // "bar", "donut", "table"
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryLimit, setCategoryLimit] = useState("all"); // "5", "10", "all"

  // Section 3: Top Products States
  const [selectedTopProductStatus, setSelectedTopProductStatus] = useState("pending");
  const [productViewMode, setProductViewMode] = useState("ranking"); // "ranking", "bar", "donut"
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSortOrder, setProductSortOrder] = useState("desc"); // "desc", "asc", "alpha"
  const [productLimit, setProductLimit] = useState("10"); // "5", "10", "all"

  // Fetch owners and products metadata
  const fetchMetadata = useCallback(async () => {
    try {
      const res = await apiClient.get("/products/private");
      if (res.data?.success && res.data.products) {
        setProducts(res.data.products);
        const uniqueOwners = Array.from(
          new Set(res.data.products.map((p) => p.owner?._id).filter(Boolean))
        ).map((id) => res.data.products.find((p) => p.owner?._id === id).owner);
        setOwners(uniqueOwners);
      }
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  }, []);

  // Fetch stats data
  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await apiClient.get("/orders/stats", {
        params: {
          ownerId: ownerId || undefined,
          productId: productId || undefined,
          limit: 30, // Request up to 30 top products
        },
      });
      if (res.data?.success) {
        setStatsData(res.data.response);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      showToast(err.response?.data?.message || "Błąd pobierania statystyk", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [ownerId, productId, showToast]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  // Status key translator
  const translateStatus = useCallback(
    (statusKey) => {
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
        reserved: "approved",
      };
      const mappedKey = map[lowerKey] || lowerKey;
      return t(`statuses.${mappedKey}`) || statusKey;
    },
    [t]
  );

  // Sorted owners list
  const sortedOwners = useMemo(() => {
    return [...owners].sort((a, b) =>
      (a?.name || "").localeCompare(b?.name || "", language)
    );
  }, [owners, language]);

  // Filtered and grouped products for global filter dropdown
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => !ownerId || p.owner?._id === ownerId)
      .sort((a, b) => (a?.name || "").localeCompare(b?.name || "", language));
  }, [products, ownerId, language]);

  const searchedProducts = useMemo(() => {
    if (!productSearch) return filteredProducts;
    const query = productSearch.toLowerCase();
    return filteredProducts.filter((p) => {
      const matchName = (p.name || "").toLowerCase().includes(query);
      const matchCategory = (p.categories || []).some((cat) =>
        (cat?.name || "").toLowerCase().includes(query)
      );
      return matchName || matchCategory;
    });
  }, [filteredProducts, productSearch]);

  const groupedProducts = useMemo(() => {
    return searchedProducts.reduce((acc, product) => {
      const catName = product.categories?.[0]?.name || "Uncategorized";
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(product);
      return acc;
    }, {});
  }, [searchedProducts]);

  const selectedProduct = products.find((p) => p._id === productId);
  const selectedProductLabel = selectedProduct
    ? selectedProduct.name
    : language === "pl"
    ? "Wszystkie obiekty"
    : "All objects";

  // -------------------------------------------------------------
  // DATA PREPARATION FOR CHARTS
  // -------------------------------------------------------------

  // Status breakdown data
  const statusPieData = useMemo(() => {
    if (!statsData) return [];
    const items = [
      {
        id: "pending",
        name: translateStatus("pending"),
        value: statsData.totalItemsRequested || 0,
        color: STATUS_COLORS.pending,
      },
      {
        id: "approved",
        name: translateStatus("approved"),
        value: statsData.totalItemsApproved || 0,
        color: STATUS_COLORS.approved,
      },
      {
        id: "rented",
        name: translateStatus("rented"),
        value: statsData.totalItemsRented || 0,
        color: STATUS_COLORS.rented,
      },
      {
        id: "returned",
        name: translateStatus("returned"),
        value: statsData.totalItemsReturned || 0,
        color: STATUS_COLORS.returned,
      },
      {
        id: "rejected",
        name: translateStatus("rejected"),
        value: statsData.totalItemsRejected || 0,
        color: STATUS_COLORS.rejected,
      },
    ].filter((d) => d.value > 0);

    const total = items.reduce((sum, d) => sum + d.value, 0);
    return items.map((item) => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
    }));
  }, [statsData, translateStatus]);

  const totalStatusItems = useMemo(() => {
    return statusPieData.reduce((sum, d) => sum + d.value, 0);
  }, [statusPieData]);

  // Category popularity data
  const statusCategoryOptions = useMemo(() => {
    return Object.keys(statsData?.statisticMap || {});
  }, [statsData]);

  const rawCategoryData = useMemo(() => {
    if (!statsData?.statisticMap?.[selectedCategoryStatus]) return [];
    return statsData.statisticMap[selectedCategoryStatus].map((cat, idx) => ({
      name: cat._id || "Brak kategorii",
      requested: cat.totalRequested || 0,
      assigned: cat.totalAssigned || 0,
      value: cat.totalRequested || cat.totalAssigned || 0,
      color: PALETTE[idx % PALETTE.length],
    }));
  }, [statsData, selectedCategoryStatus]);

  // Filtered & limited category data
  const processedCategoryData = useMemo(() => {
    let list = [...rawCategoryData];

    // Filter by search query
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Sort descending by value
    list.sort((a, b) => b.value - a.value);

    // Calculate percentages
    const total = list.reduce((sum, c) => sum + c.value, 0);
    list = list.map((item) => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
    }));

    // Limit if requested
    if (categoryLimit === "5") return list.slice(0, 5);
    if (categoryLimit === "10") return list.slice(0, 10);
    return list;
  }, [rawCategoryData, categorySearchQuery, categoryLimit]);

  // Donut aggregated category data (groups items beyond top 5 into "Others")
  const donutCategoryData = useMemo(() => {
    if (processedCategoryData.length <= 6) return processedCategoryData;
    const top5 = processedCategoryData.slice(0, 5);
    const others = processedCategoryData.slice(5);
    const othersSum = others.reduce((acc, cur) => acc + cur.value, 0);
    const total = processedCategoryData.reduce((acc, cur) => acc + cur.value, 0);

    return [
      ...top5,
      {
        name: language === "pl" ? "Pozostałe" : "Others",
        value: othersSum,
        color: "#94a3b8", // slate-400
        percentage: total > 0 ? ((othersSum / total) * 100).toFixed(1) : 0,
      },
    ];
  }, [processedCategoryData, language]);

  // Top products data
  const topProductStatusOptions = useMemo(() => {
    return Object.keys(statsData?.topProducts || {});
  }, [statsData]);

  const rawTopProducts = useMemo(() => {
    if (!statsData?.topProducts?.[selectedTopProductStatus]) return [];
    return statsData.topProducts[selectedTopProductStatus].map((p, idx) => ({
      name: p._id || "Nieznany produkt",
      value: p.totalQuantity || 0,
      totalQuantity: p.totalQuantity || 0,
      color: PALETTE[idx % PALETTE.length],
    }));
  }, [statsData, selectedTopProductStatus]);

  // Filtered, sorted & limited top products
  const processedTopProducts = useMemo(() => {
    let list = [...rawTopProducts];

    // Filter by search query
    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Sort order
    if (productSortOrder === "desc") {
      list.sort((a, b) => b.totalQuantity - a.totalQuantity);
    } else if (productSortOrder === "asc") {
      list.sort((a, b) => a.totalQuantity - b.totalQuantity);
    } else if (productSortOrder === "alpha") {
      list.sort((a, b) => a.name.localeCompare(b.name, language));
    }

    // Calculate percentages relative to highest item
    const maxVal = Math.max(...list.map((p) => p.totalQuantity), 1);
    const total = list.reduce((sum, p) => sum + p.totalQuantity, 0);

    list = list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      relativePercent: Math.round((item.totalQuantity / maxVal) * 100),
      percentage: total > 0 ? ((item.totalQuantity / total) * 100).toFixed(1) : 0,
    }));

    // Limit
    if (productLimit === "5") return list.slice(0, 5);
    if (productLimit === "10") return list.slice(0, 10);
    return list;
  }, [rawTopProducts, productSearchQuery, productSortOrder, productLimit, language]);

  // Donut aggregated product data
  const donutProductData = useMemo(() => {
    if (processedTopProducts.length <= 6) return processedTopProducts;
    const top5 = processedTopProducts.slice(0, 5);
    const others = processedTopProducts.slice(5);
    const othersSum = others.reduce((acc, cur) => acc + cur.totalQuantity, 0);
    const total = processedTopProducts.reduce((acc, cur) => acc + cur.totalQuantity, 0);

    return [
      ...top5,
      {
        name: language === "pl" ? "Pozostałe" : "Others",
        value: othersSum,
        totalQuantity: othersSum,
        color: "#94a3b8",
        percentage: total > 0 ? ((othersSum / total) * 100).toFixed(1) : 0,
      },
    ];
  }, [processedTopProducts, language]);

  // Reset all filters
  const resetFilters = () => {
    setOwnerId("");
    setProductId("");
    setProductSearch("");
  };

  const hasActiveFilters = Boolean(ownerId || productId);

  if (loading) {
    return (
      <div className="w-full min-h-[600px] flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">{language === "pl" ? "Ładowanie statystyk..." : "Loading statistics..."}</p>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="font-semibold">{language === "pl" ? "Brak danych statystycznych." : "No statistics data available."}</p>
        <button
          onClick={() => fetchStats()}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-indigo-700 transition"
        >
          {t("statistics.refresh")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-900/20">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 transition-colors duration-300">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={"📊 " + t("nav.statistics")}
            subtitle={t("statistics.subtitle")}
          />
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition cursor-pointer disabled:opacity-60"
            title={t("statistics.refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-500" : ""}`} />
            <span>{t("statistics.refresh")}</span>
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Filter className="w-4 h-4 text-indigo-500" />
              <span>{language === "pl" ? "Filtry:" : "Filters:"}</span>
            </div>

            {/* Owner Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {t("statistics.owner")}:
              </span>
              <div className="relative select-none flex items-center">
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition cursor-pointer min-w-[120px] max-w-[170px] truncate"
                >
                  <option value="">{t("statistics.allOwners")}</option>
                  {sortedOwners.map((owner) => (
                    <option key={owner._id} value={owner._id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Product Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {t("statistics.product")}:
              </span>
              <div className="static sm:relative" ref={productDropdownRef}>
                <button
                  onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                  type="button"
                  className="text-xs text-left border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition cursor-pointer min-w-[140px] max-w-[200px] truncate relative"
                >
                  <span>{selectedProductLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </button>

                {isProductDropdownOpen && (
                  <div className="absolute left-4 right-4 sm:left-auto sm:right-0 mt-2 z-50 w-auto sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 flex flex-col gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder={t("statistics.searchPlaceholder")}
                        className="text-xs w-full border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 pl-8 pr-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin">
                      <button
                        onClick={() => {
                          setProductId("");
                          setIsProductDropdownOpen(false);
                          setProductSearch("");
                        }}
                        type="button"
                        className={`text-left text-xs px-3 py-2 rounded-xl transition font-semibold cursor-pointer ${
                          productId === ""
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {t("statistics.allProducts")}
                      </button>

                      {Object.keys(groupedProducts).length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
                          {language === "pl" ? "Brak produktów" : "No products found"}
                        </div>
                      ) : (
                        Object.entries(groupedProducts).map(([category, items]) => (
                          <div key={category} className="flex flex-col gap-1">
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-1 select-none">
                              {category}
                            </span>
                            {items.map((prod) => (
                              <button
                                key={prod._id}
                                onClick={() => {
                                  setProductId(prod._id);
                                  setIsProductDropdownOpen(false);
                                  setProductSearch("");
                                }}
                                type="button"
                                className={`text-left text-xs px-3 py-2 rounded-xl transition truncate cursor-pointer ${
                                  productId === prod._id
                                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                                    : "text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                }`}
                                title={prod.name}
                              >
                                {prod.name}
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

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold transition cursor-pointer border border-red-200/50 dark:border-red-900/30"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t("statistics.clearFilters")}</span>
            </button>
          )}
        </div>

        {/* Top KPI Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1: Total Volume */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t("statistics.totalVolume")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {totalStatusItems}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">{t("statistics.itemsCount")}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-semibold truncate">
              {language === "pl" ? "Całkowity obieg sprzętu" : "Total equipment turnover"}
            </div>
          </div>

          {/* Card 2: Pending Requests */}
          <div
            onClick={() => setSelectedCategoryStatus("pending")}
            className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border transition cursor-pointer hover:border-amber-400/80 dark:hover:border-amber-600 ${
              selectedCategoryStatus === "pending"
                ? "border-amber-500 shadow-md shadow-amber-500/10"
                : "border-slate-200 dark:border-slate-800 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t("statistics.pendingRequests")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-amber-500">
                {statsData.totalItemsRequested || 0}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">{t("statistics.itemsCount")}</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate">
              {language === "pl" ? "Wymaga weryfikacji" : "Awaiting approval"}
            </div>
          </div>

          {/* Card 3: Active Rentals */}
          <div
            onClick={() => setSelectedCategoryStatus("rented")}
            className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border transition cursor-pointer hover:border-indigo-400/80 dark:hover:border-indigo-600 ${
              selectedCategoryStatus === "rented"
                ? "border-indigo-500 shadow-md shadow-indigo-500/10"
                : "border-slate-200 dark:border-slate-800 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t("statistics.activeRentals")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {statsData.totalItemsRented || 0}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">{t("statistics.itemsCount")}</span>
            </div>
            <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
              {language === "pl" ? "Aktualnie w użyciu" : "Currently with users"}
            </div>
          </div>

          {/* Card 4: Reserved / Prepared */}
          <div
            onClick={() => setSelectedCategoryStatus("approved")}
            className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border transition cursor-pointer hover:border-emerald-400/80 dark:hover:border-emerald-600 ${
              selectedCategoryStatus === "approved"
                ? "border-emerald-500 shadow-md shadow-emerald-500/10"
                : "border-slate-200 dark:border-slate-800 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t("statistics.reservedPrepared")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-500">
                {statsData.totalItemsApproved || 0}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">{t("statistics.itemsCount")}</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              {language === "pl" ? "Gotowe do odbioru" : "Ready for pickup"}
            </div>
          </div>

          {/* Card 5: Completed Returns */}
          <div
            onClick={() => setSelectedCategoryStatus("returned")}
            className={`col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border transition cursor-pointer hover:border-sky-400/80 dark:hover:border-sky-600 ${
              selectedCategoryStatus === "returned"
                ? "border-sky-500 shadow-md shadow-sky-500/10"
                : "border-slate-200 dark:border-slate-800 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t("statistics.completedReturns")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-sky-500">
                {statsData.totalItemsReturned || 0}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">{t("statistics.itemsCount")}</span>
            </div>
            <div className="mt-2 text-[11px] text-sky-600 dark:text-sky-400 font-semibold truncate">
              {language === "pl" ? "Zwrócone do magazynu" : "Returned to storage"}
            </div>
          </div>
        </div>

        {/* Section 1 & Section 2 Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0">
          
          {/* Card 1: Registered Orders by Status (Col span 5) */}
          <div className="xl:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {t("statistics.registeredOrders")}
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {language === "pl" ? "Struktura statusów wypożyczeń" : "Status share breakdown"}
                  </p>
                </div>
              </div>
            </div>

            {statusPieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
                {t("statistics.noData")}
              </div>
            ) : (
              <div className="flex flex-col md:flex-row xl:flex-col items-center gap-6 py-2">
                {/* Donut Chart with central counter */}
                <div className="w-full md:w-1/2 xl:w-full h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`status-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip unit={t("statistics.itemsCount")} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Text in Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                      {totalStatusItems}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                      {language === "pl" ? "Łącznie" : "Total"}
                    </span>
                  </div>
                </div>

                {/* Status Breakdown List with Progress Bars */}
                <div className="w-full md:w-1/2 xl:w-full flex flex-col gap-2.5">
                  {statusPieData.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCategoryStatus(item.id)}
                      className="group flex flex-col gap-1 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.value} {t("statistics.itemsCount")}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium min-w-[36px] text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      {/* Visual progress bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Category Popularity (Col span 7) - Built for High Volume */}
          <div className="xl:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            {/* Header with Status Select & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {t("statistics.categoryPopularity")}
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {language === "pl" ? "Wolumen według kategorii obiektów" : "Volume per equipment category"}
                  </p>
                </div>
              </div>

              {/* Status Select & View Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Selector */}
                <div className="relative select-none flex items-center">
                  <select
                    value={selectedCategoryStatus}
                    onChange={(e) => setSelectedCategoryStatus(e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition cursor-pointer"
                  >
                    {statusCategoryOptions.map((status) => (
                      <option key={status} value={status}>
                        {translateStatus(status)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none" />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-0.5">
                  <button
                    onClick={() => setCategoryViewMode("bar")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      categoryViewMode === "bar"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-bold"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                    title={t("statistics.barChart")}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCategoryViewMode("donut")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      categoryViewMode === "donut"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-bold"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                    title={t("statistics.donutChart")}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCategoryViewMode("table")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      categoryViewMode === "table"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-bold"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                    title={t("statistics.tableView")}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-toolbar: Search & Limits */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder={t("statistics.searchCategory")}
                  className="w-full text-xs pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Limit selector */}
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <span className="text-slate-400 mr-1">{language === "pl" ? "Pokaż:" : "Show:"}</span>
                {["5", "10", "all"].map((lim) => (
                  <button
                    key={lim}
                    onClick={() => setCategoryLimit(lim)}
                    className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                      categoryLimit === lim
                        ? "bg-indigo-600 text-white font-extrabold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {lim === "all" ? t("statistics.all") : lim}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area based on View Mode */}
            {processedCategoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
                {t("statistics.noData")}
              </div>
            ) : (
              <div className="flex-1 min-h-[300px]">
                {categoryViewMode === "bar" && (
                  <div className="w-full h-80 overflow-y-auto pr-1 scrollbar-thin">
                    <ResponsiveContainer width="100%" height={Math.max(280, processedCategoryData.length * 40)}>
                      <BarChart
                        data={processedCategoryData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                        <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={140}
                          fontSize={11}
                          stroke="#94a3b8"
                          tickFormatter={(val) => truncateText(val, 18)}
                        />
                        <Tooltip content={<CustomChartTooltip unit={t("statistics.itemsCount")} />} />
                        <Bar
                          dataKey="value"
                          name="Ilość"
                          radius={[0, 8, 8, 0]}
                          barSize={20}
                        >
                          {processedCategoryData.map((entry, index) => (
                            <Cell key={`cat-cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {categoryViewMode === "donut" && (
                  <div className="w-full h-80 flex flex-col md:flex-row items-center justify-center gap-4">
                    <div className="w-full md:w-1/2 h-64 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutCategoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {donutCategoryData.map((entry, index) => (
                              <Cell key={`donut-cat-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomChartTooltip unit={t("statistics.itemsCount")} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full md:w-1/2 max-h-64 overflow-y-auto pr-2 flex flex-col gap-1.5 scrollbar-thin">
                      {donutCategoryData.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white shrink-0 ml-2">
                            {item.value} {t("statistics.itemsCount")} ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {categoryViewMode === "table" && (
                  <div className="w-full max-h-80 overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">{t("statistics.category")}</th>
                          <th className="py-2.5 px-3 text-right">{t("statistics.requested")}</th>
                          <th className="py-2.5 px-3 text-right">{t("statistics.assigned")}</th>
                          <th className="py-2.5 px-3 text-right">{t("statistics.share")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                        {processedCategoryData.map((cat, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="truncate max-w-[200px]" title={cat.name}>
                                {cat.name}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">{cat.requested} {t("statistics.itemsCount")}</td>
                            <td className="py-2.5 px-3 text-right">{cat.assigned} {t("statistics.itemsCount")}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {cat.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Top Products & Equipment Demand - Built for High Volume */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {t("statistics.topProducts")}
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {language === "pl" ? "Ranking najczęściej zamawianych obiektów i sprzętu" : "Leaderboard of most requested hardware"}
                </p>
              </div>
            </div>

            {/* Controls: Status, Sort, Limit, View Mode */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Status Selector */}
              <div className="relative select-none flex items-center">
                <select
                  value={selectedTopProductStatus}
                  onChange={(e) => setSelectedTopProductStatus(e.target.value)}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition cursor-pointer"
                >
                  {topProductStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {translateStatus(status)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-0.5">
                <button
                  onClick={() => setProductViewMode("ranking")}
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs ${
                    productViewMode === "ranking"
                      ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-bold"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                  }`}
                  title={t("statistics.rankingView")}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("statistics.rankingView")}</span>
                </button>
                <button
                  onClick={() => setProductViewMode("bar")}
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs ${
                    productViewMode === "bar"
                      ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-bold"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                  }`}
                  title={t("statistics.barChart")}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("statistics.barChart")}</span>
                </button>
                <button
                  onClick={() => setProductViewMode("donut")}
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs ${
                    productViewMode === "donut"
                      ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs font-bold"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                  }`}
                  title={t("statistics.donutChart")}
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("statistics.donutChart")}</span>
                </button>
              </div>

              {/* Limit selector */}
              <div className="flex items-center gap-1 text-[11px] font-bold">
                {["5", "10", "all"].map((lim) => (
                  <button
                    key={lim}
                    onClick={() => setProductLimit(lim)}
                    className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                      productLimit === lim
                        ? "bg-indigo-600 text-white font-extrabold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {lim === "all" ? t("statistics.all") : lim}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search bar & sort for Products */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-[160px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder={t("statistics.searchProducts")}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === "pl" ? "Sortowanie:" : "Sort:"}
              </span>
              <button
                onClick={() =>
                  setProductSortOrder((prev) => (prev === "desc" ? "asc" : prev === "asc" ? "alpha" : "desc"))
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>
                  {productSortOrder === "desc"
                    ? language === "pl" ? "Najwięcej sztuk ↓" : "Highest quantity ↓"
                    : productSortOrder === "asc"
                    ? language === "pl" ? "Najmniej sztuk ↑" : "Lowest quantity ↑"
                    : "Alfabetycznie A-Z"}
                </span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          {processedTopProducts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-medium">
              {t("statistics.noData")}
            </div>
          ) : (
            <div className="min-h-[280px]">
              {/* View 1: Leaderboard Ranking Cards (Most useful for products) */}
              {productViewMode === "ranking" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                  {processedTopProducts.map((prod) => {
                    const isTop1 = prod.rank === 1;
                    const isTop2 = prod.rank === 2;
                    const isTop3 = prod.rank === 3;

                    return (
                      <div
                        key={prod.name}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-850 hover:shadow-sm transition-all duration-200 flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Rank badge */}
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                isTop1
                                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                                  : isTop2
                                  ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                                  : isTop3
                                  ? "bg-amber-700/80 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold"
                              }`}
                            >
                              {prod.rank}
                            </div>
                            <span
                              className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate"
                              title={prod.name}
                            >
                              {prod.name}
                            </span>
                          </div>

                          {/* Quantity badge */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                              {prod.totalQuantity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{t("statistics.itemsCount")}</span>
                          </div>
                        </div>

                        {/* Relative visual bar */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                              style={{ width: `${prod.relativePercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold min-w-[32px] text-right">
                            {prod.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View 2: Horizontal Bar Chart */}
              {productViewMode === "bar" && (
                <div className="w-full h-80 overflow-y-auto pr-1 scrollbar-thin">
                  <ResponsiveContainer width="100%" height={Math.max(280, processedTopProducts.length * 40)}>
                    <BarChart
                      data={processedTopProducts}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                      <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={160}
                        fontSize={11}
                        stroke="#94a3b8"
                        tickFormatter={(val) => truncateText(val, 22)}
                      />
                      <Tooltip content={<CustomChartTooltip unit={t("statistics.itemsCount")} />} />
                      <Bar
                        dataKey="totalQuantity"
                        name="Ilość"
                        fill="#6366f1"
                        radius={[0, 8, 8, 0]}
                        barSize={20}
                      >
                        {processedTopProducts.map((entry, index) => (
                          <Cell key={`prod-cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* View 3: Donut Chart */}
              {productViewMode === "donut" && (
                <div className="w-full h-80 flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="w-full md:w-1/2 h-64 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutProductData}
                          dataKey="totalQuantity"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {donutProductData.map((entry, index) => (
                            <Cell key={`donut-prod-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip unit={t("statistics.itemsCount")} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full md:w-1/2 max-h-64 overflow-y-auto pr-2 flex flex-col gap-1.5 scrollbar-thin">
                    {donutProductData.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white shrink-0 ml-2">
                          {item.totalQuantity} {t("statistics.itemsCount")} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
