import React, { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Search, Filter, ShoppingCart, ArrowLeft, Grid, List, Plus, Minus, Info, Box, Check, AlertTriangle, Eye, HelpCircle } from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

const GuestProducts = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { menuCategory } = useParams();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [extraColumns, setExtraColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(menuCategory || "");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [cart, setCart] = useState(
    () => JSON.parse(localStorage.getItem("cart")) || [],
  );
  const [cartQuantities, setCartQuantities] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const itemsPerPage = 12; // 12 fits grid layouts perfectly (3 or 4 columns)

  const allColumns = [
    "name",
    "description",
    "categories",
    ...extraColumns,
    "available",
  ];
  const hiddenColumns = [];

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const handlePreview = (productId) => {
    if (!productId) return;
    navigate("/preview", { state: { productId } });
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/products/public");
      const allExtraKeys = new Set(extraColumns);

      res.data.products.forEach((p) => {
        if (p.extraFields)
          Object.keys(p.extraFields).forEach((k) => allExtraKeys.add(k));
      });

      const updatedProducts = res.data.products.map((p) => {
        const newExtraFields = {};
        [...allExtraKeys].forEach((col) => {
          newExtraFields[col] = p.extraFields?.[col] || "";
        });
        return { ...p, extraFields: newExtraFields };
      });

      setExtraColumns([...allExtraKeys]);
      setProducts(updatedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/categories/public");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    setCartQuantities((prev) => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const newQuantities = {};
      cart.forEach(
        (cartItem) => (newQuantities[cartItem._id] = cartItem.quantity),
      );
      return newQuantities;
    });
  }, []);

  useEffect(() => {
    setCartQuantities((prev) => {
      const newQuantities = { ...prev };
      products.forEach((p) => {
        if (p._id && newQuantities[p._id] === undefined)
          newQuantities[p._id] = 0;
      });
      return newQuantities;
    });
  }, [products]);

  useEffect(() => {
    let filtered = products.filter((p) => {
      const searchLower = searchTerm.toLowerCase();
      if (p.name.toLowerCase().includes(searchLower)) return true;
      if (p.description && p.description.toLowerCase().includes(searchLower))
        return true;
      if (
        Object.values(p.extraFields || {}).some((val) =>
          val.toString().toLowerCase().includes(searchLower),
        )
      )
        return true;
      return false;
    });

    if (activeCategory) {
      filtered = filtered.filter((p) =>
        p.categories?.some((cat) => cat._id === activeCategory),
      );
    }

    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key] ?? a.extraFields?.[sortConfig.key] ?? "";
        let valB = b[sortConfig.key] ?? b.extraFields?.[sortConfig.key] ?? "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, sortConfig, activeCategory]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const handleQuantityChange = (productId, value, product) => {
    let qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) qty = 0;
    const maxQty = product.stockForRent || 0;
    if (qty > maxQty) qty = maxQty;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item._id === productId,
      );
      if (existingIndex !== -1) {
        const newCart = [...prevCart];
        if (qty === 0) {
          newCart.splice(existingIndex, 1);
        } else {
          newCart[existingIndex].quantity = qty;
        }
        return newCart;
      } else if (qty > 0) {
        return [...prevCart, { ...product, quantity: qty }];
      }
      return prevCart;
    });

    setCartQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const getAvailableStockForProduct = (product) =>
    Math.max(
      0,
      Number(product.stockForRent || 0) -
        Number(product.stockRentedOut || 0) -
        Number(product.stockReserved || 0),
    );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        
        {/* Main Card Header */}
        <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition duration-200">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-650 dark:text-indigo-400 select-none">
              {t("guest.subtitle")}
            </p>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {t("guest.title")}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle (Grid/List) */}
            <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/60 p-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "text-slate-505 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-250"
                }`}
                title={language === "pl" ? "Siatka" : "Grid"}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "text-slate-505 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-250"
                }`}
                title={language === "pl" ? "Lista" : "List"}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition duration-100 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("guest.backHome")}
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition duration-100 cursor-pointer flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {t("guest.viewCart")}
              <span className="bg-indigo-700 text-white font-black px-2 py-0.5 rounded-md text-[10px]">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </button>
          </div>
        </div>

        {/* Filters and Stats Row */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_300px] w-full">
          {/* Filters card */}
          <div className="min-w-0 rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-5">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Filter className="w-3.5 h-3.5" />
              {language === "pl" ? "Filtry katalogu" : "Catalog Filters"}
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* Search text field */}
              <div className="flex flex-col gap-1.5 relative w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t("guest.searchPlaceholder")}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition"
                    onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                  />
                </div>
              </div>

              {/* Category Slider */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                  {language === "pl" ? "Kategorie" : "Categories"}
                </span>
                <div className="flex overflow-x-auto pb-1 -mx-1 px-1 gap-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <button
                    onClick={() => setActiveCategory("")}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                      activeCategory === "" 
                        ? "bg-indigo-600 text-white shadow-md border border-indigo-600" 
                        : "bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {t("guest.allCategories")}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setActiveCategory(cat._id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                        activeCategory === cat._id 
                          ? "bg-indigo-600 text-white shadow-md border border-indigo-600" 
                          : "bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick info card */}
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-indigo-650 to-indigo-700 text-white dark:from-slate-900 dark:to-slate-900/60 dark:text-slate-300 p-6 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200 dark:text-indigo-400 select-none flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {t("guest.quickInfo")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
                <div className="bg-white/10 dark:bg-slate-950/30 p-2.5 rounded-xl border border-white/5 dark:border-slate-850/60">
                  <span className="text-[9px] block text-indigo-200 dark:text-slate-500 uppercase tracking-wider mb-0.5">{language === "pl" ? "Pasujących" : "Matched"}</span>
                  <span className="text-base font-extrabold text-white dark:text-slate-200">{filteredProducts.length} {t("guest.items")}</span>
                </div>
                <div className="bg-white/10 dark:bg-slate-950/30 p-2.5 rounded-xl border border-white/5 dark:border-slate-900/60">
                  <span className="text-[9px] block text-indigo-200 dark:text-slate-500 uppercase tracking-wider mb-0.5">{t("guest.totalInCart")}</span>
                  <span className="text-base font-extrabold text-white dark:text-slate-200">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-indigo-100 dark:text-slate-450 leading-relaxed italic select-none">
              {t("guest.useFilters")}
            </p>
          </div>
        </div>

        {/* Loading and Catalog Listing */}
        {loading ? (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center text-slate-400 font-bold select-none">
            <svg className="animate-spin w-8 h-8 mx-auto mb-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("guest.loading")}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 p-16 text-center text-slate-450 dark:text-slate-505 font-semibold select-none flex flex-col items-center gap-2">
            <AlertTriangle className="w-10 h-10 text-slate-400" />
            {t("guest.noProducts")}
          </div>
        ) : viewMode === "grid" ? (
          /* Premium Product Cards Grid View */
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((p) => {
              const availableQty = getAvailableStockForProduct(p);
              const inCartQty = cartQuantities[p._id] || 0;
              const hasNoStock = availableQty <= 0;

              return (
                <div
                  key={p._id}
                  onClick={(e) => {
                    if (e.target.closest("button, select, input, option, a")) return;
                    handlePreview(p._id);
                  }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col h-full cursor-pointer relative"
                >
                  {/* Image Area */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={`${API_BASE}/uploads/products/${p.images.find(i => i.isVisible)?.filename || p.images[0].filename}`}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-500/10 to-purple-650/15 dark:from-indigo-950/20 dark:to-purple-950/20 flex items-center justify-center text-slate-400 text-3xl select-none group-hover:scale-105 transition-transform duration-500">
                        📦
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {hasNoStock ? (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-lg border border-rose-100/40 bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 shadow-sm select-none">
                          {language === "pl" ? "Niedostępne" : "Unavailable"}
                        </span>
                      ) : availableQty <= 3 ? (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-lg border border-amber-100/40 bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400 shadow-sm select-none">
                          {language === "pl" ? "Niski zapas" : "Low stock"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-lg border border-emerald-100/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 shadow-sm select-none">
                          {language === "pl" ? "Dostępne" : "Available"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    {/* Category Tags */}
                    {p.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat._id}
                            className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-305 border border-indigo-100/30 dark:border-indigo-900/20 px-2 py-0.5 rounded-lg text-[9px] font-bold"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors" title={p.name}>
                      {p.name}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed" title={p.description}>
                      {p.description || "—"}
                    </p>

                    {/* Specs / Custom Fields */}
                    {Object.keys(p.extraFields || {}).length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-1 flex flex-col gap-1">
                        {Object.entries(p.extraFields).slice(0, 2).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                            <span className="capitalize">{key}:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{val || "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Push picker to bottom */}
                    <div className="flex-1 min-h-[4px]"></div>

                    {/* Quantity Picker & Action */}
                    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center text-xs font-bold text-slate-400 select-none">
                        <span>{language === "pl" ? "Sztuk" : "Stock"}:</span>
                        <span className="ml-1 text-slate-700 dark:text-slate-300 font-extrabold">{availableQty}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Eye details button */}
                        <button
                          type="button"
                          onClick={() => handlePreview(p._id)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
                          title={language === "pl" ? "Szczegóły" : "Details"}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Interactive Pill */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p._id, inCartQty - 1, p)}
                            disabled={inCartQty <= 0}
                            className="p-1.5 text-slate-600 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer leading-none"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            max={availableQty}
                            value={inCartQty}
                            onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                            className="w-10 text-center text-xs font-extrabold text-slate-800 dark:text-slate-200 bg-transparent border-0 outline-none select-none appearance-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p._id, inCartQty + 1, p)}
                            disabled={inCartQty >= availableQty}
                            className="p-1.5 text-slate-600 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer leading-none"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Premium Product List Table View */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    {allColumns.map((col) => {
                      const colTrans = t(`products.columns.${col}`);
                      const displayName = colTrans.startsWith("products.columns.")
                        ? (col === "available" ? t("guest.available") : col)
                        : colTrans;
                      
                      const isSorted = sortConfig.key === col;
                      return (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="p-4 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-950 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{displayName}</span>
                            {isSorted && (
                              <span className="text-[10px] text-indigo-500 font-mono">
                                {sortConfig.direction === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    <th className="p-4 w-44 text-center">{t("guest.quantity")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedProducts.map((p) => {
                    const availableQty = getAvailableStockForProduct(p);
                    const inCartQty = cartQuantities[p._id] || 0;
                    
                    return (
                      <tr
                        key={p._id}
                        onClick={(e) => {
                          if (e.target.closest("button, select, input, option, a")) return;
                          handlePreview(p._id);
                        }}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition cursor-pointer"
                      >
                        {/* Render all table cells */}
                        {allColumns.map((col) => (
                          <td key={col} className="p-4 text-xs font-medium text-slate-700 dark:text-slate-350 max-w-[200px] truncate">
                            {col === "name" ? (
                              <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-650 hover:underline">
                                {p.name}
                              </span>
                            ) : col === "available" ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                                availableQty <= 0
                                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-400"
                                  : availableQty <= 3
                                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
                                    : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              }`}>
                                {availableQty}
                              </span>
                            ) : col === "description" ? (
                              <span className="text-slate-500 dark:text-slate-400 truncate block max-w-[200px]">{p.description || "—"}</span>
                            ) : col === "categories" ? (
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {p.categories?.map((c) => (
                                  <span key={c._id} className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-755 dark:text-indigo-305 border border-indigo-100/30 dark:border-indigo-900/20 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                    {c.name}
                                  </span>
                                ))}
                                {(!p.categories || p.categories.length === 0) && <span className="text-slate-400">—</span>}
                              </div>
                            ) : (
                              <span>{p[col] ?? p.extraFields?.[col] ?? "—"}</span>
                            )}
                          </td>
                        ))}

                        {/* List quantity picker */}
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(p._id, inCartQty - 1, p)}
                              disabled={inCartQty <= 0}
                              className="p-1.5 text-slate-600 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer leading-none"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            
                            <input
                              type="number"
                              min="0"
                              max={availableQty}
                              value={inCartQty}
                              onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                              className="w-10 text-center text-xs font-extrabold text-slate-800 dark:text-slate-200 bg-transparent border-0 outline-none select-none appearance-none"
                            />

                            <button
                              type="button"
                              onClick={() => handleQuantityChange(p._id, inCartQty + 1, p)}
                              disabled={inCartQty >= availableQty}
                              className="p-1.5 text-slate-600 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer leading-none"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-905 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-450 dark:text-slate-505">
            {language === "pl"
              ? `Razem: ${filteredProducts.length} produktów`
              : `Total: ${filteredProducts.length} products`}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition duration-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {t("common.prev")}
            </button>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3">
              {currentPage} / {Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
                  )
                )
              }
              disabled={currentPage === Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition duration-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {t("common.next")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GuestProducts;
