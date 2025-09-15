import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const GuestProducts = () => {
  const navigate = useNavigate();
  const { menuCategory } = useParams();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [extraColumns, setExtraColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(menuCategory || "");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart")) || []);
  const [cartQuantities, setCartQuantities] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allColumns = ["name", "description", "stockForRent", "categories", ...extraColumns];
  const hiddenColumns = []; // <- np. ["owner"] jeśli chcesz ukryć coś w mobile

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const handlePreview = (productId) => {
    if (!productId) return alert("No product to preview");
    navigate("/preview", { state: { productId } });
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/public`
      );
      const allExtraKeys = new Set(extraColumns);

      res.data.products.forEach((p) => {
        if (p.extraFields) Object.keys(p.extraFields).forEach((k) => allExtraKeys.add(k));
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
      alert("Error fetching products");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/public`
      );
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = products.filter((p) => {
      const searchLower = searchTerm.toLowerCase();
      if (p.name.toLowerCase().includes(searchLower)) return true;
      if (p.description && p.description.toLowerCase().includes(searchLower)) return true;
      if (
        Object.values(p.extraFields || {}).some((val) =>
          val.toString().toLowerCase().includes(searchLower)
        )
      )
        return true;
      return false;
    });

    if (activeCategory) {
      filtered = filtered.filter((p) =>
        p.categories?.some((cat) => cat._id === activeCategory)
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
      const existingIndex = prevCart.findIndex((item) => item._id === productId);
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

  const getAvailableStockForProduct = (p) => p.stockForRent ?? 0;

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 md:p-6 bg-gray-50">
      {/* Back + Title */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back
        </button>
        <h1 className="text-3xl font-extrabold text-blue-900 flex-1 text-center">
          Objects
        </h1>
        <div className="w-[72px]" />
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-center mb-4">
        <input
          type="text"
          placeholder="Search"
          className="border border-gray-300 p-2 rounded shadow-sm flex-1 focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        />
        <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-0 flex-wrap">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="border p-2 rounded focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => navigate("/cart")}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition"
          >
            Go to Cart
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="overflow-x-auto hidden md:block">
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-100">
              <tr>
                {allColumns.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase cursor-pointer select-none hover:bg-blue-200 transition"
                    onClick={() => handleSort(col)}
                  >
                    {col}{" "}
                    {sortConfig.key === col
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </th>
                ))}
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition">
                  {allColumns.map((col, idx) => (
  <td key={idx} className="px-4 py-2 text-sm text-gray-700">
    {col === "name" ? (
      <span
        className="truncate cursor-pointer"
        onClick={() => handlePreview(p._id)}
        title={p.name}
      >
        {p.name}
      </span>
    ) : col === "description" ? (
      <span
        className="truncate cursor-pointer block max-w-[200px]"
        onClick={() => handlePreview(p._id)}
        title={p.description}
      >
        {p.description?.length > 50
          ? p.description.slice(0, 50) + "…"
          : p.description}
      </span>
    ) : col === "categories" ? (
      p.categories?.length === 0 ? (
        "-"
      ) : p.categories?.length === 1 ? (
        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
          {p.categories[0].name}
        </span>
      ) : (
        <div className="relative inline-block w-40">
          <select
            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white appearance-none pr-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm"
            value=""
            onChange={(e) => e.preventDefault()}
          >
            <option value="" disabled hidden>
              Categories
            </option>
            {p.categories.map((c, i) => (
              <option key={i} value={c?.name ?? ""}>
                {c?.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
            ▼
          </span>
        </div>
      )
    ) : (
      p[col] ?? p.extraFields?.[col] ?? ""
    )}
  </td>
))}

                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            p._id,
                            (cartQuantities[p._id] || 0) - 1,
                            p
                          )
                        }
                        disabled={(cartQuantities[p._id] || 0) <= 0}
                        className="px-3 bg-gray-200 hover:bg-gray-300"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={p.stockForRent || 0}
                        value={cartQuantities[p._id] || 0}
                        onChange={(e) =>
                          handleQuantityChange(p._id, e.target.value, p)
                        }
                        className="w-16 text-center outline-none"
                      />
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            p._id,
                            (cartQuantities[p._id] || 0) + 1,
                            p
                          )
                        }
                        disabled={(cartQuantities[p._id] || 0) >= (p.stockForRent || 0)}
                        className="px-3 bg-gray-200 hover:bg-gray-300"
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
      </div>

      {/* Mobile cards */}
<div className="md:hidden flex flex-col gap-4">
  {paginatedProducts.map((p) => (
    <div key={p._id} className="border rounded shadow p-4 bg-white">
      {allColumns
        .filter((col) => !hiddenColumns.includes(col))
        .map((col, idx, arr) => (
          <div key={idx}>
            <div className="flex justify-between py-2">
              <span className="font-semibold text-gray-500">{col}:</span>
              <span className="text-gray-700 truncate max-w-[60%] text-right">
                {(() => {
                  switch (col) {
                    case "stockForRent":
                      return p.stockForRent ?? 0;
                    case "categories":
                      return (
                        <select
                          className="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                          value=""
                          onChange={(e) => e.preventDefault()}
                        >
                          <option value="" disabled hidden>
                            Categories
                          </option>
                          {p.categories.map((c, i) => (
                            <option key={i} value={c?.name ?? ""}>
                              {c?.name}
                            </option>
                          ))}
                        </select>
                      );
                    case "description":
                      return (
                        <span
                          className="truncate cursor-pointer"
                          onClick={() => handlePreview(p._id)}
                          title={p.description}
                        >
                          {p.description?.length > 50
                            ? p.description.slice(0, 50) + "…"
                            : p.description}
                        </span>
                      );
                    case "name":
                      return (
                        <span
                          className="truncate cursor-pointer"
                          onClick={() => handlePreview(p._id)}
                          title={p.name}
                        >
                          {p.name}
                        </span>
                      );
                    default:
                      return p[col] ?? p.extraFields?.[col] ?? "";
                  }
                })()}
              </span>
            </div>
            {/* kreska między polami, ale nie po ostatnim */}
            {idx < arr.length - 1 && <hr className="border-gray-200 my-1" />}
          </div>
        ))}

      {/* Quantity controls */}
      <div className="flex justify-center items-center border rounded-lg overflow-hidden h-10 mt-3 shadow-sm">
        <button
          onClick={() =>
            handleQuantityChange(p._id, (cartQuantities[p._id] || 0) - 1, p)
          }
          className="px-4 bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-bold"
          disabled={(cartQuantities[p._id] || 0) <= 0}
        >
          -
        </button>

        <input
          type="number"
          min="0"
          max={getAvailableStockForProduct(p)}
          value={cartQuantities[p._id] || 0}
          onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
          className="w-16 text-center outline-none border-x border-gray-200"
        />

        <button
          onClick={() =>
            handleQuantityChange(p._id, (cartQuantities[p._id] || 0) + 1, p)
          }
          className="px-4 bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-bold"
          disabled={(cartQuantities[p._id] || 0) >= getAvailableStockForProduct(p)}
        >
          +
        </button>
      </div>

      <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
        <span className="bg-gray-100 px-2 py-0.5 rounded">
          Available: {getAvailableStockForProduct(p)}
        </span>
        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
          In cart: {cartQuantities[p._id] || 0}
        </span>
      </div>
    </div>
  ))}
</div>

    </div>
  );
};

export default GuestProducts;
