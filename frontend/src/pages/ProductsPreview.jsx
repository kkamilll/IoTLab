import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileAlt,
  FaFile,
  FaShoppingCart,
} from "react-icons/fa";

const ProductPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { productId } = location.state || {};
  const [product, setProduct] = useState(null);
  const [categoryNames, setCategoryNames] = useState([]);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [cartQuantities, setCartQuantities] = useState({});

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
    setCategoryNames((product.categories || []).map((cat) => cat?.name));
  }, [product]);

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
    alert(`${product.name} has been added to the cart!`);
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
    // setCartQuantitiesInCart(cart.reduce((acc, item) => ({ ...acc, [item._id]: item.quantity }), {}));
  };

  if (!product)
    return <div className="p-6 text-center">Loading product...</div>;

  const API_URL = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          ← Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Detailed product preview and rental options.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Available
              </p>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                {getAvailableStockForProduct(product)}
              </span>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Category:</span>{" "}
                {categoryNames.join(", ") || "Uncategorized"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">In cart:</span>{" "}
                {cartQuantities[product._id] || 0}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Owner:</span>{" "}
                {product.owner?.name || "Unknown"}
              </p>
            </div>
            <button
              onClick={() => navigate("/cart")}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition"
            >
              View Cart
            </button>
          </div>
        </div>

        {product.images?.length > 0 ? (
          <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
            <img
              src={`${API_URL}/uploads/products/${product.images[currentImageIndex].filename}`}
              alt={`${product.name} ${currentImageIndex + 1}`}
              className="h-[28rem] w-full object-cover"
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={showPrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-4 py-3 text-xl text-slate-900 shadow hover:bg-white"
                >
                  ‹
                </button>
                <button
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-4 py-3 text-xl text-slate-900 shadow hover:bg-white"
                >
                  ›
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-4 rounded-full bg-slate-900/80 px-4 py-2 text-sm text-slate-100">
              {currentImageIndex + 1} / {product.images.length}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
            No images available for this product.
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              Description
            </h2>
            <p className="text-slate-700 whitespace-pre-line">
              {product.description || "No description provided."}
            </p>
          </div>
          <div className="space-y-4">
            {categoryNames.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  Categories
                </h2>
                <p className="text-slate-700">{categoryNames.join(", ")}</p>
              </div>
            )}
            {product.tags && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  Tags
                </h2>
                <p className="text-slate-700">{product.tags.join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        {product.extraFields &&
          Object.entries(product.extraFields).length > 0 && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Additional Data
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(product.extraFields).map(([key, val]) => (
                  <div key={key} className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                      {key}
                    </p>
                    <p className="mt-2 text-slate-700">{val || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {product.attachments?.length > 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Attachments
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.attachments.map((att) => (
                <a
                  key={att.uniqueKey}
                  href={`${API_URL}/uploads/products/${att.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  {getFileIcon(att.originalName)} {att.originalName}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_220px] items-end">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Add to cart
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  handleQuantityChange(
                    product._id,
                    (cartQuantities[product._id] || 0) - 1,
                    product,
                  )
                }
                disabled={(cartQuantities[product._id] || 0) <= 0}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-xl font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                max={getAvailableStockForProduct(product)}
                value={cartQuantities[product._id] || 0}
                onChange={(e) =>
                  handleQuantityChange(product._id, e.target.value, product)
                }
                className="w-24 rounded-2xl border border-slate-200 px-3 py-3 text-center text-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={() =>
                  handleQuantityChange(
                    product._id,
                    (cartQuantities[product._id] || 0) + 1,
                    product,
                  )
                }
                disabled={
                  (cartQuantities[product._id] || 0) >=
                  getAvailableStockForProduct(product)
                }
                className="rounded-2xl bg-slate-100 px-4 py-3 text-xl font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Quantity will be stored in the cart automatically.
            </p>
          </div>

          <button
            onClick={() => navigate("/cart")}
            className="rounded-3xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition"
          >
            View Cart & Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
