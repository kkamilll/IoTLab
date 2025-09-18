import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CollectionFiles = () => {
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
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">{collection.name}</h1>

      {/* Files section */}
      {collection.files.length === 0 && <p>No files in this collection.</p>}

      <ul className="space-y-3 mb-6">
        {collection.files.map((file) => (
          <li
            key={file._id}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <button
              onClick={() => handlePreview(file._id)}
              className="text-blue-600 underline"
            >
              {file.name}
            </button>
            <button
              onClick={() => handleDownload(file._id, file.originalName || file.name)}
              className="ml-4 text-green-600 underline"
            >
              Download
            </button>
          </li>
        ))}
      </ul>

      {/* Links section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Links:</h2>
        {collection.links.length === 0 ? (
          <p>No links in this collection.</p>
        ) : (
          <ul className="space-y-2">
            {collection.links.map((link) => (
              <li key={link._id} className="bg-white p-3 rounded shadow">
                {console.log(link)}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-words"
                >
                  {link.text.length > 50 ? link.text.slice(0, 50) + "…" : link.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Preview */}
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

export default CollectionFiles;
