import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/layout/PageHeader";
import Btn from "../components/layout/Btn";
import ConfirmModal from "../components/layout/ConfirmModal";

const MAX_LENGTH = 500;
const NOTES_PER_PAGE = 6;

/* ── colour palette for note cards ─────────────────────────────── */
const NOTE_PALETTES = [
  { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900/50", dot: "bg-amber-400" },
  { bg: "bg-sky-50 dark:bg-sky-950/20", border: "border-sky-200 dark:border-sky-900/50", dot: "bg-sky-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-900/50", dot: "bg-emerald-400" },
  { bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-200 dark:border-violet-900/50", dot: "bg-violet-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-200 dark:border-rose-900/50", dot: "bg-rose-400" },
];

const fmt = (d) =>
  new Date(d).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "short", timeStyle: "short" });

/* ── NoteCard ───────────────────────────────────────────────────── */
const NoteCard = ({
  note, palette,
  editingId, editingText, editingTextareaRef, editingImportant,
  onStartEditing, onCancelEditing, onSaveEdit, onDelete,
  onSetEditingText, onSetEditingImportant,
}) => {
  const { user } = useAuth();
  const isEditing = editingId === note._id;
  const canEditOrDelete = user && (user.role === "admin" || note.author?._id === user.id || note.author === user.id);

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-3xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${palette.bg} ${palette.border} ${note.important ? "ring-2 ring-rose-400/40 dark:ring-rose-500/30" : ""}`}
      style={{ animation: "toastIn 0.25s ease-out both" }}
    >
      {/* Top-right indicators */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        {note.important && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 px-2 py-0.5 rounded-full">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Ważne
          </span>
        )}
        <span className={`w-2.5 h-2.5 rounded-full ${palette.dot}`} />
      </div>

      {/* Content */}
      <div className="pr-20 min-h-[3rem]">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={editingTextareaRef}
              value={editingText}
              onChange={(e) => e.target.value.length <= MAX_LENGTH && onSetEditingText(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 resize-none transition"
              rows={4}
            />
            <div className="flex items-center gap-2">
              <Btn
                type="button"
                variant={editingImportant ? "danger" : "danger-outline"}
                onClick={() => onSetEditingImportant(!editingImportant)}
                className="py-1.5 px-3"
              >
                ⚠️ Ważne
              </Btn>
              <span className="text-xs text-slate-400 ml-auto">{editingText.length}/{MAX_LENGTH}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap break-words">
            {note.text}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between gap-2 pt-3 border-t border-black/5 dark:border-white/5">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{note.author?.name || "Anonim"}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{fmt(note.updatedAt || note.createdAt)}</p>
        </div>
        {canEditOrDelete && (
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button onClick={() => onSaveEdit(note._id)} title="Zapisz" className="p-2 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button onClick={onCancelEditing} title="Anuluj" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onStartEditing(note)} title="Edytuj" className="p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-indigo-650 dark:text-indigo-450 transition cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => onDelete(note._id)} title="Usuń" className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 dark:text-rose-400 transition cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [important, setImportant] = useState(false);
  const [editingImportant, setEditingImportant] = useState(false);
  const [authorFilter, setAuthorFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });
  const { token } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const addTextareaRef = useRef(null);
  const editingTextareaRef = useRef(null);

  const autoResize = (ref) => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  };
  useEffect(() => autoResize(addTextareaRef), [text]);
  useEffect(() => autoResize(editingTextareaRef), [editingText]);

  const sortNotes = (arr) =>
    [...arr].sort((a, b) => {
      if (b.important !== a.important) return b.important - a.important;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

  const fetchNotes = async () => {
    try {
      const res = await apiClient.get("/notes");
      if (res.data.success) setNotes(sortNotes(res.data.data));
    } catch (err) {
      console.error(err);
      showToast(language === "pl" ? "Błąd pobierania notatek" : "Error fetching notes", "error");
    }
  };
  useEffect(() => { fetchNotes(); }, [token]);

  const addNote = async () => {
    if (!text.trim()) { showToast(t("notes.emptyWarning"), "warning"); return; }
    try {
      setLoading(true);
      const res = await apiClient.post("/notes/create", { text, important });
      if (res.data.success) {
        setNotes((prev) => sortNotes([...prev, res.data.data]));
        setText(""); setImportant(false);
        showToast(language === "pl" ? "Notatka dodana!" : "Note added!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || (language === "pl" ? "Błąd dodawania notatki" : "Error adding note"), "error");
    } finally { setLoading(false); }
  };

  const deleteNote = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń",
      message: t("notes.deleteConfirm") || "Usunąć tę notatkę?",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/notes/${id}`);
          setNotes((prev) => prev.filter((n) => n._id !== id));
          showToast(t("notes.deleteSuccess"), "success");
        } catch (err) {
          showToast(err.response?.data?.message || t("notes.deleteError"), "error");
        }
      }
    });
  };

  const saveEdit = async (id) => {
    if (!editingText.trim()) { showToast(t("notes.emptyWarning"), "warning"); return; }
    try {
      const res = await apiClient.put(`/notes/${id}`, { text: editingText, important: editingImportant });
      if (res.data.success) {
        setNotes((prev) => sortNotes([...prev.filter((n) => n._id !== id), res.data.data]));
        cancelEditing();
        showToast(t("notes.editSuccess"), "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || t("notes.editError"), "error");
    }
  };

  const startEditing = (note) => { setEditingId(note._id); setEditingText(note.text); setEditingImportant(note.important || false); };
  const cancelEditing = () => { setEditingId(null); setEditingText(""); setEditingImportant(false); };


  const authors = Array.from(new Set(notes.map((n) => n.author?.name || (language === "pl" ? "Anonim" : "Anonymous")).filter(Boolean)));
  const filteredNotes = authorFilter ? notes.filter((n) => (n.author?.name || (language === "pl" ? "Anonim" : "Anonymous")) === authorFilter) : notes;

  const totalPages = Math.ceil(filteredNotes.length / NOTES_PER_PAGE);
  const paginatedNotes = filteredNotes.slice((currentPage - 1) * NOTES_PER_PAGE, currentPage * NOTES_PER_PAGE);

  const cardProps = {
    editingId,
    editingText,
    editingTextareaRef,
    editingImportant,
    onStartEditing: startEditing,
    onCancelEditing: cancelEditing,
    onSaveEdit: saveEdit,
    onDelete: deleteNote,
    onSetEditingText: setEditingText,
    onSetEditingImportant: setEditingImportant
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10 flex flex-col transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">

        {/* Header */}
        <PageHeader
          title={"📝 " + t("nav.notes")}
          subtitle={language === "pl" ? "Ogłoszenia i notatki dla użytkowników laboratorium" : "Announcements and notes for laboratory users"}
        >
          {authors.length > 0 && (
            <select
              value={authorFilter}
              onChange={(e) => { setAuthorFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3.5 pr-9 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer w-full sm:w-52"
            >
              <option value="">{t("notes.allAuthors")}</option>
              {authors.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
        </PageHeader>

        {/* Add note panel */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t("notes.newNote")}</p>
          <textarea
            ref={addTextareaRef}
            value={text}
            onChange={(e) => e.target.value.length <= MAX_LENGTH && setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote(); }}
            placeholder={t("notes.notePlaceholder")}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 focus:border-indigo-400 resize-none min-h-[80px] overflow-hidden transition"
            rows={2}
          />
          <div className="flex items-center gap-3 mt-3">
            <Btn
              type="button"
              variant={important ? "danger" : "danger-outline"}
              onClick={() => setImportant(!important)}
              className="py-2"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              {t("notes.important")}
            </Btn>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{text.length}/{MAX_LENGTH}</span>
              <Btn
                onClick={addNote}
                disabled={loading || !text.trim()}
                variant="primary"
                className="px-5 py-2.5"
              >
                {loading
                  ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                }
                {loading ? t("notes.adding") : t("notes.add")}
              </Btn>
            </div>
          </div>
        </div>

        {/* Notes grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 font-medium shadow-sm w-full">
            <div className="text-4xl mb-3">📝</div>
            <p>{t("notes.noNotes")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedNotes.map((note, idx) => (
              <NoteCard
                key={note._id}
                note={note}
                palette={NOTE_PALETTES[idx % NOTE_PALETTES.length]}
                {...cardProps}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="py-2">{t("notes.prev")}</Btn>
            <span className="px-4 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-650 dark:text-slate-300 rounded-xl">{currentPage} / {totalPages}</span>
            <Btn variant="secondary" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="py-2">{t("notes.next")}</Btn>
          </div>
        )}

      </div>
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

export default Notes;
