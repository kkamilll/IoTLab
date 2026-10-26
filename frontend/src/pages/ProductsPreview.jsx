import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import Btn from "../components/layout/Btn";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileAlt,
  FaFile,
} from "react-icons/fa";
import {
  ArrowLeft,
  Info,
  User,
  MapPin,
  Tag,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Building,
  ShieldCheck,
  Download,
  Cpu,
  Mail,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUpRight,
} from "lucide-react";

const ProductPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [categoryNames, setCategoryNames] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [cartQuantities, setCartQuantities] = useState({});
  const [localQty, setLocalQty] = useState(0);
  const totalInCart = Object.values(cartQuantities).reduce((acc, qty) => acc + (qty || 0), 0);

  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  const API_URL = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

  // Robust image URL generator
  const getImageUrl = (imgObj) => {
    if (!imgObj) return null;
    let rawPath = "";
    if (typeof imgObj === "string") {
      rawPath = imgObj;
    } else if (typeof imgObj === "object") {
      rawPath = imgObj.filename || imgObj.path || imgObj.url || imgObj.src || imgObj.originalName || "";
    }
    if (!rawPath) return null;
    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      return rawPath;
    }
    const fileName = rawPath.includes("/") || rawPath.includes("\\")
      ? rawPath.split(/[\/\\]/).pop()
      : rawPath;
    if (!fileName) return null;
    return `${API_URL}/uploads/products/${fileName}`;
  };

  const getAvailableStockForProduct = (prod) => {
    if (!prod) return 0;
    return Math.max(
      0,
      Number(prod.stockForRent || 0) -
        Number(prod.stockRentedOut || 0) -
        Number(prod.stockReserved || 0),
    );
  };

  // Determine effective product ID from state, query param, or session storage
  const queryParams = new URLSearchParams(location.search);
  const requestedId =
    location.state?.productId ||
    queryParams.get("id") ||
    sessionStorage.getItem("last_preview_product_id");

  useEffect(() => {
    let isMounted = true;
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        let activeId = requestedId;

        // If no ID was supplied at all (direct URL visit), load first public product as fallback
        if (!activeId) {
          const listRes = await apiClient.get("/products/public");
          if (listRes.data?.products?.length > 0) {
            activeId = listRes.data.products[0]._id;
          } else {
            if (isMounted) setError(t("productPreview.productNotFound") || "Obiekt nie został znaleziony");
            return;
          }
        }

        const url = token
          ? `/products/privateId/${activeId}`
          : `/products/publicId/${activeId}`;

        const res = await apiClient.get(url);

        if (res.data?.success && res.data.product) {
          if (isMounted) {
            setProduct(res.data.product);
            try {
              sessionStorage.setItem("last_preview_product_id", res.data.product._id);
            } catch (e) {}
          }
        } else {
          if (isMounted) setError(t("productPreview.productNotFound") || "Obiekt nie został znaleziony");
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            err.response?.data?.message || err.message || t("productPreview.productNotFound"),
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductData();
    return () => {
      isMounted = false;
    };
  }, [requestedId, token, t]);

  useEffect(() => {
    if (product) {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const item = cart.find((p) => p._id === product._id);
      const stock = getAvailableStockForProduct(product);
      setLocalQty(item ? item.quantity : (stock > 0 ? 1 : 0));
    }
  }, [product]);

  const handleLocalQtyChange = (value) => {
    let qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) qty = 0;
    const maxQty = getAvailableStockForProduct(product);
    if (qty > maxQty) qty = maxQty;
    setLocalQty(qty);
  };

  const handleSaveToCart = () => {
    if (!product) return;
    const previousInCart = cartQuantities[product._id] || 0;
    handleQuantityChange(product._id, localQty, product);
    if (localQty > 0) {
      showToast(
        language === "pl"
          ? (previousInCart > 0 ? "Zaktualizowano ilość w koszyku!" : "Dodano do koszyka!")
          : (previousInCart > 0 ? "Cart updated!" : "Added to cart!"),
        "success"
      );
    } else {
      showToast(
        language === "pl" ? "Przedmiot usunięty z koszyka" : "Item removed from cart",
        "info"
      );
    }
  };

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?._id]);

  useEffect(() => {
    if (!product) return;
    setCategoryNames(
      (product.categories || [])
        .map((cat) => (language === "en" && cat?.nameEn ? cat.nameEn : cat?.name))
        .filter(Boolean),
    );
  }, [product, language]);

  useEffect(() => {
    setCartQuantities(() => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const newQuantities = {};
      cart.forEach((cartItem) => {
        newQuantities[cartItem._id] = cartItem.quantity;
      });
      return newQuantities;
    });
  }, []);

  const handleQuantityChange = (prodId, value, prod) => {
    let qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) qty = 0;
    const maxQty = getAvailableStockForProduct(prod);
    if (qty > maxQty) qty = maxQty;

    setCartQuantities((prev) => ({ ...prev, [prodId]: qty }));

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = cart.findIndex((p) => p._id === prodId);

    if (qty === 0) {
      if (existingIndex !== -1) cart.splice(existingIndex, 1);
    } else {
      if (existingIndex !== -1) {
        cart[existingIndex].quantity = qty;
      } else {
        cart.push({ ...prod, quantity: qty });
      }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
  };

  const showPrevImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : product.images.length - 1,
    );
  };

  const showNextImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex((prev) =>
      prev < product.images.length - 1 ? prev + 1 : 0,
    );
  };

  const getFileIcon = (filename) => {
    if (!filename || typeof filename !== "string") {
      return <FaFile className="inline-block mr-2 text-slate-400" />;
    }
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FaFilePdf className="inline-block mr-2 text-red-500" />;
      case "doc":
      case "docx":
        return <FaFileWord className="inline-block mr-2 text-blue-600" />;
      case "xls":
      case "xlsx":
        return <FaFileExcel className="inline-block mr-2 text-emerald-600" />;
      case "txt":
      case "md":
        return <FaFileAlt className="inline-block mr-2 text-slate-500" />;
      default:
        return <FaFile className="inline-block mr-2 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-500">
        <svg className="animate-spin w-10 h-10 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          {t("productPreview.loadingProduct") || "Ładowanie danych przedmiotu..."}
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center justify-center text-red-500 mb-4 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {error || t("productPreview.productNotFound")}
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          {language === "pl"
            ? "Nie udało się odnaleźć tego obiektu lub został on usunięty z bazy."
            : "This object could not be found or has been removed from the database."}
        </p>
        <Btn onClick={() => navigate(-1)} variant="secondary" className="px-5 py-2 text-xs font-bold gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>{t("common.back")}</span>
        </Btn>
      </div>
    );
  }

  const availableStock = getAvailableStockForProduct(product);
  const itemInCart = cartQuantities[product?._id] || 0;
  const imagesList = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const hasImages = imagesList.length > 0;
  const currentImageUrl = hasImages ? getImageUrl(imagesList[currentImageIndex] || imagesList[0]) : null;

  const hasDescription = !!product.description && product.description.trim().length > 0;

  const validTags = Array.isArray(product?.tags)
    ? product.tags.filter((t) => typeof t === "string" && t.trim().length > 0)
    : [];
  const hasTags = validTags.length > 0;

  const filteredTags = tagSearchQuery.trim()
    ? validTags.filter((t) => t.toLowerCase().includes(tagSearchQuery.trim().toLowerCase()))
    : validTags;

  const MAX_VISIBLE_TAGS = 14;
  const showExpandButton = !tagSearchQuery.trim() && validTags.length > MAX_VISIBLE_TAGS;
  const displayedTags = showExpandButton && !isTagsExpanded
    ? filteredTags.slice(0, MAX_VISIBLE_TAGS)
    : filteredTags;

  const validExtraFields = (product?.extraFields && typeof product.extraFields === "object")
    ? Object.entries(product.extraFields).filter(
        ([_, val]) => val !== null && val !== undefined && String(val).trim() !== ""
      )
    : [];
  const hasExtraFields = validExtraFields.length > 0;

  const validAttachments = Array.isArray(product?.attachments)
    ? product.attachments.filter((att) => !!att && (att.filename || att.originalName))
    : [];
  const hasAttachments = validAttachments.length > 0;

  const hasOwner = !!product?.owner?.name && product.owner.name.trim().length > 0;
  const hasRoom = !!product?.labRoom && String(product.labRoom).trim().length > 0;
  const hasAssignmentInfo = hasOwner || hasRoom;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Centered Single-Column Vertical Container */}
      <div className="mx-auto max-w-4xl flex flex-col gap-6">

        {/* 1. Top Bar: Back Button & Cart Shortcut */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Btn
            onClick={() => navigate(-1)}
            variant="secondary"
            className="py-1.5 px-3.5 text-xs font-bold shadow-2xs gap-1.5 inline-flex"
            type="button"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("common.back")}</span>
          </Btn>

          {totalInCart > 0 && (
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-md transition duration-150 cursor-pointer flex items-center gap-2"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t("guest.viewCart")}</span>
              <span className="bg-indigo-700 text-white font-black px-1.5 py-0.2 rounded-md text-[10px]">
                {totalInCart}
              </span>
            </button>
          )}
        </div>

        {/* 2. Product Header Section */}
        <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col gap-4">
          {categoryNames.length > 0 && (
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-indigo-600 dark:text-indigo-400">
              {categoryNames.join("  /  ")}
            </span>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight break-words [overflow-wrap:anywhere] min-w-0">
              {product.name}
            </h1>

            {/* Availability & Rentability Badges */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {availableStock === 0 && (
                <span className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-red-200/80 dark:border-red-900/40 shadow-2xs">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{t("products.statusUnavailable") || "Niedostępne"}</span>
                </span>
              )}

              {product.isRentable ? (
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/40 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{language === "pl" ? "Możliwość wypożyczenia" : "Rentable"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{language === "pl" ? "Tylko w laboratorium" : "Lab use only"}</span>
                </span>
              )}
            </div>
          </div>

          {/* Key Lab Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {language === "pl" ? "Dostępne w labie" : "Available"}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                {availableStock} <span className="text-xs font-bold text-slate-400">/ {product.stockTotal || availableStock} szt.</span>
              </span>
            </div>

            <div className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {language === "pl" ? "Wypożyczone" : "Rented out"}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                {product.stockRentedOut || 0} <span className="text-xs font-bold text-slate-400">szt.</span>
              </span>
            </div>

            <div className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {language === "pl" ? "Lokalizacja" : "Lab Room"}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1 truncate" title={product.labRoom || "Laboratorium"}>
                {product.labRoom || "Laboratorium"}
              </span>
            </div>

            <div className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {language === "pl" ? "Opiekun sprzętu" : "Caretaker"}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1 truncate" title={product.owner?.name || "Katedra IoT"}>
                {product.owner?.name || "Katedra IoT"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Image / Gallery Block (Rendered if images exist) */}
        {hasImages && (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="relative group overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 aspect-[16/10] sm:aspect-[16/9] max-h-[520px] w-full flex items-center justify-center">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={`${product.name} ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain sm:object-cover transition-transform duration-500 hover:scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}

              <div
                className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950"
                style={{ display: currentImageUrl ? "none" : "flex" }}
              >
                <Package className="w-12 h-12 mb-2 text-slate-400" />
                <span className="text-xs font-bold">{t("productPreview.noImages")}</span>
              </div>

              {/* Navigation Chevrons */}
              {imagesList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevImage}
                    aria-label="Previous image"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="Next image"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center border border-slate-200/80 dark:border-slate-700 transition active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-3.5 right-3.5 px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md text-xs font-bold border border-white/10 select-none shadow-sm">
                    {currentImageIndex + 1} / {imagesList.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Row */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto p-1 scrollbar-thin">
                {imagesList.map((img, idx) => {
                  const thumbUrl = getImageUrl(img);
                  const isSelected = idx === currentImageIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-1 bg-white dark:bg-slate-900 border-2 transition-all cursor-pointer shrink-0 shadow-2xs ${
                        isSelected
                          ? "border-indigo-600 ring-4 ring-indigo-500/20 scale-102"
                          : "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-350 dark:hover:border-slate-700"
                      }`}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Booking Card (Rendered only if rentable) */}
        {product.isRentable && (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm flex flex-col gap-5">
            {/* Top row: Title, Stock & Cart Status */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {t("productPreview.addToCart") || "Zarezerwuj sprzęt"}
                  </h3>
                </div>
              </div>

              {itemInCart > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {language === "pl" ? `W Twoim koszyku: ${itemInCart} szt.` : `In your cart: ${itemInCart} pcs`}
                  </span>
                </div>
              )}
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-2xl h-12 bg-slate-50 dark:bg-slate-950/60 p-1 shrink-0 sm:w-44">
                <button
                  type="button"
                  onClick={() => handleLocalQtyChange(localQty - 1)}
                  disabled={localQty <= 0 || availableStock === 0}
                  className="w-10 h-full rounded-xl bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition disabled:opacity-30 disabled:cursor-not-allowed text-base font-extrabold flex items-center justify-center cursor-pointer shadow-2xs"
                  aria-label="Zmniejsz ilość"
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  max={availableStock}
                  value={localQty}
                  onChange={(e) => handleLocalQtyChange(e.target.value)}
                  disabled={availableStock === 0}
                  className="w-14 text-center bg-transparent border-0 outline-none focus:ring-0 text-base font-black text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleLocalQtyChange(localQty + 1)}
                  disabled={localQty >= availableStock || availableStock === 0}
                  className="w-10 h-full rounded-xl bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition disabled:opacity-30 disabled:cursor-not-allowed text-base font-extrabold flex items-center justify-center cursor-pointer shadow-2xs"
                  aria-label="Zwiększ ilość"
                >
                  +
                </button>
              </div>

              {/* Action button */}
              <button
                type="button"
                onClick={handleSaveToCart}
                disabled={availableStock === 0 || (localQty === 0 && itemInCart === 0)}
                className={`flex-1 h-12 rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-center gap-2 ${
                  availableStock === 0
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : localQty === 0 && itemInCart > 0
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {availableStock === 0 ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>{language === "pl" ? "Brak w magazynie" : "Out of stock"}</span>
                  </>
                ) : localQty === 0 && itemInCart > 0 ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>{language === "pl" ? "Usuń z koszyka" : "Remove from cart"}</span>
                  </>
                ) : itemInCart > 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {localQty !== itemInCart
                        ? (language === "pl" ? "Zaktualizuj w koszyku" : "Update in cart")
                        : (language === "pl" ? "Zapisz w koszyku" : "Save in cart")}
                    </span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t("productPreview.addToCart") || "Dodaj do koszyka"}</span>
                  </>
                )}
              </button>

              {/* Single, clean Go to cart button */}
              {totalInCart > 0 && (
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="h-12 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shrink-0 border border-slate-200/80 dark:border-slate-700/80"
                >
                  <ShoppingCart className="w-4 h-4 text-indigo-500" />
                  <span>{t("productPreview.viewCart") || "Przejdź do koszyka"}</span>
                  <span className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-black text-[10px]">
                    {totalInCart}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5. Description Block (Rendered ONLY if description exists) */}
        {hasDescription && (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Info className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>{t("productPreview.description")}</span>
            </h2>

            <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
              {product.description}
            </div>
          </div>
        )}

        {/* 6. Technical Specifications / Custom Fields (Rendered ONLY if extra fields with values exist) */}
        {hasExtraFields && (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>{language === "pl" ? "Dodatkowe informacje i parametry" : "Additional information"}</span>
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80">
                {validExtraFields.length} {language === "pl" ? (validExtraFields.length === 1 ? "pozycja" : "pozycje") : "items"}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {validExtraFields.map(([key, val]) => (
                <div
                  key={key}
                  className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-4 sm:px-5 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-6 min-w-0 transition hover:border-indigo-300 dark:hover:border-indigo-800/60"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 break-words [overflow-wrap:anywhere]">
                    {key}
                  </span>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 break-words [overflow-wrap:anywhere] sm:text-right whitespace-pre-line">
                    {String(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* 8. Location & Caretaker Block (Rendered ONLY if room or owner exists) */}
        {hasAssignmentInfo && (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
              {language === "pl" ? "Lokalizacja i opiekun sprzętu" : "Location & caretaker"}
            </h3>

            <div className={`grid gap-4 ${hasOwner && hasRoom ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              {/* Owner */}
              {hasOwner && (
                <div className="flex items-center justify-between gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 min-w-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t("productPreview.owner")}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {product.owner.name}
                      </span>
                    </div>
                  </div>
                  {product.owner?.email && (
                    <a
                      href={`mailto:${product.owner.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition shrink-0"
                      title={language === "pl" ? "Wyślij wiadomość do opiekuna" : "Email caretaker"}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{language === "pl" ? "Kontakt" : "Contact"}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Room */}
              {hasRoom && (
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t("productPreview.room")}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {product.labRoom}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. Tags Block (Rendered ONLY if tags exist) */}
        {hasTags && (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            {/* Header: Title, counter & search filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {language === "pl" ? "Tagi i powiązane technologie" : (t("productPreview.tags") || "Tags")}
                  </h2>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700/80">
                    {validTags.length}
                  </span>
                </div>
              </div>

              {/* Tag Search input (shown if there are more than 6 tags or an active query) */}
              {(validTags.length > 6 || tagSearchQuery) && (
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder={language === "pl" ? "Filtruj tagi..." : "Filter tags..."}
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                  {tagSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTagSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Wyczyść filtr"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tags Cloud Container */}
            <div className={`flex flex-wrap gap-2 ${isTagsExpanded ? "max-h-[360px] overflow-y-auto scrollbar-thin pr-1" : ""}`}>
              {displayedTags.length > 0 ? (
                displayedTags.map((tag, i) => (
                  <button
                    key={`${tag}-${i}`}
                    type="button"
                    onClick={() => {
                      const targetRoute = token ? "/products" : "/guest-products";
                      navigate(`${targetRoute}?search=${encodeURIComponent(tag)}`, { state: { search: tag } });
                    }}
                    title={language === "pl" ? `Kliknij, aby wyszukać sprzęt z tagiem #${tag}` : `Search equipment with tag #${tag}`}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 select-none cursor-pointer bg-slate-50 hover:bg-indigo-50/90 dark:bg-slate-950/60 dark:hover:bg-indigo-950/60 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200/80 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-800/80 shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-95"
                  >
                    <span className="text-indigo-500 dark:text-indigo-400 font-black text-[13px] group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      #
                    </span>
                    <span>{tag}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0 -ml-0.5" />
                  </button>
                ))
              ) : (
                <div className="py-4 text-center w-full text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                  <span>{language === "pl" ? `Nie znaleziono tagów pasujących do "${tagSearchQuery}"` : `No tags matching "${tagSearchQuery}"`}</span>
                  <button
                    type="button"
                    onClick={() => setTagSearchQuery("")}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold mt-1 cursor-pointer"
                  >
                    {language === "pl" ? "Wyczyść wyszukiwanie" : "Clear search"}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom row: Counter info & Expand / Collapse Toggle if many tags */}
            {showExpandButton && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">
                  {isTagsExpanded
                    ? (language === "pl" ? `Wyświetlono wszystkie ${validTags.length} tagów` : `Showing all ${validTags.length} tags`)
                    : (language === "pl" ? `Wyświetlono 14 z ${validTags.length} tagów` : `Showing 14 of ${validTags.length} tags`)}
                </span>

                <button
                  type="button"
                  onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-900/50 transition cursor-pointer"
                >
                  {isTagsExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>{language === "pl" ? "Zwiń tagi" : "Show less"}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>
                        {language === "pl"
                          ? `Pokaż wszystkie (${validTags.length})`
                          : `Show all (${validTags.length})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 9. Attachments Block (Rendered ONLY if attachments exist) */}
        {hasAttachments && (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col gap-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>{t("productPreview.attachments")}</span>
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {validAttachments.map((att) => {
                return (
                  <a
                    key={att.uniqueKey || att.filename}
                    href={`${API_URL}/uploads/products/${att.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-900 transition min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{getFileIcon(att.originalName || att.filename)}</span>
                      <span
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[200px] sm:max-w-[260px]"
                        title={att.originalName || att.filename}
                      >
                        {att.originalName || att.filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {att.size ? `${(att.size / 1024).toFixed(0)} KB` : "Plik"}
                      </span>
                      <Download className="w-3.5 h-3.5" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductPreview;
