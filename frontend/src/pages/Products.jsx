import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import ProductModal from "../components/products/ProductModal";
import ProductsTable from "../components/products/ProductsTable";
import ProductsMobileCards from "../components/products/ProductsMobileCards";
import { generateProductsPDF } from "../utils/pdfGenerator";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { buildTree } from "../utils/categoryUtils";
import CategoryTree from "../components/categories/CategoryTree";
import PageHeader from "../components/layout/PageHeader";
import Btn from "../components/layout/Btn";
import Pagination from "../components/layout/Pagination";
import { FileDown, Plus, ShoppingCart, LayoutGrid } from "lucide-react";

const MEGA_BYTE = 1024 * 1024;
const MAX_FILE_SIZE = 50 * MEGA_BYTE;
const MAX_FILE_NAME_LENGTH = 15;
const EXTENSION_OFFSET = 3;
// const MAX_FILE_COUNT = 20;

const Products = () => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

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
  const [hiddenColumns, setHiddenColumns] = useState(["description", "categories", "owner"]);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState([]);

  const [newTag, setNewTag] = useState("");
  const [cartQuantities, setCartQuantities] = useState({});

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

  const allColumns = [
    "name",
    "description",
    "total",
    "for rent",
    "categories",
    "owner",
    ...extraColumns,
  ];

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

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get("/products/private");

      if (!res.data.success) {
        showToast(res.data.message || "Error fetching products", "error");
        return;
      }

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
      showToast(err.response?.data?.message || err.message || "Error fetching products", "error");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/users");
      if (!res.data.success) {
        showToast(res.data.message || "Error fetching users", "error");
        return;
      }
      setUsers(res.data.users);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || error.message || "Error fetching users", "error");
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
        showToast(`${file.name} is too large (max ${MAX_FILE_SIZE / MEGA_BYTE}MB).`, "warning");
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
      showToast("This tag is already added.", "warning");
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
    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > getAvailableStockForProduct(product)) qty = getAvailableStockForProduct(product);

    setCartQuantities((prev) => ({ ...prev, [productId]: qty }));

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
  };

  const addExtraField = () => {
    const key = prompt("Enter the name of the new column (max 30 characters):")
      ?.trim()
      ?.toLowerCase();
    if (!key) return;
    if (key.length > 30) {
      showToast("Column name cannot be longer than 30 characters.", "warning");
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
      showToast("A column with this name already exists.", "warning");
    }
  };

  const removeExtraField = async (key) => {
    if (!window.confirm(`Delete column "${key}" from all products?`)) return;

    try {
      const res = await apiClient.delete(`/products/extraField/${key}`);

      if (res.data.success) {
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
        showToast(`Column "${key}" deleted.`, "success");
      } else {
        showToast(res.data.message || "Failed to delete column", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || "Failed to delete column", "error");
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

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      const res = editProduct
        ? await apiClient.put(`/products/${editProduct}`, form, config)
        : await apiClient.post("/products/create", form, config);

      if (res.data.success) {
        showToast(editProduct ? "Product updated successfully!" : "Product created successfully!", "success");
        fetchProducts();
        closeModal();
      } else {
        showToast(res.data.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || error.message || "Operation failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const data = await deleteProduct(id);
      if (data.success) {
        showToast("Product deleted.", "success");
        fetchProducts();
      } else {
        showToast(data.message || "Failed to delete product", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || "Failed to delete product", "error");
    }
  };

  const generatePDF = () => {
    generateProductsPDF(filteredProducts, allColumns, hiddenColumns);
  };
  const handlePreview = (productId) => {
    if (!productId) return;
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
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"📦 " + t("products.title")}
          subtitle={t("products.subtitle")}
        >
        <Btn variant="secondary" onClick={generatePDF}>
          <FileDown className="w-4 h-4" />
          {t("products.exportPdf")}
        </Btn>
        <Btn variant="dark" onClick={addExtraField}>
          <LayoutGrid className="w-4 h-4" />
          {t("products.addColumn")}
        </Btn>
        <Btn variant="success" onClick={() => navigate("/cart")}>
          <ShoppingCart className="w-4 h-4" />
          {t("products.goToCart")}
        </Btn>
        <Btn variant="primary" onClick={() => { setEditProduct(null); setOpenModal(true); }}>
          <Plus className="w-4 h-4" />
          {t("products.addObject")}
        </Btn>
      </PageHeader>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder={t("products.searchPlaceholder")}
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
              <span>{t("products.filterByCategory")}</span>
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
                {columnsDropdownOpen ? t("products.hideColumns") : t("products.showColumns")}
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
                {allColumns.map((col) => {
                  const colTrans = t(`products.columns.${col}`);
                  const displayName = colTrans.startsWith("products.columns.") ? col : colTrans;
                  return (
                    <li key={col}>
                      <label className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.includes(col)}
                          onChange={() => toggleColumn(col)}
                          className="accent-indigo-600 w-4 h-4 rounded"
                        />
                        <span>{displayName}</span>
                      </label>
                    </li>
                  );
                })}
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      />

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
    </div>
  );
};

export default Products;
