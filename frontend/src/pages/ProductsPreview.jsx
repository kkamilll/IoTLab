import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileAlt,
  FaFile,
  FaShoppingCart,
} from "react-icons/fa";
import {
  ArrowLeft,
  Info,
  Folder,
  User,
  MapPin,
  Tag,
  Cpu,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShoppingCart,
} from "lucide-react";

const ProductPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { productId } = location.state || {};
  const [product, setProduct] = useState(null);
  const [categoryNames, setCategoryNames] = useState([]);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [cartQuantities, setCartQuantities] = useState({});
  const [localQty, setLocalQty] = useState(0);
  const totalInCart = Object.values(cartQuantities).reduce((acc, qty) => acc + (qty || 0), 0);


  useEffect(() => {
    if (product) {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const item = cart.find((p) => p._id === product._id);
      setLocalQty(item ? item.quantity : 0);
    }
  }, [product]);

  const handleLocalQtyChange = (value) => {
    let qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) qty = 0;
    const maxQty = getAvailableStockForProduct(product);
    if (qty > maxQty) qty = maxQty;
    setLocalQty(qty);
  };

  useEffect(() => setCurrentImageIndex(0), [productId]);
  const getAvailableStockForProduct = (product) =>
    Math.max(
      0,
      Number(product.stockForRent || 0) -
        Number(product.stockRentedOut || 0) -
        Number(product.stockReserved || 0),
    );

  useEffect(() => {
    if (!productId) {
      setError("No product ID provided");
      return;
    }

    const fetchProduct = async () => {
      try {
        const url = token
          ? `/products/privateId/${productId}`
          : `/products/publicId/${productId}`;

        const res = await apiClient.get(url);

        if (res.data.success) setProduct(res.data.product);
        else setError("Product not found");
      } catch (err) {
        console.error(err);
        setError(
          `Error fetching product: ${err.response?.data?.message || err.message}`,
        );
      }
    };

    fetchProduct();
  }, [productId, token]);

  useEffect(() => {
    if (!product) return;
    setCategoryNames((product.categories || []).map((cat) => language === "en" && cat?.nameEn ? cat.nameEn : cat?.name).filter(Boolean));
  }, [product, language]);

  useEffect(() => {
    setCartQuantities((prev) => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const newQuantities = {};
      cart.forEach(
        (cartItem) => (newQuantities[cartItem._id] = cartItem.quantity),
      );
      return newQuantities;
    });
  }, []);

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = cart.findIndex((p) => p._id === product._id);

    if (existingIndex !== -1) cart[existingIndex].quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));
    showToast(`${product.name} has been added to the cart!`, "success");
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

  // Funkcja pomocnicza do wyświetlania ikony w zależności od typu pliku
  const getFileIcon = (filename) => {
    if (!filename || typeof filename !== "string") {
      return <FaFile className="inline-block mr-2 text-gray-400" />;
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
        return <FaFileExcel className="inline-block mr-2 text-green-600" />;
      case "txt":
        return <FaFileAlt className="inline-block mr-2 text-gray-600" />;
      default:
        return <FaFile className="inline-block mr-2 text-gray-400" />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-red-500">
        <p className="mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          ← Back
        </button>
      </div>
    );
  }

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
  };

  if (!product)
    return <div className="p-6 text-center">{t("productPreview.loadingProduct") || "Loading product..."}</div>;

  const API_URL = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

  const hasImages = product.images && product.images.length > 0;
  const hasDescription = !!product.description;
  const hasTags = product.tags && product.tags.length > 0;
  const hasExtraFields = product.extraFields && Object.keys(product.extraFields).length > 0;
  const hasAttachments = product.attachments && product.attachments.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate(-1)}
          className="group mb-8 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t("common.back")}</span>
        </button>

        <div className="mb-8 pb-6 border-b border-slate-200/60 dark:border-slate-800/80">
          <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-indigo-650 dark:text-indigo-400">
            {categoryNames.join(" / ") || t("productPreview.uncategorized")}
          </span>
          <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>
            {getAvailableStockForProduct(product) === 0 ? (
              <span className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/25 text-red-600 dark:text-red-400 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-red-100/50 dark:border-red-900/30 shadow-sm w-max">
                {t("products.statusUnavailable") || "Niedostępne"}
              </span>
            ) : getAvailableStockForProduct(product) <= 2 ? (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-amber-100/50 dark:border-amber-900/30 shadow-sm w-max">
                {(t("products.statusLowStock") || "Niski zapas") + `: ${getAvailableStockForProduct(product)}`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm w-max">
                {t("productPreview.available")}: {getAvailableStockForProduct(product)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-405">
            {t("productPreview.subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 flex flex-col gap-4">
            {hasImages ? (
              <div className="relative group overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
                <div className="aspect-[4/3] w-full relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-950">
                  <img
                    src={`${API_URL}/uploads/products/${(product.images[currentImageIndex] || product.images[0])?.filename}`}
                    alt={`${product.name} ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                {product.images.length > 1 && (
                  <>
                    <button onClick={showPrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-2xl bg-white/90 dark:bg-slate-900/90 p-3 text-slate-900 dark:text-slate-100 shadow-md hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={showNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-2xl bg-white/90 dark:bg-slate-900/90 p-3 text-slate-900 dark:text-slate-100 shadow-md hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-250 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40 p-12 flex flex-col items-center justify-center text-center aspect-[4/3] min-h-[300px]">
                {/* Subtle background glow */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-slate-500/10 dark:bg-slate-400/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800 shadow-inner">
                  <FaFileImage className="w-10 h-10 text-slate-400 dark:text-slate-550" />
                </div>
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-350">
                  {t("productPreview.noImages") || "Brak wgranych zdjęć dla tego obiektu"}
                </h4>
                <p className="mt-1.5 text-xs text-slate-450 dark:text-slate-500 max-w-xs leading-normal">
                  {language === "pl" 
                    ? "Ten obiekt nie posiada zdjęć. Szczegółowe specyfikacje i dokumenty znajdziesz poniżej."
                    : "This object does not have any images. Detailed specifications and documents are available below."}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            {product.isRentable && (
              <div className="rounded-3xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-6 shadow-md border border-indigo-100/30 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-2xl pointer-events-none"></div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  {t("productPreview.addToCart")}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="flex items-center border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden h-12 bg-white dark:bg-slate-950 shadow-inner">
                    <button onClick={() => handleLocalQtyChange(localQty - 1)} disabled={localQty <= 0} className="w-12 h-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition disabled:opacity-40 disabled:pointer-events-none text-lg font-bold cursor-pointer">−</button>
                    <input type="number" min="0" max={getAvailableStockForProduct(product)} value={localQty} onChange={(e) => handleLocalQtyChange(e.target.value)} className="w-14 text-center bg-transparent border-0 outline-none focus:ring-0 text-base font-extrabold text-slate-800 dark:text-slate-200" />
                    <button onClick={() => handleLocalQtyChange(localQty + 1)} disabled={localQty >= getAvailableStockForProduct(product)} className="w-12 h-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition disabled:opacity-40 disabled:pointer-events-none text-lg font-bold cursor-pointer">+</button>
                  </div>
                  <button onClick={() => { handleQuantityChange(product._id, localQty, product); showToast(t("productPreview.cartUpdatedAlert"), "success"); }} className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm hover:shadow transition-all cursor-pointer text-sm">{t("productPreview.confirm")}</button>
                </div>
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 leading-normal">{t("productPreview.updateCartHelp")}</p>
                <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <button onClick={() => navigate("/cart")} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-300 transition-colors"><span>{t("productPreview.viewCart")}</span><span>→</span></button>
                  <button onClick={() => navigate("/cart")} className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold shadow hover:shadow-md transition-all cursor-pointer text-xs flex items-center gap-2"><span>{t("productPreview.viewCartCheckout")}</span><span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-slate-900 dark:text-slate-900 font-extrabold text-[10px] shadow-sm">{totalInCart}</span></button>
                </div>
              </div>
            )}
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200/60 dark:border-slate-800 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div><h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">{t("productPreview.owner")}</h4><p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{product.owner?.name || t("welcome.anonymous")}</p></div>
              </div>
              {product.labRoom && (
                <div className="flex items-start gap-3 border-t border-slate-105 dark:border-slate-800/80 pt-3">
                  <MapPin className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div><h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">{t("productPreview.room")}</h4><p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{product.labRoom}</p></div>
                </div>
              )}
              <div className="flex items-start gap-3 border-t border-slate-105 dark:border-slate-800/80 pt-3">
                <ShoppingCart className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div><h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">{t("productPreview.inCart")}</h4><p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{cartQuantities[product._id] || 0} szt.</p></div>
              </div>
            </div>
          </div>
        </div>

        {(hasDescription || hasTags) && (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {hasDescription && (
              <div className={`${hasTags ? "md:col-span-2" : "md:col-span-3"} rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200/60 dark:border-slate-800`}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-indigo-500" />{t("productPreview.description")}</h2>
                <p className="text-slate-650 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
            {hasTags && (
              <div className={`${!hasDescription ? "md:col-span-3" : "md:col-span-1"} rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200/60 dark:border-slate-800`}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-indigo-500" />{t("productPreview.tags")}</h2>
                <div className="flex flex-wrap gap-1.5 mt-2">{product.tags.map((tag, i) => <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-300">{tag}</span>)}</div>
              </div>
            )}
          </div>
        )}

        {hasExtraFields && (
          <div className="mt-8 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200/60 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-500" />{t("productPreview.additionalData")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(product.extraFields).map(([key, val]) => (
                <div key={key} className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/80">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{key}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{val || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasAttachments && (
          <div className="mt-8 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200/60 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" />{t("productPreview.attachments")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {product.attachments.map((att) => att && (
                <a key={att.uniqueKey} href={`${API_URL}/uploads/products/${att.filename}`} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-semibold text-slate-700 dark:text-slate-350 hover:border-indigo-300 dark:hover:border-indigo-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition duration-300">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getFileIcon(att.originalName)}</span>
                    <span className="text-sm font-bold group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">{att.originalName}</span>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors font-bold uppercase tracking-wider">{att.size ? `${(att.size / 1024).toFixed(1)} KB` : "View"}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPreview;
