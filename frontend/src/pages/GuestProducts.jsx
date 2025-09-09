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

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/api/products/public`);
      const allExtraKeys = new Set(extraColumns);

      res.data.products.forEach(p => {
        if (p.extraFields) Object.keys(p.extraFields).forEach(k => allExtraKeys.add(k));
      });

      const updatedProducts = res.data.products.map(p => {
        const newExtraFields = {};
        [...allExtraKeys].forEach(col => {
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
      const res = await axios.get(`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/api/categories/public`);
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
    let filtered = products.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      if (p.name.toLowerCase().includes(searchLower)) return true;
      if (p.description && p.description.toLowerCase().includes(searchLower)) return true;
      if (Object.values(p.extraFields || {}).some(val => val.toString().toLowerCase().includes(searchLower))) return true;
      return false;
    });

    if (activeCategory) {
      filtered = filtered.filter(p =>
        p.categories?.some(cat => cat._id === activeCategory)
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

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item._id === productId);
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

    setCartQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 md:p-6 bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-3xl font-extrabold text-gray-700">Products</h1>
        <button
          onClick={() => navigate("/mainguest")}
          className="px-4 py-2 bg-gray-500 text-white rounded shadow hover:bg-gray-600 transition"
        >
          Back
        </button>
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
              <option key={cat._id} value={cat._id}>{cat.name}</option>
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

      {/* Table for desktop */}
      <div className="overflow-x-auto">
        <div className="hidden md:block overflow-x-auto shadow-lg rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-100">
              <tr>
                {allColumns.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase cursor-pointer select-none hover:bg-blue-200 transition"
                    onClick={() => handleSort(col)}
                  >
                    {col} {sortConfig.key === col ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                  </th>
                ))}
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Quantity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map(p => (
                <tr key={p._id} className="hover:bg-gray-50 transition">
                  {allColumns.map((col, idx) => (
                    <td key={idx} className="px-4 py-2 text-sm text-gray-700">
                      {col === "stockForRent"
                        ? p.stockForRent
                        : col === "categories"
                        ? p.categories?.map(c => c.name).join(", ")
                        : p[col] ?? p.extraFields?.[col] ?? ""}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                      <div className="flex items-center border rounded overflow-hidden h-10">
                        <button
                          onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) - 1, p)}
                          className="px-3 bg-gray-200 hover:bg-gray-300 h-full transition"
                          disabled={(cartQuantities[p._id] || 0) <= 0}
                        >-</button>
                        <input
                          type="number"
                          min="0"
                          max={p.stockForRent || 0}
                          value={cartQuantities[p._id] || 0}
                          onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                          className="w-16 text-center outline-none"
                        />
                        <button
                          onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) + 1, p)}
                          className="px-3 bg-gray-200 hover:bg-gray-300 h-full transition"
                          disabled={(cartQuantities[p._id] || 0) >= (p.stockForRent || 0)}
                        >+</button>
                      </div>
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                        In Cart: {cart.find(item => item._id === p._id)?.quantity || 0}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-4">
          {paginatedProducts.map(p => (
            <div
              key={p._id}
              className="bg-white shadow-md rounded-xl p-4 flex flex-col gap-3 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {allColumns.map((col, idx) => (
                <div key={idx} className="flex justify-between text-sm text-gray-700">
                  <span className="font-semibold">{col}:</span>
                  <span className="text-gray-900 break-words">
                    {col === "categories"
                      ? p.categories?.map(c => c.name).join(", ")
                      : p[col] ?? p.extraFields?.[col] ?? ""}
                  </span>
                </div>
              ))}

              {/* Quantity control */}
              <div className="flex items-center gap-2 mt-2 justify-center">
                <button
                  onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) - 1, p)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-l-lg transition-colors"
                  disabled={(cartQuantities[p._id] || 0) <= 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  max={p.stockForRent || 0}
                  value={cartQuantities[p._id] || 0}
                  onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                  className="w-16 text-center text-lg border-t border-b border-gray-300 outline-none"
                />
                <button
                  onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) + 1, p)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-r-lg transition-colors"
                  disabled={(cartQuantities[p._id] || 0) >= (p.stockForRent || 0)}
                >
                  +
                </button>
              </div>

              {/* Current in-cart quantity */}
              <div className="text-center mt-1">
                <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                  In Cart: {cart.find(item => item._id === p._id)?.quantity || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {filteredProducts.length > itemsPerPage && (
        <div className="flex justify-between mt-4 items-center">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition disabled:opacity-50"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {Math.ceil(filteredProducts.length / itemsPerPage)}
          </span>
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition disabled:opacity-50"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredProducts.length / itemsPerPage)))}
            disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestProducts;
