import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import ProductModal from "../components/products/ProductModal";
import ProductsTable from "../components/products/ProductsTable";
import ProductsMobileCards from "../components/products/ProductsMobileCards";
import { generateProductsPDF } from "../utils/pdfGenerator";
import { useAuth } from "../context/AuthContext";
import { buildTree } from "../utils/categoryUtils";
import CategoryTree from "../components/categories/CategoryTree";

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
    version: "",
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
  // const [cartQuantitiesInCart, setCartQuantitiesInCart] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const selectedUser = users.find((user) => user._id === formData.owner);
  const labRooms = selectedUser?.labRooms || [];

  const toggleColumn = (col) => {
    setHiddenColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  };

  // const allColumns = ["name", "description", "Owned", "tag", ...extraColumns];
  const allColumns = [
    "name",
    "description",
    "total",
    "for rent",
    "categories",
    "owner",
    ...extraColumns,
  ];
  // const allColumns = ["name", "description", "stock", "hiddenStock", "category", "owner", ...extraColumns];

  const allCategories = Object.values(
    // create an array of objects from object of objects
    products
      .flatMap((p) => p.categories || []) // flatten array products into array of all categories
      .reduce((acc, cat) => {
        acc[cat._id] = cat;
        return acc;
      }, {}), // create object of objects from array, without duplicates with same field _id
  );

  // category tree
  const normalizedCategories = useMemo(
    () =>
      categories.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        parent: c.parent?._id?.toString() || null,
      })),
    [categories],
  );
  const categoryTree = useMemo(
    () => buildTree(normalizedCategories),
    [normalizedCategories],
  );

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchUsers();

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

      if (
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      )
        return true;

      if (p.tags?.some((tag) => tag.toLowerCase().includes(searchLower)))
        return true;

      if (
        Object.values(p.extraFields || {}).some((val) =>
          val.toString().toLowerCase().includes(searchLower),
        )
      )
        return true;

      return false;
    });

    // AND filter dla wielu kategorii
    if (activeCategories.length > 0) {
      filtered = filtered.filter((p) =>
        activeCategories.every((selectedCatId) =>
          p.categories?.some((cat) => cat._id === selectedCatId),
        ),
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
      const res = await apiClient.get("/categories/private");
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
      const res = await apiClient.get("/products/private");

      if (!res.data.success)
        return alert(res.data.message || "Error fetching products");

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
      setFilteredProducts(updatedProducts);
    } catch (err) {
      console.error(err);
      alert(`${err.response.data.message}`);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/users");
      if (!res.data.success)
        return alert(res.data.message || "Error fetching products");

      const fetchedUsers = res.data.users;
      setUsers(fetchedUsers);
    } catch (error) {
      console.error(error);
      alert(`${error.response.data.message}`);
    }
  };

  const deleteProduct = async (id) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  };

  const getAvailableStockForProduct = (product) =>
    Math.max(
      0,
      Number(product.stockForRent || 0) -
        Number(product.stockRentedOut || 0) -
        Number(product.stockReserved || 0),
    );

  const truncateFileName = (name, maxLength) => {
    if (!name) return "";

    const lastDotIndex = name.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // No extension
      return name.length > maxLength
        ? name.slice(0, maxLength - 3) + "..."
        : name;
    }

    const baseName = name.slice(0, lastDotIndex);
    const extension = name.slice(lastDotIndex);
    const truncation = "...-";

    if (baseName.length > maxLength) {
      return (
        baseName.slice(0, maxLength - truncation.length) +
        truncation +
        extension
      );
    }

    return name;
  };

  const filesChange = (newFiles, oldFiles) => {
    const validFiles = newFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(
          `${file.name} is too large (max ${MAX_FILE_SIZE / MEGA_BYTE}MB).`,
        );
        return false;
      }
      return true;
    });

    const newFilesMapped = validFiles.map((file) => ({
      file: file,
      originalName: file.name,
      uniqueKey: `${file.name}-${file.lastModified}`,
      isVisible: false,
      source: "client",
    }));

    const files = [...oldFiles, ...newFilesMapped];
    // check if file was already added
    const uniqueFiles = Array.from(
      new Map(
        files.map((fileObj) => [`${fileObj.uniqueKey}`, fileObj]),
      ).values(),
    );

    return uniqueFiles;
  };

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
      categories:
        (product?.categories || []).map((cat) => cat._id.toString()) || [],
      tags: product?.tags || [],
      labRoom: product?.labRoom || "",
      images:
        product?.images?.map((imageObj) => ({
          ...imageObj,
          source: "server",
        })) || [],
      attachments:
        product?.attachments?.map((attachmentObj) => ({
          ...attachmentObj,
          source: "server",
        })) || [],
      owner: product.owner?._id || user.id,
      isSerialized: product?.isSerialized || false,
      isRentable: product?.isRentable || false,
      isVisible: product?.isVisible || false,
      isShared: product?.isShared || false,
      version: product.__v?.toString() || "",
    });
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditProduct(null);
    setFormData({
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
      version: "",
    });
    setNewTag("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExtraFieldChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      extraFields: { ...prev.extraFields, [key]: value },
    }));
  };

  const handleAddTag = () => {
    if (!newTag) return;

    const tagLower = newTag.trim().toLowerCase();
    if (!formData.tags.includes(tagLower)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagLower] }));
      setNewTag("");
    } else {
      alert("This tag is already added.");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleOwnerChange = (e) => {
    const newOwner = e.target.value;
    const selectedUser = users.find((user) => user._id === newOwner);
    const newLabRooms = selectedUser?.labRooms || [];

    setFormData((prev) => ({
      ...prev,
      owner: newOwner,
      labRoom: newLabRooms.includes(prev.labRoom) ? prev.labRoom : "",
    }));
  };

  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const oldImages = formData.images || [];
    const newImages = newFiles.filter((file) => file.type.startsWith("image/"));
    // console.log(oldImages);

    // if (newFiles.length !== newImages.length) {
    //   alert("Only image files are allowed!");
    // }

    const uniqueImages = filesChange(newImages, oldImages);

    const newAttachments = newFiles.filter(
      (file) => !file.type.startsWith("image/"),
    );
    const oldAttachments = formData.attachments || [];
    const uniqueAttachments = filesChange(newAttachments, oldAttachments);

    setFormData((prev) => ({
      ...prev,
      images: uniqueImages,
      attachments: uniqueAttachments,
    }));
  };

  const handleQuantityChange = (productId, value, product) => {
    let qty = parseInt(value, 10);

    // minimalna ilość 0, maksymalna = dostępny stock
    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > getAvailableStockForProduct(product))
      qty = getAvailableStockForProduct(product);

    // aktualizacja stanu koszyka
    setCartQuantities((prev) => ({ ...prev, [productId]: qty }));

    // aktualizacja localStorage
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = cart.findIndex((p) => p._id === productId);

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
    // setCartQuantitiesInCart(cart.reduce((acc, item) => ({ ...acc, [item._id]: item.quantity }), {}));
  };

  const addExtraField = () => {
    const key = prompt("Enter the name of the new column (max 30 characters):")
      ?.trim()
      ?.toLowerCase();
    if (!key) return; // użytkownik anulował
    if (key.length > 30) {
      alert("Column name cannot be longer than 30 characters.");
      return;
    }

    if (!extraColumns.includes(key)) {
      setExtraColumns((prev) => [...prev, key]);
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          extraFields: { ...p.extraFields, [key]: "" },
        })),
      );
      setFormData((prev) => ({
        ...prev,
        extraFields: { ...prev.extraFields, [key]: "" },
      }));
    } else {
      alert("A column with this name already exists.");
    }
  };

  const removeExtraField = async (key) => {
    if (!window.confirm(`Delete column "${key}" from all products?`)) return;

    try {
      const res = await apiClient.delete(`/products/extraField/${key}`);

      if (res.data.success) {
        // Usuń kolumnę z widoku
        setExtraColumns((prev) => prev.filter((col) => col !== key));
        setProducts((prev) =>
          prev.map((p) => {
            const newExtra = { ...p.extraFields };
            delete newExtra[key];
            return { ...p, extraFields: newExtra };
          }),
        );
        setFormData((prev) => {
          const newExtra = { ...prev.extraFields };
          delete newExtra[key];
          return { ...prev, extraFields: newExtra };
        });
      } else {
        alert(res.data.message || "Failed to delete column");
      }
    } catch (err) {
      console.error(err);
      alert(`${err.response.data.message}`);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else if (sortConfig.direction === "desc") {
        setSortConfig({ key: null, direction: null }); // brak sortowania
      } else {
        setSortConfig({ key, direction: "asc" });
      }
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  // Dodanie obsługi plików w handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Remove empty extraFields
      const cleanedExtraFields = Object.fromEntries(
        Object.entries(formData.extraFields).filter(
          ([key, value]) => value != null && value !== "",
        ),
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

      const clientImages =
        formData.images && formData.images.length
          ? formData.images.filter((img) => img.source === "client")
          : [];
      const serverImages =
        formData.images && formData.images.length
          ? formData.images.filter((img) => img.source === "server")
          : [];

      if (clientImages && clientImages.length) {
        clientImages.forEach((imgObj) => {
          form.append("images", imgObj.file);
        });

        const imagesData = clientImages.map((imgObj) => ({
          originalName: imgObj.originalName,
          uniqueKey: imgObj.uniqueKey,
          isVisible: imgObj.isVisible,
        }));
        form.append("newImagesData", JSON.stringify(imagesData));
      }
      if (serverImages && serverImages.length) {
        const imagesData = serverImages.map((imgObj) => ({
          fileId: imgObj._id,
          filename: imgObj.filename,
          originalName: imgObj.originalName,
          uniqueKey: imgObj.uniqueKey,
          isVisible: imgObj.isVisible,
        }));
        form.append("oldImages", JSON.stringify(imagesData));
      }

      const clientAttachments =
        formData.attachments && formData.attachments.length
          ? formData.attachments.filter(
              (attachment) => attachment.source === "client",
            )
          : [];
      const serverAttachments =
        formData.attachments && formData.attachments.length
          ? formData.attachments.filter(
              (attachment) => attachment.source === "server",
            )
          : [];

      if (clientAttachments && clientAttachments.length) {
        clientAttachments.forEach((attachmentObj) => {
          form.append("attachments", attachmentObj.file);
        });

        const attachmentsData = clientAttachments.map((attachmentObj) => ({
          originalName: attachmentObj.originalName,
          uniqueKey: attachmentObj.uniqueKey,
          isVisible: attachmentObj.isVisible,
        }));
        form.append("newAttachmentsData", JSON.stringify(attachmentsData));
      }
      if (serverAttachments && serverAttachments.length) {
        const attachmentsData = serverAttachments.map((attachmentObj) => ({
          fileId: attachmentObj._id,
          filename: attachmentObj.filename,
          originalName: attachmentObj.originalName,
          uniqueKey: attachmentObj.uniqueKey,
          isVisible: attachmentObj.isVisible,
        }));
        form.append("oldAttachments", JSON.stringify(attachmentsData));
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const res = editProduct
        ? await apiClient.put(`/products/${editProduct}`, form, config)
        : await apiClient.post("/products/create", form, config);
      // console.log(res);

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
    generateProductsPDF(filteredProducts, allColumns, hiddenColumns);
  };
  const handlePreview = (productId) => {
    if (!productId) return alert("No product to preview");
    navigate("/admin-dashboard/preview", { state: { productId } });
  };
  const handleCategorySelect = (catId) => {
    setActiveCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    );
  };

  // handler dla rozwoju kategorii
  const handleCategoryExpand = (catId) => {
    setExpandedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    );
  };
  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 md:p-8 bg-slate-50/30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Objects Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage and organize laboratory objects, items, and inventory
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-center w-full md:w-auto">
          <button
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl shadow-sm hover:bg-slate-200 transition"
            onClick={generatePDF}
          >
            Export PDF
          </button>

          <button
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-slate-800 text-white rounded-xl shadow-sm hover:bg-slate-900 transition"
            onClick={addExtraField}
          >
            Add Column
          </button>

          <button
            onClick={() => navigate("/cart")}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition"
          >
            Go to Cart
          </button>

          <button
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
            onClick={() => {
              setEditProduct(null);
              setOpenModal(true);
            }}
          >
            Add Object
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search objects..."
          className="border border-slate-200 px-4 py-2 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm w-full lg:max-w-md"
          onChange={handleSearch}
        />

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Filter by Category */}
          <div className="relative inline-block text-left w-full sm:w-60">
            <button
              type="button"
              onClick={() => setCategoriesDropdownOpen((prev) => !prev)}
              className="inline-flex justify-between items-center w-full rounded-xl border border-slate-200 shadow-sm px-4 py-2 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none transition"
            >
              <span>Filter by Category</span>
              <svg
                className="ml-2 h-4 w-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {categoriesDropdownOpen && (
              <div className="absolute mt-2 w-full rounded-xl shadow-lg bg-white border border-slate-100 z-30 overflow-y-auto max-h-48 py-1.5">
                <ul className="py-1">
                  {allCategories.map((category) => (
                    <li key={category._id}>
                      <label className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          value={category._id}
                          checked={activeCategories.includes(category._id)}
                          onChange={(e) => {
                            const { checked } = e.target;
                            setActiveCategories((prev) =>
                              checked
                                ? [...prev, category._id]
                                : prev.filter((id) => id !== category._id),
                            );
                          }}
                          className="accent-indigo-600 w-4 h-4 rounded"
                        />
                        <span>{category.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Show Columns */}
          <div className="relative inline-block text-left w-full sm:w-60">
            <button
              type="button"
              onClick={() => setColumnsDropdownOpen((prev) => !prev)}
              className="inline-flex justify-between items-center w-full rounded-xl border border-slate-200 shadow-sm px-4 py-2 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none transition"
            >
              <span>
                {columnsDropdownOpen ? "Hide Columns" : "Show Columns"}
              </span>
              <svg
                className={`ml-2 h-4 w-4 text-slate-400 transform transition-transform duration-200 ${columnsDropdownOpen ? "rotate-180" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {columnsDropdownOpen && (
              <ul className="absolute mt-2 w-full rounded-xl shadow-lg bg-white border border-slate-100 z-30 overflow-y-auto max-h-60 py-1.5">
                {allColumns.map((col) => (
                  <li key={col}>
                    <label className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.includes(col)}
                        onChange={() => toggleColumn(col)}
                        className="accent-indigo-600 w-4 h-4 rounded"
                      />
                      <span>{col}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="w-full">
        <ProductsTable
          paginatedProducts={paginatedProducts}
          allColumns={allColumns}
          hiddenColumns={hiddenColumns}
          sortConfig={sortConfig}
          handleSort={handleSort}
          isAdmin={isAdmin}
          user={user}
          extraColumns={extraColumns}
          removeExtraField={removeExtraField}
          handlePreview={handlePreview}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleQuantityChange={handleQuantityChange}
          cartQuantities={cartQuantities}
          getAvailableStockForProduct={getAvailableStockForProduct}
        />

        <ProductsMobileCards
          paginatedProducts={paginatedProducts}
          cartQuantities={cartQuantities}
          handleQuantityChange={handleQuantityChange}
          getAvailableStockForProduct={getAvailableStockForProduct}
          handleEdit={handleEdit}
          handlePreview={handlePreview}
          handleDelete={handleDelete}
          user={user}
          isAdmin={isAdmin}
        />
      </div>

      {/* Paginate */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          Prev
        </button>

        <span className="text-slate-500 text-xs font-semibold">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          Next
        </button>
      </div>

      {openModal && (
        <ProductModal
          closeModal={closeModal}
          editProduct={editProduct}
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          extraColumns={extraColumns}
          handleExtraFieldChange={handleExtraFieldChange}
          categoryTree={categoryTree}
          normalizedCategories={normalizedCategories}
          newTag={newTag}
          setNewTag={setNewTag}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          handleFilesChange={handleFilesChange}
          labRooms={labRooms}
          users={users}
          isAdmin={isAdmin}
          handleOwnerChange={handleOwnerChange}
          truncateFileName={truncateFileName}
          MAX_FILE_NAME_LENGTH={MAX_FILE_NAME_LENGTH}
        />
      )}
    </div>
  );
};

export default Products;
