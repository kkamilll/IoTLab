import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/* ── colour palette for note cards ─────────────────────────────── */
const NOTE_PALETTES = [
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800/50", dot: "bg-amber-400" },
  { bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-200 dark:border-sky-800/50", dot: "bg-sky-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800/50", dot: "bg-emerald-400" },
  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800/50", dot: "bg-violet-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800/50", dot: "bg-rose-400" },
];

/* Demo notes – shown only when DB has no notes yet */
const DEMO_NOTES = [
  {
    _id: "demo-1",
    text: "Laboratorium jest czynne od poniedziałku do piątku w godzinach 8:00–20:00. W weekendy dostępne tylko po wcześniejszej rezerwacji.",
    important: false,
    author: { name: "Administrator" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    _demo: true,
  },
  {
    _id: "demo-2",
    text: "⚠️ WAŻNE: Przed wypożyczeniem sprzętu prosimy o zapoznanie się z regulaminem laboratorium dostępnym na stronie wydziału.",
    important: true,
    author: { name: "Admin IoTLab" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    _demo: true,
  },
  {
    _id: "demo-3",
    text: "Nowy zestaw Raspberry Pi 5 dostępny do wypożyczenia! Skontaktuj się z opiekunem laboratorium w celu rezerwacji.",
    important: false,
    author: { name: "dr inż. Kowalski" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    _demo: true,
  },
];

const MAX_LENGTH = 500;
const NOTES_PER_PAGE = 6;

const fmt = (d) =>
  new Date(d).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "short", timeStyle: "short" });

/* ── NoteCard ───────────────────────────────────────────────────── */
const NoteCard = ({
  note, palette,
  editingId, editingText, editingTextareaRef, editingImportant,
  onStartEditing, onCancelEditing, onSaveEdit, onDelete,
  onSetEditingText, onSetEditingImportant,
}) => {
  const isEditing = editingId === note._id;
  return (
    <div
      className={`relative flex flex-col gap-3 rounded-3xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${palette.bg} ${palette.border} ${note.important ? "ring-2 ring-rose-400/40 dark:ring-rose-500/30" : ""}`}
      style={{ animation: "toastIn 0.25s ease-out both" }}
    >
      {/* Top-right indicators */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        {note.important && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
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
              <button
                onClick={() => onSetEditingImportant(!editingImportant)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${editingImportant ? "bg-rose-500 text-white border-rose-400" : "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 hover:bg-rose-50"}`}
              >⚠️ Ważne</button>
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
          {note._demo && <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 italic">przykład</span>}
        </div>
        {!note._demo && (
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
                <button onClick={() => onStartEditing(note)} title="Edytuj" className="p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition cursor-pointer">
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

/* ── Notes page ─────────────────────────────────────────────────── */
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
  const { token } = useAuth();
  const { showToast } = useToast();

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
      showToast("Błąd pobierania notatek", "error");
    }
  };
  useEffect(() => { fetchNotes(); }, [token]);

  const addNote = async () => {
    if (!text.trim()) { showToast("Notatka nie może być pusta", "warning"); return; }
    try {
      setLoading(true);
      const res = await apiClient.post("/notes/create", { text, important });
      if (res.data.success) {
        setNotes((prev) => sortNotes([...prev, res.data.data]));
        setText(""); setImportant(false);
        showToast("Notatka dodana!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Błąd dodawania notatki", "error");
    } finally { setLoading(false); }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Usunąć tę notatkę?")) return;
    try {
      await apiClient.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      showToast("Notatka usunięta", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Błąd usuwania", "error");
    }
  };

  const saveEdit = async (id) => {
    if (!editingText.trim()) { showToast("Notatka nie może być pusta", "warning"); return; }
    try {
      const res = await apiClient.put(`/notes/${id}`, { text: editingText, important: editingImportant });
      if (res.data.success) {
        setNotes((prev) => sortNotes([...prev.filter((n) => n._id !== id), res.data.data]));
        cancelEditing();
        showToast("Notatka zaktualizowana!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Błąd edycji", "error");
    }
  };

  const startEditing = (note) => { setEditingId(note._id); setEditingText(note.text); setEditingImportant(note.important || false); };
  const cancelEditing = () => { setEditingId(null); setEditingText(""); setEditingImportant(false); };

  const authors = Array.from(new Set(notes.map((n) => n.author?.name || "Anonim").filter(Boolean)));
  const filteredNotes = authorFilter ? notes.filter((n) => (n.author?.name || "Anonim") === authorFilter) : notes;

  // When DB has no notes yet → show demo cards as empty state
  const showDemo = filteredNotes.length === 0 && !loading;
  const displayNotes = showDemo ? DEMO_NOTES : filteredNotes;
  const totalPages = Math.ceil(displayNotes.length / NOTES_PER_PAGE);
  const paginatedNotes = displayNotes.slice((currentPage - 1) * NOTES_PER_PAGE, currentPage * NOTES_PER_PAGE);

  const cardProps = (isDemo) => isDemo
    ? { editingId: null, editingText: "", editingTextareaRef: { current: null }, editingImportant: false, onStartEditing: () => {}, onCancelEditing: () => {}, onSaveEdit: () => {}, onDelete: () => {}, onSetEditingText: () => {}, onSetEditingImportant: () => {} }
    : { editingId, editingText, editingTextareaRef, editingImportant, onStartEditing: startEditing, onCancelEditing: cancelEditing, onSaveEdit: saveEdit, onDelete: deleteNote, onSetEditingText: setEditingText, onSetEditingImportant: setEditingImportant };

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-slate-900/10 flex flex-col p-6 md:p-8 transition-colors duration-300">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-base">📝</span>
              Notatki
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ogłoszenia i notatki dla użytkowników laboratorium</p>
          </div>
          {authors.length > 0 && (
            <select
              value={authorFilter}
              onChange={(e) => { setAuthorFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition w-full sm:w-52"
            >
              <option value="">Wszyscy autorzy</option>
              {authors.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
        </div>

        {/* Add note panel */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Nowa notatka</p>
          <textarea
            ref={addTextareaRef}
            value={text}
            onChange={(e) => e.target.value.length <= MAX_LENGTH && setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote(); }}
            placeholder="Wpisz treść notatki… (Ctrl+Enter żeby zapisać)"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 focus:border-indigo-400 resize-none min-h-[80px] overflow-hidden transition"
            rows={2}
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => setImportant(!important)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${important ? "bg-rose-500 text-white border-rose-400 shadow-sm" : "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"}`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              Ważne
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{text.length}/{MAX_LENGTH}</span>
              <button
                onClick={addNote}
                disabled={loading || !text.trim()}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white disabled:text-slate-400 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
              >
                {loading
                  ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                }
                {loading ? "Dodawanie…" : "Dodaj"}
              </button>
            </div>
          </div>
        </div>

        {/* Demo banner – only when DB is empty */}
        {showDemo && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-5 py-3 flex items-center gap-3 text-sm text-amber-800 dark:text-amber-300">
            <span className="text-lg flex-shrink-0">💡</span>
            <span>Brak notatek w bazie — poniżej widoczne są <strong>przykładowe</strong> ogłoszenia. Dodaj pierwszą notatkę powyżej!</span>
          </div>
        )}

        {/* Notes grid – demo when empty, real otherwise */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedNotes.map((note, idx) => (
            <NoteCard
              key={note._id}
              note={note}
              palette={NOTE_PALETTES[idx % NOTE_PALETTES.length]}
              {...cardProps(showDemo)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer">← Poprzednia</button>
            <span className="px-4 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 rounded-2xl">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer">Następna →</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Notes;
