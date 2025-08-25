import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ProductPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { productId } = location.state || {}; // pobieramy tylko productId
const [product, setProduct] = useState(null);
const [categoryNames, setCategoryNames] = useState([]);
// const [categories, setCategories] = useState([]);
const [error, setError] = useState(null);

  // Pobranie produktu
  useEffect(() => {
    if (!productId) {
      setError("No product ID provided");
      return;
    }

    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:3500/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setProduct(res.data.product);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching product");
      }
    };

    fetchProduct();

    
  }, [productId, token]);

  useEffect(() => {
    if(!product) return;
    setCategoryNames(product ? (product.categories || []).map(cat => cat?.name) : "No category");
    // console.log(product ? product.categories : "no product categories");
    // console.log(categoryNames);
  }, [product])

  // Dodanie do koszyka
  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = cart.findIndex((p) => p._id === product._id);

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} został dodany do koszyka!`);
  };

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error} <br />
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!product) {
    return <div className="p-6">Loading product...</div>;
  }


  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>

      {product.image && (
        <img
          src={`http://localhost:3500/uploads/${product.image}`}
          alt={product.name}
          className="w-full max-h-96 object-contain rounded mb-4"
        />
      )}

      <p className="text-gray-700 mb-2">
        <strong>Description:</strong> {product.description}
      </p>
      <p className="text-gray-700 mb-2">
        <strong>Stock:</strong> {product.stock}
      </p>
    <p>
  <strong>Categories:</strong>{" "}
  { categoryNames.join(", ") }
</p>



      <div className="mb-2">
        <strong>Tag:</strong>{" "}
        {
          product.tag || <span className="text-gray-500">No tag</span>
        }
      </div>

      <div>
        <strong>Extra fields:</strong>
        <ul className="list-disc list-inside">
          {product.extraFields &&
            Object.entries(product.extraFields).map(([key, val]) => (
              <li key={key}>
                <span className="font-semibold">{key}:</span> {val}
              </li>
            ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:gap-4">
        <button
          onClick={() => handleAddToCart(product)}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition"
        >
          Dodaj do koszyka
        </button>

        <button
          onClick={() => navigate("/cart")}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
        >
          Przejdź do koszyka
        </button>
      </div>
    </div>
  );
};

export default ProductPreview;
