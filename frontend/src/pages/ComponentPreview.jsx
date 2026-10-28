import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Btn from "../components/layout/Btn";
import {
  ArrowLeft,
  FileText,
  File,
  Link2,
  ExternalLink,
  Download,
  Eye,
  X,
  Copy,
  Check,
  Info,
  Layers,
  Settings,
} from "lucide-react";

const ComponentPreview = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { collectionId } = useParams();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null); // blob URL for preview
  const [previewFileName, setPreviewFileName] = useState("");
  const [copiedTextId, setCopiedTextId] = useState(null);

  const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await apiClient.get(`/components/${collectionId}`);
        if (res.data.success) {
          setCollection(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching collection:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [collectionId]);

  // Fetch file preview
  const handlePreview = async (file) => {
    try {
      const res = await apiClient.get(
        `/files/component/${collectionId}/${file._id}`,
        { responseType: "blob" }
      );
      const fileURL = URL.createObjectURL(res.data);
      setSelectedFile(fileURL);
      setPreviewFileName(file.name);
    } catch (err) {
      console.error("Error fetching preview:", err);
      alert(language === "pl" ? "Nie udało się załadować podglądu pliku." : "Failed to load file preview.");
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

  const handleCopyText = (textId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedTextId(textId);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>{t("guest.loading") || "Ładowanie..."}</span>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t("components.collectionNotFound") || "Nie znaleziono kolekcji."}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            {language === "pl"
              ? "Ta kolekcja mogła zostać usunięta lub zmieniono jej identyfikator."
              : "This collection might have been removed or ID is invalid."}
          </p>
          <Btn onClick={() => navigate(-1)} variant="secondary" className="px-5 py-2 text-xs font-bold gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>{t("common.back") || "Powrót"}</span>
          </Btn>
        </div>
      </div>
    );
  }

  const isAdminOrLecturer = user?.role === "admin" || user?.role === "lecturer";
  const textsList = Array.isArray(collection.texts) ? collection.texts : [];
  const filesList = Array.isArray(collection.files) ? collection.files : [];
  const linksList = Array.isArray(collection.links) ? collection.links : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">

        {/* 1. Top Bar: Consistent Return Button & Manage Shortcut */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Btn
            onClick={() => navigate(-1)}
            variant="secondary"
            className="py-1.5 px-3.5 text-xs font-bold shadow-2xs gap-1.5 inline-flex"
            type="button"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("common.back") || (language === "pl" ? "Powrót" : "Back")}</span>
          </Btn>

          {isAdminOrLecturer && (
            <button
              type="button"
              onClick={() => navigate("/admin-dashboard/components")}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === "pl" ? "Zarządzaj w panelu" : "Manage in Admin"}</span>
            </button>
          )}
        </div>

        {/* 2. Collection Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-xs">
              {collection.logo?.trim() ? collection.logo : <Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                {collection.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                {t("components.exploreFiles") || "Przeglądaj pliki, instrukcje i zasoby w tej kolekcji"}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                {textsList.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{textsList.length} {language === "pl" ? "tekstów" : "texts"}</span>
                  </span>
                )}
                {filesList.length > 0 && (
                  <span className="flex items-center gap-1">
                    <File className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{filesList.length} {language === "pl" ? "plików" : "files"}</span>
                  </span>
                )}
                {linksList.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{linksList.length} {language === "pl" ? "linków" : "links"}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description / Introduction (if present) */}
          {collection.description?.trim() && (
            <div className="mt-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>{collection.description}</span>
            </div>
          )}
        </div>

        {/* 3. Text Notes & Documentation Section */}
        {textsList.length > 0 && (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{t("components.texts") || (language === "pl" ? "Teksty i notatki" : "Texts & Notes")}</span>
                <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                  {textsList.length}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {textsList.map((item) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-800/60 transition flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopyText(item._id, item.content || item.title)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
                      title={language === "pl" ? "Kopiuj do schowka" : "Copy to clipboard"}
                    >
                      {copiedTextId === item._id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{language === "pl" ? "Skopiowano" : "Copied"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>{language === "pl" ? "Kopiuj" : "Copy"}</span>
                        </>
                      )}
                    </button>
                  </div>
                  {item.content && (
                    <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-normal bg-slate-50/70 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Attached Files Section */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <File className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t("components.attachedFiles")?.replace(":", "") || (language === "pl" ? "Załączone pliki" : "Attached Files")}</span>
              <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                {filesList.length}
              </span>
            </h2>
          </div>

          {filesList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
              {t("components.noFilesInCategory") || "Brak plików w tej kolekcji."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filesList.map((file) => (
                <div
                  key={file._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-800/60 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                      <File className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" title={file.name}>
                      {file.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePreview(file)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                      title={t("components.preview") || "Podgląd"}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(file._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                      title={t("components.download") || "Pobierz"}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. External Links Section */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{t("components.externalLinks") || (language === "pl" ? "Przydatne linki" : "Useful Links")}</span>
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                {linksList.length}
              </span>
            </h2>
          </div>

          {linksList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
              {t("components.noLinksInCollection") || "Brak linków w tej kolekcji."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {linksList.map((link) => (
                <a
                  key={link._id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-blue-300 dark:hover:border-blue-800/60 hover:shadow-sm transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30 group-hover:scale-105 transition-transform">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {link.text}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {link.href.replace(/^https?:\/\//i, "")}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 6. Embedded File Preview Modal / Container */}
        {selectedFile && (
          <div className="mt-4 flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {previewFileName || (t("components.preview") || "Podgląd")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={t("components.hide") || "Zamknij"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-950/5 dark:bg-slate-950/40">
              <embed
                src={selectedFile}
                type="application/pdf"
                width="100%"
                height="600px"
                className="w-full h-[550px] sm:h-[650px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentPreview;
