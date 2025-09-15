import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CategoryFiles = () => {
  const { token } = useAuth();
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null); // PDF do podglądu

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/components/${categoryId}`,
          { headers }
        );
        if (res.data.success) setCategory(res.data.data);
      } catch (err) {
        console.error("Error fetching category:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [categoryId, token]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!category) return <p className="text-center mt-10 text-red-500">Category not found.</p>;

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">{category.name}</h1>

      {category.files.length === 0 && <p>No files in this category.</p>}

      <ul className="space-y-3 mb-6">
        {category.files.map((file) => {
          // Tworzymy pełny URL do pliku
          const fileURL = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}/${file.path.replace(/^\/+/, '')}`;
          return (
            <li key={file._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <button
                onClick={() => setSelectedFile(fileURL)}
                className="text-blue-600 underline"
              >
                {file.name}
              </button>
              <a
                href={fileURL}
                download
                className="ml-4 text-green-600 underline"
              >
                Download
              </a>
            </li>
          );
        })}
      </ul>

      {selectedFile && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Preview:</h2>
          <div className="border rounded shadow">
            <embed
              src={selectedFile}
              type="application/pdf"
              width="100%"
              height="600px"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryFiles;