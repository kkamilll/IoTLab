import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
const GuestProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [extraColumns, setExtraColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [cartQuantities, setCartQuantities] = useState({});

  const allColumns = ["name", "description", "stock", "category", ...extraColumns];
  const allTags = [...new Set(products.flatMap(p => p.tags || []))];
  const allCategories = [...new Set(products.map(p => p.category?.name))];

  // get category from menu
  const { menuCategory } = useParams();

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:3500/products/public");
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
      setFilteredProducts(updatedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("Błąd podczas pobierania produktów");
    }
  };

  useEffect(() => {
    fetchProducts();
    // set category if was from menu
    if (menuCategory !== undefined) {
      console.log("menuCategory: " + menuCategory);
      setActiveCategory(menuCategory);
    }
    else {
      console.log("menuCategory UNDEF: " + menuCategory);
    }
  }, []);

  useEffect(() => {
    let filtered = products.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      if (p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))) return true;
      if (p.tags?.some(tag => tag.toLowerCase().includes(searchLower))) return true;
      if (Object.values(p.extraFields || {}).some(val =>
        val.toString().toLowerCase().includes(searchLower))) return true;
      return false;
    });

    if (activeTag) filtered = filtered.filter(p => p.tags?.includes(activeTag));
    if (activeCategory) filtered = filtered.filter(p => p.categories && p.categories?.some(cat => cat.name === activeCategory));

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
  }, [products, searchTerm, sortConfig, activeTag, activeCategory]);

  const getAvailableStockForProduct = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const inCart = cart.find(item => item._id === product._id)?.quantity || 0;
    return Math.max(0, (product.stockForRent || 0) - inCart);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const handleQuantityChange = (productId, value, product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const inCart = cart.find(p => p._id === productId)?.quantity || 0;
    // const availableStock = product.stockForRent;
    const maxQty = (product.stockForRent || 0) - inCart;

    let qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > maxQty) qty = maxQty;

    setCartQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const qtyToAdd = cartQuantities[product._id] || 1;

    const existingIndex = cart.findIndex(p => p._id === product._id);
    const availableStock = product.stockForRent || 0;

    if (existingIndex !== -1) {
      cart[existingIndex].quantity = Math.min(cart[existingIndex].quantity + qtyToAdd, availableStock);
    } else {
      cart.push({ ...product, quantity: Math.min(qtyToAdd, availableStock) });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    // Update only the input quantity to 1 if there is remaining stock
    const inCart = cart.find(item => item._id === product._id)?.quantity || 0;
    const remaining = availableStock - inCart;
    setCartQuantities(prev => ({ ...prev, [product._id]: remaining > 0 ? 1 : 0 }));
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-700">Products</h1>

      {/* Search, Filters & Cart */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
        <input
          type="text"
          placeholder="Search"
          className="border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
        />
        <div className="flex gap-4 items-center">
          <select value={activeTag} onChange={(e) => setActiveTag(e.target.value)} className="border p-2 rounded">
            <option value="">All Tags</option>
            {allTags.map((tag, idx) => <option key={idx} value={tag}>{tag}</option>)}
          </select>
          <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="border p-2 rounded">
            <option value="">All Categories</option>
            {allCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
          </select>
          <button
            onClick={() => navigate("/cart")}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
          >
            Przejdź do koszyka
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {allColumns.map((col, idx) => (
                <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort(col)}>
                  {col} {sortConfig.key === col ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
              <th className="px-4 py-2">Add to Cart</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map(p => (
              <tr key={p._id}>
                {allColumns.map((col, idx) => (
                  <td key={idx} className="px-4 py-2 text-sm text-gray-700">
                    {col === "stock" ? p.stock :
                      col === "category" ? p.category?.name ?? "" :
                        p[col] ?? p.extraFields?.[col] ?? ""}
                  </td>
                ))}
                <td className="px-4 py-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={getAvailableStockForProduct(p)}
                    value={cartQuantities[p._id] || 1}
                    onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                    className="w-16 border rounded p-1 text-center"
                  />
                  <button
                    onClick={() => handleAddToCart(p)}
                    className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Dodaj
                  </button>
                  <span className="text-gray-700 text-sm font-medium">
                    W koszyku: {JSON.parse(localStorage.getItem("cart"))?.find(item => item._id === p._id)?.quantity || 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestProducts;
