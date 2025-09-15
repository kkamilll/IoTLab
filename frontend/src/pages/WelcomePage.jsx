import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MainSlider from '../components/MainSlider';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [materials, setMaterials] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [notesPage, setNotesPage] = useState(1);

  const [collectionIndex, setCollectionIndex] = useState(0);
  const [collections, setCollections] = useState([]);

  const [visibleCount, setVisibleCount] = useState(3);

  const NOTES_PER_PAGE = 4;
  const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE);
  const paginatedNotes = notes.slice(
    (notesPage - 1) * NOTES_PER_PAGE,
    notesPage * NOTES_PER_PAGE
  );

  // Fetch materials
  useEffect(() => {
    (async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/materials`, { headers });
        if (res.data.success) setMaterials(res.data.data);
      } catch (err) {
        console.error("Error fetching materials:", err);
      }
    })();
  }, [token]);

  // Fetch notes
  useEffect(() => {
    (async () => {
      setNotesLoading(true);
      setNotesError(null);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/notes`, { headers });
        if (res.data.success && Array.isArray(res.data.data)) setNotes(res.data.data);
        else setNotesError('Invalid server response');
      } catch (err) {
        console.error('Fetch notes error:', err.response ? err.response.data : err.message);
        setNotesError('Error fetching notes');
      } finally {
        setNotesLoading(false);
      }
    })();
  }, [token]);

  // Fetch components (public)
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/components`
        );
        if (res.data.success) setCollections(res.data.data);
      } catch (err) {
        console.error("Error fetching collections:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth < 640) setVisibleCount(1); // mobile
      else if (window.innerWidth < 1024) setVisibleCount(2); // tablet
      else setVisibleCount(3); // desktop
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  useEffect(() => {
    if (!collections.length || !visibleCount) return;

    const maxStartIndex = Math.max(0, collections.length - visibleCount);
    setCollectionIndex(prevIndex => { return Math.min(prevIndex, maxStartIndex) });
  }, [visibleCount]);

  // Timer for current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCollectionClick = (id) => {
    navigate(`/components/${id}`); // jeśli zalogowany → pokaz pliki
  };

  // Handlers
  const handleLoginClick = () => navigate('/login');
  const handleLogout = () => { logout(); navigate('/'); };
  const handleBackToSidebar = () => {
    if (['admin', 'lecturer'].includes(user?.role)) navigate('/admin-dashboard');
    else navigate('/');
  };

  return (
    <div className="w-full min-h-screen font-sans bg-gradient-to-b from-blue-900 to-blue-700 text-gray-900">

      {/* TOPBAR */}
      <div className="w-full py-2 px-4 text-white text-sm font-semibold tracking-wide flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <span>
          {`${currentTime.getDate().toString().padStart(2, '0')}.${(currentTime.getMonth() + 1).toString().padStart(2, '0')}.${currentTime.getFullYear()} ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}
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

      <section className="relative py-20 flex justify-center items-center overflow-hidden shadow-1xl">
        <div
          className="absolute inset-0 bg-[url('/uploadsWelcome/aa.jpg')] bg-cover bg-center bg-no-repeat"
          style={{ filter: 'brightness(0.8)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50"></div>
        <div className="relative z-10 max-w-3xl text-center px-6">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight text-white drop-shadow-xl">
            IoTLab
          </h1>
          <p className="text-lg md:text-2xl mb-8 font-light text-blue-200 drop-shadow-md">
            Laboratory Room Management System
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6">
              <button
                onClick={handleLoginClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-full shadow-lg transition duration-300 transform hover:-translate-y-1"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/mainguest')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-3 rounded-full shadow-lg transition duration-300 transform hover:-translate-y-1"
              >
                Order as Guest
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Components */}
      <section className="py-20 bg-white text-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold text-center mb-14 tracking-tight text-blue-900">
            Explore Collections
          </h2>

          <div className="relative flex items-center">
            {/* Strzałka w lewo */}
            <button
              onClick={() => setCollectionIndex(prev => Math.max(prev - 1, 0))}
              className="bg-blue-600/80 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition"
              disabled={collectionIndex === 0}
            >
              ←
            </button>

            {/* Kontenery */}
            <div className="flex gap-7 flex-1 justify-center overflow-hidden px-2">
              {collections.slice(collectionIndex, collectionIndex + visibleCount).map(cat => (
                <div
                  key={cat._id}
                  onClick={() => handleCollectionClick(cat._id)}
                  className="flex-shrink-0 w-[280px] p-10 rounded-3xl shadow-lg hover:shadow-2xl hover:scale-105 transition-transform cursor-pointer flex flex-col justify-between items-center bg-gradient-to-tr from-blue-50 to-blue-100 min-h-[220px]"
                >
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="font-semibold text-xl text-blue-800 text-center break-words">{cat.name}</h3>
                </div>
              ))}
            </div>

            {/* Strzałka w prawo */}
            <button
              onClick={() => setCollectionIndex(prev => Math.min(prev + 1, collections.length - visibleCount))}
              className="bg-blue-600/80 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition"
              disabled={collectionIndex >= collections.length - visibleCount}
            >
              →
            </button>
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
                {paginatedNotes.map(note => (
                  <li key={note._id} className="bg-blue-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-transform duration-300 hover:scale-[1.02] flex flex-col">
                    <p className="text-white text-lg leading-relaxed font-medium whitespace-pre-wrap break-words break-all">
                      {note.text}
                    </p>
                    <div className="mt-3 text-blue-200 text-sm font-light italic">
                      Added by <strong>{note.author?.name || 'Anonymous'}</strong> •{' '}
                      {`${new Date(note.createdAt).getDate().toString().padStart(2, '0')}.${(new Date(note.createdAt).getMonth() + 1).toString().padStart(2, '0')}.${new Date(note.createdAt).getFullYear()} ${new Date(note.createdAt).getHours().toString().padStart(2, '0')}:${new Date(note.createdAt).getMinutes().toString().padStart(2, '0')}:${new Date(note.createdAt).getSeconds().toString().padStart(2, '0')}`}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setNotesPage(prev => Math.max(prev - 1, 1))}
                  disabled={notesPage === 1}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-blue-800 text-white font-semibold rounded-full shadow-inner">
                  {notesPage} / {totalPages}
                </span>
                <button
                  onClick={() => setNotesPage(prev => Math.min(prev + 1, totalPages))}
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
        © {new Date().getFullYear()} Laboratory Room Management System. All rights reserved.
      </footer>
    </div>
  );
};

export default WelcomePage;