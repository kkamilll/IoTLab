
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CategorySelector from "../components/CategorySelector";
import { buildTree } from "../utils/categoryUtils"; 

const Products = () => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [extraColumns, setExtraColumns] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stock: "",
    extraFields: {},
    tag: "",
    image: null,
    categories: [] // nowa właściwość dla kategorii
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  // const [newTag, setNewTag] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [categories, setCategories] = useState([]);


  const navigate = useNavigate();

  // category tree
  const normalizedCategories = useMemo(
    () => categories.map(c => ({
      _id: c._id.toString(),
      name: c.name,
      parent: c.parent?._id?.toString() || null
    })),
    [categories]
  );

const categoryTree = useMemo(() => buildTree(normalizedCategories), [normalizedCategories]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3500/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error("Błąd pobierania kategorii:", err);
    }
  };
  // Pobieranie produktów
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:3500/products");

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

  // CRUD API
  // const addProduct = async () => {
  //   const res = await axios.post(
  //     "http://localhost:3500/products",
  //     { ...formData, stock: Number(formData.stock) },
  //     { headers: { Authorization: `Bearer ${token}` } }
  //   );
  //   return res.data;
  // };

  // const updateProduct = async () => {
  //   const res = await axios.put(
  //     `http://localhost:3500/products/${editProduct}`,
  //     { ...formData, stock: Number(formData.stock) },
  //     { headers: { Authorization: `Bearer ${token}` } }
  //   );
  //   return res.data;
  // };

  const deleteProduct = async (id) => {
    const res = await axios.delete(
      `http://localhost:3500/products/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  };

  // Handlery
  const handleEdit = (product) => {
    setOpenModal(true);
    setEditProduct(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      stock: product.stock?.toString() || "",
      extraFields: { ...product.extraFields },
      tag: product.tag || "",
      categories: (product.categories || []).map(cat => cat._id.toString())
    });
    // console.log(product)
    // setNewTag("");
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditProduct(null);
    setFormData({ name: "", description: "", stock: "", extraFields: {}, tag: "", categories: [] });
    // setNewTag("");
  };

  const handleChange = (e) => {
    // console.log(`change: ${e.target.name}, ${e.target.value}`)
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExtraFieldChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      extraFields: { ...prev.extraFields, [key]: value }
    }));
  };

  // const handleCategoriesChange = (e) => {
  //   const { options } = e.target;
  //   const values = [];
  //   for (let i = 0; i < options.length; i++) {
  //     if (options[i].selected) {
  //       values.push(options[i].value);
  //     }
  //   }
  //   setFormData({ ...formData, categories: values });
  // };

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

  const removeExtraField = async (key) => {
    if (!window.confirm(`Delete column "${key}" from all products?`)) return;

    try {
      const res = await axios.delete(`http://localhost:3500/products/extraField/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        // Usuń kolumnę z widoku
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
      } else {
        alert(res.data.message || "Failed to delete column");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while deleting column");
    }
  };


  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  useEffect(() => {

    let filtered = products.filter(p => {
      const searchLower = searchTerm.toLowerCase();

      if (p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))) return true;

      if (p.tag?.some(tag => tag.toLowerCase().includes(searchLower))) return true;

      if (Object.values(p.extraFields || {}).some(val =>
        val.toString().toLowerCase().includes(searchLower)
      )) return true;

      return false;
    });

    if (activeCategory) {
      filtered = filtered.filter(p => p.categories?.some(cat => cat._id === activeCategory));
    }

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
  }, [products, searchTerm, sortConfig, activeCategory]);

  // Dodanie obsługi plików w handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Remove empty extraFields
      const cleanedExtraFields = Object.fromEntries(
        Object.entries(formData.extraFields).filter(([key, value]) => value != null && value !== "")
      );

      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("stock", formData.stock);
      form.append("extraFields", JSON.stringify(cleanedExtraFields));
      form.append("categories", JSON.stringify(formData.categories)); // dodanie kategorii
      form.append("tag", formData.tag);
      if (formData.image) form.append("image", formData.image);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const res = editProduct
        ? await axios.put(`http://localhost:3500/products/${editProduct}`, form, config)
        : await axios.post(`http://localhost:3500/products`, form, config);

      if (res.data.success) {
        fetchProducts();
        closeModal();
      } else {
        alert(res.data.message || "Operation failed");
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

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const allColumns = ["name", "description", "stock", "tag", ...extraColumns];

  // const allCategories = [...new Set(products.flatMap(p => p.categories || []))]; // old approach doesn't work 

  const allCategories = Object.values( // create an array of objects from object of objects
    products.flatMap(p => p.categories || []) // flatten array products into array of all categories
    .reduce((acc, cat) => { acc[cat._id] = cat; return acc; }, {}) // create object of objects from array, without duplicates with same field _id 
  );

  const handleRemoveImage = async () => {
    if (!editProduct) return; // tylko dla istniejącego produktu
    if (!window.confirm("Remove product image?")) return;

    try {
      const res = await axios.delete(
        `http://localhost:3500/products/${editProduct}/image`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Usuń obraz z lokalnego stanu
        setFormData(prev => ({ ...prev, image: null }));
        fetchProducts(); // odśwież listę produktów, żeby zdjęcie zniknęło z tabeli
      } else {
        alert(res.data.message || "Failed to remove image");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while removing image");
    }
  };
  const handlePreview = (productId) => {
    if (!productId) return alert("No product to preview");
    navigate("/admin-dashboard/preview", { state: { productId } });
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
          {isAdmin && (
            <>
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
              <button
                onClick={() => navigate("/cart")}
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
              >
                Przejdź do koszyka
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <label className="font-medium">Filter by category:</label>
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="border p-2 rounded"
        >
          
          <option value="">All</option>
          {allCategories.map((category, idx) => (
            <option key={idx} value={category._id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto shadow rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {allColumns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span onClick={() => handleSort(col)}>
                      {col} {sortConfig.key === col ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                    </span>
                    {isAdmin && extraColumns.includes(col) && (
                      <button
                        onClick={() => removeExtraField(col)}
                        className="ml-2 px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        X
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {isAdmin && <th className="px-4 py-2">Actions</th>}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((p) => (
              <tr key={p._id}>
                {allColumns.map((col, idx) => (
                  <td key={idx} className="px-4 py-2 text-sm text-gray-700">
                    {col === "stock" ? (
                      <span>{p.stock}</span>
                    ) : col === "tag" ? (
                      p.tag ?? ""
                    ) : (
                      p[col] ?? p.extraFields?.[col] ?? ""
                    )}
                  </td>
                ))}

                {isAdmin && (
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => handleEdit(p)} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button>
                    <button
                      onClick={() => handlePreview(p._id)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Preview
                    </button>
                    <button onClick={() => handleDelete(p._id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                  </td>
                )}

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
            <h2 className="text-2xl font-bold mb-4">{editProduct ? "Edit Product" : "Add Product"}</h2>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required className="border p-2 rounded" />
              <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="border p-2 rounded" />
              <input type="number" name="stock" placeholder="Stock" value={formData.stock} onChange={handleChange} required className="border p-2 rounded" />
              {extraColumns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={col}
                    value={formData.extraFields?.[col] || ""}
                    onChange={(e) => handleExtraFieldChange(col, e.target.value)}
                    className="border p-2 rounded flex-1"
                  />
                  {isAdmin && <button type="button" onClick={() => removeExtraField(col)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">X</button>}
                </div>
              ))}
              <label htmlFor="categories">Categories</label>
              <CategorySelector
                categoryTree={categoryTree}   // flat array from backend
                flatCategories={normalizedCategories} 
                formData={formData}
                setFormData={setFormData}
              />

              <div className="flex gap-2">
                <input type="text" name="tag" placeholder="Add tag" value={formData.tag} onChange={handleChange} className="border p-2 rounded flex-1" />

                {/* <button type="button" onClick={() => {
                  if (newTag && !formData.tags.includes(newTag)) {
                    setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
                    setNewTag("");
                  }
                }} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Add</button> */}

              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
                className="border p-2 rounded"
              />

              <div className="flex flex-wrap gap-2">
                {/* {formData.tag.map((tag, idx) => (
                  <span key={idx} className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1">
                    {tag} <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} className="text-red-600 font-bold">x</button>
                  </span>
                ))} */}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg relative max-w-lg w-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              X
            </button>
            <img
              src={`http://localhost:3500/uploads/${previewImage}`}
              alt="Product Preview"
              className="w-full h-auto object-contain rounded"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;