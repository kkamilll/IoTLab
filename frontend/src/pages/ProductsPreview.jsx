import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ProductPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { productId } = location.state || {};
  const [product, setProduct] = useState(null);
  const [categoryNames, setCategoryNames] = useState([]);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => setCurrentImageIndex(0), [productId]);

  // Fetch product
  useEffect(() => {
    if (!productId) {
      setError("No product ID provided");
      return;
    }

    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:3500/products/privateId/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  if (!product) return <div className="p-6 text-center">Loading product...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl shadow-md">
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
              src={`http://localhost:3500/uploads/products/${product.images[currentImageIndex].filename}`}
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
          <p className="text-gray-500 mt-2">{currentImageIndex + 1} / {product.images.length}</p>
        </div>
      ) : (
        <p className="text-gray-400">No images</p>
      )}

      {/* Product details */}
      <div className="space-y-2 text-gray-700">
        <p><strong>Description:</strong> {product.description}</p>
        <p><strong>Available:</strong> {product.stockForRent}</p>
        <p><strong>Categories:</strong> {categoryNames.join(", ") || "No categories"}</p>
        <p><strong>Tag:</strong> {product.tag || <span className="text-gray-500">No tag</span>}</p>

        {product.extraFields && Object.keys(product.extraFields).length > 0 && (
          <div>
            <strong>Extra Fields:</strong>
            <ul className="list-disc list-inside mt-1 text-gray-600">
              {Object.entries(product.extraFields).map(([key, val]) => (
                <li key={key}>
                  <span className="font-semibold">{key}:</span> {val}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row sm:gap-4 mt-4">
        <button
          onClick={() => handleAddToCart(product)}
          className="flex-1 px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
        >
          Add to Cart
        </button>
        <button
          onClick={() => navigate("/cart")}
          className="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition mt-2 sm:mt-0"
        >
          Go to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductPreview;
