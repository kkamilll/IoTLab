import React, { useEffect, useMemo, useState } from "react";
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
import { buildTree, getDescendantCategoryIds, getCategoryDepth, getSortedHierarchicalCategories, isCategoryVisible } from "../utils/categoryUtils";
import CategoryTree from "../components/categories/CategoryTree";
import PageHeader from "../components/layout/PageHeader";
import Btn from "../components/layout/Btn";
import Pagination from "../components/layout/Pagination";
import { FileDown, Plus, ShoppingCart, LayoutGrid, Search, ChevronDown, ChevronRight } from "lucide-react";

const MEGA_BYTE = 1024 * 1024;
const MAX_FILE_SIZE = 50 * MEGA_BYTE;
const MAX_FILE_NAME_LENGTH = 15;
const EXTENSION_OFFSET = 3;

const Products = () => {
  const { user, token } = useAuth();
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
  const [ownersDropdownOpen, setOwnersDropdownOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState([]);
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

    // OR filter dla wielu kategorii (uwzględniając dzieci/podkategorie)
    if (activeCategories.length > 0) {
      const targetCategoryIds = new Set([
        ...activeCategories,
        ...activeCategories.flatMap(catId => getDescendantCategoryIds(catId, categories))
      ]);
      filtered = filtered.filter((p) =>
        p.categories?.some((cat) => targetCategoryIds.has(cat._id))
      );
    }

    if (ownerFilter) {
      filtered = filtered.filter((p) => {
        const pOwnerId = p.owner?._id || p.owner;
        return pOwnerId === ownerFilter;
      });
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
  }, [products, searchTerm, sortConfig, activeCategories, ownerFilter]);

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
      setIsAddColModalOpen(false);
      setNewColName("");
      showToast(
        language === "pl"
          ? `Kolumna "${key}" została dodana pomyślnie.`
          : `Column "${key}" added successfully.`,
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
    navigate("/admin-dashboard/preview", { state: { productId } });
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
          <FileDown className="w-4 h-4" />
          {selectedProductIds.length > 0
            ? `${t("products.exportPdf")} (${selectedProductIds.length})`
            : t("products.exportPdf")
          }
        </Btn>
        <Btn variant="dark" onClick={addExtraField}>
          <LayoutGrid className="w-4 h-4" />
          {t("products.addColumn")}
        </Btn>
        <Btn variant="success" onClick={() => navigate("/cart")} className="relative flex items-center gap-2">
          <span>{t("products.goToCart")}</span>
          <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-white text-emerald-600 font-extrabold text-xs shadow-sm border border-emerald-100/50">
            {totalInCart}
          </span>
        </Btn>
        <Btn variant="primary" onClick={() => { setEditProduct(null); setOpenModal(true); }}>
          <Plus className="w-4 h-4" />
          {t("products.addObject")}
        </Btn>
      </PageHeader>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder={t("products.searchPlaceholder")}
              className="border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm w-full transition"
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Filter by Category */}
            <div className="relative inline-block text-left w-full sm:w-60">
              <button
                type="button"
                onClick={() => {
                  setCategoriesDropdownOpen((prev) => !prev);
                  setColumnsDropdownOpen(false);
                  setOwnersDropdownOpen(false);
                }}
                className="inline-flex justify-between items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-2.5 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 focus:outline-none transition cursor-pointer"
              >
                <span>{t("products.filterByCategory")}</span>
                <svg
                  className={`ml-2 h-4 w-4 text-slate-400 transform transition-transform duration-200 ${categoriesDropdownOpen ? "rotate-180" : ""}`}
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
                <div className="absolute mt-2 w-full rounded-xl shadow-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 z-30 flex flex-col max-h-72 w-64 py-1.5">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder={t("products.searchCategoryPlaceholder") || "Szukaj kategorii..."}
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <ul className="py-1 overflow-y-auto flex-1">
                    {getSortedHierarchicalCategories(categories)
                      .filter((category) =>
                        category.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                        category.nameEn?.toLowerCase().includes(categorySearch.toLowerCase())
                      )
                      .map((category) => {
                        const isVisible = !categorySearch ? isCategoryVisible(category, categories, expandedCategories) : true;
                        if (!isVisible) return null;

                        const hasChildren = categories.some(c => {
                          const pId = c.parent?._id || c.parent;
                          return pId?.toString() === category._id.toString();
                        });
                        const isExpanded = expandedCategories.includes(category._id.toString());

                        return (
                          <li key={category._id} style={{ paddingLeft: `${(category.depth ?? 0) * 12}px` }}>
                            <div className="flex items-center gap-1.5 px-4 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                              {hasChildren ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCategoryExpand(category._id);
                                  }}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition cursor-pointer flex items-center justify-center"
                                  title={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-6 h-6 flex-shrink-0" />
                              )}
                              <label className="flex items-center gap-2.5 py-1 text-xs text-slate-650 dark:text-slate-300 cursor-pointer transition font-medium flex-1 select-none">
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
                                  className="accent-indigo-650 w-3.5 h-3.5 rounded"
                                />
                                <span>{language === "en" && category.nameEn ? category.nameEn : category.name}</span>
                              </label>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>

            {/* Filter by Owner */}
            <div className="relative inline-block text-left w-full sm:w-60">
              <button
                type="button"
                onClick={() => {
                  setOwnersDropdownOpen((prev) => !prev);
                  setCategoriesDropdownOpen(false);
                  setColumnsDropdownOpen(false);
                }}
                className="inline-flex justify-between items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-2.5 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 focus:outline-none transition cursor-pointer"
              >
                <span className="truncate">
                  {ownerFilter
                    ? `${t("products.columns.owner") || "Opiekun"}: ${users.find((u) => u._id === ownerFilter)?.name || ownerFilter}`
                    : (language === "pl" ? "Filtruj wg opiekuna" : "Filter by owner")}
                </span>
                <svg
                  className={`ml-2 h-4 w-4 text-slate-400 transform transition-transform duration-200 ${ownersDropdownOpen ? "rotate-180" : ""}`}
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

              {ownersDropdownOpen && (
                <div className="absolute mt-2 w-full rounded-xl shadow-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 z-30 flex flex-col max-h-72 w-64 py-1.5">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder={language === "pl" ? "Szukaj opiekuna..." : "Search owner..."}
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <ul className="py-1 overflow-y-auto flex-1 max-h-56">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setOwnerFilter("");
                          setOwnersDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        {language === "pl" ? "Wszyscy opiekunowie" : "All owners"}
                      </button>
                    </li>
                    {users
                      .filter((u) => u.name.toLowerCase().includes(ownerSearch.toLowerCase()))
                      .map((u) => (
                        <li key={u._id}>
                          <button
                            type="button"
                            onClick={() => {
                              setOwnerFilter(u._id);
                              setOwnersDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between ${
                              ownerFilter === u._id
                                ? "text-indigo-650 dark:text-indigo-400 font-bold bg-indigo-50/20 dark:bg-indigo-950/20"
                                : "text-slate-650 dark:text-slate-300"
                            }`}
                          >
                            <span>{u.name}</span>
                            {ownerFilter === u._id && (
                              <span className="text-indigo-650 dark:text-indigo-400 font-bold">✓</span>
                            )}
                          </button>
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
                onClick={() => {
                  setColumnsDropdownOpen((prev) => !prev);
                  setCategoriesDropdownOpen(false);
                  setOwnersDropdownOpen(false);
                }}
                className="inline-flex justify-between items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-2.5 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 focus:outline-none transition cursor-pointer"
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
                <div className="absolute mt-2 w-full rounded-xl shadow-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 z-30 overflow-y-auto max-h-80 w-64 py-1.5 flex flex-col">
                  {/* Dropdown Header Actions */}
                  <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
                    <span>{t("products.columnsHeader")}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHiddenColumns([])}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition cursor-pointer"
                      >
                        {t("products.columnsShowAll") || "Pokaż wszystkie"}
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setHiddenColumns(allColumns.filter(c => c !== "name"))}
                        className="text-red-550 hover:text-red-700 transition cursor-pointer"
                      >
                        {t("products.columnsReset") || "Reset"}
                      </button>
                    </div>
                  </div>

                  <ul className="py-1 overflow-y-auto">
                    {/* Standard Columns Group */}
                    <div className="px-4 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider select-none bg-slate-50/55 dark:bg-slate-950/20">
                      {t("products.columnsStandardGroup") || "STANDARD"}
                    </div>
                    {allColumns
                      .filter(col => !extraColumns.includes(col))
                      .map((col) => {
                        const colTrans = t(`products.columns.${col}`);
                        const displayName = colTrans.startsWith("products.columns.") ? col : colTrans;
                        return (
                          <li key={col}>
                            <label className="flex items-center gap-2.5 px-4 py-1.5 text-xs text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition font-medium">
                              <input
                                type="checkbox"
                                checked={!hiddenColumns.includes(col)}
                                onChange={() => toggleColumn(col)}
                                className="accent-indigo-650 w-3.5 h-3.5 rounded"
                              />
                              <span>{displayName}</span>
                            </label>
                          </li>
                        );
                      })}

                    {/* Custom Columns Group */}
                    {extraColumns.length > 0 && (
                      <>
                        <div className="px-4 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider select-none bg-slate-50/55 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 mt-1">
                          {t("products.columnsCustomGroup") || "CUSTOM"}
                        </div>
                        {extraColumns.map((col) => {
                          return (
                            <li key={col}>
                              <label className="flex items-center gap-2.5 px-4 py-1.5 text-xs text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition font-medium">
                                <input
                                  type="checkbox"
                                  checked={!hiddenColumns.includes(col)}
                                  onChange={() => toggleColumn(col)}
                                  className="accent-indigo-650 w-3.5 h-3.5 rounded"
                                />
                                <span className="truncate max-w-[120px]">{col}</span>
                                <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 px-1 rounded ml-auto">custom</span>
                              </label>
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
        {(activeCategories.length > 0 || ownerFilter) && (
          <div className="flex flex-wrap gap-2 items-center bg-slate-100/50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-800/80 p-3 rounded-2xl transition">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Aktywne filtry:" : "Active filters:"}
            </span>
            {activeCategories.map((catId) => {
              const category = categories.find((c) => c._id === catId);
              return (
                <span
                  key={catId}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-55 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/40 dark:border-indigo-900/30 rounded-lg text-xs font-semibold shadow-sm"
                >
                  {language === "en" && category?.nameEn ? category.nameEn : (category?.name || catId)}
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(catId)}
                    className="hover:text-red-505 transition cursor-pointer font-bold pl-0.5"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
            {ownerFilter && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-55 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/40 dark:border-indigo-900/30 rounded-lg text-xs font-semibold shadow-sm"
              >
                <span className="opacity-75">{language === "pl" ? "Opiekun: " : "Owner: "}</span>
                {users.find((u) => u._id === ownerFilter)?.name || ownerFilter}
                <button
                  type="button"
                  onClick={() => setOwnerFilter("")}
                  className="hover:text-red-505 transition cursor-pointer font-bold pl-0.5"
                  title="Remove owner filter"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveCategories([]);
                setOwnerFilter("");
              }}
              className="text-xs font-bold text-red-550 dark:text-red-400 hover:text-red-700 dark:hover:text-red-350 ml-2 transition cursor-pointer"
            >
              {language === "pl" ? "Wyczyść wszystko" : "Clear all"}
            </button>
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
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
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
