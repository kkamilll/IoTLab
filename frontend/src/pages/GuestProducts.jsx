import React, { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const GuestProducts = () => {
  const { t } = useLanguage();
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
  const itemsPerPage = 10;

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
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                {t("guest.subtitle")}
              </p>
              <h1 className="text-4xl font-black text-slate-900">
                {t("guest.title")}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/")}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                {t("guest.backHome")}
              </button>
              <button
                onClick={() => navigate("/cart")}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                {t("guest.viewCart")} ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                <input
                  type="text"
                  placeholder={t("guest.searchPlaceholder")}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                />
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-9 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="">{t("guest.allCategories")}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">{t("guest.showing")}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {filteredProducts.length} {t("guest.items")}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("guest.useFilters")}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-blue-600 p-4 text-white shadow-lg">
              <p className="text-sm uppercase tracking-[0.22em] text-blue-200">
                {t("guest.quickInfo")}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6">
                <p>
                  <strong className="text-white">{t("guest.category")}:</strong>{" "}
                  {activeCategory
                    ? categories.find((cat) => cat._id === activeCategory)
                        ?.name || "Selected"
                    : t("guest.allCategories")}
                </p>
                <p>
                  <strong className="text-white">{t("guest.totalInCart")}:</strong>{" "}
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
                <p>
                  <strong className="text-white">{t("guest.currentPage")}:</strong>{" "}
                  {currentPage} /{" "}
                  {Math.max(
                    1,
                    Math.ceil(filteredProducts.length / itemsPerPage),
                  )}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              {t("guest.loading")}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
              {t("guest.noProducts")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase tracking-[0.08em] text-xs">
                    <tr>
                      {allColumns.map((col, idx) => {
                        const colTrans = t(`products.columns.${col}`);
                        const displayName = colTrans.startsWith("products.columns.")
                          ? (col === "available" ? t("guest.available") : col)
                          : colTrans;
                        return (
                          <th
                            key={idx}
                            className="px-4 py-4 text-left font-semibold cursor-pointer select-none"
                            onClick={() => handleSort(col)}
                          >
                            <div className="flex items-center gap-2">
                              {displayName}
                              {sortConfig.key === col
                                ? sortConfig.direction === "asc"
                                  ? "↑"
                                  : "↓"
                                : ""}
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-4 py-4 text-left font-semibold">
                        {t("guest.quantity")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {paginatedProducts.map((p) => (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50 cursor-pointer transition"
                        onClick={(e) => {
                          if (e.target.closest("button, select, input, option, a")) {
                            return;
                          }
                          handlePreview(p._id);
                        }}
                      >
                        {allColumns.map((col, idx) => (
                          <td
                            key={idx}
                            className="px-4 py-3 align-top text-slate-700"
                          >
                            {col === "name" ? (
                              <span className="text-blue-600 hover:text-blue-700 font-semibold">
                                {p.name}
                              </span>
                            ) : col === "available" ? (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                {getAvailableStockForProduct(p)}
                              </span>
                            ) : col === "description" ? (
                              <span className="block max-w-[240px] truncate text-slate-600">
                                {p.description || "—"}
                              </span>
                            ) : col === "categories" ? (
                              <span className="inline-flex max-w-[200px] flex-wrap gap-1">
                                {p.categories?.map((c) => (
                                  <span
                                    key={c._id}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                                  >
                                    {c.name}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-slate-700">
                                {p[col] ?? p.extraFields?.[col] ?? "—"}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  p._id,
                                  (cartQuantities[p._id] || 0) - 1,
                                  p,
                                )
                              }
                              disabled={(cartQuantities[p._id] || 0) <= 0}
                              className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={getAvailableStockForProduct(p)}
                              value={cartQuantities[p._id] || 0}
                              onChange={(e) =>
                                handleQuantityChange(p._id, e.target.value, p)
                              }
                              className="w-16 rounded-xl border border-slate-200 px-2 py-2 text-center text-slate-700"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  p._id,
                                  (cartQuantities[p._id] || 0) + 1,
                                  p,
                                )
                              }
                              disabled={
                                (cartQuantities[p._id] || 0) >=
                                getAvailableStockForProduct(p)
                              }
                              className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 md:hidden p-4">
                {paginatedProducts.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md cursor-pointer transition"
                    onClick={(e) => {
                      if (e.target.closest("button, select, input, option, a")) {
                        return;
                      }
                      handlePreview(p._id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-lg font-semibold text-blue-600">
                          {p.name}
                        </span>
                        <p className="mt-1 text-sm text-slate-500 line-clamp-3">
                          {p.description || "—"}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        {t("guest.available")}: {getAvailableStockForProduct(p)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                          {t("products.columns.categories")}
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                          {p.categories?.map((c) => c.name).join(", ") || "—"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              p._id,
                              (cartQuantities[p._id] || 0) - 1,
                              p,
                            )
                          }
                          disabled={(cartQuantities[p._id] || 0) <= 0}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={getAvailableStockForProduct(p)}
                          value={cartQuantities[p._id] || 0}
                          onChange={(e) =>
                            handleQuantityChange(p._id, e.target.value, p)
                          }
                          className="w-16 rounded-xl border border-slate-200 px-2 py-2 text-center"
                        />
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              p._id,
                              (cartQuantities[p._id] || 0) + 1,
                              p,
                            )
                          }
                          disabled={
                            (cartQuantities[p._id] || 0) >=
                            getAvailableStockForProduct(p)
                          }
                          className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
            <div className="text-sm text-slate-500">
              {t("common.page")} {currentPage} {t("common.of")}{" "}
              {Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {t("common.prev")}
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      prev + 1,
                      Math.max(
                        1,
                        Math.ceil(filteredProducts.length / itemsPerPage),
                      ),
                    ),
                  )
                }
                disabled={
                  currentPage ===
                  Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {t("common.next")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestProducts;
