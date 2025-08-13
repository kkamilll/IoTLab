import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Products = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [extraColumns, setExtraColumns] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stock: "",
    extraFields: {}
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:3500/products", {
        headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
      });

      if (res.data.success) {
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
      } else {
        alert(res.data.message || "Error fetching products");
      }
    } catch (err) {
      console.error(err);
      alert("Server error – check console");
    }
  };

  const addProduct = async () => {
    const res = await axios.post(
      "http://localhost:3500/products",
      { ...formData, stock: Number(formData.stock) },
      { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
    );
    return res.data;
  };

  const updateProduct = async () => {
    const res = await axios.put(
      `http://localhost:3500/products/${editProduct}`,
      { ...formData, stock: Number(formData.stock) },
      { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
    );
    return res.data;
  };

  const deleteProduct = async (id) => {
    const res = await axios.delete(
      `http://localhost:3500/products/${id}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
    );
    return res.data;
  };

  const handleEdit = (product) => {
    setOpenModal(true);
    setEditProduct(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      stock: product.stock?.toString() || "",
      extraFields: { ...product.extraFields }
    });
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditProduct(null);
    setFormData({ name: "", description: "", stock: "", extraFields: {} });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExtraFieldChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      extraFields: { ...prev.extraFields, [key]: value }
    }));
  };

  const addExtraField = () => {
    const key = prompt("Podaj nazwę nowej kolumny:");
    if (key && !extraColumns.includes(key)) {
      setExtraColumns(prev => [...prev, key]);
      setProducts(prev =>
        prev.map(p => ({ ...p, extraFields: { ...p.extraFields, [key]: "" } }))
      );
      setFormData(prev => ({
        ...prev,
        extraFields: { ...prev.extraFields, [key]: "" }
      }));
    }
  };

  const removeExtraField = (key) => {
    setExtraColumns(prev => prev.filter(col => col !== key));
    setProducts(prev =>
      prev.map(p => {
        const newExtra = { ...p.extraFields };
        delete newExtra[key];
        return { ...p, extraFields: newExtra };
      })
    );
    setFormData(prev => {
      const newExtra = { ...prev.extraFields };
      delete newExtra[key];
      return { ...prev, extraFields: newExtra };
    });
  };

  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    let filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm));
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key] ?? a.extraFields?.[sortConfig.key] ?? "";
        let valB = b[sortConfig.key] ?? b.extraFields?.[sortConfig.key] ?? "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    setFilteredProducts(filtered);
  }, [products, searchTerm, sortConfig]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = editProduct ? await updateProduct() : await addProduct();
      if (data.success) {
        fetchProducts();
        closeModal();
      } else {
        alert(data.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const data = await deleteProduct(id);
      if (data.success) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const generatePDF = () => {
    if (filteredProducts.length === 0) return alert("No products to export.");
    const doc = new jsPDF();
    doc.text("Product List", 14, 22);
    const headers = ["#", "Name", "Description", "Stock", ...extraColumns];
    const rows = filteredProducts.map((p, i) => [
      i + 1,
      p.name,
      p.description || "",
      p.stock,
      ...extraColumns.map(c => p.extraFields?.[c] || "")
    ]);
    autoTable(doc, { head: [headers], body: rows, startY: 30 });
    doc.save("products.pdf");
  };

  useEffect(() => { fetchProducts(); }, []);

  const allColumns = ["name", "description", "stock", ...extraColumns];

  const getStockColor = (stock) => {
    if (stock >= 50) return "bg-green-200";
    if (stock >= 20) return "bg-yellow-200";
    return "bg-red-200";
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-700">Product Management</h1>

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <input
          type="text"
          placeholder="Search"
          className="border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
          onChange={handleSearch}
        />
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 transition" onClick={generatePDF}>
            Export PDF
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition"
            onClick={() => { setEditProduct(null); setOpenModal(true); }}
          >
            Add Product
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded shadow hover:bg-gray-600 transition"
            onClick={addExtraField}
          >
            + Add Column
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-lg mt-2">
        <table className="min-w-full border-collapse overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              {allColumns.map(col => (
                <th key={col} className="px-4 py-2 text-left relative">
                  <div className="flex items-center justify-between">
                    <span
                      className="cursor-pointer select-none hover:text-yellow-200"
                      onClick={() => handleSort(col)}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                      {sortConfig.key === col ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : ""}
                    </span>
                    {extraColumns.includes(col) && (
                      <button
                        className="ml-2 text-red-200 hover:text-red-400 font-bold"
                        onClick={() => removeExtraField(col)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredProducts.map((p, idx) => (
              <tr key={p._id} className="hover:bg-gray-50 transition-all border-b last:border-b-0">
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.description}</td>
                <td className={`px-4 py-2 ${getStockColor(Number(p.stock))}`}>{p.stock}</td>
                {extraColumns.map(col => (
                  <td key={col} className="px-4 py-2">{p.extraFields?.[col]}</td>
                ))}
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition"
                    onClick={() => handleEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    onClick={() => handleDelete(p._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openModal && (
       <div className="fixed inset-0 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl" onClick={closeModal}>×</button>
            <h2 className="text-xl font-bold mb-4">{editProduct ? "Edit Product" : "Add Product"}</h2>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <input name="name" placeholder="Name" className="border p-2 rounded" value={formData.name} onChange={handleChange} required />
              <input name="description" placeholder="Description" className="border p-2 rounded" value={formData.description} onChange={handleChange} />
              <input type="number" name="stock" placeholder="Stock" className="border p-2 rounded" value={formData.stock} onChange={handleChange} required />
              {extraColumns.map(col => (
                <input
                  key={col}
                  placeholder={col}
                  className="border p-2 rounded"
                  value={formData.extraFields[col] || ""}
                  onChange={e => handleExtraFieldChange(col, e.target.value)}
                />
              ))}
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition mt-2">
                {editProduct ? "Update" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
