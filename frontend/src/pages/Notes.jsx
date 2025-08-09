import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  const axiosInstance = axios.create({
    baseURL: "http://localhost:3500",
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchNotes = async () => {
    try {
      const res = await axiosInstance.get("/notes");
      if (res.data.success) setNotes(res.data.data);
    } catch (error) {
      console.error("Fetch notes error:", error.response?.data || error.message);
      alert("Błąd podczas pobierania notatek");
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Czy na pewno usunąć tę notatkę?")) return;
    try {
      await axiosInstance.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((note) => note._id !== id));
    } catch (error) {
      console.error("Delete note error:", error.response?.data || error.message);
      alert("Błąd podczas usuwania notatki");
    }
  };

  const addNote = async () => {
    if (!text.trim()) return alert("Tekst notatki nie może być pusty");
    try {
      setLoading(true);
      const res = await axiosInstance.post("/notes", { text });
      if (res.data.success) {
        setNotes((prev) => [res.data.data, ...prev]);
        setText("");
      }
    } catch {
      alert("Błąd podczas dodawania notatki");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Notatki</h2>

        <div className="flex mb-6 gap-4">
          <input
            type="text"
            placeholder="Wpisz nową notatkę..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-grow border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            disabled={loading}
          />
          <button
            onClick={addNote}
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Dodaję..." : "Dodaj"}
          </button>
        </div>

        <ul>
          {notes.length === 0 && (
            <li className="text-center text-gray-400 py-16 select-none">Brak notatek</li>
          )}
          {notes.map((note) => (
            <li
              key={note._id}
              className="flex justify-between items-start border-b border-gray-200 py-4"
            >
              <div className="max-w-[80%]">
                <p className="font-medium text-gray-800 whitespace-pre-wrap">{note.text}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Dodane przez <strong>{note.author?.name || "Anonim"}</strong> •{" "}
                  {new Date(note.createdAt).toLocaleString("pl-PL")}
                </p>
              </div>
              <button
                onClick={() => deleteNote(note._id)}
                title="Usuń notatkę"
                className="text-red-600 hover:text-red-800 ml-4 flex items-center justify-center p-2 rounded hover:bg-red-100 transition"
                aria-label="Usuń notatkę"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Notes;
