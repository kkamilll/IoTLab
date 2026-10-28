import React, { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import apiClient from "../api/apiClient";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/layout/ConfirmModal";
import {
  Folder,
  FolderPlus,
  FolderOpen,
  FileText,
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  Check,
  X,
  Globe,
  Search,
  FileUp,
  File,
  Sparkles,
  ArrowRight,
  Info,
  Eye,
  Copy,
} from "lucide-react";

const Components = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "texts" | "files" | "links" | "direct"

  // Multi-expand state for collections
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Creation form state
  const [isCreateOpen, setIsCreateOpen] = useState(true);
  const [newCollection, setNewCollection] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionLogo, setNewCollectionLogo] = useState("");
  const [newCollectionIsDirectLink, setNewCollectionIsDirectLink] = useState(false);
  const [newCollectionDirectUrl, setNewCollectionDirectUrl] = useState("");

  // Edit collection state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingLogo, setEditingLogo] = useState("");
  const [editingIsDirectLink, setEditingIsDirectLink] = useState(false);
  const [editingDirectUrl, setEditingDirectUrl] = useState("");

  // Texts inputs per collection: { [collectionId]: { title: "", content: "" } }
  const [textInputs, setTextInputs] = useState({});
  const [editingText, setEditingText] = useState({
    id: null,
    title: "",
    content: "",
  });

  // Links & Files inputs per collection
  const [linkInputs, setLinkInputs] = useState({});
  const [editingLink, setEditingLink] = useState({
    id: null,
    text: "",
    href: "",
  });
  const [fileInputs, setFileInputs] = useState({});

  // Fetch collections from server
  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/components");
      if (res.data.success) {
        setCollections(res.data.data || []);
      }
    } catch {
      showToast(language === "pl" ? "Błąd pobierania kolekcji" : "Error fetching collections", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Filter collections by search and filterType
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Type filter
      if (filterType === "texts" && (!c.texts || c.texts.length === 0)) return false;
      if (filterType === "files" && (!c.files || c.files.length === 0)) return false;
      if (filterType === "links" && (!c.links || c.links.length === 0)) return false;
      if (filterType === "direct" && !c.isDirectLink) return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchDirect = c.directUrl?.toLowerCase().includes(q);
      const matchText = c.texts?.some((t) => t.title?.toLowerCase().includes(q) || t.content?.toLowerCase().includes(q));
      const matchFile = c.files?.some((f) => f.name?.toLowerCase().includes(q));
      const matchLink = c.links?.some((l) => l.text?.toLowerCase().includes(q) || l.href?.toLowerCase().includes(q));
      return matchName || matchDesc || matchDirect || matchText || matchFile || matchLink;
    });
  }, [collections, searchQuery, filterType]);

  // Expand / Collapse all
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(collections.map((c) => c._id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Add collection
  const addCollection = async (e) => {
    if (e) e.preventDefault();
    if (!newCollection.trim()) {
      showToast(language === "pl" ? "Wpisz nazwę kolekcji" : "Collection name is required", "warning");
      return;
    }

    try {
      const payload = {
        name: newCollection.trim(),
        description: newCollectionDescription.trim(),
        isDirectLink: newCollectionIsDirectLink,
        directUrl: newCollectionIsDirectLink ? newCollectionDirectUrl.trim() : "",
      };
      if (newCollectionLogo.trim()) payload.logo = newCollectionLogo.trim();

      await apiClient.post("/components/create", payload);
      await fetchCollections();

      showToast(language === "pl" ? "Kolekcja została utworzona" : "Collection created", "success");
      setNewCollection("");
      setNewCollectionDescription("");
      setNewCollectionLogo("");
      setNewCollectionIsDirectLink(false);
      setNewCollectionDirectUrl("");
    } catch {
      showToast(t("components.addLinkError") || "Błąd dodawania kolekcji", "error");
    }
  };

  // Delete collection
  const deleteCollection = (collectionId, name) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń kolekcję",
      message:
        language === "pl"
          ? `Czy na pewno chcesz usunąć kolekcję "${name}" wraz ze wszystkimi plikami i linkami?`
          : `Are you sure you want to delete collection "${name}" and all its files/links?`,
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/components/${collectionId}`);
          await fetchCollections();
          setExpandedIds((prev) => {
            const next = new Set(prev);
            next.delete(collectionId);
            return next;
          });
          showToast(language === "pl" ? "Kolekcja usunięta" : "Collection deleted", "success");
        } catch {
          showToast(t("components.deleteCollectionError") || "Błąd usuwania kolekcji", "error");
        }
      },
    });
  };

  // Edit collection
  const editCollection = async (collectionId) => {
    if (!editingName.trim()) {
      showToast(language === "pl" ? "Nazwa nie może być pusta" : "Name cannot be empty", "warning");
      return;
    }

    try {
      const payload = {
        name: editingName.trim(),
        description: editingDescription.trim(),
        isDirectLink: editingIsDirectLink,
        directUrl: editingIsDirectLink ? editingDirectUrl.trim() : "",
      };
      if (editingLogo.trim()) payload.logo = editingLogo.trim();

      await apiClient.patch(`/components/${collectionId}`, payload);
      await fetchCollections();

      setEditingId(null);
      setEditingName("");
      setEditingDescription("");
      setEditingLogo("");
      setEditingIsDirectLink(false);
      setEditingDirectUrl("");
      showToast(language === "pl" ? "Kolekcja zaktualizowana" : "Collection updated", "success");
    } catch {
      showToast(t("components.editCollectionError") || "Błąd edycji kolekcji", "error");
    }
  };

  // Add link
  const addLink = async (collectionId) => {
    const input = linkInputs[collectionId];
    if (!input?.text?.trim() || !input?.href?.trim()) {
      showToast(language === "pl" ? "Podaj etykietę oraz poprawny adres URL" : "Label and URL are required", "warning");
      return;
    }

    let href = input.href.trim();
    if (!/^https?:\/\//i.test(href) && !href.startsWith("/")) {
      href = "https://" + href;
    }

    try {
      await apiClient.post(`/components/${collectionId}/links`, {
        text: input.text.trim(),
        href,
      });
      await fetchCollections();

      setLinkInputs((prev) => ({
        ...prev,
        [collectionId]: { text: "", href: "" },
      }));
      showToast(language === "pl" ? "Link został dodany" : "Link added", "success");
    } catch {
      showToast(t("components.addLinkError") || "Błąd dodawania linku", "error");
    }
  };

  // Save edited link
  const saveLink = async (collectionId) => {
    if (!editingLink.text?.trim() || !editingLink.href?.trim()) {
      showToast(t("components.linkTextRequired") || "Wymagana nazwa i link", "warning");
      return;
    }

    let href = editingLink.href.trim();
    if (!/^https?:\/\//i.test(href) && !href.startsWith("/")) {
      href = "https://" + href;
    }

    try {
      await apiClient.put(`/components/${collectionId}/links/${editingLink.id}`, {
        text: editingLink.text.trim(),
        href,
      });
      await fetchCollections();
      setEditingLink({ id: null, text: "", href: "" });
      showToast(language === "pl" ? "Link zaktualizowany" : "Link updated", "success");
    } catch {
      showToast(t("components.saveLinkError") || "Błąd zapisu linku", "error");
    }
  };

  // Delete link
  const deleteLink = (collectionId, linkId, linkText) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń link",
      message:
        language === "pl"
          ? `Czy na pewno chcesz usunąć link "${linkText}"?`
          : `Are you sure you want to delete link "${linkText}"?`,
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/components/${collectionId}/links/${linkId}`);
          await fetchCollections();
          showToast(language === "pl" ? "Link usunięty" : "Link deleted", "success");
        } catch {
          showToast(t("components.deleteLinkError") || "Błąd usuwania linku", "error");
        }
      },
    });
  };

  // Add / Upload file
  const addFile = async (collectionId) => {
    const file = fileInputs[collectionId];
    if (!file) {
      showToast(language === "pl" ? "Wybierz plik z dysku przed wysłaniem" : "Select a file first", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiClient.post(`/components/${collectionId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchCollections();
      setFileInputs((prev) => ({ ...prev, [collectionId]: null }));
      showToast(language === "pl" ? "Plik przesłany pomyślnie" : "File uploaded", "success");
    } catch {
      showToast(t("components.uploadError") || "Błąd przesyłania pliku", "error");
    }
  };

  // Delete file
  const deleteFile = (collectionId, fileId, fileName) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń plik",
      message:
        language === "pl"
          ? `Czy na pewno chcesz usunąć plik "${fileName}"?`
          : `Are you sure you want to delete file "${fileName}"?`,
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/components/${collectionId}/files/${fileId}`);
          await fetchCollections();
          showToast(language === "pl" ? "Plik usunięty" : "File deleted", "success");
        } catch {
          showToast(t("components.deleteFileError") || "Błąd usuwania pliku", "error");
        }
      },
    });
  };

  // Add text
  const addText = async (collectionId) => {
    const input = textInputs[collectionId];
    if (!input?.title?.trim()) {
      showToast(language === "pl" ? "Podaj tytuł tekstu" : "Text title is required", "warning");
      return;
    }

    try {
      await apiClient.post(`/components/${collectionId}/texts`, {
        title: input.title.trim(),
        content: input.content ? input.content.trim() : "",
      });
      await fetchCollections();

      setTextInputs((prev) => ({
        ...prev,
        [collectionId]: { title: "", content: "" },
      }));
      showToast(language === "pl" ? "Wpis tekstowy został dodany" : "Text entry added", "success");
    } catch {
      showToast(language === "pl" ? "Błąd dodawania tekstu" : "Error adding text", "error");
    }
  };

  // Save edited text
  const saveText = async (collectionId) => {
    if (!editingText.title?.trim()) {
      showToast(language === "pl" ? "Tytuł nie może być pusty" : "Title cannot be empty", "warning");
      return;
    }

    try {
      await apiClient.put(`/components/${collectionId}/texts/${editingText.id}`, {
        title: editingText.title.trim(),
        content: editingText.content ? editingText.content.trim() : "",
      });
      await fetchCollections();
      setEditingText({ id: null, title: "", content: "" });
      showToast(language === "pl" ? "Tekst został zaktualizowany" : "Text updated", "success");
    } catch {
      showToast(language === "pl" ? "Błąd zapisu tekstu" : "Error saving text", "error");
    }
  };

  // Delete text
  const deleteText = (collectionId, textId, textTitle) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń tekst",
      message:
        language === "pl"
          ? `Czy na pewno chcesz usunąć wpis tekstowy "${textTitle}"?`
          : `Are you sure you want to delete text "${textTitle}"?`,
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/components/${collectionId}/texts/${textId}`);
          await fetchCollections();
          showToast(language === "pl" ? "Tekst usunięty" : "Text deleted", "success");
        } catch {
          showToast(language === "pl" ? "Błąd usuwania tekstu" : "Error deleting text", "error");
        }
      },
    });
  };

  return (
    <div className="w-full min-h-full flex flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-slate-50/40 dark:bg-slate-950/20 overflow-x-hidden">
        {/* Page Header */}
        <PageHeader
          title={"📁 " + (t("components.title") || "Kolekcje Komponentów i Dokumenty")}
          subtitle={t("components.subtitle") || "Organizuj linki, załączniki i pliki dla każdej kolekcji komponentów"}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs transition cursor-pointer"
              title="Rozwiń wszystkie kolekcje"
            >
              <ChevronDown size={13} className="text-slate-400" />
              <span className="hidden sm:inline">{language === "pl" ? "Rozwiń wszystko" : "Expand all"}</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-2xs transition cursor-pointer"
              title="Zwiń wszystkie kolekcje"
            >
              <ChevronRight size={13} className="text-slate-400" />
              <span className="hidden sm:inline">{language === "pl" ? "Zwiń wszystko" : "Collapse all"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus size={14} />
              <span>{isCreateOpen ? (language === "pl" ? "Schowaj formularz" : "Hide Form") : (language === "pl" ? "Nowa kolekcja" : "New Collection")}</span>
            </button>
          </div>
        </PageHeader>

        {/* Collapsible Create New Collection Card */}
        {isCreateOpen && (
          <form
            onSubmit={addCollection}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col gap-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FolderPlus size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("components.createNewCollection") || "Utwórz nową kolekcję"}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {language === "pl" ? "Dodaj grupę komponentów dla laboratorium" : "Add laboratory resource group"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              {/* Collection Name */}
              <div className="md:col-span-6 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t("components.collectionName") || "Nazwa kolekcji"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    value={newCollection}
                    onChange={(e) => setNewCollection(e.target.value.slice(0, 50))}
                    placeholder="e.g. Mikrokontrolery, Sensory i Moduły, Arduino..."
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium shadow-2xs"
                  />
                  <div className="absolute right-3 top-3 text-[10px] text-slate-400 pointer-events-none font-semibold">
                    {newCollection.length}/50
                  </div>
                </div>
              </div>

              {/* Logo / Emoji */}
              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {language === "pl" ? "Logo / Emoji" : "Logo / Emoji"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={newCollectionLogo}
                    onChange={(e) => setNewCollectionLogo(e.target.value.slice(0, 10))}
                    placeholder="np. 📟, 📡, 🍓, ⚡"
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium shadow-2xs"
                  />
                  {newCollectionLogo.trim() && (
                    <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {newCollectionLogo}
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={!newCollection.trim()}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>{t("common.add") || "Dodaj"}</span>
                </button>
              </div>
            </div>

            {/* Optional Description / Introduction */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {language === "pl" ? "Opis / Notatka kolekcji (opcjonalnie)" : "Description / Collection Notes (optional)"}
              </label>
              <textarea
                rows={2}
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder={t("components.collectionDescPlaceholder") || "Wpisz krótki opis, przeznaczenie lub zasady korzystania z tej kolekcji..."}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-normal resize-none shadow-2xs"
              />
            </div>

            {/* Direct Link Options Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
              <label
                onClick={() => setNewCollectionIsDirectLink(!newCollectionIsDirectLink)}
                className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <div
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    newCollectionIsDirectLink ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      newCollectionIsDirectLink ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
                <span>{t("components.directLinkCheckbox") || "Bezpośredni link (przekierowanie po kliknięciu)"}</span>
              </label>

              {newCollectionIsDirectLink && (
                <div className="flex-1 animate-in fade-in duration-150">
                  <input
                    value={newCollectionDirectUrl}
                    onChange={(e) => setNewCollectionDirectUrl(e.target.value)}
                    placeholder="https://example.com lub /guest-products..."
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 text-xs bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs font-medium"
                  />
                </div>
              )}
            </div>
          </form>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "pl" ? "Szukaj w kolekcjach, tekstach, plikach lub linkach..." : "Search collections, texts, files, or links..."}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium shadow-2xs transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                filterType === "all"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {language === "pl" ? "Wszystkie" : "All"} ({collections.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("texts")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                filterType === "texts"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {language === "pl" ? "Z tekstami" : "With Texts"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("files")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                filterType === "files"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {language === "pl" ? "Z plikami" : "With Files"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("links")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                filterType === "links"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {language === "pl" ? "Z linkami" : "With Links"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("direct")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                filterType === "direct"
                  ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {language === "pl" ? "Przekierowania" : "Direct"}
            </button>
          </div>
        </div>

        {/* Collections Accordion List */}
        <div className="flex flex-col gap-3 pb-12">
          {loading ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin w-8 h-8 rounded-full border-3 border-indigo-500 border-t-transparent" />
              <p className="text-xs font-semibold text-slate-400">
                {language === "pl" ? "Ładowanie kolekcji..." : "Loading collections..."}
              </p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                <Folder size={26} />
              </div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                {searchQuery
                  ? (language === "pl" ? "Brak kolekcji pasujących do wyszukiwania" : "No matching collections")
                  : (t("components.noCollections") || "Brak kolekcji")}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md">
                {searchQuery
                  ? (language === "pl" ? "Spróbuj zmienić zapytanie lub wyczyścić filtry." : "Try clearing filters.")
                  : (t("components.noCollectionsDesc") || "Dodaj kolekcję powyżej, aby zacząć organizować pliki i linki.")}
              </p>
            </div>
          ) : (
            filteredCollections.map((collection) => {
              const isExpanded = expandedIds.has(collection._id);
              const isEditing = editingId === collection._id;
              const textsCount = collection.texts?.length || 0;
              const filesCount = collection.files?.length || 0;
              const linksCount = collection.links?.length || 0;

              return (
                <div
                  key={collection._id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-200 shadow-xs overflow-hidden ${
                    isExpanded
                      ? "border-indigo-300/80 dark:border-indigo-800/80 shadow-md ring-1 ring-indigo-500/10"
                      : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                    {isEditing ? (
                      /* Inline Edit Mode */
                      <div className="flex-1 flex flex-col gap-3 py-1">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value.slice(0, 50))}
                            className="sm:col-span-8 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder={t("components.collectionName") || "Nazwa kolekcji"}
                          />
                          <input
                            value={editingLogo}
                            onChange={(e) => setEditingLogo(e.target.value.slice(0, 10))}
                            className="sm:col-span-4 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder={t("components.logoString") || "Logo / Emoji"}
                          />
                        </div>

                        {/* Optional Description in Edit */}
                        <textarea
                          rows={2}
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          placeholder={t("components.collectionDescPlaceholder") || "Opis kolekcji (opcjonalnie)..."}
                          className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-normal resize-none shadow-2xs"
                        />

                        {/* Direct Link toggle in Edit */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                          <label
                            onClick={() => setEditingIsDirectLink(!editingIsDirectLink)}
                            className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            <input
                              type="checkbox"
                              checked={editingIsDirectLink}
                              onChange={() => {}} // handled by label onClick
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span>{t("components.directLinkCheckbox") || "Bezpośredni link"}</span>
                          </label>
                          {editingIsDirectLink && (
                            <input
                              value={editingDirectUrl}
                              onChange={(e) => setEditingDirectUrl(e.target.value)}
                              placeholder="https://... lub /guest-products"
                              className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingName("");
                              setEditingDescription("");
                              setEditingLogo("");
                              setEditingIsDirectLink(false);
                              setEditingDirectUrl("");
                            }}
                            className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-650 dark:text-slate-300 rounded-xl transition cursor-pointer"
                          >
                            {t("common.cancel") || "Anuluj"}
                          </button>
                          <button
                            type="button"
                            onClick={() => editCollection(collection._id)}
                            className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <Check size={14} />
                            <span>{t("common.save") || "Zapisz"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Mode */
                      <>
                        <div
                          onClick={() => toggleExpand(collection._id)}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none group/title"
                        >
                          {/* Chevron Toggle */}
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition shrink-0">
                            <ChevronRight
                              size={15}
                              className={`transition-transform duration-200 ${isExpanded ? "rotate-90 text-indigo-600 dark:text-indigo-400" : ""}`}
                            />
                          </div>

                          {/* Logo or Folder Icon */}
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs">
                            {collection.logo ? collection.logo : <Folder size={20} />}
                          </div>

                          {/* Title and Badges */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition truncate">
                                {collection.name}
                              </span>

                              {collection.isDirectLink && (
                                <a
                                  href={collection.directUrl || "#"}
                                  target={collection.directUrl?.startsWith("http") ? "_blank" : "_self"}
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/50 hover:underline shrink-0"
                                  title={collection.directUrl}
                                >
                                  <Globe size={11} />
                                  <span className="truncate max-w-[150px]">{collection.directUrl || "Link"}</span>
                                  <ExternalLink size={9} />
                                </a>
                              )}
                            </div>

                            {/* Optional Description preview */}
                            {collection.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-xl">
                                {collection.description}
                              </p>
                            )}

                            {/* Subtitle / Counts */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                              <span className="flex items-center gap-1">
                                <FileText size={12} className="text-indigo-500" />
                                <span>{textsCount} {language === "pl" ? "tekstów" : "texts"}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <File size={12} className="text-emerald-500" />
                                <span>{filesCount} {language === "pl" ? "plików" : "files"}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Link2 size={12} className="text-blue-500" />
                                <span>{linksCount} {language === "pl" ? "linków" : "links"}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Public Preview Button */}
                          <NavLink
                            to={`/components/${collection._id}`}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                            title={language === "pl" ? "Zobacz stronę kolekcji" : "Preview collection page"}
                          >
                            <Eye size={15} />
                          </NavLink>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(collection._id);
                              setEditingName(collection.name);
                              setEditingDescription(collection.description || "");
                              setEditingLogo(collection.logo || "");
                              setEditingIsDirectLink(Boolean(collection.isDirectLink));
                              setEditingDirectUrl(collection.directUrl || "");
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title={t("common.edit") || "Edytuj"}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCollection(collection._id, collection.name)}
                            className="p-2 rounded-xl text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                            title={t("common.delete") || "Usuń"}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Expanded Content Drawer */}
                  {isExpanded && !isEditing && (
                    <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-6 flex flex-col gap-6 w-full min-w-0 max-w-full overflow-hidden animate-in slide-in-from-top-2 duration-150">
                      <div className="flex flex-col gap-5 w-full min-w-0">
                        {/* Section 1: Texts & Notes */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xs w-full min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <FileText className="text-indigo-500" size={15} />
                              <span>{t("components.texts") || (language === "pl" ? "Teksty i notatki" : "Texts & Notes")}</span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                ({textsCount})
                              </span>
                            </span>
                          </div>

                          {/* Texts List */}
                          {collection.texts?.length > 0 ? (
                            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                              {collection.texts.map((textItem) => (
                                <div
                                  key={textItem._id}
                                  className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800/60 transition group/text w-full min-w-0"
                                >
                                  {editingText.id === textItem._id ? (
                                    /* Inline Edit Text Form */
                                    <div className="flex flex-col gap-2.5 w-full min-w-0">
                                      <input
                                        className="border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full min-w-0"
                                        value={editingText.title}
                                        onChange={(e) =>
                                          setEditingText((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                          }))
                                        }
                                        placeholder={t("components.textTitlePlaceholder") || "Tytuł wpisu"}
                                      />
                                      <textarea
                                        rows={3}
                                        className="border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-normal focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none w-full min-w-0"
                                        value={editingText.content}
                                        onChange={(e) =>
                                          setEditingText((prev) => ({
                                            ...prev,
                                            content: e.target.value,
                                          }))
                                        }
                                        placeholder={t("components.textContentPlaceholder") || "Treść notatki lub instrukcji..."}
                                      />
                                      <div className="flex items-center gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setEditingText({ id: null, title: "", content: "" })}
                                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 text-xs font-semibold transition cursor-pointer"
                                        >
                                          {t("common.cancel") || "Anuluj"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => saveText(collection._id)}
                                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                                        >
                                          <Check size={12} />
                                          <span>{t("common.save") || "Zapisz"}</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Normal Text Row */
                                    <>
                                      <div className="flex items-start justify-between gap-3 w-full min-w-0">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                                            <FileText size={13} />
                                          </div>
                                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate break-words">
                                            {textItem.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditingText({
                                                id: textItem._id,
                                                title: textItem.title,
                                                content: textItem.content || "",
                                              })
                                            }
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                                            title={t("common.edit") || "Edytuj"}
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => deleteText(collection._id, textItem._id, textItem.title)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                            title={t("common.delete") || "Usuń"}
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                      {textItem.content && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 pl-9 font-normal break-words whitespace-pre-wrap">
                                          {textItem.content}
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                              {language === "pl" ? "Brak wpisów tekstowych w tej kolekcji." : "No text entries in this collection."}
                            </div>
                          )}

                          {/* Add New Text Form */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 w-full min-w-0">
                            <input
                              className="border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs w-full min-w-0"
                              placeholder={t("components.textTitlePlaceholder") || "Tytuł wpisu (np. Wymagania zasilania)"}
                              value={textInputs[collection._id]?.title || ""}
                              onChange={(e) =>
                                setTextInputs((prev) => ({
                                  ...prev,
                                  [collection._id]: {
                                    ...prev[collection._id],
                                    title: e.target.value,
                                  },
                                }))
                              }
                            />
                            <textarea
                              rows={2}
                              className="border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none shadow-2xs w-full min-w-0"
                              placeholder={t("components.textContentPlaceholder") || "Treść notatki lub opisu (opcjonalnie)..."}
                              value={textInputs[collection._id]?.content || ""}
                              onChange={(e) =>
                                setTextInputs((prev) => ({
                                  ...prev,
                                  [collection._id]: {
                                    ...prev[collection._id],
                                    content: e.target.value,
                                  },
                                }))
                              }
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => addText(collection._id)}
                                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>{t("components.addText") || "Dodaj tekst"}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Attached Files */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xs w-full min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <File className="text-emerald-500" size={15} />
                              <span>{t("components.attachedFiles") || "Załączone pliki"}</span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                ({filesCount})
                              </span>
                            </span>
                          </div>

                          {/* Files List */}
                          {collection.files?.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                              {collection.files.map((file) => {
                                const downloadUrl = `${API_BASE}/${file.path.startsWith("/") ? file.path.slice(1) : file.path}`;
                                return (
                                  <div
                                    key={file._id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition group/file w-full min-w-0"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                                        <File size={15} />
                                      </div>
                                      <a
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 truncate group-hover/file:underline block max-w-full break-all"
                                        title={file.name}
                                      >
                                        {file.name}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <a
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                                        title="Otwórz plik"
                                      >
                                        <ExternalLink size={13} />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => deleteFile(collection._id, file._id, file.name)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                        title={t("common.delete") || "Usuń"}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                              {language === "pl" ? "Brak załączonych plików w tej kolekcji." : "No attached files in this collection."}
                            </div>
                          )}

                          {/* Upload File Zone */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
                            <input
                              type="file"
                              onChange={(e) =>
                                setFileInputs((prev) => ({
                                  ...prev,
                                  [collection._id]: e.target.files[0],
                                }))
                              }
                              className="min-w-0 flex-1 max-w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950/60 dark:file:text-emerald-300 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/60 cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => addFile(collection._id)}
                              disabled={!fileInputs[collection._id]}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <UploadCloud size={14} />
                              <span>{t("components.upload") || "Prześlij"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Section 3: External Links */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xs w-full min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <Link2 className="text-blue-500" size={15} />
                              <span>{t("components.links") || "Przydatne linki"}</span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                ({linksCount})
                              </span>
                            </span>
                          </div>

                          {/* Links List */}
                          {collection.links?.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                              {collection.links.map((link) => (
                                <div
                                  key={link._id}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800/60 transition group/link w-full min-w-0"
                                >
                                  {editingLink.id === link._id ? (
                                    /* Inline Edit Link Form */
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
                                      <input
                                        className="border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs sm:w-1/3 min-w-0 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={editingLink.text}
                                        onChange={(e) =>
                                          setEditingLink((prev) => ({
                                            ...prev,
                                            text: e.target.value,
                                          }))
                                        }
                                        placeholder={t("components.linkText") || "Etykieta"}
                                      />
                                      <input
                                        className="border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs flex-1 min-w-0 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={editingLink.href}
                                        onChange={(e) =>
                                          setEditingLink((prev) => ({
                                            ...prev,
                                            href: e.target.value,
                                          }))
                                        }
                                        placeholder="https://..."
                                      />
                                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                        <button
                                          type="button"
                                          onClick={() => saveLink(collection._id)}
                                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                                          title="Zapisz"
                                        >
                                          <Check size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingLink({ id: null, text: "", href: "" })}
                                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
                                          title="Anuluj"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Normal Link Row */
                                    <>
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
                                          <ExternalLink size={14} />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate block max-w-full group-hover/link:underline"
                                            title={link.text}
                                          >
                                            {link.text}
                                          </a>
                                          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate block max-w-full">
                                            {link.href}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setEditingLink({ id: link._id, text: link.text, href: link.href })}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                                          title={t("common.edit") || "Edytuj"}
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteLink(collection._id, link._id, link.text)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                          title={t("common.delete") || "Usuń"}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                              {language === "pl" ? "Brak dodanych linków w tej kolekcji." : "No links added yet."}
                            </div>
                          )}

                          {/* Add New Link Form */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 w-full min-w-0">
                            <input
                              className="border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs md:w-1/3 min-w-0 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                              placeholder={t("components.linkLabelPlaceholder") || (language === "pl" ? "Etykieta linku (np. Karta katalogowa)" : "Link label")}
                              value={linkInputs[collection._id]?.text || ""}
                              onChange={(e) =>
                                setLinkInputs((prev) => ({
                                  ...prev,
                                  [collection._id]: {
                                    ...prev[collection._id],
                                    text: e.target.value,
                                  },
                                }))
                              }
                            />
                            <input
                              className="border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs flex-1 min-w-0 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                              placeholder="https://..."
                              value={linkInputs[collection._id]?.href || ""}
                              onChange={(e) =>
                                setLinkInputs((prev) => ({
                                  ...prev,
                                  [collection._id]: {
                                    ...prev[collection._id],
                                    href: e.target.value,
                                  },
                                }))
                              }
                            />
                            <button
                              type="button"
                              onClick={() => addLink(collection._id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <Plus size={14} />
                              <span>{t("components.addLink") || "Dodaj link"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Components;
