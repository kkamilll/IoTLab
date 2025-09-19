import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileAlt, FaFile, FaShoppingCart } from "react-icons/fa";

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
  const getAvailableStockForProduct = (product) => (Math.max(0, Number(product.stockForRent || 0) - Number(product.stockRentedOut || 0) - Number(product.stockReserved || 0)));

  useEffect(() => {
    if (!productId) {
      setError("No product ID provided");
      return;
    }

    const fetchProduct = async () => {
      try {
        const API_URL = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;
        const url = token
          ? `${API_URL}/products/privateId/${productId}`
          : `${API_URL}/products/publicId/${productId}`;

        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const res = await axios.get(url, config);

        if (res.data.success) setProduct(res.data.product);
        else setError("Product not found");
      } catch (err) {
        console.error(err);
        setError(`Error fetching product: ${err.response?.data?.message || err.message}`);
      }
    };

    fetchProduct();
  }, [productId, token]);

  useEffect(() => {
    if (!product) return;
    setCategoryNames((product.categories || []).map(cat => cat?.name));
  }, [product]);

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = cart.findIndex(p => p._id === product._id);

    if (existingIndex !== -1) cart[existingIndex].quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} has been added to the cart!`);
  };

  const showPrevImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : product.images.length - 1));
  };

  const showNextImage = () => {
    if (!product?.images?.length) return;
    setCurrentImageIndex(prev => (prev < product.images.length - 1 ? prev + 1 : 0));
  };

  // Funkcja pomocnicza do wyświetlania ikony w zależności od typu pliku
  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return <FaFilePdf className="inline-block mr-2 text-red-500" />;
      case "doc":
      case "docx": return <FaFileWord className="inline-block mr-2 text-blue-600" />;
      case "xls":
      case "xlsx": return <FaFileExcel className="inline-block mr-2 text-green-600" />;
      case "txt": return <FaFileAlt className="inline-block mr-2 text-gray-600" />;
      default: return <FaFile className="inline-block mr-2 text-gray-400" />;
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
    // setCartQuantitiesInCart(cart.reduce((acc, item) => ({ ...acc, [item._id]: item.quantity }), {}));
  };

  if (!product) return <div className="p-6 text-center">Loading product...</div>;

  const API_URL = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl shadow-md">
      <button
        onClick={() => navigate(-1)}
        className="self-start px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>

      {/* Image gallery */}
      {product.images?.length > 0 ? (
        <div className="relative flex flex-col items-center">
          <div className="relative w-full max-w-lg">
            <img
              src={`${API_URL}/uploads/products/${product.images[currentImageIndex].filename}`}
              alt={`${product.name} ${currentImageIndex + 1}`}
              className="w-full max-h-96 object-contain rounded-lg shadow-lg"
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={showPrevImage}
                  className="absolute top-1/2 left-0 -translate-y-1/2 bg-black bg-opacity-40 text-white px-3 py-2 rounded-l hover:bg-opacity-70 transition"
                >
                  ‹
                </button>
                <button
                  onClick={showNextImage}
                  className="absolute top-1/2 right-0 -translate-y-1/2 bg-black bg-opacity-40 text-white px-3 py-2 rounded-r hover:bg-opacity-70 transition"
                >
                  ›
                </button>
              </>
            )}
          </div>
          <p className="text-gray-500 mt-2">
            {currentImageIndex + 1} / {product.images.length}
          </p>
        </div>
      ) : (
        <p className="text-gray-400">No images</p>
      )}

      {/* Product details (bubble layout) */}
      <div className="space-y-4 mt-4">
        {/* Description */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-auto min-w-[200px] px-4 py-3 bg-gray-100 rounded-lg">
            <p className="text-sm font-semibold text-gray-600">Description</p>
            <p className="text-center text-gray-800 break-words">
              {product.description || "—"}
            </p>
          </div>
        </div>

        {/* Available */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-auto min-w-[200px] px-4 py-3 bg-green-100 rounded-lg">
            <p className="text-sm font-semibold text-gray-600">Available</p>
            <p className="text-center text-green-800">{getAvailableStockForProduct(product)}</p>
          </div>
        </div>

        {/* Categories */}
        {categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="flex-auto min-w-[200px] px-4 py-3 bg-blue-100 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">Categories</p>
              <p className="text-center text-blue-800 break-words">
                {categoryNames.join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        {product.tags && (
          <div className="flex flex-wrap gap-2">
            <div className="flex-auto min-w-[200px] px-4 py-3 bg-purple-100 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">Tags</p>
              <p className="text-center text-purple-800">{product.tags.join(", ")}</p>
            </div>
          </div>
        )}

        {/* Extra fields */}
        {product.extraFields &&
          Object.entries(product.extraFields).map(([key, val]) => (
            <div key={key} className="flex flex-wrap gap-2">
              <div className="flex-auto min-w-[200px] px-4 py-3 bg-yellow-100 rounded-lg">
                <p className="text-sm font-semibold text-gray-600">{key}</p>
                <p className="text-center text-yellow-800 break-words">{val}</p>
              </div>
            </div>
          ))}

        {/* Attachments with icons */}
        {product.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="flex-auto min-w-[200px] px-4 py-3 bg-pink-100 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">Attachments</p>
              {product.attachments.map(att => (
                <a
                  key={att.uniqueKey}
                  href={`${API_URL}/uploads/products/${att.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-800 hover:underline flex items-center gap-2 break-words justify-center"
                >
                  {getFileIcon(att.originalName)}
                  <span>{att.originalName}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row sm:gap-6 mt-6 items-stretch sm:items-stretch">
        <div className="flex flex-1 sm:flex-none items-center gap-0 justify-center sm:justify-start">
          <span className="bg-gray-100 text-gray-700 px-3 rounded-l-xl font-medium border border-r-0 border-gray-300 flex items-center h-14">
            In cart:
          </span>

          {/* Quantity Selector */}
          <div className="flex border rounded-r-xl shadow-sm overflow-hidden h-14 flex-shrink-0">
            <button
              onClick={() =>
                handleQuantityChange(product._id, (cartQuantities[product._id] || 0) - 1, product)
              }
              className="w-14 h-full bg-gray-100 hover:bg-gray-200 transition text-gray-700 text-2xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={(cartQuantities[product._id] || 0) <= 0}
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
              className="w-20 h-full text-center text-lg font-semibold outline-none border-x border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />

            <button
              onClick={() =>
                handleQuantityChange(product._id, (cartQuantities[product._id] || 0) + 1, product)
              }
              className="w-14 h-full bg-gray-100 hover:bg-gray-200 transition text-gray-700 text-2xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={
                (cartQuantities[product._id] || 0) >= getAvailableStockForProduct(product)
              }
            >
              +
            </button>
          </div>
        </div>

        {/* Cart Button */}
        <button
          onClick={() => navigate("/cart")}
          className="flex-1 px-8 py-4 bg-blue-500 text-white text-lg font-semibold rounded-xl hover:bg-blue-600 transition mt-4 sm:mt-0 h-14 sm:h-14"
        >
          Go to Cart
        </button>
      </div>


    </div>
  );
};

export default ProductPreview;