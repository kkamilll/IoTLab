import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import MainSlider from '../components/layout/MainSlider';
import Btn from '../components/layout/Btn';

/** Quick "Track your order" input displayed in the hero section for guests */
const TrackOrderBanner = ({ language, navigate }) => {
  const [uuid, setUuid] = useState("");
  const handleGo = (e) => {
    e.preventDefault();
    const trimmed = uuid.trim();
    if (!trimmed) return;
    navigate(`/orderPreview/${trimmed}`);
  };
  return (
    <form
      onSubmit={handleGo}
      className="mt-8 flex flex-col sm:flex-row gap-2 justify-center items-center max-w-md mx-auto w-full"
    >
      <input
        type="text"
        value={uuid}
        onChange={(e) => setUuid(e.target.value)}
        placeholder={language === "pl" ? "🔍 Wklej UUID zamówienia…" : "🔍 Paste order UUID…"}
        className="flex-1 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 transition backdrop-blur-sm"
      />
      <button
        type="submit"
        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 text-xs transition cursor-pointer shadow-md whitespace-nowrap"
      >
        {language === "pl" ? "Śledź zamówienie" : "Track Order"}
      </button>
    </form>
  );
};

const WelcomePage = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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
      else if (window.innerWidth < 1280) setVisibleCount(3); // small desktop
      else setVisibleCount(4); // large desktop
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
    <div className="w-full min-h-screen font-sans bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">

      {/* TOPBAR */}
      <div className="w-full py-3.5 px-6 text-slate-600 dark:text-slate-300 text-xs font-semibold tracking-wide flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/20 backdrop-blur-sm transition-colors duration-300">
        <span className="text-slate-500 dark:text-slate-400 font-mono">
          {`${currentTime.getDate().toString().padStart(2, '0')}.${(currentTime.getMonth() + 1).toString().padStart(2, '0')}.${currentTime.getFullYear()} ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`}
        </span>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto md:justify-end">
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 cursor-pointer"
            title={theme === "dark" ? (language === "pl" ? "Przełącz na tryb jasny" : "Switch to Light Mode") : (language === "pl" ? "Przełącz na tryb ciemny" : "Switch to Dark Mode")}
          >
            {theme === "dark" ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m14.071-5.071l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Language Switcher Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white/50 dark:bg-slate-900/50">
            <button
              onClick={() => setLanguage("pl")}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                language === "pl"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              PL
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                language === "en"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              EN
            </button>
          </div>

          {user ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 text-slate-650 dark:text-slate-200 text-xs font-semibold w-full sm:w-auto">
              <span className="truncate max-w-[140px] sm:max-w-none text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {user.name}
              </span>

              {/* Back button */}
              <Btn
                onClick={handleBackToSidebar}
                variant="secondary"
                className="py-1.5 px-4 text-xs font-bold w-full sm:w-auto shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {t("common.back")}
              </Btn>

              {/* Logout button */}
              <Btn
                onClick={handleLogout}
                variant="danger"
                className="py-1.5 px-4 text-xs font-bold w-full sm:w-auto shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                </svg>
                {t("common.logout")}
              </Btn>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Btn
                onClick={handleLoginClick}
                variant="secondary"
                className="py-1.5 px-4 text-xs font-bold shadow-sm"
              >
                {t("common.login")}
              </Btn>
            </div>
          )}
        </div>
      </div>

      <section className="relative py-28 flex justify-center items-center overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div
          className="absolute inset-0 bg-[url('/uploadsWelcome/aa.jpg')] bg-cover bg-center bg-no-repeat opacity-40 animate-pulse-slow"
          style={{ filter: 'brightness(0.7) contrast(1.1)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/40 via-slate-50/60 to-slate-50 dark:from-slate-950/40 dark:via-slate-900/60 dark:to-slate-900"></div>
        <div className="relative z-10 max-w-3xl text-center px-6">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-full">
            {t("welcome.reservationSystem")}
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-3 mt-4 leading-tight text-slate-900 dark:text-white tracking-tight">
            IoTLab
          </h1>
          <p className="text-base md:text-xl mb-8 font-medium text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            {t("welcome.subtitle")}
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Btn
                onClick={handleLoginClick}
                variant="primary"
                className="px-8 py-3.5 text-sm font-bold shadow-lg"
              >
                {t("nav.loginAccount")}
              </Btn>
              <Btn
                onClick={() => navigate('/mainguest')}
                variant="secondary"
                className="px-8 py-3.5 text-sm font-bold shadow-lg"
              >
                {t("nav.orderAsGuest")}
              </Btn>
            </div>
          )}

          {/* Track Order quick-access */}
          {!user && (
            <TrackOrderBanner language={language} navigate={navigate} />
          )}
        </div>
      </section>

      <section className="py-16 bg-slate-100/30 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-6 md:px-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl font-black mb-1.5 text-center tracking-tight text-slate-900 dark:text-white">
            {t("nav.explore")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs text-center mb-8">
            {t("welcome.exploreSubtitle")}
          </p>

          {collections.length === 0 ? (
            <p className="text-center text-sm opacity-80 font-semibold text-slate-500">
              {t("welcome.noCollections")}
            </p>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Left arrow */}
              <button
                onClick={() => setCollectionIndex(prev => Math.max(prev - 1, 0))}
                className="absolute left-0 z-10 w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full shadow-md text-slate-800 dark:text-white font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
                    className="bg-white dark:bg-slate-800/45 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] flex flex-col items-center text-center flex-shrink-0 w-[220px] cursor-pointer"
                  >
                    <div
                      className="w-14 h-14 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-lg font-medium flex items-center justify-center mb-4 truncate"
                      title={collection.logo}
                    >
                      {collection.logo}
                    </div>

                    <h3
                      className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate w-full"
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
                className="absolute right-0 z-10 w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full shadow-md text-slate-800 dark:text-white font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                disabled={collectionIndex >= collections.length - visibleCount}
              >
                →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* LABORATORY FEATURES GRID - shown only if no materials and no notes exist */}
      {materials.length === 0 && notes.length === 0 && (
        <section className="py-20 bg-white dark:bg-slate-950/20 px-6 md:px-12 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <span className="block text-center text-xs font-extrabold uppercase tracking-widest text-indigo-650 dark:text-indigo-400 mb-2">
              {language === "pl" ? "Możliwości IoTLab" : "IoTLab Features"}
            </span>
            <h2 className="text-3xl font-black mb-3 text-center tracking-tight text-slate-900 dark:text-white">
              {language === "pl" ? "Co oferuje nasze laboratorium?" : "What does our lab offer?"}
            </h2>
            <p className="text-slate-555 dark:text-slate-400 text-sm text-center max-w-2xl mx-auto mb-12">
              {language === "pl" 
                ? "IoTLab to przestrzeń stworzona do rozwoju projektów z zakresu internetu rzeczy, systemów wbudowanych oraz elektroniki."
                : "IoTLab is a space designed for developing projects in the Internet of Things, embedded systems, and electronics."}
            </p>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center text-xl shadow-inner font-bold">
                  🛠️
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === "pl" ? "Zaawansowany sprzęt" : "Advanced Hardware"}
                </h3>
                <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {language === "pl" 
                    ? "Szeroka baza sensorów, mikrokontrolerów ESP32/Arduino, minikomputerów Raspberry Pi oraz modułów komunikacyjnych."
                    : "A wide database of sensors, ESP32/Arduino microcontrollers, Raspberry Pi single-board computers, and communication modules."}
                </p>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 text-emerald-650 dark:text-indigo-400 flex items-center justify-center text-xl shadow-inner font-bold">
                  📅
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === "pl" ? "Szybka rezerwacja" : "Quick Booking"}
                </h3>
                <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {language === "pl"
                    ? "Intuicyjny system wynajmu sprzętu online, pozwalający na sprawne planowanie pracy i projektów studenckich."
                    : "An intuitive online equipment rental system that allows efficient planning of student work and projects."}
                </p>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/40 text-amber-650 dark:text-indigo-400 flex items-center justify-center text-xl shadow-inner font-bold">
                  🏫
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === "pl" ? "Pokoje laboratoryjne" : "Laboratory Rooms"}
                </h3>
                <p className="text-slate-555 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {language === "pl"
                    ? "Możliwość rezerwacji dedykowanych stanowisk pracy w salach laboratoryjnych wyposażonych w specjalistyczną aparaturę."
                    : "Possibility to book dedicated workstations in laboratory rooms equipped with specialized apparatus."}
                </p>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/40 text-violet-650 dark:text-indigo-400 flex items-center justify-center text-xl shadow-inner font-bold">
                  📚
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === "pl" ? "Zasoby i linki" : "Resources & Links"}
                </h3>
                <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {language === "pl"
                    ? "Dostęp do kart katalogowych, schematów oraz przydatnych linków dla każdego komponentu dostępnego w bazie."
                    : "Access to datasheets, schematics, and useful links for each component available in the inventory."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAIN SLIDER – shown only if there are materials */}
      {materials.length > 0 && <MainSlider materials={materials} />}

      {/* NOTES & ANNOUNCEMENTS – shown only if loading, error, or has notes */}
      {(notesLoading || notesError || notes.length > 0) && (
        <section className="py-16 bg-white dark:bg-slate-900 px-6 md:px-12 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h2 className="text-2xl font-black mb-1.5 text-center tracking-tight text-slate-900 dark:text-white">
              {t("nav.announcements")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs text-center mb-8">
              {t("welcome.notesSubtitle")}
            </p>

            {notesLoading && (
              <p className="text-center text-sm text-slate-400 font-semibold">
                {t("welcome.loadingNotes")}
              </p>
            )}
            {notesError && <p className="text-center text-red-400 font-semibold">{notesError}</p>}

            {!notesLoading && !notesError && notes.length > 0 && (
              <>
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedNotes.map(note => (
                    <li key={note._id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
                      <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed font-semibold whitespace-pre-wrap break-words break-all">
                        {note.text}
                      </p>
                      <div className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold italic border-t border-slate-250 dark:border-slate-800 pt-3">
                        {t("welcome.addedBy")} <strong className="text-indigo-600 dark:text-indigo-400">{note.author?.name || t("welcome.anonymous")}</strong> •{' '}
                        {`${new Date(note.createdAt).getDate().toString().padStart(2, '0')}.${(new Date(note.createdAt).getMonth() + 1).toString().padStart(2, '0')}.${new Date(note.createdAt).getFullYear()} ${new Date(note.createdAt).getHours().toString().padStart(2, '0')}:${new Date(note.createdAt).getMinutes().toString().padStart(2, '0')}`}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Btn
                    onClick={() => setNotesPage(prev => Math.max(prev - 1, 1))}
                    disabled={notesPage === 1}
                    variant="secondary"
                    className="px-4 py-2"
                  >
                    {t("welcome.previous")}
                  </Btn>
                  <span className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-850">
                    {notesPage} / {totalPages}
                  </span>
                  <Btn
                    onClick={() => setNotesPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={notesPage === totalPages}
                    variant="secondary"
                    className="px-4 py-2"
                  >
                    {t("welcome.next")}
                  </Btn>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-white/40 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-900 text-center py-6 text-xs text-slate-500 font-semibold tracking-wide">
        © {new Date().getFullYear()} {t("welcome.footerText")}
      </footer>
    </div>
  );
};

export default WelcomePage;
