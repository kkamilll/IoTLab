import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CollectionFiles = () => {
  const navigate = useNavigate();

  const { token } = useAuth();
  const { collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null); // blob URL for preview

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/components/${collectionId}`,
          { headers }
        );
        if (res.data.success) setCollection(res.data.data);
      } catch (err) {
        console.error("Error fetching collection:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [collectionId, token]);

  // Fetch file preview
  const handlePreview = async (fileId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/files/component/${collectionId}/${fileId}`,
        { headers, responseType: "blob" }
      );

      const fileURL = URL.createObjectURL(res.data);
      setSelectedFile(fileURL);
    } catch (err) {
      console.error("Error fetching preview:", err);
      alert("Failed to load file preview.");
    }
  };

  // Download file
  const handleDownload = async (fileId, fileName) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/files/component/${collectionId}/${fileId}`,
        { headers, responseType: "blob" }
      );

      const downloadURL = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = downloadURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadURL);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file.");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!collection) return <p className="text-center mt-10 text-red-500">Collection not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="w-full max-w-4xl flex flex-col gap-6">

        {/* Back + Title */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back
          </button>
          <h1 className="text-3xl font-extrabold text-blue-900 text-center flex-1">
            {collection.name}
          </h1>
          <div className="w-[72px]" /> {/* pusta przestrzeń */}
        </div>

        {/* Files section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Files:</h2>
          {collection.files.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">No files in this category.</p>
          ) : (
            collection.files.map((file) => (
              <div key={file._id} className="border rounded-xl p-4 bg-white flex justify-between items-center shadow hover:shadow-md transition">
                <button
                  onClick={() => handlePreview(file._id)}
                  className="text-blue-600 font-medium underline hover:text-blue-800 transition"
                >
                  {file.name}
                </button>
                <button
                  onClick={() => handleDownload(file._id, file.originalName || file.name)}
                  className="text-green-600 underline hover:text-green-800 transition"
                >
                  Download
                </button>
              </div>
            ))
          )}
        </div>

        {/* Links section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Links:</h2>
          {collection.links.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">No links in this collection.</p>
          ) : (
            collection.links.map((link) => (
              <div key={link._id} className="border rounded-xl p-4 bg-white flex justify-between items-center shadow hover:shadow-md transition over justify-center overflow-hidden">
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-words truncate"
                >
                  {link.text}
                </a>
              </div>
            ))
          )}
        </div>

        {/* Preview */}
        {selectedFile && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Preview:</h2>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-600 underline hover:text-red-800 transition"
              >
                Hide
              </button>
            </div>
            <div className="border rounded-xl shadow overflow-hidden">
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
    </div>
  );
};

export default CollectionFiles;
