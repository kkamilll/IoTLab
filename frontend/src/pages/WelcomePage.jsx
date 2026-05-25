import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import MainSlider from '../components/layout/MainSlider';

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
        const res = await apiClient.get('/materials');
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
        const res = await apiClient.get('/notes');
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
        const res = await apiClient.get('/components');
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
    <div className="w-full min-h-screen font-sans bg-slate-900 text-slate-100 flex flex-col justify-between">

      {/* TOPBAR */}
      <div className="w-full py-3.5 px-6 text-slate-300 text-xs font-semibold tracking-wide flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 bg-slate-950/20 backdrop-blur-sm">
        <span className="text-slate-400 font-mono">
          {`${currentTime.getDate().toString().padStart(2, '0')}.${(currentTime.getMonth() + 1).toString().padStart(2, '0')}.${currentTime.getFullYear()} ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}
        </span>

        {user && (
          <div className="flex flex-col sm:flex-row items-center gap-3 text-slate-200 text-xs font-semibold w-full sm:w-auto">
            <span className="truncate max-w-[140px] sm:max-w-none text-slate-300 bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-800">{user.name}</span>

            {/* Back button */}
            <button
              onClick={handleBackToSidebar}
              className="flex items-center justify-center gap-1.5 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors rounded-xl px-4 py-1.5 text-xs font-bold w-full sm:w-auto shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors text-white rounded-xl px-4 py-1.5 text-xs font-bold w-full sm:w-auto shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>

      <section className="relative py-28 flex justify-center items-center overflow-hidden border-b border-slate-800">
        <div
          className="absolute inset-0 bg-[url('/uploadsWelcome/aa.jpg')] bg-cover bg-center bg-no-repeat opacity-40"
          style={{ filter: 'brightness(0.7) contrast(1.1)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/60 to-slate-900"></div>
        <div className="relative z-10 max-w-3xl text-center px-6">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">System rezerwacji</span>
          <h1 className="text-5xl md:text-7xl font-black mb-3 mt-4 leading-tight text-white tracking-tight">
            IoTLab
          </h1>
          <p className="text-base md:text-xl mb-8 font-medium text-slate-300 max-w-xl mx-auto">
            Laboratory Room & Equipment Management System
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button
                onClick={handleLoginClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 text-sm"
              >
                Login to Account
              </button>
              <button
                onClick={() => navigate('/mainguest')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-8 py-3 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 border border-slate-700 text-sm"
              >
                Order as Guest
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-slate-900/50 border-b border-slate-800 text-white px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black mb-1.5 text-center tracking-tight text-white">
            Explore Collections
          </h2>
          <p className="text-slate-400 text-xs text-center mb-8">Select a collection category to view documents and links</p>

          {collections.length === 0 ? (
            <p className="text-center text-sm opacity-80 font-semibold text-slate-500">
              No collections available.
            </p>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Left arrow */}
              <button
                onClick={() => setCollectionIndex(prev => Math.max(prev - 1, 0))}
                className="absolute left-0 z-10 w-9 h-9 flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-750 rounded-full shadow-md text-white font-bold transition disabled:opacity-30 disabled:pointer-events-none"
                disabled={collectionIndex === 0}
              >
                ←
              </button>

              {/* Cards */}
              <div className="flex gap-6 overflow-hidden px-2">
                {collections.slice(collectionIndex, collectionIndex + visibleCount).map(collection => (
                  <div
                    key={collection._id}
                    onClick={() => handleCollectionClick(collection._id)}
                    className="bg-slate-800/45 border border-slate-700/50 hover:border-indigo-500/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] flex flex-col items-center text-center flex-shrink-0 w-[220px] cursor-pointer"
                  >
                    <div
                      className="w-14 h-14 rounded-xl text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 text-lg font-medium flex items-center justify-center mb-4 truncate"
                      title={collection.logo}
                    >
                      {collection.logo}
                    </div>

                    <h3
                      className="font-bold text-sm text-slate-200 truncate w-full"
                      title={collection.name}
                    >
                      {collection.name}
                    </h3>
                  </div>
                ))}
              </div>

              {/* Right arrow */}
              <button
                onClick={() =>
                  setCollectionIndex(prev =>
                    Math.min(prev + 1, collections.length - visibleCount)
                  )
                }
                className="absolute right-0 z-10 w-9 h-9 flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-750 rounded-full shadow-md text-white font-bold transition disabled:opacity-30 disabled:pointer-events-none"
                disabled={collectionIndex >= collections.length - visibleCount}
              >
                →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* MAIN SLIDER */}
      {materials.length > 0 && <MainSlider materials={materials} />}

      {/* NOTES & ANNOUNCEMENTS */}
      <section className="py-16 bg-slate-900 text-white px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black mb-1.5 text-center tracking-tight text-white">Announcements & Notes</h2>
          <p className="text-slate-400 text-xs text-center mb-8">Latest updates and notifications from the administration</p>

          {notesLoading && <p className="text-center text-sm text-slate-400 font-semibold">Loading announcements and notes...</p>}
          {notesError && <p className="text-center text-red-400 font-semibold">{notesError}</p>}
          {!notesLoading && !notesError && notes.length === 0 && (
            <p className="text-center text-sm text-slate-500 font-semibold">No current announcements or notes to display.</p>
          )}

          {!notesLoading && !notesError && notes.length > 0 && (
            <>
              <ul className="grid gap-6 sm:grid-cols-2">
                {paginatedNotes.map(note => (
                  <li key={note._id} className="bg-slate-800/40 border border-slate-850 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
                    <p className="text-slate-200 text-sm leading-relaxed font-semibold whitespace-pre-wrap break-words break-all">
                      {note.text}
                    </p>
                    <div className="mt-4 text-slate-400 text-xs font-semibold italic border-t border-slate-800 pt-3">
                      Added by <strong className="text-indigo-400">{note.author?.name || 'Anonymous'}</strong> •{' '}
                      {`${new Date(note.createdAt).getDate().toString().padStart(2, '0')}.${(new Date(note.createdAt).getMonth() + 1).toString().padStart(2, '0')}.${new Date(note.createdAt).getFullYear()} ${new Date(note.createdAt).getHours().toString().padStart(2, '0')}:${new Date(note.createdAt).getMinutes().toString().padStart(2, '0')}`}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setNotesPage(prev => Math.max(prev - 1, 1))}
                  disabled={notesPage === 1}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  Previous
                </button>
                <span className="px-3.5 py-1.5 bg-slate-950 text-slate-400 text-xs font-bold rounded-xl border border-slate-850">
                  {notesPage} / {totalPages}
                </span>
                <button
                  onClick={() => setNotesPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={notesPage === totalPages}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950/40 border-t border-slate-900 text-center py-6 text-xs text-slate-500 font-semibold tracking-wide">
        © {new Date().getFullYear()} Laboratory Room Management System. All rights reserved.
      </footer>
    </div>
  );
};

export default WelcomePage;
