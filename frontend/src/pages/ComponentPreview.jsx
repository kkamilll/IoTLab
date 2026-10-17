import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const CollectionFiles = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { token } = useAuth();
  const { collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null); // blob URL for preview

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await apiClient.get(`/components/${collectionId}`);
        if (res.data.success) setCollection(res.data.data);
      } catch (err) {
        console.error("Error fetching collection:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [collectionId]);

  // Fetch file preview
  const handlePreview = async (fileId) => {
    try {
      const res = await apiClient.get(
        `/files/component/${collectionId}/${fileId}`,
        { responseType: "blob" }
      );

      const fileURL = URL.createObjectURL(res.data);
      setSelectedFile(fileURL);
    } catch (err) {
      console.error("Error fetching preview:", err);
      alert("Failed to load file preview.");
    }
  };

  // Download file
  const handleDownload = (fileId) => {
    const baseURL = apiClient.defaults.baseURL || "";
    const link = document.createElement("a");
    link.href = `${baseURL}/files/component/${collectionId}/${fileId}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) return <div className="text-center mt-10 text-slate-500 font-medium">{t("guest.loading") || "Loading..."}</div>;
  if (!collection) return <div className="text-center mt-10 text-red-500 font-semibold">{t("components.collectionNotFound") || "Collection not found."}</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">

        {/* Back + Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-sm transition font-semibold text-sm self-start"
          >
            {t("components.backHome")}
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 text-center sm:text-left">
              {collection.name}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 text-center sm:text-left">
              {t("components.exploreFiles")}
            </p>
          </div>
          <div className="w-[1px]" />
        </div>

        {/* Files section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-800">{t("components.attachedFiles")}</h2>
          {collection.files.length === 0 ? (
            <p className="text-center text-slate-400 mt-2 select-none italic text-sm">{t("components.noFilesInCategory")}</p>
          ) : (
            <div className="grid gap-3">
              {collection.files.map((file) => (
                <div key={file._id} className="border border-slate-200 rounded-2xl p-4 bg-white flex justify-between items-center shadow-sm hover:shadow-md transition">
                  <button
                    onClick={() => handlePreview(file._id)}
                    className="text-indigo-600 font-semibold hover:text-indigo-700 transition"
                  >
                    📄 {file.name}
                  </button>
                  <button
                    onClick={() => handleDownload(file._id)}
                    className="text-emerald-600 font-semibold hover:text-emerald-700 transition"
                  >
                    {t("components.download")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links section */}
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-xl font-bold text-slate-800">{t("components.addLink")}:</h2>
          {collection.links.length === 0 ? (
            <p className="text-center text-slate-400 mt-2 select-none italic text-sm">{t("components.noLinksInCollection")}</p>
          ) : (
            <div className="grid gap-3">
              {collection.links.map((link) => (
                <div key={link._id} className="border border-slate-200 rounded-2xl p-4 bg-white flex justify-between items-center shadow-sm hover:shadow-md transition over justify-center overflow-hidden">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 font-semibold hover:text-indigo-700 transition break-all truncate"
                  >
                    🔗 {link.text}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {selectedFile && (
          <div className="mt-8 flex flex-col gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">{t("components.preview")}:</h2>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-500 font-semibold hover:text-red-600 transition"
              >
                {t("components.hide")}
              </button>
            </div>
            <div className="border border-slate-200 rounded-2xl shadow-inner overflow-hidden">
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
