import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  Search,
  Filter,
  ShoppingCart,
  ArrowLeft,
  Grid,
  List,
  Plus,
  Minus,
  Box,
  Check,
  AlertTriangle,
  Eye,
  HelpCircle,
  ChevronDown,
  ChevronsUpDown,
  Folder,
  FolderOpen,
  Layers,
  X,
  FolderTree,
  ListTree,
  Package,
} from "lucide-react";
import Btn from "../components/layout/Btn";
import NavArrowBtn from "../components/layout/NavArrowBtn";

const API_BASE = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

const getImageUrl = (product) => {
  if (!product || !product.images || !Array.isArray(product.images) || product.images.length === 0) {
    return null;
  }
  const imgObj = product.images.find((i) => i && (i.isVisible || i.visible)) || product.images[0];
  if (!imgObj) return null;

  let rawPath = "";
  if (typeof imgObj === "string") {
    rawPath = imgObj;
  } else if (typeof imgObj === "object") {
    rawPath = imgObj.filename || imgObj.path || imgObj.url || imgObj.src || imgObj.originalName || "";
  }

  if (!rawPath) return null;
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return rawPath;
  }

  const fileName = rawPath.includes("/") || rawPath.includes("\\")
    ? rawPath.split(/[\/\\]/).pop()
    : rawPath;

  if (!fileName) return null;
  return `${API_BASE}/uploads/products/${fileName}`;
};

const GuestProducts = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { menuCategory } = useParams();

  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("search") || location.state?.search || "";

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [extraColumns, setExtraColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search");
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [location.search]);
  const [activeCategory, setActiveCategory] = useState(menuCategory || "");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [cart, setCart] = useState(
    () => JSON.parse(localStorage.getItem("cart")) || [],
  );
  const [cartQuantities, setCartQuantities] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categoryViewMode, setCategoryViewMode] = useState("accordion"); // "accordion" | "dropdown"

  // Build hierarchical category tree from categories array
  const categoryTree = useMemo(() => {
    const map = new Map();
    const roots = [];

    categories.forEach((cat) => {
      const id = cat._id.toString();
      const parentId = cat.parent?._id
        ? cat.parent._id.toString()
        : typeof cat.parent === "string"
        ? cat.parent
        : null;

      map.set(id, {
        _id: id,
        name: cat.name,
        nameEn: cat.nameEn || "",
        parentId,
        children: [],
      });
    });

    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
        const nameA = (language === "en" && a.nameEn ? a.nameEn : a.name) || "";
        const nameB = (language === "en" && b.nameEn ? b.nameEn : b.name) || "";
        return nameA.localeCompare(nameB);
      });
      nodes.forEach((n) => {
        if (n.children.length > 0) sortNodes(n.children);
      });
    };
    sortNodes(roots);

    return roots;
  }, [categories, language]);

  // Recursively collect descendant IDs
  const categoryDescendantsMap = useMemo(() => {
    const map = {};
    const getDescendants = (id) => {
      const list = [];
      categories.forEach((c) => {
        const pId = c.parent?._id
          ? c.parent._id.toString()
          : typeof c.parent === "string"
          ? c.parent
          : null;
        if (pId === id) {
          list.push(c._id.toString());
          list.push(...getDescendants(c._id.toString()));
        }
      });
      return list;
    };

    categories.forEach((cat) => {
      const id = cat._id.toString();
      map[id] = [id, ...getDescendants(id)];
    });
    return map;
  }, [categories]);

  // Calculate product count for each category (including products tagged with descendant categories)
  const categoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach((cat) => {
      const id = cat._id.toString();
      const targetIds = categoryDescendantsMap[id] || [id];
      const count = products.filter((p) =>
        p.categories?.some((c) => targetIds.includes(c._id?.toString())),
      ).length;
      counts[id] = count;
    });
    return counts;
  }, [products, categories, categoryDescendantsMap]);

  // Currently active category object
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c._id.toString() === activeCategory);
  }, [activeCategory, categories]);

  // Automatically expand parent of active category if a child is selected
  useEffect(() => {
    if (!activeCategory) return;
    const cat = categories.find((c) => c._id.toString() === activeCategory);
    const parentId = cat?.parent?._id
      ? cat.parent._id.toString()
      : typeof cat?.parent === "string"
      ? cat.parent
      : null;
    if (parentId) {
      setExpandedCategories((prev) => ({ ...prev, [parentId]: true }));
    }
  }, [activeCategory, categories]);

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allExpanded = useMemo(() => {
    const parentNodes = categoryTree.filter((r) => r.children.length > 0);
    if (parentNodes.length === 0) return false;
    return parentNodes.every((r) => expandedCategories[r._id]);
  }, [categoryTree, expandedCategories]);

  const toggleAllExpanded = () => {
    if (allExpanded) {
      setExpandedCategories({});
    } else {
      const newExpanded = {};
      categoryTree.forEach((r) => {
        if (r.children.length > 0) newExpanded[r._id] = true;
      });
      setExpandedCategories(newExpanded);
    }
  };
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("guest_products_view_mode") || "list";
  });
  const itemsPerPage = 12; // 12 fits grid layouts perfectly (3 or 4 columns)

  useEffect(() => {
    localStorage.setItem("guest_products_view_mode", viewMode);
  }, [viewMode]);

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
    try {
      sessionStorage.setItem("last_preview_product_id", productId);
    } catch (e) {}
    navigate(`/preview?id=${productId}`, { state: { productId } });
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/products/public");
      const allExtraKeys = new Set();

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
      if (
        Array.isArray(p.tags) &&
        p.tags.some(
          (t) => typeof t === "string" && t.toLowerCase().includes(searchLower),
        )
      )
        return true;
      return false;
    });

    if (activeCategory) {
      const targetIds = categoryDescendantsMap[activeCategory] || [activeCategory];
      filtered = filtered.filter((p) =>
        p.categories?.some((cat) => targetIds.includes(cat._id?.toString())),
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
  }, [products, searchTerm, sortConfig, activeCategory, categoryDescendantsMap]);

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
        <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-4 transition duration-200">
          <div>
            <Btn
              onClick={() => navigate("/")}
              variant="secondary"
              className="py-1.5 px-3.5 text-xs font-bold shadow-2xs gap-1.5 inline-flex"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("guest.backHome")}</span>
            </Btn>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              {t("guest.title")}
            </h1>
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
      </div>

        {/* Filters Card */}
        <div className="w-full rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Filter className="w-3.5 h-3.5" />
              {language === "pl" ? "Filtry katalogu" : "Catalog Filters"}
            </h3>

            {(activeCategory || searchTerm) && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {language === "pl" ? "Znaleziono:" : "Found:"}{" "}
                  <strong className="text-slate-900 dark:text-white font-black">{filteredProducts.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("");
                    setSearchTerm("");
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer ml-1"
                >
                  {language === "pl" ? "Wyczyść filtry" : "Clear filters"}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Search text field */}
            <div className="flex flex-col gap-1.5 relative w-full">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("guest.searchPlaceholder")}
                  value={searchTerm}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition"
                  onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Collapsible Section (Listy zwijane) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
                    {language === "pl" ? "Kategorie" : "Categories"}
                  </span>
                  {activeCategory && activeCategoryObj && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory("")}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer"
                      title={language === "pl" ? "Wyczyść filtr kategorii" : "Clear category filter"}
                    >
                      <span className="truncate max-w-[140px]">
                        {language === "en" && activeCategoryObj.nameEn
                          ? activeCategoryObj.nameEn
                          : activeCategoryObj.name}
                      </span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Expand / Collapse all toggle */}
                  {categoryViewMode === "accordion" && categoryTree.some((r) => r.children.length > 0) && (
                    <button
                      type="button"
                      onClick={toggleAllExpanded}
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                    >
                      <ChevronsUpDown className="w-3 h-3" />
                      {allExpanded
                        ? language === "pl" ? "Zwiń wszystkie" : "Collapse all"
                        : language === "pl" ? "Rozwiń wszystkie" : "Expand all"}
                    </button>
                  )}

                  {/* View Switcher: Accordion vs Dropdown */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setCategoryViewMode("accordion")}
                      className={`p-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        categoryViewMode === "accordion"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                      title={language === "pl" ? "Widok list zwijanych" : "Collapsible lists view"}
                    >
                      <ListTree className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryViewMode("dropdown")}
                      className={`p-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        categoryViewMode === "dropdown"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                      title={language === "pl" ? "Lista rozwijana" : "Dropdown list view"}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* View 1: Accordion / Collapsible Lists (Listy zwijane) */}
              {categoryViewMode === "accordion" ? (
                <div className="flex flex-col gap-2">
                  {/* All Categories Option */}
                  <button
                    type="button"
                    onClick={() => setActiveCategory("")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition cursor-pointer group ${
                      activeCategory === ""
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className={`w-4 h-4 shrink-0 ${activeCategory === "" ? "text-white" : "text-indigo-500"}`} />
                      <span className="text-xs font-extrabold truncate">
                        {t("guest.allCategories")}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      activeCategory === ""
                        ? "bg-indigo-700 text-white"
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {products.length}
                    </span>
                  </button>

                  {/* Collapsible Category Cards Container */}
                  <div className="max-h-80 overflow-y-auto pr-1 flex flex-col gap-2">
                    {categoryTree.map((rootCat) => {
                      const hasChildren = rootCat.children && rootCat.children.length > 0;
                      const isExpanded = !!expandedCategories[rootCat._id];
                      const isActive = activeCategory === rootCat._id;
                      const isDescendantActive =
                        hasChildren &&
                        (categoryDescendantsMap[rootCat._id] || []).includes(activeCategory) &&
                        !isActive;
                      const rootCount = categoryCounts[rootCat._id] ?? 0;
                      const catDisplayName = language === "en" && rootCat.nameEn ? rootCat.nameEn : rootCat.name;

                      return (
                        <div
                          key={rootCat._id}
                          className={`rounded-xl border transition-all ${
                            isActive
                              ? "border-indigo-500/80 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/25 shadow-2xs"
                              : isDescendantActive
                              ? "border-indigo-300/60 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10"
                              : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          {/* Main Category Header Row */}
                          <div className="flex items-center justify-between p-1.5 sm:p-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveCategory(rootCat._id)}
                              className="flex items-center gap-2 flex-1 text-left min-w-0 cursor-pointer py-0.5 px-1 rounded-lg group"
                            >
                              {isExpanded ? (
                                <FolderOpen className={`w-4 h-4 shrink-0 transition-colors ${
                                  isActive || isDescendantActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-indigo-500"
                                }`} />
                              ) : (
                                <Folder className={`w-4 h-4 shrink-0 transition-colors ${
                                  isActive || isDescendantActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-indigo-500"
                                }`} />
                              )}
                              <span className={`text-xs truncate ${
                                isActive
                                  ? "font-black text-indigo-700 dark:text-indigo-300"
                                  : isDescendantActive
                                  ? "font-bold text-indigo-600 dark:text-indigo-400"
                                  : "font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                              }`}>
                                {catDisplayName}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                                {rootCount}
                              </span>
                            </button>

                            {/* Toggle Chevron for Subcategories */}
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategory(rootCat._id);
                                }}
                                className={`p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer ${
                                  isExpanded ? "rotate-180 text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-950/60" : ""
                                }`}
                                title={isExpanded ? (language === "pl" ? "Zwiń podkategorie" : "Collapse subcategories") : (language === "pl" ? "Rozwiń podkategorie" : "Expand subcategories")}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Subcategories Collapsible List (Lista zwijana) */}
                          {hasChildren && isExpanded && (
                            <div className="px-3 pb-2.5 pt-1 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap gap-1.5 animate-in fade-in duration-200">
                              <button
                                type="button"
                                onClick={() => setActiveCategory(rootCat._id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                  isActive
                                    ? "bg-indigo-600 text-white shadow-2xs"
                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:text-indigo-600"
                                }`}
                              >
                                <span>{language === "pl" ? "Wszystkie w tej grupie" : "All in this group"}</span>
                                <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                                  isActive ? "bg-indigo-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}>
                                  {rootCount}
                                </span>
                              </button>

                              {rootCat.children.map((child) => {
                                const isChildSelected = activeCategory === child._id;
                                const childCount = categoryCounts[child._id] ?? 0;
                                const childDisplayName = language === "en" && child.nameEn ? child.nameEn : child.name;

                                return (
                                  <button
                                    key={child._id}
                                    type="button"
                                    onClick={() => setActiveCategory(child._id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                      isChildSelected
                                        ? "bg-indigo-600 text-white shadow-2xs"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                                    }`}
                                  >
                                    <span>{childDisplayName}</span>
                                    <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                                      isChildSelected ? "bg-indigo-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    }`}>
                                      {childCount}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* View 2: Dropdown Select List (Lista rozwijana) */
                <div className="relative">
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="">
                      {t("guest.allCategories")} ({products.length})
                    </option>
                    {categoryTree.map((root) => {
                      const rootDisplayName = language === "en" && root.nameEn ? root.nameEn : root.name;
                      return (
                        <React.Fragment key={root._id}>
                          <option value={root._id} className="font-bold">
                            📁 {rootDisplayName} ({categoryCounts[root._id] ?? 0})
                          </option>
                          {root.children?.map((child) => {
                            const childDisplayName = language === "en" && child.nameEn ? child.nameEn : child.name;
                            return (
                              <option key={child._id} value={child._id}>
                                &nbsp;&nbsp;&nbsp;&nbsp;↳ {childDisplayName} ({categoryCounts[child._id] ?? 0})
                              </option>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
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
                    {(() => {
                      const imgUrl = getImageUrl(p);
                      return imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null;
                    })()}
                    <div
                      className="w-full h-full bg-gradient-to-tr from-indigo-500/10 to-purple-650/15 dark:from-indigo-950/20 dark:to-purple-950/20 flex items-center justify-center text-slate-400 text-3xl select-none group-hover:scale-105 transition-transform duration-500"
                      style={{ display: getImageUrl(p) ? "none" : "flex" }}
                    >
                      📦
                    </div>
                    
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
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition cursor-pointer group"
                      >
                        {/* Render all table cells */}
                        {allColumns.map((col) => (
                          <td
                            key={col}
                            className={`p-3.5 text-xs font-medium text-slate-700 dark:text-slate-350 ${
                              col === "name" ? "min-w-[240px] max-w-[340px]" : "max-w-[200px] truncate"
                            }`}
                          >
                            {col === "name" ? (
                              <div className="flex items-center gap-3">
                                {/* Small Product Thumbnail */}
                                {(() => {
                                  const imgUrl = getImageUrl(p);
                                  return (
                                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
                                      {imgUrl ? (
                                        <img
                                          src={imgUrl}
                                          alt={p.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            if (e.currentTarget.nextElementSibling) {
                                              e.currentTarget.nextElementSibling.style.display = "flex";
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800"
                                        style={{ display: imgUrl ? "none" : "flex" }}
                                      >
                                        <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                      </div>
                                    </div>
                                  );
                                })()}
                                <span
                                  className="font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 hover:underline line-clamp-2 leading-snug"
                                  title={p.name}
                                >
                                  {p.name}
                                </span>
                              </div>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {language === "pl"
              ? `Razem: ${filteredProducts.length} produktów`
              : `Total: ${filteredProducts.length} products`}
          </div>

          <div className="flex items-center gap-2">
            <NavArrowBtn
              direction="left"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              title={t("common.prev")}
              ariaLabel="Previous page"
            />
            <span className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700">
              {currentPage} / {Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))}
            </span>
            <NavArrowBtn
              direction="right"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
                  )
                )
              }
              disabled={currentPage === Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))}
              title={t("common.next")}
              ariaLabel="Next page"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default GuestProducts;
