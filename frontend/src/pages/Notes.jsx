import React, { useState, useEffect, useRef, useMemo } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/layout/PageHeader";
import Pagination from "../components/layout/Pagination";
import Btn from "../components/layout/Btn";
import ConfirmModal from "../components/layout/ConfirmModal";
import {
  StickyNote,
  Plus,
  AlertTriangle,
  Search,
  RotateCcw,
  User,
  Clock,
  Copy,
  Check,
  Edit2,
  Trash2,
  Pin,
  Sparkles,
  Users,
  Shield,
  GraduationCap,
  X,
  Send,
  MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { pl, enUS } from "date-fns/locale";

const MAX_LENGTH = 500;
const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

/* ── Modern Card Color Themes ─────────────────────────────── */
const NOTE_PALETTES = [
  {
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    border: "border-amber-200/80 dark:border-amber-900/40",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-800",
    accent: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-400",
    headerBg: "bg-amber-100/50 dark:bg-amber-900/30",
  },
  {
    bg: "bg-sky-50/60 dark:bg-sky-950/20",
    border: "border-sky-200/80 dark:border-sky-900/40",
    hoverBorder: "hover:border-sky-300 dark:hover:border-sky-800",
    accent: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-400",
    headerBg: "bg-sky-100/50 dark:bg-sky-900/30",
  },
  {
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    border: "border-emerald-200/80 dark:border-emerald-900/40",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-800",
    accent: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-400",
    headerBg: "bg-emerald-100/50 dark:bg-emerald-900/30",
  },
  {
    bg: "bg-violet-50/60 dark:bg-violet-950/20",
    border: "border-violet-200/80 dark:border-violet-900/40",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-800",
    accent: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-400",
    headerBg: "bg-violet-100/50 dark:bg-violet-900/30",
  },
  {
    bg: "bg-rose-50/60 dark:bg-rose-950/20",
    border: "border-rose-200/80 dark:border-rose-900/40",
    hoverBorder: "hover:border-rose-300 dark:hover:border-rose-800",
    accent: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-400",
    headerBg: "bg-rose-100/50 dark:bg-rose-900/30",
  },
  {
    bg: "bg-indigo-50/60 dark:bg-indigo-950/20",
    border: "border-indigo-200/80 dark:border-indigo-900/40",
    hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-800",
    accent: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-400",
    headerBg: "bg-indigo-100/50 dark:bg-indigo-900/30",
  },
];

/* ── Individual Note Card ─────────────────────────────────── */
const NoteCard = ({
  note,
  palette,
  editingId,
  editingText,
  editingTextareaRef,
  editingImportant,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onDelete,
  onToggleImportant,
  onSetEditingText,
  onSetEditingImportant,
  currentUserId,
  isAdmin,
  copiedId,
  onCopyText,
  dateLocale,
  t,
  language,
}) => {
  const isEditing = editingId === note._id;
  const authorId = note.author?._id || note.author?.id || note.author;
  const canModify = isAdmin || (currentUserId && authorId === currentUserId);
  const isAuthorSelf = currentUserId && authorId === currentUserId;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl border p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        palette.bg
      } ${palette.border} ${palette.hoverBorder} ${
        note.important
          ? "ring-2 ring-rose-400/50 dark:ring-rose-500/30 bg-rose-50/30 dark:bg-rose-950/20"
          : ""
      }`}
    >
      {/* Top Header / Indicators */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {note.important ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300/60 dark:border-rose-900/50 px-2.5 py-0.5 rounded-full shadow-2xs animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              <span>{t("notes.importantBadge")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-0.5 rounded-full">
              <MessageSquare className="w-3 h-3 opacity-60" />
              <span>{language === "pl" ? "Notatka" : "Note"}</span>
            </span>
          )}
          <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
        </div>

        {/* Card Quick Actions: Copy & Pin */}
        <div className="flex items-center gap-1">
          {canModify && !isEditing && (
            <button
              type="button"
              onClick={() => onToggleImportant(note)}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                note.important
                  ? "bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                  : "bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500"
              }`}
              title={
                note.important
                  ? (language === "pl" ? "Odznacz jako ważne" : "Unmark as important")
                  : (language === "pl" ? "Oznacz jako ważne" : "Mark as important")
              }
            >
              <Pin className={`w-3.5 h-3.5 ${note.important ? "fill-current" : ""}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onCopyText(note._id, note.text)}
            className="p-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer shadow-2xs"
            title={t("notes.copy")}
          >
            {copiedId === note._id ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[4.5rem] flex-1">
        {isEditing ? (
          <div className="flex flex-col gap-2.5">
            <textarea
              ref={editingTextareaRef}
              value={editingText}
              onChange={(e) =>
                e.target.value.length <= MAX_LENGTH && onSetEditingText(e.target.value)
              }
              className="w-full rounded-2xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 resize-none transition shadow-inner"
              rows={4}
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onSetEditingImportant(!editingImportant)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  editingImportant
                    ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900/50"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t("notes.markImportant")}</span>
              </button>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                {editingText.length}/{MAX_LENGTH}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap break-words">
            {note.text}
          </p>
        )}
      </div>

      {/* Footer: Author Info & Edit/Delete Actions */}
      <div className="flex items-center justify-between gap-2 pt-3.5 mt-3 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs relative">
            {note.author?.profileImage ? (
              <img
                src={`${API_BASE}/uploads/users/${note.author.profileImage}`}
                alt={note.author.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.classList.remove("hidden");
                  }
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center ${
                note.author?.profileImage ? "hidden" : ""
              }`}
            >
              {(note.author?.name || "A")[0].toUpperCase()}
            </div>
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {note.author?.name || (language === "pl" ? "Anonim" : "Anonymous")}
              </span>
              {isAuthorSelf && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 shrink-0">
                  {language === "pl" ? "Ty" : "You"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              <Clock className="w-3 h-3 shrink-0" />
              <span
                title={format(new Date(note.updatedAt || note.createdAt), "d MMMM yyyy, HH:mm", {
                  locale: dateLocale,
                })}
              >
                {formatDistanceToNow(new Date(note.updatedAt || note.createdAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {canModify && (
          <div className="flex items-center gap-1 shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => onSaveEdit(note._id)}
                  title={t("notes.save")}
                  className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-2xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onCancelEditing}
                  title={t("notes.cancel")}
                  className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onStartEditing(note)}
                  title={t("notes.edit")}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-650 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700 transition shadow-2xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(note._id)}
                  title={t("notes.delete")}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/80 dark:border-slate-700 transition shadow-2xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Notes Component ─────────────────────────────────── */
const Notes = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [text, setText] = useState("");
  const [important, setImportant] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingImportant, setEditingImportant] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "important" | "myNotes"
  const [authorFilter, setAuthorFilter] = useState("");
  const [sortBy, setSortBy] = useState("important_first"); // "important_first" | "newest" | "oldest"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Confirm Modal
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });

  const addTextareaRef = useRef(null);
  const editingTextareaRef = useRef(null);

  const currentUserId = user?._id || user?.id;
  const isAdmin = user?.role === "admin";
  const dateLocale = language === "pl" ? pl : enUS;

  // Auto-resize textarea
  const autoResize = (ref) => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${Math.min(220, ref.current.scrollHeight)}px`;
  };
  useEffect(() => autoResize(addTextareaRef), [text]);
  useEffect(() => autoResize(editingTextareaRef), [editingText]);

  // Fetch notes from API
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/notes");
      if (res.data.success) {
        setNotes(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast(
        language === "pl" ? "Błąd pobierania notatek" : "Error fetching notes",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Add new note
  const handleAddNote = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) {
      showToast(t("notes.emptyWarning"), "warning");
      return;
    }

    setAddLoading(true);
    try {
      const res = await apiClient.post("/notes/create", { text, important });
      if (res.data.success) {
        setNotes((prev) => [res.data.data, ...prev]);
        setText("");
        setImportant(false);
        setIsComposerOpen(false);
        showToast(t("notes.addSuccess"), "success");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || (language === "pl" ? "Błąd dodawania notatki" : "Error adding note"),
        "error"
      );
    } finally {
      setAddLoading(false);
    }
  };

  // Toggle important status directly
  const handleToggleImportant = async (note) => {
    try {
      const updatedImportance = !note.important;
      const res = await apiClient.put(`/notes/${note._id}`, {
        text: note.text,
        important: updatedImportance,
      });
      if (res.data.success) {
        setNotes((prev) =>
          prev.map((n) => (n._id === note._id ? res.data.data : n))
        );
        showToast(t("notes.toggleImportantSuccess"), "success");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || t("notes.editError"),
        "error"
      );
    }
  };

  // Delete note with confirmation
  const handleDeleteNote = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t("notes.deleteConfirmTitle"),
      message: t("notes.deleteConfirm"),
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/notes/${id}`);
          setNotes((prev) => prev.filter((n) => n._id !== id));
          showToast(t("notes.deleteSuccess"), "success");
        } catch (err) {
          showToast(err.response?.data?.message || t("notes.deleteError"), "error");
        }
      },
    });
  };

  // Save inline edit
  const handleSaveEdit = async (id) => {
    if (!editingText.trim()) {
      showToast(t("notes.emptyWarning"), "warning");
      return;
    }

    try {
      const res = await apiClient.put(`/notes/${id}`, {
        text: editingText,
        important: editingImportant,
      });
      if (res.data.success) {
        setNotes((prev) =>
          prev.map((n) => (n._id === id ? res.data.data : n))
        );
        handleCancelEditing();
        showToast(t("notes.editSuccess"), "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || t("notes.editError"), "error");
    }
  };

  const handleStartEditing = (note) => {
    setEditingId(note._id);
    setEditingText(note.text);
    setEditingImportant(note.important || false);
  };

  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingText("");
    setEditingImportant(false);
  };

  // Copy note text to clipboard
  const handleCopyText = (id, textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    showToast(t("notes.copied"), "success");
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  // Calculate unique authors list
  const authors = useMemo(() => {
    const map = new Map();
    notes.forEach((n) => {
      const authorId = n.author?._id || n.author?.id || n.author;
      const authorName = n.author?.name || (language === "pl" ? "Anonim" : "Anonymous");
      if (authorId && !map.has(authorId)) {
        map.set(authorId, authorName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [notes, language]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((n) => {
        const textMatch = n.text?.toLowerCase().includes(query);
        const authorMatch = n.author?.name?.toLowerCase().includes(query);
        return textMatch || authorMatch;
      });
    }

    // Filter Type
    if (filterType === "important") {
      result = result.filter((n) => n.important);
    } else if (filterType === "myNotes") {
      result = result.filter((n) => {
        const authorId = n.author?._id || n.author?.id || n.author;
        return currentUserId && authorId === currentUserId;
      });
    }

    // Specific Author filter
    if (authorFilter) {
      result = result.filter((n) => {
        const authorId = n.author?._id || n.author?.id || n.author;
        return authorId === authorFilter;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "important_first") {
        if (b.important !== a.important) return b.important ? 1 : -1;
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });

    return result;
  }, [notes, searchQuery, filterType, authorFilter, sortBy, currentUserId]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage) || 1;
  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotes.slice(start, start + itemsPerPage);
  }, [filteredNotes, currentPage, itemsPerPage]);

  const isAnyFilterActive =
    searchQuery.trim() !== "" ||
    filterType !== "all" ||
    authorFilter !== "" ||
    sortBy !== "important_first";

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setAuthorFilter("");
    setSortBy("important_first");
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Full width container matching Users, Orders & Notifications */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6 max-w-[1920px] mx-auto">
        {/* Page Header */}
        <PageHeader
          title={"📝 " + t("notes.title")}
          subtitle={t("notes.subtitle")}
        >
          <button
            type="button"
            onClick={() => {
              setIsComposerOpen((prev) => !prev);
              setTimeout(() => addTextareaRef.current?.focus(), 100);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition duration-200 shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
          >
            {isComposerOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>{t("notes.cancel")}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{t("notes.addNoteBtn")}</span>
              </>
            )}
          </button>
        </PageHeader>

        {/* Expandable Composer Panel */}
        {isComposerOpen && (
          <div className="rounded-3xl border border-indigo-200/80 dark:border-indigo-900/50 bg-white dark:bg-slate-900 shadow-md p-5 sm:p-6 transition-all duration-300 animate-in fade-in-50 zoom-in-98">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {t("notes.newNote")}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {language === "pl"
                      ? "Opublikuj ogłoszenie widoczne dla studentów i opiekunów laboratorium"
                      : "Publish notice visible to laboratory students and supervisors"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              ref={addTextareaRef}
              value={text}
              onChange={(e) =>
                e.target.value.length <= MAX_LENGTH && setText(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddNote();
              }}
              placeholder={t("notes.notePlaceholder")}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none min-h-[90px] transition shadow-inner"
              rows={3}
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setImportant(!important)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                    important
                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900/60 shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${important ? "text-rose-600 animate-pulse" : "text-slate-400"}`} />
                  <span>{t("notes.markImportant")}</span>
                </button>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {text.length}/{MAX_LENGTH}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Btn
                  type="button"
                  variant="ghost"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 font-bold"
                >
                  {t("notes.cancel")}
                </Btn>
                <Btn
                  type="button"
                  onClick={handleAddNote}
                  disabled={addLoading || !text.trim()}
                  variant="primary"
                  className="px-5 py-2 font-bold flex items-center gap-1.5"
                >
                  {addLoading ? (
                    <span>{t("notes.adding")}</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t("notes.add")}</span>
                    </>
                  )}
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("notes.searchPlaceholder")}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills and Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setFilterType("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterType === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {language === "pl" ? "Wszystkie" : "All"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType("important");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  filterType === "important"
                    ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>{language === "pl" ? "Tylko ważne" : "Important"}</span>
                {notes.some((n) => n.important) && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
              {currentUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("myNotes");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    filterType === "myNotes"
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {language === "pl" ? "Moje notatki" : "My Notes"}
                </button>
              )}
            </div>

            {/* Author Dropdown */}
            {authors.length > 0 && (
              <select
                value={authorFilter}
                onChange={(e) => {
                  setAuthorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer max-w-[160px] truncate"
              >
                <option value="">{t("notes.allAuthors")}</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="important_first">{language === "pl" ? "Najpierw ważne" : "Important first"}</option>
              <option value="newest">{language === "pl" ? "Najnowsze" : "Newest"}</option>
              <option value="oldest">{language === "pl" ? "Najstarsze" : "Oldest"}</option>
            </select>

            {/* Reset Filters */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                title={language === "pl" ? "Wyczyść filtry" : "Clear filters"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === "pl" ? "Reset" : "Reset"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-bold">
              {language === "pl" ? "Wczytywanie notatek..." : "Loading notes..."}
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center p-14 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 font-medium shadow-sm flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-3xl shadow-inner">
              📝
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                {t("notes.noNotes")}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                {isAnyFilterActive
                  ? t("notes.noNotesHelp")
                  : (language === "pl" ? "Dodaj pierwszą notatkę lub ogłoszenie za pomocą przycisku powyżej." : "Add your first notice using the button above.")}
              </p>
            </div>
            {isAnyFilterActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-xs font-bold transition border border-indigo-200 dark:border-indigo-900/30 cursor-pointer"
              >
                {language === "pl" ? "Zresetuj filtry" : "Reset filters"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsComposerOpen(true);
                  setTimeout(() => addTextareaRef.current?.focus(), 100);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                {t("notes.addNoteBtn")}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedNotes.map((note, idx) => (
              <NoteCard
                key={note._id}
                note={note}
                palette={NOTE_PALETTES[idx % NOTE_PALETTES.length]}
                editingId={editingId}
                editingText={editingText}
                editingTextareaRef={editingTextareaRef}
                editingImportant={editingImportant}
                onStartEditing={handleStartEditing}
                onCancelEditing={handleCancelEditing}
                onSaveEdit={handleSaveEdit}
                onDelete={handleDeleteNote}
                onToggleImportant={handleToggleImportant}
                onSetEditingText={setEditingText}
                onSetEditingImportant={setEditingImportant}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                copiedId={copiedId}
                onCopyText={handleCopyText}
                dateLocale={dateLocale}
                t={t}
                language={language}
              />
            ))}
          </div>
        )}

        {/* Pagination & Counter Footer */}
        {filteredNotes.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <div className="flex items-center gap-2">
              <span>
                {language === "pl" ? "Łącznie notatek:" : "Total notes:"}{" "}
                <strong className="text-slate-800 dark:text-slate-200">{filteredNotes.length}</strong>
              </span>
              <span className="opacity-40">•</span>
              <span>
                {language === "pl" ? "Strona" : "Page"}{" "}
                <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong>{" "}
                {language === "pl" ? "z" : "of"}{" "}
                <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">{language === "pl" ? "Na stronę:" : "Per page:"}</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={18}>18</option>
                </select>
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Notes;
