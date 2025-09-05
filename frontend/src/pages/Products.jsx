
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCube, FaCubes, FaHandshake, FaEye, FaEyeSlash } from "react-icons/fa";
import { FaUserShield, FaUserLock } from "react-icons/fa6";

import CategorySelector from "../components/CategorySelector";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import { useAuth } from "../context/AuthContext";
import { buildTree } from "../utils/categoryUtils";

const MEGA_BYTE = 1024 * 1024;
const MAX_FILE_SIZE = 50 * MEGA_BYTE;
const MAX_FILE_NAME_LENGTH = 15;
const EXTENSION_OFFSET = 3;
// const MAX_FILE_COUNT = 20;

const Products = () => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [extraColumns, setExtraColumns] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stockTotal: "",
    stockForRent: "0",
    extraFields: {},
    categories: [], // nowa właściwość dla kategorii
    tag: "",
    labRoom: "",
    images: [],
    attachments: [],
    owner: user.id,
    isSerialized: false,
    isRentable: false,
    isVisible: false,
    isShared: false,
    version: ""
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  // const [newTag, setNewTag] = useState("");
  // const [previewImage, setPreviewImage] = useState(null);

  const [cartQuantities, setCartQuantities] = useState({});
  const [cartQuantitiesInCart, setCartQuantitiesInCart] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedUser = users.find(user => user._id === formData.owner);
  const labRooms = selectedUser?.labRooms || [];

  const toggleColumn = (col) => {
    setHiddenColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // const allColumns = ["name", "description", "Owned", "tag", ...extraColumns];
  const allColumns = ["name", "description", "stockTotal", "stockForRent", "categories", "owner", ...extraColumns];
  // const allColumns = ["name", "description", "stock", "hiddenStock", "category", "owner", ...extraColumns];

  const allCategories = Object.values( // create an array of objects from object of objects
    products.flatMap(p => p.categories || []) // flatten array products into array of all categories
      .reduce((acc, cat) => { acc[cat._id] = cat; return acc; }, {}) // create object of objects from array, without duplicates with same field _id 
  );

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

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchUsers();

    setCartQuantities(prev => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const newQuantities = {};
      cart.forEach(cartItem => newQuantities[cartItem._id] = cartItem.quantity);
      return newQuantities;
    })
  }, []);

  useEffect(() => {
    setCartQuantities(prev => {
      const newQuantities = { ...prev };
      products.forEach(p => { if (p._id && newQuantities[p._id] === undefined) newQuantities[p._id] = 0; });
      return newQuantities;
    });
  }, [products]);

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

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3500/categories/private", {
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
      const res = await axios.get("http://localhost:3500/products/private", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data.success) return alert(res.data.message || "Error fetching products");


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
      console.error(err);
      alert(`${err.response.data.message}`);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3500/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data.success) return alert(res.data.message || "Error fetching products");

      const fetchedUsers = res.data.users;
      setUsers(fetchedUsers);
    } catch (error) {
      console.error(err);
      alert(`${err.response.data.message}`);
    }
  }

  const deleteProduct = async (id) => {
    const res = await axios.delete(
      `http://localhost:3500/products/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  };


  const getAvailableStockForProduct = (product) => Math.max(0, Number(product.stockForRent || 0));

  const truncateFileName = (name, maxLength) => {
    if (!name) return "";

    const lastDotIndex = name.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // No extension
      return name.length > maxLength ? name.slice(0, maxLength - 3) + "..." : name;
    }

    const baseName = name.slice(0, lastDotIndex);
    const extension = name.slice(lastDotIndex);
    const truncation = "...-";

    if (baseName.length > maxLength) {
      return baseName.slice(0, maxLength - truncation.length) + truncation + extension;
    }

    return name;
  };

  const filesChange = (newFiles, oldFiles) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large (max ${MAX_FILE_SIZE / MEGA_BYTE}MB).`);
        return false;
      }
      return true;
    });

    const newFilesMapped = validFiles.map(file => ({
      file: file,
      originalName: file.name,
      uniqueKey: `${file.name}-${file.lastModified}`,
      isVisible: false,
      source: "client"
    }))

    const files = [...oldFiles, ...newFilesMapped];
    // check if file was already added
    const uniqueFiles = Array.from(
      new Map(
        files.map(fileObj => [`${fileObj.uniqueKey}`, fileObj])
      ).values()
    );

    return uniqueFiles;
  }

  // Handlery
  const handleEdit = (product) => {
    setOpenModal(true);
    setEditProduct(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      stockTotal: product.stockTotal?.toString() || "",
      stockForRent: product.stockForRent?.toString() || "",
      extraFields: { ...product.extraFields } || {},
      categories: (product?.categories || []).map(cat => cat._id.toString()) || [],
      tag: product?.tag || "",
      labRoom: product?.labRoom || "",
      images: product?.images?.map(imageObj => ({ ...imageObj, source: "server" })) || [],
      attachments: product?.attachments?.map(attachmentObj => ({ ...attachmentObj, source: "server" })) || [],
      owner: product.owner?._id || user.id,
      isSerialized: product?.isSerialized || false,
      isRentable: product?.isRentable || false,
      isVisible: product?.isVisible || false,
      isShared: product?.isShared || false,
      version: product.__v?.toString() || ""
    });
    // setNewTag("");
    console.log(formData);
  };


  const closeModal = () => {
    setOpenModal(false);
    setEditProduct(null);
    setFormData({ name: "", description: "", stockTotal: "", stockForRent: "0", extraFields: {}, categories: [], tag: "", labRoom: "", images: [], attachments: [], owner: user.id, isSerialized: false, isRentable: false, isVisible: false, isShared: false, version: "" });
    // setNewTag("");
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

  const handleOwnerChange = (e) => {
    const newOwner = e.target.value;
    const selectedUser = users.find(user => user._id === newOwner);
    const newLabRooms = selectedUser?.labRooms || [];

    setFormData(prev => ({
      ...prev,
      owner: newOwner,
      labRoom: newLabRooms.includes(prev.labRoom) ? prev.labRoom : ""
    }));
  }

  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const oldImages = formData.images || [];
    const newImages = newFiles.filter(file => file.type.startsWith("image/"));

    // if (newFiles.length !== newImages.length) {
    //   alert("Only image files are allowed!");
    // }

    const uniqueImages = filesChange(newImages, oldImages);

    const newAttachments = newFiles.filter(file => !file.type.startsWith("image/"));
    const oldAttachments = formData.attachments || [];
    const uniqueAttachments = filesChange(newAttachments, oldAttachments);

    setFormData(prev => ({
      ...prev,
      images: uniqueImages,
      attachments: uniqueAttachments
    }));
  }

  const handleQuantityChange = (productId, value, product) => {
    let qty = parseInt(value, 10);

    // minimalna ilość 0, maksymalna = dostępny stock
    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > getAvailableStockForProduct(product)) qty = getAvailableStockForProduct(product);

    // aktualizacja stanu koszyka
    setCartQuantities(prev => ({ ...prev, [productId]: qty }));

    // aktualizacja localStorage
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = cart.findIndex(p => p._id === productId);

    if (qty === 0) {
      if (existingIndex !== -1) cart.splice(existingIndex, 1);
    } else {
      if (existingIndex !== -1) {
        cart[existingIndex].quantity = qty;
      } else {
        cart.push({ ...product, quantity: qty });
      }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setCartQuantitiesInCart(cart.reduce((acc, item) => ({ ...acc, [item._id]: item.quantity }), {}));
  };


  // const handleAddToCart = (product) => {
  //   const cart = JSON.parse(localStorage.getItem("cart")) || [];
  //   const qtyToAdd = cartQuantities[product._id] || 1;
  //   const existingIndex = cart.findIndex(p => p._id === product._id);
  //   const availableStock = product.stockForRent;

  //   if (existingIndex !== -1) {
  //     cart[existingIndex].quantity = Math.min(cart[existingIndex].quantity + qtyToAdd, availableStock);
  //   } else {
  //     cart.push({ ...product, quantity: Math.min(qtyToAdd, availableStock) });
  //   }

  //   localStorage.setItem("cart", JSON.stringify(cart));
  //   const quantities = {};
  //   cart.forEach(item => quantities[item._id] = item.quantity);
  //   setCartQuantitiesInCart(quantities);

  //   const inCart = quantities[product._id] || 0;
  //   const remaining = availableStock - inCart;
  //   setCartQuantities(prev => ({ ...prev, [product._id]: remaining > 0 ? 1 : 0 }));
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
      form.append("stockTotal", formData.stockTotal);
      form.append("stockForRent", formData.stockForRent);
      form.append("extraFields", JSON.stringify(cleanedExtraFields));
      form.append("categories", JSON.stringify(formData.categories)); // dodanie kategorii
      form.append("tag", formData.tag);
      form.append("labRoom", formData.labRoom);
      form.append("owner", formData.owner);

      form.append("isSerialized", JSON.stringify(formData.isSerialized));
      form.append("isRentable", JSON.stringify(formData.isRentable));
      form.append("isVisible", JSON.stringify(formData.isVisible));
      form.append("isShared", JSON.stringify(formData.isShared));
      form.append("version", formData.version);
      console.log(formData);
      const clientImages = formData.images && formData.images.length ? formData.images.filter(img => img.source === "client") : [];
      const serverImages = formData.images && formData.images.length ? formData.images.filter(img => img.source === "server") : [];

      if (clientImages && clientImages.length) {
        clientImages.forEach(imgObj => {
          form.append("images", imgObj.file)
        });

        const imagesData = clientImages.map(imgObj => ({ originalName: imgObj.originalName, uniqueKey: imgObj.uniqueKey, isVisible: imgObj.isVisible }));
        form.append("newImagesData", JSON.stringify(imagesData));
      }
      if (serverImages && serverImages.length) {
        const imagesData = serverImages.map(imgObj => ({ filename: imgObj.filename, originalName: imgObj.originalName, uniqueKey: imgObj.uniqueKey, isVisible: imgObj.isVisible }))
        form.append("oldImages", JSON.stringify(imagesData))
      }

      const clientAttachments = formData.attachments && formData.attachments.length ? formData.attachments.filter(attachment => attachment.source === "client") : [];
      const serverAttachments = formData.attachments && formData.attachments.length ? formData.attachments.filter(attachment => attachment.source === "server") : [];

      if (clientAttachments && clientAttachments.length) {
        clientAttachments.forEach(attachmentObj => {
          form.append("attachments", attachmentObj.file)
        });

        const attachmentsData = clientAttachments.map(attachmentObj => ({ originalName: attachmentObj.originalName, uniqueKey: attachmentObj.uniqueKey, isVisible: attachmentObj.isVisible }));
        form.append("newAttachmentsData", JSON.stringify(attachmentsData));
      }
      if (serverAttachments && serverAttachments.length) {
        const attachmentsData = serverAttachments.map(attachmentObj => ({ filename: attachmentObj.filename, originalName: attachmentObj.originalName, uniqueKey: attachmentObj.uniqueKey, isVisible: attachmentObj.isVisible }))
        form.append("oldAttachments", JSON.stringify(attachmentsData))
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const res = editProduct
        ? await axios.put(`http://localhost:3500/products/${editProduct}`, form, config)
        : await axios.post(`http://localhost:3500/products/create`, form, config);

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

    // Filtrujemy tylko widoczne kolumny
    const visibleColumns = allColumns.filter(col => !hiddenColumns.includes(col));

    const headers = ["#", ...visibleColumns];
    const rows = filteredProducts.map((p, i) =>
      visibleColumns.map(col => {
        if (col === "stockTotal") return p.stockTotal;
        if (col === "stockForRent") return getAvailableStockForProduct(p);
        if (col === "categories") return p.categories?.map(category => category?.name ?? "").join(", ") ?? []
        if (col === "owner") return p.owner?.name ?? p.owner;
        if (col === "description") return p.description;
        if (col === "name") return p.name;
        return p[col] ?? p.extraFields?.[col] ?? "";
      })
    );

    // Dodaj numerację w pierwszej kolumnie
    const numberedRows = rows.map((row, idx) => [idx + 1, ...row]);

    autoTable(doc, { head: [headers], body: numberedRows, startY: 30 });
    doc.save("products.pdf");
  };

  // const handleRemoveImage = async () => {
  //   if (!editProduct) return; // tylko dla istniejącego produktu
  //   if (!window.confirm("Remove product image?")) return;

  //   try {
  //     const res = await axios.delete(
  //       `http://localhost:3500/products/${editProduct}/image`,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     if (res.data.success) {
  //       // Usuń obraz z lokalnego stanu
  //       setFormData(prev => ({ ...prev, image: null }));
  //       fetchProducts(); // odśwież listę produktów, żeby zdjęcie zniknęło z tabeli
  //     } else {
  //       alert(res.data.message || "Failed to remove image");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     alert("Server error while removing image");
  //   }
  // };
  const handlePreview = (productId) => {
    if (!productId) return alert("No product to preview");
    navigate("/admin-dashboard/preview", { state: { productId } });
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-700">Product Management</h1>

      {/* Kontrolki */}
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

        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Filter by tag */}
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

        {/* Columns dropdown */}
        <div className="relative">
          <button
            onClick={() => setColumnsDropdownOpen(prev => !prev)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition flex items-center gap-2"
          >
            {columnsDropdownOpen ? "Hide Columns" : "Show Columns"}
            <span className={`transform transition-transform ${columnsDropdownOpen ? "rotate-180" : ""}`}>▼</span>
          </button>

          {columnsDropdownOpen && (
            <ul className="absolute left-0 mt-2 list-disc list-inside border rounded p-2 bg-white shadow max-h-60 overflow-y-auto z-10 w-56">
              {allColumns.map(col => (
                <li key={col} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!hiddenColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                  />
                  {col}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>









      {/* Tabela */}

      <div className="overflow-x-auto w-full shadow rounded border border-gray-200">
        <table className="table-auto w-full min-w-max divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {allColumns.filter(col => !hiddenColumns.includes(col)).map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center justify-between">
                    <span onClick={() => handleSort(col)} className="truncate">
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
              {isAdmin && <th className="px-4 py-2 whitespace-nowrap">Actions</th>}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedProducts.map(p => (
              <tr key={p._id}>
                {allColumns.filter(col => !hiddenColumns.includes(col)).map((col, idx) => (
                  <td key={idx} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {col === "stockTotal" ? p.stockTotal ?? 0
                      : col === "stockForRent" ? getAvailableStockForProduct(p) ?? 0
                        : col === "categories" ? p.categories?.map(category => category?.name ?? "").join(", ") ?? []
                          : col === "owner" ? p.owner?.name ?? "Brak ownera"
                            : col === "description" ? (
                              <span className="truncate cursor-pointer" onClick={() => handlePreview(p._id)} title={p.description}>
                                {p.description?.length > 50 ? p.description.slice(0, 50) + "…" : p.description}
                              </span>
                            )
                              : col === "name" ? (
                                <span className="truncate cursor-pointer" onClick={() => handlePreview(p._id)} title={p.name}>
                                  {p.name}
                                </span>
                              )
                                : p[col] ?? p.extraFields?.[col] ?? ""}
                  </td>
                ))}


                <td className="px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 whitespace-nowrap">

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleEdit(p)} disabled={(user.id !== p.owner?._id && !isAdmin)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                      Edit
                    </button>
                    <button onClick={() => handlePreview(p._id)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
                      Preview
                    </button>
                    <button onClick={() => handleDelete(p._id)} disabled={(user.id !== p.owner?._id && !isAdmin)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                      Delete
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                    <div className="flex items-center border rounded overflow-hidden h-10">
                      <button
                        onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) - 1, p)}
                        className="px-3 bg-gray-200 hover:bg-gray-300 h-full"
                        disabled={(cartQuantities[p._id] || 0) <= 0}
                      >-</button>
                      <input
                        type="number"
                        min="0"
                        max={getAvailableStockForProduct(p)}
                        value={cartQuantities[p._id] || 0}
                        onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                        className="w-16 text-center outline-none"
                      />
                      <button
                        onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) + 1, p)}
                        className="px-3 bg-gray-200 hover:bg-gray-300 h-full"
                        disabled={(cartQuantities[p._id] || 0) >= getAvailableStockForProduct(p)}
                      >+</button>
                    </div>

                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full sm:mt-0 mt-1">
                      W koszyku: {cartQuantities[p._id] || 0}
                    </span>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Paginate */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-gray-700 font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
            {/* <h2 className="text-2xl font-bold mb-4">{editProduct ? "Edit Product" : "Add Product"}</h2> */}
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {editProduct ? "Edit Product" : "Add Product"}
                </h2>

                <div className="flex gap-2">
                  {/* Serializable toggle */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      isSerialized: !prev.isSerialized,
                      stockTotal: !prev.isSerialized ? 1 : prev.stockTotal,
                      stockForRent: !prev.isSerialized ? (prev.isRentable ? 1 : 0) : prev.stockForRent
                    }))}
                    className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                    title="Serializable (Track individually vs grouped)"
                  >
                    {formData.isSerialized ? (
                      <FaCube className="text-blue-500 text-3xl" />
                    ) : (
                      <FaCubes className="text-gray-500" />
                    )}
                  </button>

                  {/* Rentable toggle */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isRentable: !prev.isRentable, stockForRent: !prev.isRentable ? prev.isSerialized ? "1" : prev.stockForRent : "0" }))}
                    className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                    title="Rentable (allow item for rent)"
                  >
                    <FaHandshake
                      className={formData.isRentable ? "text-green-500" : "text-gray-500"}
                    />
                  </button>

                  {/* Visible toggle */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isVisible: !formData.isVisible, isShared: !prev.isVisible ? true : prev.isShared }))}
                    className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                    title="Visible (allow item to be vissible for everyone)"
                  >
                    {formData.isVisible ? (
                      <FaEye className="text-indigo-500" />
                    ) : (
                      <FaEyeSlash className="text-gray-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    name="isShared"
                    onClick={() => setFormData(prev => ({ ...prev, isShared: !formData.isShared, isVisible: prev.isShared ? false : prev.isVisible }))}
                    className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                    title="Shared (allow item to be vissible for other users)"
                  >
                    {formData.isShared ? (
                      <FaUserShield className="text-indigo-500" />
                    ) : (
                      <FaUserLock className="text-gray-500" />
                    )}
                  </button>
                </div>

              </div>
              <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required className="border p-2 rounded" />
              <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="border p-2 rounded" />
              <input type="number" name="stockTotal" placeholder="stockTotal" value={formData.stockTotal} onChange={handleChange} min={1} required disabled={formData.isSerialized} className="border p-2 rounded disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" />
              <input type="number" name="stockForRent" placeholder="stockForRent" value={formData.stockForRent} onChange={handleChange} min={0} max={formData.stockTotal} required disabled={formData.isSerialized || !formData.isRentable} className="border p-2 rounded disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed" />
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
                {/* {formData.tag.map((tag, idx) => (
                  <span key={idx} className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1">
                    {tag} <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} className="text-red-600 font-bold">x</button>
                  </span>
                ))} */}

              </div>
              <input
                type="file"
                accept="*"
                multiple
                onChange={handleFilesChange}
                className="border p-2 rounded"
              />

              {formData.images?.length > 0 && (
                <div className="mb-6">
                  <p className="font-semibold text-gray-700 mb-2">Images:</p>
                  <div className="flex flex-wrap gap-3">
                    {formData.images.map((imageObj) => {
                      const name = imageObj.originalName;
                      const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);

                      return (
                        <span key={imageObj.uniqueKey} className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1" title={name}>
                          {displayName}
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.map(file => file === imageObj ? { ...file, isVisible: !imageObj.isVisible } : file) }))} className="text-gray-700 hover:text-blue-500">
                            {imageObj.isVisible ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                          </button>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter(file => file !== imageObj) }))} className="text-red-600 font-bold">x</button>

                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.attachments?.length > 0 && (
                <div className="mb-6">
                  <p className="font-semibold text-gray-700 mb-2">Attachments:</p>
                  <div className="flex flex-wrap gap-3">
                    {formData.attachments.map((attachmentObj) => {
                      const name = attachmentObj.originalName;
                      const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);

                      return (
                        <span key={attachmentObj.uniqueKey} className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1" title={name}>
                          {displayName}
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments.map(file => file === attachmentObj ? { ...file, isVisible: !attachmentObj.isVisible } : file) }))} className="text-gray-700 hover:text-blue-500">
                            {attachmentObj.isVisible ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                          </button>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments.filter(file => file !== attachmentObj) }))} className="text-red-600 font-bold">x</button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <select
                name="labRoom"
                value={formData.labRoom}
                onChange={handleChange}
                className="border p-2 rounded disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">None</option>
                {labRooms?.map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>

              <select
                name="owner"
                value={formData.owner}
                onChange={handleOwnerChange}
                className="border p-2 rounded disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                disabled={!isAdmin}
              >
                {users.map((user) => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>

              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;