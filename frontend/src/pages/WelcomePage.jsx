import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MainSlider from '../components/MainSlider';
import { buildTree } from "../utils/categoryUtils";

const WelcomePage = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [notesPage, setNotesPage] = useState(1);

  const NOTES_PER_PAGE = 4;

  useEffect(() => { fetchCategories(); }, []);
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3500/categories/public");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get("http://localhost:3500/materials", { headers });
        if (res.data.success) setMaterials(res.data.data);
      } catch (err) {
        console.error("Error fetching materials:", err);
      }
    };
    fetchMaterials();
  }, [token]);

  const normalizedCategories = useMemo(
    () => categories.map(c => ({
      _id: c._id.toString(),
      name: c.name,
      description: c.description,
      parent: c.parent?._id?.toString() || null
    })),
    [categories]
  );

  const categoryTree = useMemo(() => buildTree(normalizedCategories), [normalizedCategories]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      setNotesLoading(true);
      setNotesError(null);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('http://localhost:3500/notes', { headers });
        if (res.data.success && Array.isArray(res.data.data)) setNotes(res.data.data);
        else setNotesError('Invalid server response');
      } catch (err) {
        console.error('Fetch notes error:', err.response ? err.response.data : err.message);
        setNotesError('Error fetching notes');
      } finally { setNotesLoading(false); }
    };
    fetchNotes();
  }, [token]);

  const handleLoginClick = () => navigate('/login');
  const handleLogout = () => { logout(); navigate('/'); };
  const handleBackToSidebar = () => {
    if (['admin','lecturer'].includes(user?.role)) navigate('/admin-dashboard');
    else navigate('/');
  };

  const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE);
  const paginatedNotes = notes.slice(
    (notesPage - 1) * NOTES_PER_PAGE,
    notesPage * NOTES_PER_PAGE
  );

  return (
    <div className="w-full min-h-screen font-sans bg-gradient-to-b from-blue-900 to-blue-700 text-gray-900">

      {/* TOPBAR */}
      <div className="w-full py-2 px-4 text-white text-sm font-semibold tracking-wide flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <span>
          {`${currentTime.getDate().toString().padStart(2,'0')}.${(currentTime.getMonth()+1).toString().padStart(2,'0')}.${currentTime.getFullYear()} ${currentTime.getHours().toString().padStart(2,'0')}:${currentTime.getMinutes().toString().padStart(2,'0')}:${currentTime.getSeconds().toString().padStart(2,'0')}`}
        </span>

        {user && (
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white px-4 py-2 rounded-full shadow-md text-black text-sm font-semibold">
            <span className="truncate max-w-[140px] sm:max-w-none">{user.name}</span>

            <button
              onClick={handleBackToSidebar}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white rounded-full px-5 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-full px-5 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>

   

      {/* WELCOME SECTION */}
      <section className="relative flex flex-col justify-center items-center min-h-[40vh] bg-blue-800/20 rounded-3xl py-10 px-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight text-white drop-shadow-lg">
            Inventory System
          </h1>
          <p className="text-base md:text-lg mb-6 font-light text-blue-200 drop-shadow-md">
            Efficient resource management
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button
                onClick={handleLoginClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-full shadow-lg transition duration-300"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/mainguest')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-3 rounded-full shadow-lg transition duration-300"
              >
                Order as Guest
              </button>
            </div>
          )}
        </div>
      </section>
{/* INFO PANEL */}
<section className="py-20 bg-white text-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-center mb-14 tracking-tight text-blue-900">
            Dlaczego nasz system?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-shadow bg-gradient-to-tr from-blue-50 to-blue-100 cursor-default">
              <div className="text-5xl mb-5">📦</div>
              <h3 className="font-semibold text-2xl mb-3 text-blue-800">Pełna kontrola magazynu</h3>
              <p className="text-gray-700">
                Śledź ilość, dostępność i lokalizację produktów w czasie rzeczywistym.
              </p>
            </div>
            <div className="p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-shadow bg-gradient-to-tr from-blue-50 to-blue-100 cursor-default">
              <div className="text-5xl mb-5">📊</div>
              <h3 className="font-semibold text-2xl mb-3 text-blue-800">Raporty & Statystyki</h3>
              <p className="text-gray-700">
                Twórz zaawansowane raporty dotyczące sprzedaży, stanu magazynowego i zamówień.
              </p>
            </div>
            <div className="p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-shadow bg-gradient-to-tr from-blue-50 to-blue-100 cursor-default">
              <div className="text-5xl mb-5">🔒</div>
              <h3 className="font-semibold text-2xl mb-3 text-blue-800">Bezpieczny dostęp</h3>
              <p className="text-gray-700">
                System z autoryzacją dla administratorów i pracowników z różnymi poziomami uprawnień.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN SLIDER */}
      {materials.length > 0 && <MainSlider materials={materials} />}

      {/* NOTES & ANNOUNCEMENTS */}
      <section className="py-16 bg-blue-900 text-white px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-10 text-center tracking-wide">Announcements & Notes</h2>

          {notesLoading && <p className="text-center text-lg opacity-90">Loading announcements and notes...</p>}
          {notesError && <p className="text-center text-red-400 font-semibold">{notesError}</p>}
          {!notesLoading && !notesError && notes.length === 0 && (
            <p className="text-center text-lg opacity-80 font-light">No current announcements or notes to display.</p>
          )}

          {!notesLoading && !notesError && notes.length > 0 && (
            <>
              <ul className="grid gap-6 sm:grid-cols-2">
                {paginatedNotes.map((note) => (
                  <li
                    key={note._id}
                    className="bg-blue-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-transform duration-300 hover:scale-[1.02] flex flex-col"
                  >
                    <p className="text-white text-lg leading-relaxed font-medium whitespace-pre-wrap break-words">
                      {note.text}
                    </p>
                    <div className="mt-3 text-blue-200 text-sm font-light italic">
                      Added by <strong>{note.author?.name || 'Anonymous'}</strong> •{' '}
                      {`${new Date(note.createdAt).getDate().toString().padStart(2,'0')}.${(new Date(note.createdAt).getMonth()+1).toString().padStart(2,'0')}.${new Date(note.createdAt).getFullYear()} ${new Date(note.createdAt).getHours().toString().padStart(2,'0')}:${new Date(note.createdAt).getMinutes().toString().padStart(2,'0')}:${new Date(note.createdAt).getSeconds().toString().padStart(2,'0')}`}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination Buttons */}
              {/* Pagination Buttons */}
<div className="flex justify-center gap-4 mt-6">
  <button
    onClick={() => setNotesPage((prev) => Math.max(prev - 1, 1))}
    disabled={notesPage === 1}
    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
  >
    Previous
  </button>

  <span className="px-4 py-2 bg-blue-800 text-white font-semibold rounded-full shadow-inner">
    {notesPage} / {totalPages}
  </span>

  <button
    onClick={() => setNotesPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={notesPage === totalPages}
    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
  >
    Next
  </button>
</div>

            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-blue-900/70 text-center py-6 text-sm text-blue-200 font-light tracking-wide">
        © {new Date().getFullYear()} Inventory System. All rights reserved.
      </footer>
    </div>
  );
};

export default WelcomePage;
