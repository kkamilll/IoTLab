
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
import CategoryTree from "../components/CategoryTree";

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
    categories: [],
    tags: [],
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
  const [activeCategories, setActiveCategories] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState([]);

  const [newTag, setNewTag] = useState("");
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

      if (
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      ) return true;

      if (p.tags?.some(tag => tag.toLowerCase().includes(searchLower))) return true;

      if (Object.values(p.extraFields || {}).some(val =>
        val.toString().toLowerCase().includes(searchLower)
      )) return true;

      return false;
    });

    // AND filter dla wielu kategorii
    if (activeCategories.length > 0) {
      filtered = filtered.filter(p =>
        activeCategories.every(selectedCatId =>
          p.categories?.some(cat => cat._id === selectedCatId)
        )
      );
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
  }, [products, searchTerm, sortConfig, activeCategories]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/categories/private`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };
  // Pobieranie produktów
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/private`, {
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
      const res = await axios.get(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/users`, {
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
      `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  };


  const getAvailableStockForProduct = (product) => (Math.max(0, Number(product.stockForRent || 0) - Number(product.stockRentedOut || 0) - Number(product.stockReserved || 0)));

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
      tags: product?.tags || [],
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
  };


  const closeModal = () => {
    setOpenModal(false);
    setEditProduct(null);
    setFormData({ name: "", description: "", stockTotal: "", stockForRent: "0", extraFields: {}, categories: [], tags: [], labRoom: "", images: [], attachments: [], owner: user.id, isSerialized: false, isRentable: false, isVisible: false, isShared: false, version: "" });
    setNewTag("");
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

  const handleAddTag = () => {
    if (!newTag) return;

    const tagLower = newTag.trim().toLowerCase();
    if (!formData.tags.includes(tagLower)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagLower] }));
      setNewTag("");
    } else {
      alert("This tag is already added.");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
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

  const addExtraField = () => {
    const key = prompt("Podaj nazwę nowej kolumny:")?.trim()?.toLowerCase();

    if (key && !extraColumns.some(col => col.toLowerCase() === key)) {
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
      const res = await axios.delete(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/extraField/${key}`, {
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
      alert(`${error.response.data.message}`);
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
      form.append("tags", JSON.stringify(formData.tags));
      form.append("labRoom", formData.labRoom);
      form.append("owner", formData.owner);

      form.append("isSerialized", JSON.stringify(formData.isSerialized));
      form.append("isRentable", JSON.stringify(formData.isRentable));
      form.append("isVisible", JSON.stringify(formData.isVisible));
      form.append("isShared", JSON.stringify(formData.isShared));
      form.append("version", formData.version);

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
        ? await axios.put(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/${editProduct}`, form, config)
        : await axios.post(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/create`, form, config);
      console.log(res);

      if (res.data.success) {
        fetchProducts();
        closeModal();
      } else {
        alert(res.data.message || "Operation failed");
      }
    } catch (error) {
      console.error(error);
      alert(`${error.response.data.message}`);
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
        if (col === "stockForRent") return p.stockForRent;
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

  const handlePreview = (productId) => {
    if (!productId) return alert("No product to preview");
    navigate("/admin-dashboard/preview", { state: { productId } });
  };
  const handleCategorySelect = (catId) => {
    setActiveCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // handler dla rozwoju kategorii
  const handleCategoryExpand = (catId) => {
    setExpandedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };
  return (
    <div className="w-full h-full flex flex-col gap-4 p-6 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-700">Object Management</h1>

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
              Add Object
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
              Go to Cart
            </button>
          </>

        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative inline-block text-left">
          <button
            type="button"
            onClick={() => setCategoriesDropdownOpen(prev => !prev)}
            className="inline-flex justify-between w-64 rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            Filter by category
            <svg
              className="-mr-1 ml-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {categoriesDropdownOpen && (
            <div className="absolute mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 max-h-60 overflow-y-auto">
              <ul className="py-1">
                {allCategories.map(category => (
                  <li key={category._id}>
                    <label className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        value={category._id}
                        checked={activeCategories.includes(category._id)}
                        onChange={e => {
                          const { checked } = e.target;
                          setActiveCategories(prev =>
                            checked
                              ? [...prev, category._id]
                              : prev.filter(id => id !== category._id)
                          );
                        }}
                        className="accent-blue-500 w-4 h-4"
                      />
                      <span>{category.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

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

      <div className="w-full">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto w-full shadow rounded border border-gray-200">
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
              {paginatedProducts.map((p) => (
                <tr key={p._id}>
                  {allColumns
                    .filter((col) => !hiddenColumns.includes(col))
                    .map((col, idx) => {
                      let value;
                      switch (col) {
                        case "stockTotal":
                          value = p.stockTotal ?? 0;
                          break;

                        case "stockForRent":
                          value = p.stockForRent ?? 0;
                          break;

                        case "categories":
                          value = (
                            <div className="inline-block relative w-32">
                              <select
                                className="appearance-none border rounded px-2 py-1 text-sm w-full pr-6 bg-white cursor-pointer"
                                value=""
                                onChange={(e) => e.preventDefault()} // temporarily block change
                              >
                                {p.categories?.map((c, i) => (
                                  <option key={i} value={c?.name ?? ""}>
                                    {(c?.name ?? "").slice(0, 15)}
                                  </option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 text-sm">
                                ⬇️
                              </span>
                            </div>
                          );
                          break;

                        case "owner":
                          value = p.owner?.name ?? p.owner;
                          break;

                        case "description":
                        case "name":
                          value = p[col];
                          break;

                        default:
                          value = p[col] ?? p.extraFields?.[col] ?? "";
                      }

                      // Determine if we need truncation (strings only)
                      const isString = typeof value === "string";
                      const maxLength = 25;
                      const truncated = isString && value.length > maxLength ? value.slice(0, maxLength) + "…" : value;

                      return (
                        <td key={idx} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {col === "categories" ? (
                            value
                          ) : isString ? (
                            <span className="truncate cursor-pointer" title={value}>
                              {truncated}
                            </span>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  <td className="px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 whitespace-nowrap">
                    {/* Action buttons + quantity */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleEdit(p)} disabled={(user.id !== p.owner._id && !isAdmin)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                        Edit
                      </button>
                      <button onClick={() => handlePreview(p._id)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
                        Preview
                      </button>
                      <button onClick={() => handleDelete(p._id)} disabled={(user.id !== p.owner._id && !isAdmin)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
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

                      <div className="flex gap-2">
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                          Available: {getAvailableStockForProduct(p)}
                        </span>
                        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                          In cart: {cartQuantities[p._id] || 0}
                        </span>
                      </div>
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
            <div key={p._id} className="border rounded shadow p-4 bg-white">
              {allColumns.filter(col => !hiddenColumns.includes(col)).map((col, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span className="font-semibold text-gray-500">{col}:</span>
                  <span className="text-gray-700 truncate">
                    {(() => {
                      switch (col) {
                        case "stockTotal":
                          return p.stockTotal ?? 0;

                        case "stockForRent":
                          return p.stockForRent ?? 0;

                        case "categories":
                          return (
                            <div className="inline-block relative">
                              <select
                                className="border rounded px-2 py-1 text-sm"
                                value=""
                                onChange={(e) => e.preventDefault()}
                                style={{ width: "8rem" }}
                              >
                                <option value="">Categories</option>
                                {p.categories?.map((c, i) => (
                                  <option key={i} value={c?.name ?? ""}>
                                    {(c?.name ?? "").slice(0, 15)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );

                        case "owner":
                          return p.owner?.name ?? p.owner;

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
              ))}

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleEdit(p)} disabled={(user.id !== p.owner._id && !isAdmin)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                    Edit
                  </button>
                  <button onClick={() => handlePreview(p._id)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
                    Preview
                  </button>
                  <button onClick={() => handleDelete(p._id)} disabled={(user.id !== p.owner._id && !isAdmin)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                    Delete
                  </button>
                </div>

                <div className="flex justify-center items-center border rounded-lg overflow-hidden h-10 mt-2 shadow-sm">
                  <button
                    onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) - 1, p)}
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
                    className="w-16 text-center outline-none border-x border-gray-200 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
                  />

                  <button
                    onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) + 1, p)}
                    className="px-4 bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-bold"
                    disabled={(cartQuantities[p._id] || 0) >= getAvailableStockForProduct(p)}
                  >
                    +
                  </button>
                </div>

                <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    Available: {getAvailableStockForProduct(p)}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    In cart: {cartQuantities[p._id] || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
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
        <div className="fixed inset-0 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-4" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto my-8 max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {editProduct ? "Edit Object" : "Add Object"}
                </h2>

                <div className="flex gap-2">
                  {/* Toggles */}
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
                    {formData.isSerialized ? <FaCube className="text-blue-500 text-3xl" /> : <FaCubes className="text-gray-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isRentable: !prev.isRentable, stockForRent: !prev.isRentable ? prev.isSerialized ? "1" : prev.stockForRent : "0" }))}
                    className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                    title="Rentable (allow item for rent)"
                  >
                    <FaHandshake className={formData.isRentable ? "text-green-500" : "text-gray-500"} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isVisible: !formData.isVisible, isShared: !prev.isVisible ? true : prev.isShared }))}
                    className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                    title="Visible (allow item to be visible for everyone)"
                  >
                    {formData.isVisible ? <FaEye className="text-indigo-500" /> : <FaEyeSlash className="text-gray-500" />}
                  </button>

                  <button
                    type="button"
                    name="isShared"
                    onClick={() => setFormData(prev => ({ ...prev, isShared: !formData.isShared, isVisible: prev.isShared ? false : prev.isVisible }))}
                    className="p-2 rounded-full hover:bg-gray-200 text-3xl"
                    title="Shared (allow item to be visible for other users)"
                  >
                    {formData.isShared ? <FaUserShield className="text-indigo-500" /> : <FaUserLock className="text-gray-500" />}
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="font-semibold">Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="font-semibold">Description</label>
                <input
                  id="description"
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              {/* Stock Total */}
              <div>
                <label htmlFor="stockTotal" className="font-semibold">Stock Total</label>
                <input
                  id="stockTotal"
                  type="number"
                  name="stockTotal"
                  placeholder="Stock Total"
                  value={formData.stockTotal}
                  onChange={handleChange}
                  min={1}
                  required
                  disabled={formData.isSerialized}
                  className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>

              {/* Stock For Rent */}
              <div>
                <label htmlFor="stockForRent" className="font-semibold">Stock For Rent</label>
                <input
                  id="stockForRent"
                  type="number"
                  name="stockForRent"
                  placeholder="Stock For Rent"
                  value={formData.stockForRent}
                  onChange={handleChange}
                  min={0}
                  max={formData.stockTotal}
                  required
                  disabled={formData.isSerialized || !formData.isRentable}
                  className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>

              {/* Extra Columns */}
              {extraColumns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <label htmlFor={`extra-${col}`} className="font-semibold">{col}</label>
                  <input
                    id={`extra-${col}`}
                    type="text"
                    placeholder={col}
                    value={formData.extraFields?.[col] || ""}
                    onChange={(e) => handleExtraFieldChange(col, e.target.value)}
                    className="border p-2 rounded flex-1"
                  />
                  {isAdmin && (
                    <button type="button" onClick={() => removeExtraField(col)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">X</button>
                  )}
                </div>
              ))}

              {/* Categories */}
              <div>
                <label className="font-semibold">Categories</label>
                <CategorySelector
                  categoryTree={categoryTree}
                  flatCategories={normalizedCategories}
                  formData={formData}
                  setFormData={setFormData}
                />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <label htmlFor="tags" className="font-semibold text-gray-700">Tags</label>
                <div className="flex gap-2">
                  <input
                    id="tags"
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Enter a tag"
                    className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
                  >
                    Add
                  </button>
                </div>
                {formData.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => {
                      const name = tag.toString();
                      const displayName = truncateFileName(name, MAX_FILE_NAME_LENGTH);

                      return (
                        <span
                          key={index}
                          className="bg-blue-200 px-2 py-1 rounded flex items-center gap-1"
                          title={name}
                        >
                          {displayName}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-red-600 font-bold hover:text-red-700"
                          >
                            x
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="files" className="font-semibold">Upload Files</label>
                <input
                  id="files"
                  type="file"
                  accept="*"
                  multiple
                  onChange={handleFilesChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              {/* Images Display */}
              {formData.images?.length > 0 && (
                <div>
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
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter(file => file !== imageObj) }))} className="text-red-600 font-bold hover:text-red-700">x</button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attachments Display */}
              {formData.attachments?.length > 0 && (
                <div>
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

              {/* Lab Room */}
              <div>
                <label htmlFor="labRoom" className="font-semibold">Lab Room</label>
                <select
                  id="labRoom"
                  name="labRoom"
                  value={formData.labRoom}
                  onChange={handleChange}
                  className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">None</option>
                  {labRooms?.map((room) => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              {/* Owner */}
              <div>
                <label htmlFor="owner" className="font-semibold">Owner</label>
                <select
                  id="owner"
                  name="owner"
                  value={formData.owner}
                  onChange={handleOwnerChange}
                  className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={!isAdmin}
                >
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
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