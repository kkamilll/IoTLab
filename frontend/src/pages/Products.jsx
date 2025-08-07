import React, { useEffect, useState } from "react";
import axios from "axios";

const Products = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:3500/products", {
        headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` },
      });

      if (res.data.success) {
        setProducts(res.data.data);         // Zmienione z res.data.products na res.data.data
        setFilteredProducts(res.data.data); // Tak samo tutaj
      } else {
        alert(res.data.message || "Error fetching products");
      }
    } catch (err) {
      console.error("fetchProducts error:", err);
      alert("Server error – check console");
    }
  };

  const addProduct = async () => {
    const res = await axios.post(
      "http://localhost:3500/products",
      formData,
      { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
    );
    return res.data;
  };

  const updateProduct = async () => {
    const res = await axios.put(
      `http://localhost:3500/products/${editProduct}`,
      formData,
      { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
    );
    return res.data;
  };

  const deleteProduct = async (id) => {
    const res = await axios.delete(
      `http://localhost:3500/api/products/${id}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
    );
    return res.data;
  };

  const handleEdit = (product) => {
    setOpenModal(true);
    setEditProduct(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
    });
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    const val = e.target.value.toLowerCase();
    setFilteredProducts(
      products.filter((p) => p.name.toLowerCase().includes(val))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = editProduct ? await updateProduct() : await addProduct();
      if (data.success) {
        alert(editProduct ? "Product updated" : "Product added");
        fetchProducts();
        closeModal();
      } else {
        alert(data.message || "Operation failed");
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      alert("Server error – check console");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const data = await deleteProduct(id);
      if (data.success) {
        alert("Product deleted");
        fetchProducts();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      console.error("handleDelete error:", err);
      alert("Server error – check console");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Product Management</h1>

      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search"
          className="border p-1 bg-white rounded px-4"
          onChange={handleSearch}
        />
        <button
          className="px-4 py-1.5 bg-blue-500 text-white rounded"
          onClick={() => setOpenModal(true)}
        >
          Add Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">#</th>
              <th className="border p-2">Product Name</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Stock</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No records
                </td>
              </tr>
            ) : (
              filteredProducts.map((p, i) => (
                <tr key={p._id}>
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2">{p.name}</td>
                  <td className="border p-2">{p.description}</td>
                  <td className="border p-2">{p.price}</td>
                  <td className="border p-2">
                    <span className="rounded-full font-semibold">
                      {p.stock === 0 ? (
                        <span className="bg-red-100 text-red-500 px-2 py-1 rounded-full">{p.stock}</span>
                      ) : p.stock < 5 ? (
                        <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">{p.stock}</span>
                      ) : (
                        <span className="bg-green-100 text-green-500 px-2 py-1 rounded-full">{p.stock}</span>
                      )}
                    </span>
                  </td>
                  <td className="border p-2">
                    <button
                      className="px-2 py-1 bg-yellow-500 text-white rounded mr-2"
                      onClick={() => handleEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded"
                      onClick={() => handleDelete(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg relative">
            <h2 className="text-xl font-bold">
              {editProduct ? "Edit Product" : "Add Product"}
            </h2>
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-xl font-bold"
            >
              ×
            </button>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Product Name"
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description"
                className="border p-2 rounded"
              />
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Price"
                className="border p-2 rounded"
              />
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                placeholder="Stock"
                className="border p-2 rounded"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  {editProduct ? "Save Changes" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
