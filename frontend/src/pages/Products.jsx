import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/apiClient";
import ProductModal from "../components/products/ProductModal";
import ProductsTable from "../components/products/ProductsTable";
import ConfirmModal from "../components/layout/ConfirmModal";
import ProductsMobileCards from "../components/products/ProductsMobileCards";
import { generateProductsPDF } from "../utils/pdfGenerator";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { buildTree, getDescendantCategoryIds, getSortedHierarchicalCategories, isCategoryVisible } from "../utils/categoryUtils";
import CategoryTree from "../components/categories/CategoryTree";
import PageHeader from "../components/layout/PageHeader";
import Btn from "../components/layout/Btn";
import Pagination from "../components/layout/Pagination";
import {
  FileDown,
  Plus,
  ShoppingCart,
  LayoutGrid,
  Search,
  ChevronDown,
  ChevronRight,
  Globe,
  Lock,
  Layers,
  User,
  Users,
  SlidersHorizontal,
  Check,
  X,
  Filter,
  RotateCcw,
} from "lucide-react";

const MEGA_BYTE = 1024 * 1024;
const MAX_FILE_SIZE = 50 * MEGA_BYTE;
const MAX_FILE_NAME_LENGTH = 15;
const EXTENSION_OFFSET = 3;
const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

const Products = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [extraColumns, setExtraColumns] = useState([]);
  const [columnConfigs, setColumnConfigs] = useState({});
  const [newColGuestVisible, setNewColGuestVisible] = useState(false);
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
  const [hiddenColumns, setHiddenColumns] = useState(["description", "owner"]);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [ownersDropdownOpen, setOwnersDropdownOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState([]);

  const categoriesDropdownRef = useRef(null);
  const ownersDropdownRef = useRef(null);
  const columnsDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target)) {
        setCategoriesDropdownOpen(false);
      }
      if (ownersDropdownRef.current && !ownersDropdownRef.current.contains(event.target)) {
        setOwnersDropdownOpen(false);
      }
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(event.target)) {
        setColumnsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = {};
    if (!products || !categories) return counts;
    products.forEach((p) => {
      const directCatIds = new Set((p.categories || []).map((cat) => (cat._id || cat).toString()));
      categories.forEach((cat) => {
        const catIdStr = cat._id.toString();
        const descendantIds = new Set(getDescendantCategoryIds(catIdStr, categories).map((id) => id.toString()));
        descendantIds.add(catIdStr);
        const matches = Array.from(directCatIds).some((id) => descendantIds.has(id));
        if (matches) {
          counts[catIdStr] = (counts[catIdStr] || 0) + 1;
        }
      });
    });
    return counts;
  }, [products, categories]);

  const ownerCounts = useMemo(() => {
    const counts = {};
    if (!products) return counts;
    products.forEach((p) => {
      const ownerId = p.owner?._id || p.owner;
      if (ownerId) {
        const oIdStr = ownerId.toString();
        counts[oIdStr] = (counts[oIdStr] || 0) + 1;
      }
    });
    return counts;
  }, [products]);
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");

  const [newTag, setNewTag] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });
  const [cartQuantities, setCartQuantities] = useState({});
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    setSelectedProductIds([]);
  }, [searchTerm, activeCategories, products]);

  const handleToggleSelect = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (visibleProducts) => {
    const visibleIds = visibleProducts.map((p) => p._id);
    const allSelected = visibleIds.every((id) => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => [
        ...prev,
        ...visibleIds.filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categorySearch, setCategorySearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");

  useEffect(() => {
    if (location.state?.ownerId) {
      setOwnerFilter(location.state.ownerId);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location.state?.categoryId) {
      setActiveCategories([location.state.categoryId]);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

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
    "categories",
    "total",
    "for rent",
    "owner",
    "description",
    ...extraColumns,
  ];

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
    fetchColumnConfigs();

    setCartQuantities(() => {
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
    const searchLower = searchTerm.trim().toLowerCase();

    let filtered = products.filter((p) => {
      if (!searchLower) return true;

      // Nazwa produktu
      if (p.name && p.name.toLowerCase().includes(searchLower)) return true;

      // Opis
      if (p.description && p.description.toLowerCase().includes(searchLower)) return true;

      // Tagi
      if (p.tags?.some((tag) => tag.toLowerCase().includes(searchLower))) return true;

      // Sala laboratoryjna
      if (p.labRoom && p.labRoom.toLowerCase().includes(searchLower)) return true;

      // Wersja
      if (p.version && p.version.toLowerCase().includes(searchLower)) return true;

      // Nazwy kategorii (PL i EN)
      if (
        p.categories?.some((cat) => {
          const cId = (cat._id || cat).toString();
          const found = categories.find((c) => c._id.toString() === cId);
          const namePl = (cat.name || found?.name || "").toLowerCase();
          const nameEn = (cat.nameEn || found?.nameEn || "").toLowerCase();
          return namePl.includes(searchLower) || nameEn.includes(searchLower);
        })
      )
        return true;

      // Nazwa opiekuna
      const pOwnerId = (p.owner?._id || p.owner)?.toString();
      const ownerObj =
        typeof p.owner === "object" && p.owner?.name
          ? p.owner
          : users.find((u) => u._id.toString() === pOwnerId);
      if (ownerObj?.name && ownerObj.name.toLowerCase().includes(searchLower)) return true;

      // Dodatkowe pola dynamiczne (extraFields)
      if (
        Object.values(p.extraFields || {}).some(
          (val) => val != null && val.toString().toLowerCase().includes(searchLower),
        )
      )
        return true;

      return false;
    });

    // OR filter dla wielu kategorii (uwzględniając dzieci/podkategorie)
    if (activeCategories.length > 0) {
      const targetCategoryIds = new Set([
        ...activeCategories.map((id) => id.toString()),
        ...activeCategories.flatMap((catId) =>
          getDescendantCategoryIds(catId, categories).map((id) => id.toString()),
        ),
      ]);
      filtered = filtered.filter((p) =>
        p.categories?.some((cat) =>
          targetCategoryIds.has((cat._id || cat).toString()),
        ),
      );
    }

    if (ownerFilter) {
      filtered = filtered.filter((p) => {
        const pOwnerId = (p.owner?._id || p.owner)?.toString();
        return pOwnerId === ownerFilter.toString();
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key] ?? a.extraFields?.[sortConfig.key] ?? "";
        let valB = b[sortConfig.key] ?? b.extraFields?.[sortConfig.key] ?? "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, sortConfig, activeCategories, ownerFilter, categories, users]);

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

      const allExtraKeys = new Set();
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

  const fetchColumnConfigs = async () => {
    try {
      const res = await apiClient.get("/products/columns/config");
      if (res.data?.success && Array.isArray(res.data.columns)) {
        const map = {};
        res.data.columns.forEach((c) => {
          map[c.name.toLowerCase()] = c.guestVisible;
        });
        setColumnConfigs(map);
      }
    } catch (e) {
      console.error("Error fetching column configs:", e);
    }
  };

  const toggleColumnGuestVisibility = async (col) => {
    const cleanKey = col.toLowerCase();
    const current = Boolean(columnConfigs[cleanKey]);
    const nextVal = !current;
    try {
      await apiClient.post("/products/columns/config", {
        name: cleanKey,
        guestVisible: nextVal,
      });
      setColumnConfigs((prev) => ({ ...prev, [cleanKey]: nextVal }));
      showToast(
        language === "pl"
          ? `Kolumna "${col}" jest teraz ${nextVal ? "widoczna dla gości" : "widoczna tylko dla administratora"}.`
          : `Column "${col}" is now ${nextVal ? "visible to guests" : "admin only"}.`,
        "success"
      );
    } catch {
      showToast(
        language === "pl" ? "Błąd zmiany widoczności kolumny" : "Failed to change column visibility",
        "error"
      );
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

  const handleEdit = (product) => {
    setOpenModal(true);
    setEditProduct(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      stockTotal: product.stockTotal?.toString() || "",
      stockForRent: product.stockForRent?.toString() || "",
      extraFields: product.extraFields ? { ...product.extraFields } : {},
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
    if (!newTag) {
      showToast(t("productModal.tagEmpty"), "warning");
      return;
    }

    const tagLower = newTag.trim().toLowerCase();
    if (!formData.tags.includes(tagLower)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagLower] }));
      setNewTag("");
    } else {
      showToast(t("productModal.tagAlreadyAdded"), "warning");
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
    const maxQty = getAvailableStockForProduct(product);
    if (qty > maxQty) qty = maxQty;

    const previousQty = cartQuantities[productId] || 0;
    if (qty === previousQty) return;

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

    if (qty > previousQty) {
      const prodName = product?.name ? `: ${product.name}` : "";
      showToast(
        language === "pl"
          ? (previousQty === 0
              ? `Dodano do koszyka${prodName}`
              : `Zwiększono ilość w koszyku (${qty})${prodName}`)
          : (previousQty === 0
              ? `Added to cart${prodName}`
              : `Cart updated (${qty})${prodName}`),
        "success"
      );
    } else if (qty < previousQty && qty === 0) {
      const prodName = product?.name ? `: ${product.name}` : "";
      showToast(
        language === "pl"
          ? `Usunięto z koszyka${prodName}`
          : `Removed from cart${prodName}`,
        "info"
      );
    }
  };

  const addExtraField = () => {
    setIsAddColModalOpen(true);
  };

  const handleAddExtraFieldSubmit = (e) => {
    e.preventDefault();
    const key = newColName.trim().toLowerCase();
    if (!key) {
      showToast(t("products.errColumnEmpty"), "warning");
      return;
    }
    if (key.length > 30) {
      showToast(t("products.errColumnTooLong"), "warning");
      return;
    }
    const reservedColumns = [
      "id", "_id", "name", "description", "total", "for rent", "categories", "owner", "image", "#", "actions", "status", "available", "preview", "images", "attachments", "tags", "labroom", "stocktotal", "stockforrent", "isserialized", "isrentable", "isvisible", "isshared", "version"
    ];
    if (reservedColumns.includes(key)) {
      showToast(t("products.errColumnReserved"), "warning");
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

      // Save column visibility config to server
      apiClient
        .post("/products/columns/config", {
          name: key,
          guestVisible: newColGuestVisible,
        })
        .then(() => {
          setColumnConfigs((prev) => ({ ...prev, [key]: newColGuestVisible }));
        })
        .catch((err) => {
          console.error("Failed to save column config:", err);
        });

      setIsAddColModalOpen(false);
      setNewColName("");
      const wasGuest = newColGuestVisible;
      setNewColGuestVisible(false);

      showToast(
        language === "pl"
          ? `Kolumna "${key}" została dodana (${wasGuest ? "widoczna dla gości" : "tylko dla admina"}).`
          : `Column "${key}" added (${wasGuest ? "visible to guests" : "admin only"}).`,
        "success"
      );
    } else {
      showToast(t("products.errColumnExists"), "warning");
    }
  };

  const removeExtraField = (key) => {
    setConfirmConfig({
      isOpen: true,
      title: language === "pl" ? "Usuń kolumnę" : "Delete Column",
      message: language === "pl" 
        ? `Czy na pewno chcesz usunąć kolumnę "${key}" ze wszystkich obiektów?`
        : `Delete column "${key}" from all products?`,
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await apiClient.delete(`/products/extraField/${key}`);

          if (res.data.success) {
            setExtraColumns((prev) => prev.filter((col) => col !== key));
            setColumnConfigs((prev) => {
              const updated = { ...prev };
              delete updated[key.toLowerCase()];
              return updated;
            });
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
            showToast(
              language === "pl"
                ? `Kolumna "${key}" została usunięta.`
                : `Column "${key}" deleted.`,
              "success"
            );
          } else {
            showToast(res.data.message || "Failed to delete column", "error");
          }
        } catch (err) {
          console.error(err);
          showToast(err.response?.data?.message || err.message || "Failed to delete column", "error");
        }
      }
    });
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanedExtraFields = Object.fromEntries(
        Object.entries(formData.extraFields).filter(
          ([, value]) => value != null && value !== "",
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

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń",
      message: language === "pl" ? "Czy na pewno chcesz usunąć ten obiekt?" : "Delete this product?",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const data = await deleteProduct(id);
          if (data.success) {
            showToast(
              language === "pl" ? "Obiekt został usunięty." : "Product deleted.",
              "success"
            );
            fetchProducts();
          } else {
            showToast(data.message || "Failed to delete product", "error");
          }
        } catch (err) {
          console.error(err);
          showToast(err.response?.data?.message || err.message || "Failed to delete product", "error");
        }
      }
    });
  };

  const generatePDF = async () => {
    const productsToExport = selectedProductIds.length > 0
      ? filteredProducts.filter((p) => selectedProductIds.includes(p._id))
      : filteredProducts;

    if (productsToExport.length === 0) {
      showToast(t("products.toastPdfEmpty"), "warning");
      return;
    }
    showToast(t("products.toastPdfGenerating"), "info");
    try {
      await generateProductsPDF(productsToExport, allColumns, hiddenColumns, t);
      showToast(t("products.toastPdfSuccess"), "success");
    } catch (err) {
      console.error(err);
      showToast(t("products.toastPdfFail"), "error");
    }
  };

  const handlePreview = (productId) => {
    if (!productId) return;
    try {
      sessionStorage.setItem("last_preview_product_id", productId);
    } catch {
      // ignore
    }
    navigate(`/admin-dashboard/preview?id=${productId}`, { state: { productId } });
  };

  const handleCategorySelect = (catId) => {
    setActiveCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    );
  };

  const handleCategoryExpand = (catId) => {
    setExpandedCategories((prev) =>
      prev.includes(catId.toString())
        ? prev.filter((id) => id !== catId.toString())
        : [...prev, catId.toString()],
    );
  };

  const totalInCart = Object.values(cartQuantities).reduce((acc, qty) => acc + (qty || 0), 0);

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"📦 " + t("products.title")}
          subtitle={t("products.subtitle")}
        >
        <Btn variant={selectedProductIds.length > 0 ? "primary" : "secondary"} onClick={generatePDF}>
          <FileDown className="w-4 h-4 shrink-0" />
          <span>
            {selectedProductIds.length > 0
              ? `${t("products.exportPdf")} (${selectedProductIds.length})`
              : t("products.exportPdf")
            }
          </span>
        </Btn>
        <Btn variant="dark" onClick={addExtraField}>
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>{t("products.addColumn")}</span>
        </Btn>
        <Btn variant="success" onClick={() => navigate("/cart")}>
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span>{t("products.goToCart")}</span>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-emerald-600 font-extrabold text-[11px] shadow-xs shrink-0 leading-none">
            {totalInCart}
          </span>
        </Btn>
        <Btn variant="primary" onClick={() => { setEditProduct(null); setOpenModal(true); }}>
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t("products.addObject")}</span>
        </Btn>
      </PageHeader>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Global Search Input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              placeholder={t("products.searchPlaceholder") || (language === "pl" ? "Szukaj obiektów po nazwie, sali, tagach..." : "Search objects...")}
              className="h-10 border border-slate-200 dark:border-slate-800 pl-10 pr-9 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm w-full transition"
              onChange={handleSearch}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={language === "pl" ? "Wyczyść wyszukiwanie" : "Clear search"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
            {/* Filter by Category */}
            <div ref={categoriesDropdownRef} className="relative inline-block text-left w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setCategoriesDropdownOpen((prev) => !prev);
                  setColumnsDropdownOpen(false);
                  setOwnersDropdownOpen(false);
                }}
                className={`inline-flex justify-between items-center h-10 w-full sm:w-56 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer select-none ${
                  activeCategories.length > 0
                    ? "border-indigo-500/40 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/10"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className={`w-4 h-4 shrink-0 ${activeCategories.length > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                  <span className="truncate">
                    {activeCategories.length === 0
                      ? (t("products.filterByCategory") || (language === "pl" ? "Filtruj wg kategorii" : "Filter by category"))
                      : activeCategories.length === 1
                        ? (categories.find(c => c._id === activeCategories[0])?.name || t("products.filterByCategory"))
                        : `${language === "pl" ? "Kategorie" : "Categories"} (${activeCategories.length})`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {activeCategories.length > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCategories([]);
                      }}
                      className="p-0.5 rounded-full hover:bg-indigo-200/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:text-red-600 transition"
                      title={language === "pl" ? "Wyczyść kategorie" : "Clear categories"}
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${categoriesDropdownOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {categoriesDropdownOpen && (
                <div className="absolute left-0 mt-2 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 z-50 flex flex-col max-h-88 w-72 sm:w-80 py-2 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-100">
                  {/* Category Header Actions */}
                  <div className="flex items-center justify-between px-3.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === "pl" ? "Kategorie" : "Categories"}</span>
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          const allCatIds = categories.map((c) => c._id);
                          setActiveCategories(allCatIds);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {language === "pl" ? "Wszystkie" : "All"}
                      </button>
                      {activeCategories.length > 0 && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            type="button"
                            onClick={() => setActiveCategories([])}
                            className="text-red-500 hover:underline cursor-pointer"
                          >
                            {language === "pl" ? "Wyczyść" : "Clear"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Search Input with inline clear */}
                  <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t("products.searchCategoryPlaceholder") || (language === "pl" ? "Szukaj kategorii..." : "Search categories...")}
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs font-medium"
                      />
                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() => setCategorySearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Tree List */}
                  <ul className="py-1 overflow-y-auto flex-1 max-h-56 divide-y divide-slate-100/50 dark:divide-slate-800/40">
                    {getSortedHierarchicalCategories(categories)
                      .filter((category) =>
                        category.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                        category.nameEn?.toLowerCase().includes(categorySearch.toLowerCase())
                      )
                      .map((category) => {
                        const isVisible = !categorySearch ? isCategoryVisible(category, categories, expandedCategories) : true;
                        if (!isVisible) return null;

                        const hasChildren = categories.some((c) => {
                          const pId = c.parent?._id || c.parent;
                          return pId?.toString() === category._id.toString();
                        });
                        const isExpanded = expandedCategories.includes(category._id.toString());
                        const isChecked = activeCategories.includes(category._id);
                        const itemCount = categoryCounts[category._id.toString()] || 0;

                        return (
                          <li key={category._id} style={{ paddingLeft: `${(category.depth ?? 0) * 12}px` }}>
                            <div className={`flex items-center justify-between px-3 py-1.5 mx-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${isChecked ? "bg-indigo-50/50 dark:bg-indigo-950/30" : ""}`}>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCategoryExpand(category._id);
                                    }}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer flex items-center justify-center shrink-0"
                                    title={isExpanded ? "Zwiń" : "Rozwiń"}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-5.5 h-5.5 shrink-0" />
                                )}
                                <label className="flex items-center gap-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer font-semibold flex-1 truncate select-none">
                                  <input
                                    type="checkbox"
                                    value={category._id}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const { checked } = e.target;
                                      setActiveCategories((prev) =>
                                        checked
                                          ? [...prev, category._id]
                                          : prev.filter((id) => id !== category._id),
                                      );
                                    }}
                                    className="accent-indigo-600 w-3.5 h-3.5 rounded shrink-0 cursor-pointer"
                                  />
                                  <span className="truncate">{language === "en" && category.nameEn ? category.nameEn : category.name}</span>
                                </label>
                              </div>
                              <span className="ml-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                                {itemCount}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>

            {/* Filter by Owner */}
            <div ref={ownersDropdownRef} className="relative inline-block text-left w-full sm:w-auto">
              {(() => {
                const selectedOwner = users.find((u) => u._id === ownerFilter);
                const triggerAvatar = selectedOwner?.profileImage ? `${API_BASE}/uploads/users/${selectedOwner.profileImage}` : null;

                return (
                  <button
                    type="button"
                    onClick={() => {
                      setOwnersDropdownOpen((prev) => !prev);
                      setCategoriesDropdownOpen(false);
                      setColumnsDropdownOpen(false);
                    }}
                    className={`inline-flex justify-between items-center h-10 w-full sm:w-56 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer select-none ${
                      ownerFilter
                        ? "border-indigo-500/40 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/10"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {triggerAvatar ? (
                        <img
                          src={triggerAvatar}
                          alt={selectedOwner.name}
                          className="w-4.5 h-4.5 rounded-full object-cover shrink-0 border border-indigo-200 dark:border-indigo-800"
                        />
                      ) : (
                        <User className={`w-4 h-4 shrink-0 ${ownerFilter ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                      )}
                      <span className="truncate">
                        {selectedOwner
                          ? selectedOwner.name
                          : (t("products.filterByOwner") || (language === "pl" ? "Filtruj wg opiekuna" : "Filter by owner"))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {ownerFilter && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOwnerFilter("");
                          }}
                          className="p-0.5 rounded-full hover:bg-indigo-200/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:text-red-600 transition"
                          title={language === "pl" ? "Wyczyść opiekuna" : "Clear owner"}
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${ownersDropdownOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                );
              })()}

              {ownersDropdownOpen && (
                <div className="absolute left-0 mt-2 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 z-50 flex flex-col max-h-88 w-72 sm:w-80 py-2 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                  {/* Owner Header */}
                  <div className="flex items-center justify-between px-3.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === "pl" ? "Opiekunowie" : "Owners"}</span>
                    </span>
                    {ownerFilter ? (
                      <button
                        type="button"
                        onClick={() => setOwnerFilter("")}
                        className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
                      >
                        {language === "pl" ? "Wyczyść" : "Clear"}
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                        {users.length} {language === "pl" ? "osób" : "users"}
                      </span>
                    )}
                  </div>

                  {/* Search Input with inline clear */}
                  <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t("products.searchOwnerPlaceholder") || (language === "pl" ? "Szukaj opiekuna..." : "Search owner...")}
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs font-medium"
                      />
                      {ownerSearch && (
                        <button
                          type="button"
                          onClick={() => setOwnerSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Owner List */}
                  <ul className="py-1 px-1.5 overflow-y-auto overflow-x-hidden flex-1 max-h-56">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setOwnerFilter("");
                          setOwnersDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                          !ownerFilter
                            ? "text-indigo-650 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{t("products.allOwners") || (language === "pl" ? "Wszyscy opiekunowie" : "All owners")}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                            {products.length}
                          </span>
                          {!ownerFilter && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </div>
                      </button>
                    </li>
                    {users
                      .filter((u) => u.name.toLowerCase().includes(ownerSearch.toLowerCase()))
                      .map((u) => {
                        const isSelected = ownerFilter === u._id;
                        const count = ownerCounts[u._id] || 0;
                        const initials = u.name
                          .split(" ")
                          .map((n) => n[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "U";
                        const profileImgUrl = u.profileImage ? `${API_BASE}/uploads/users/${u.profileImage}` : null;

                        return (
                          <li key={u._id}>
                            <button
                              type="button"
                              onClick={() => {
                                setOwnerFilter(isSelected ? "" : u._id);
                                setOwnersDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? "text-indigo-650 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40"
                                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border overflow-hidden ${
                                  isSelected
                                    ? "border-indigo-600 ring-2 ring-indigo-500/25"
                                    : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                                }`}>
                                  {profileImgUrl ? (
                                    <img
                                      src={profileImgUrl}
                                      alt={u.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        if (e.currentTarget.nextElementSibling) {
                                          e.currentTarget.nextElementSibling.classList.remove("hidden");
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <span className={`text-[10px] font-bold ${profileImgUrl ? "hidden" : ""} ${
                                    isSelected
                                      ? "bg-indigo-600 text-white w-full h-full flex items-center justify-center"
                                      : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 w-full h-full flex items-center justify-center"
                                  }`}>
                                    {initials}
                                  </span>
                                </div>
                                <span className="truncate">{u.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                                  {count}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>

            {/* Show Columns */}
            <div ref={columnsDropdownRef} className="relative inline-block text-left w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setColumnsDropdownOpen((prev) => !prev);
                  setCategoriesDropdownOpen(false);
                  setOwnersDropdownOpen(false);
                }}
                className="inline-flex justify-between items-center h-10 w-full sm:w-56 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">
                    {columnsDropdownOpen ? t("products.hideColumns") : t("products.showColumns")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-150 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {allColumns.filter((c) => !hiddenColumns.includes(c)).length}/{allColumns.length}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${columnsDropdownOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {columnsDropdownOpen && (
                <div className="absolute right-0 mt-2 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 z-50 overflow-y-auto max-h-88 w-72 sm:w-80 py-2 flex flex-col max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-100">
                  {/* Dropdown Header Actions */}
                  <div className="flex justify-between items-center px-3.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t("products.columnsHeader") || (language === "pl" ? "Kolumny" : "Columns")}</span>
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setHiddenColumns([])}
                        className="text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                      >
                        {t("products.columnsShowAll") || "Pokaż wszystkie"}
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={() => setHiddenColumns(["description", "owner"])}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline cursor-pointer"
                      >
                        {language === "pl" ? "Domyślne" : "Default"}
                      </button>
                    </div>
                  </div>

                  <ul className="py-1 overflow-y-auto">
                    {/* Standard Columns Group */}
                    <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <span>{t("products.columnsStandardGroup") || "STANDARDOWE"}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {allColumns.filter((c) => !extraColumns.includes(c) && !hiddenColumns.includes(c)).length}/{allColumns.filter((c) => !extraColumns.includes(c)).length}
                      </span>
                    </div>
                    {allColumns
                      .filter((col) => !extraColumns.includes(col))
                      .map((col) => {
                        const colTrans = t(`products.columns.${col}`);
                        const displayName = colTrans.startsWith("products.columns.") ? col : colTrans;
                        const isChecked = !hiddenColumns.includes(col);
                        return (
                          <li key={col}>
                            <label className={`flex items-center gap-2.5 px-3.5 py-1.5 mx-1 rounded-lg text-xs font-semibold cursor-pointer transition select-none ${
                              isChecked
                                ? "text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            }`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleColumn(col)}
                                className="accent-indigo-600 w-3.5 h-3.5 rounded cursor-pointer"
                              />
                              <span className="truncate">{displayName}</span>
                            </label>
                          </li>
                        );
                      })}

                    {/* Custom Columns Group */}
                    {extraColumns.length > 0 && (
                      <>
                        <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none bg-slate-50/60 dark:bg-slate-950/40 border-y border-slate-100 dark:border-slate-800/60 mt-1 flex items-center justify-between">
                          <span>{t("products.columnsCustomGroup") || "DODATKOWE"}</span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {extraColumns.filter((c) => !hiddenColumns.includes(c)).length}/{extraColumns.length}
                          </span>
                        </div>
                        {extraColumns.map((col) => {
                          const isGuest = Boolean(columnConfigs[col.toLowerCase()]);
                          const isChecked = !hiddenColumns.includes(col);
                          return (
                            <li key={col} className={`flex items-center justify-between px-3.5 py-1.5 mx-1 rounded-lg transition ${
                              isChecked ? "hover:bg-slate-50 dark:hover:bg-slate-800/60" : "hover:bg-slate-50/50 dark:hover:bg-slate-850/40"
                            }`}>
                              <label className={`flex items-center gap-2.5 text-xs font-semibold cursor-pointer flex-1 truncate select-none ${
                                isChecked ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleColumn(col)}
                                  className="accent-indigo-600 w-3.5 h-3.5 rounded cursor-pointer"
                                />
                                <span className="truncate max-w-[130px]" title={col}>{col}</span>
                              </label>

                              {/* Guest vs Admin visibility toggle button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleColumnGuestVisibility(col);
                                }}
                                title={
                                  isGuest
                                    ? (language === "pl" ? "Widoczna dla gości. Kliknij, aby ukryć przed gośćmi (tylko admin)." : "Visible to guests. Click to make admin only.")
                                    : (language === "pl" ? "Tylko dla admina. Kliknij, aby udostępnić gościom." : "Admin only. Click to make visible to guests.")
                                }
                                className={`p-1 rounded-md transition cursor-pointer select-none shrink-0 border flex items-center justify-center ${
                                  isGuest
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                                    : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                }`}
                              >
                                {isGuest ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                            </li>
                          );
                        })}
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || activeCategories.length > 0 || ownerFilter) && (
          <div className="flex flex-wrap gap-2 items-center bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl transition">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{language === "pl" ? "Aktywne filtry:" : "Active filters:"}</span>
            </div>

            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-xs">
                <span className="text-slate-400 text-[10px] uppercase font-bold">{language === "pl" ? "Szukaj:" : "Search:"}</span>
                <span className="max-w-[120px] truncate">"{searchTerm}"</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="hover:text-red-500 transition cursor-pointer font-bold pl-0.5"
                  title="Usuń filtr wyszukiwania"
                >
                  ✕
                </button>
              </span>
            )}

            {activeCategories.map((catId) => {
              const category = categories.find((c) => c._id === catId);
              return (
                <span
                  key={catId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60 rounded-lg text-xs font-semibold shadow-xs"
                >
                  <span className="max-w-[120px] truncate">
                    {language === "en" && category?.nameEn ? category.nameEn : (category?.name || catId)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(catId)}
                    className="hover:text-red-500 transition cursor-pointer font-bold pl-0.5"
                    title="Usuń kategorię"
                  >
                    ✕
                  </button>
                </span>
              );
            })}

            {ownerFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60 rounded-lg text-xs font-semibold shadow-xs">
                <span className="text-indigo-400 text-[10px] uppercase font-bold">{language === "pl" ? "Opiekun:" : "Owner:"}</span>
                <span className="max-w-[120px] truncate">
                  {users.find((u) => u._id === ownerFilter)?.name || ownerFilter}
                </span>
                <button
                  type="button"
                  onClick={() => setOwnerFilter("")}
                  className="hover:text-red-500 transition cursor-pointer font-bold pl-0.5"
                  title="Usuń filtr opiekuna"
                >
                  ✕
                </button>
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === "pl"
                  ? `Wyniki: ${filteredProducts.length} z ${products.length}`
                  : `Results: ${filteredProducts.length} of ${products.length}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategories([]);
                  setOwnerFilter("");
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition cursor-pointer ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === "pl" ? "Wyczyść wszystko" : "Clear all"}</span>
              </button>
            </div>
          </div>
        )}
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
          columnConfigs={columnConfigs}
          toggleColumnGuestVisibility={toggleColumnGuestVisibility}
          handlePreview={handlePreview}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleQuantityChange={handleQuantityChange}
          cartQuantities={cartQuantities}
          getAvailableStockForProduct={getAvailableStockForProduct}
          selectedProductIds={selectedProductIds}
          handleToggleSelect={handleToggleSelect}
          handleToggleSelectAll={handleToggleSelectAll}
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
          selectedProductIds={selectedProductIds}
          handleToggleSelect={handleToggleSelect}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
        {/* Items per page selector */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-550 dark:text-slate-400">
          <span>{t("products.itemsPerPage") || "Elementów na stronie:"}</span>
          <div className="relative select-none flex items-center">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pl-3 pr-8 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        />

        {/* Total Counter info */}
        <div className="text-xs font-bold text-slate-450 dark:text-slate-505">
          {language === "pl"
            ? `Razem: ${filteredProducts.length} obiektów`
            : `Total: ${filteredProducts.length} objects`}
        </div>
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
          columnConfigs={columnConfigs}
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

      {/* Custom Modal for Adding a Column */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/50 transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 relative flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t("products.addColumn")}
              </h3>
              <button
                type="button"
                onClick={() => { setIsAddColModalOpen(false); setNewColName(""); }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddExtraFieldSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="newColInput" className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  {language === "pl" ? "Nazwa nowej kolumny (maks. 30 znaków)" : "New column name (max 30 characters)"}
                </label>
                <input
                  id="newColInput"
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  maxLength={30}
                  placeholder="np. serial_number"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  autoFocus
                />
              </div>

              {/* Visibility Choice */}
              <div className="flex flex-col gap-2">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === "pl" ? "Widoczność nowej kolumny:" : "New column visibility:"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewColGuestVisible(false)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                      !newColGuestVisible
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === "pl" ? "Tylko admin" : "Admin only"}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {language === "pl" ? "Kolumna widoczna wyłącznie w panelu administratora" : "Visible only in admin management view"}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewColGuestVisible(true)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                      newColGuestVisible
                        ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <Globe className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === "pl" ? "Gość i Admin" : "Guest & Admin"}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {language === "pl" ? "Widoczna również w publicznym katalogu gościa" : "Also visible in the public guest catalog"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddColModalOpen(false); setNewColName(""); }}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-650 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition cursor-pointer"
                >
                  {t("common.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
      </div>
    </div>
  );
};

export default Products;
