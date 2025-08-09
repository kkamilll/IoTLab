import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  // Axios z tokenem autoryzacji
  const axiosInstance = axios.create({
    baseURL: "http://localhost:3500",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
    setNotes(prev => prev.filter(note => note._id !== id));
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
        setNotes(prev => [res.data.data, ...prev]);
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
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Notatki</h2>

      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Nowa notatka"
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-grow border rounded px-3 py-2 mr-2"
        />
        <button
          onClick={addNote}
          disabled={loading}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Dodaj
        </button>
      </div>

      <ul>
        {notes.length === 0 && <li className="text-gray-500">Brak notatek</li>}
        {notes.map(note => (
          <li key={note._id} className="flex justify-between items-center mb-2 border-b pb-1">
            <div>
              <p className="font-medium text-gray-800">{note.text}</p>
              <p className="text-sm text-gray-500">
                Dodane przez <strong>{note.author?.name || "Anonim"}</strong> •{" "}
                {new Date(note.createdAt).toLocaleString("pl-PL")}
              </p>
            </div>
            <button
              onClick={() => deleteNote(note._id)}
              className="text-red-600 hover:text-red-900"
            >
              Usuń
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notes;
