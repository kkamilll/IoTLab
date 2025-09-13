import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
  const MAX_LENGTH = 500;
  const NOTES_PER_PAGE = 6;

  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`,
    headers: { Authorization: `Bearer ${token}` },
  });

  const addTextareaRef = useRef(null);
  const editingTextareaRef = useRef(null);
  const minHeight = 40;

  const adjustAddTextareaHeight = () => {
    if (!addTextareaRef.current) return;
    addTextareaRef.current.style.height = `${minHeight}px`;
    addTextareaRef.current.style.height = `${addTextareaRef.current.scrollHeight}px`;
  };

  const adjustEditingTextareaHeight = () => {
    if (!editingTextareaRef.current) return;
    editingTextareaRef.current.style.height = `${minHeight}px`;
    editingTextareaRef.current.style.height = `${editingTextareaRef.current.scrollHeight}px`;
  };

  const fetchNotes = async () => {
    try {
      const res = await axiosInstance.get("/notes");
      if (res.data.success) {
        // Sortuj po ważności i po dacie aktualizacji (najnowsze u góry)
        const sortedNotes = res.data.data.sort((a, b) => {
          if (b.important !== a.important) return b.important - a.important;
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });
        setNotes(sortedNotes);
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Error fetching notes");
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await axiosInstance.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(note => note._id !== id));
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(`Error deleting note: ${err.response?.data?.message || err.message}`);
    }
  };

  const addNote = async () => {
    if (!text.trim()) return alert("Note text cannot be empty");
    try {
      setLoading(true);
      const res = await axiosInstance.post("/notes/create", { text, important });
      if (res.data.success) {
        const newNote = res.data.data;
        setNotes(prev => {
          const updatedNotes = [...prev, newNote];
          updatedNotes.sort((a, b) => {
            if (b.important !== a.important) return b.important - a.important;
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
          });
          return updatedNotes;
        });
        setText("");
        setImportant(false);
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(`Error adding note: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (note) => {
    setEditingId(note._id);
    setEditingText(note.text);
    setEditingImportant(note.important || false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText("");
    setEditingImportant(false);
  };

  const saveEdit = async (id) => {
    if (!editingText.trim()) return alert("Note text cannot be empty");
    try {
      const res = await axiosInstance.put(`/notes/${id}`, {
        text: editingText,
        important: editingImportant
      });
      if (res.data.success) {
        const updatedNote = res.data.data;
        setNotes(prev => {
          const updatedNotes = [...prev.filter(n => n._id !== id), updatedNote];
          updatedNotes.sort((a, b) => {
            if (b.important !== a.important) return b.important - a.important;
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
          });
          return updatedNotes;
        });
        cancelEditing();
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(`Error editing note: ${err.response?.data?.message || err.message}`);
    }
  };

  useEffect(() => { fetchNotes(); }, [token]);
  useEffect(() => { adjustAddTextareaHeight(); }, [text]);
  useEffect(() => { adjustEditingTextareaHeight(); }, [editingText]);

  // Lista autorów, w tym "Anonymous"
  const authors = Array.from(
    new Set(notes.map(note => note.author?.name || "Anonymous").filter(Boolean))
  );

  // Filtracja notatek
  const filteredNotes = authorFilter
    ? notes.filter(note => (note.author?.name || "Anonymous") === authorFilter)
    : notes;

  // Paginacja
  const totalPages = Math.ceil(filteredNotes.length / NOTES_PER_PAGE);
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * NOTES_PER_PAGE,
    currentPage * NOTES_PER_PAGE
  );

  const goPrevious = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-700 text-center sm:text-left flex-1">
            📝 Your Notes
          </h2>

          {/* Author Filter */}
          {authors.length > 0 && (
            <select
              value={authorFilter}
              onChange={e => { setAuthorFilter(e.target.value); setCurrentPage(1); }}
              className="p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Authors</option>
              {authors.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
        </div>

        {/* Add Note */}
        <div className="flex flex-col gap-3">
          <textarea
            ref={addTextareaRef}
            value={text}
            onChange={e => { if (e.target.value.length <= MAX_LENGTH) setText(e.target.value); }}
            placeholder="Add a new note..."
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none overflow-hidden min-h-[60px] transition"
          />

          <div className="flex items-center gap-3 justify-between">
            <button
              type="button"
              onClick={() => setImportant(!important)}
              className={`px-4 py-2 rounded-xl border font-semibold transition flex items-center justify-center gap-2 ${important
                  ? "bg-red-500 text-white border-red-400 shadow-md"
                  : "bg-white text-red-600 border-red-400 hover:bg-red-100 hover:text-red-700"
                }`}
            >
              Important
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={addNote}
                disabled={loading || !text.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add"}
              </button>
              <p className="text-sm text-gray-500">{text.length} / {MAX_LENGTH}</p>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex flex-col gap-4 mt-4">
          {paginatedNotes.map(note => (
            <div
              key={note._id}
              className={`flex flex-col border rounded-xl p-4 transition ${note.important ? "bg-red-50 border-red-400" : "bg-gray-50 border-gray-200"} hover:shadow-md`}
            >

              {/* Treść notatki */}
              <div className="flex-1 overflow-x-auto mb-4">
                {editingId === note._id ? (
                  <textarea
                    ref={editingTextareaRef}
                    value={editingText}
                    onChange={e => { if (e.target.value.length <= MAX_LENGTH) setEditingText(e.target.value); }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none overflow-auto max-h-60"
                  />
                ) : (
                  <p className="font-medium text-gray-800 break-words break-all whitespace-pre-wrap">
                    {note.important && <span className="text-red-600 font-bold mr-2">❗</span>}
                    {note.text}
                  </p>
                )}
              </div>

              {/* Stopka */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-200">
                {/* Autor i data */}
                <div className="flex flex-col text-left">
                  <p className="text-sm text-gray-500">
                    Added by <strong>{note.author?.name || "Anonymous"}</strong>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(note.updatedAt || note.createdAt).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}
                  </p>
                </div>

                {/* Przyciski */}
                <div className="flex gap-2 flex-wrap">
                  {editingId === note._id ? (
                    <>
                      <button onClick={() => saveEdit(note._id)} className="text-green-500 hover:text-green-700 p-3 rounded-full hover:bg-green-100 transition">💾</button>
                      <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100 transition">❌</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(note)} className="text-blue-500 hover:text-blue-700 p-3 rounded-full hover:bg-blue-100 transition">✏️</button>
                      <button onClick={() => deleteNote(note._id)} className="text-red-500 hover:text-red-700 p-3 rounded-full hover:bg-red-100 transition">🗑️</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            <button
              onClick={goPrevious}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded-xl disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2 py-2">{currentPage} / {totalPages}</span>
            <button
              onClick={goNext}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-xl disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Notes;