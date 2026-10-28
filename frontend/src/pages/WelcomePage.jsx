import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import MainSlider from '../components/layout/MainSlider';
import NavArrowBtn from '../components/layout/NavArrowBtn';
import {
  Clock,
  Sun,
  Moon,
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  LogIn,
  LogOut,
  LayoutDashboard,
  LayoutGrid,
  Package,
  ExternalLink
} from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

/** Quick "Track your order" input displayed in the hero section for guests */
const TrackOrderBanner = ({ language, navigate }) => {
  const [orderId, setOrderId] = useState("");

  const handleGo = (e) => {
    e.preventDefault();
    const trimmed = orderId.trim();
    if (!trimmed) return;
    navigate(`/orderPreview/${trimmed}`);
  };

  return (
    <form onSubmit={handleGo} className="mt-8 max-w-2xl mx-auto w-full">
      <div className="relative flex items-center p-1.5 sm:p-2 rounded-full bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-700/80 shadow-xl dark:shadow-black/60 backdrop-blur-md focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all duration-200">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 ml-3.5 mr-2 shrink-0" />
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder={
            language === "pl"
              ? "Wklej ID zamówienia..."
              : "Paste order ID..."
          }
          className="seamless-input flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white px-2"
        />
        {orderId && (
          <button
            type="button"
            onClick={() => setOrderId("")}
            className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Clear input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-indigo-500/30 shrink-0 flex items-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <span>{language === "pl" ? "Śledź status" : "Track Order"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
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
  const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));
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
        if (res.data.success) {
          const filtered = res.data.data.filter(
            c => !c.name?.toLowerCase().includes('katalog') && c.directUrl !== '/guest-products' && c.directUrl !== '/mainguest'
          );
          setCollections(filtered);
        }
      } catch (err) {
        console.error("Error fetching collections:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else if (window.innerWidth < 1280) setVisibleCount(3);
      else setVisibleCount(4);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  useEffect(() => {
    if (!collections.length || !visibleCount) return;
    const maxStartIndex = Math.max(0, collections.length - visibleCount);
    setCollectionIndex(prevIndex => Math.min(prevIndex, maxStartIndex));
  }, [visibleCount, collections.length]);

  // Timer for current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCollectionClick = (collection) => {
    if (collection?.isDirectLink && collection?.directUrl) {
      const url = collection.directUrl.trim();
      if (/^https?:\/\//i.test(url)) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else if (url.startsWith("/")) {
        navigate(url);
      } else {
        window.open(`https://${url}`, "_blank", "noopener,noreferrer");
      }
      return;
    }
    navigate(`/components/${collection._id}`);
  };

  // Handlers
  const handleLoginClick = () => navigate('/login');
  const handleLogout = () => { logout(); navigate('/'); };
  const handleBackToSidebar = () => {
    if (['admin', 'lecturer'].includes(user?.role)) navigate('/admin-dashboard');
    else navigate('/');
  };

  return (
    <div className="w-full min-h-screen font-sans bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">

      {/* TOPBAR */}
      <header className="sticky top-0 z-40 w-full py-3 px-4 sm:px-6 lg:px-8 text-xs font-semibold tracking-wide flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md shadow-2xs transition-colors duration-300">
        {/* Left Side: Live Clock, Theme Switcher & Language Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Clock & Date Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs backdrop-blur-md select-none transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
            title={language === "pl" ? "Aktualny czas systemowy" : "Current system time"}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-slate-650 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
              {currentTime.toLocaleDateString(language === "pl" ? "pl-PL" : "en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              })}
            </span>
            <span className="opacity-30">•</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-100 tracking-wider text-[11px] sm:text-xs bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              {currentTime.toLocaleTimeString(language === "pl" ? "pl-PL" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })}
            </span>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 bg-white/90 dark:bg-slate-900/90 shadow-2xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 active:scale-95"
            title={theme === "dark" ? (language === "pl" ? "Przełącz na tryb jasny" : "Switch to Light Mode") : (language === "pl" ? "Przełącz na tryb ciemny" : "Switch to Dark Mode")}
            aria-label="Toggle theme"
            type="button"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* Language Switcher Toggle */}
          <div className="flex items-center rounded-full border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white/90 dark:bg-slate-900/90 shadow-2xs p-0.5">
            <button
              onClick={() => setLanguage("pl")}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all duration-200 rounded-full cursor-pointer ${language === "pl"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              type="button"
            >
              PL
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all duration-200 rounded-full cursor-pointer ${language === "en"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              type="button"
            >
              EN
            </button>
          </div>
        </div>

        {/* Right Side: Auth controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          {user ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* User profile capsule */}
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-indigo-400/50 shadow-2xs">
                  {user.profileImage ? (
                    <img
                      src={`${API_BASE}/uploads/users/${user.profileImage}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <span className={`w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[9px] flex items-center justify-center ${user.profileImage ? 'hidden' : ''}`}>
                    {(user.name || "U")[0].toUpperCase()}
                  </span>
                </div>
                <span className="truncate max-w-[120px] sm:max-w-none text-xs font-bold text-slate-800 dark:text-slate-100">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40">
                  {user.role}
                </span>
              </div>

              {/* Back to admin button */}
              <button
                onClick={handleBackToSidebar}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                type="button"
                title={t("welcome.adminDashboard")}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t("common.back")}</span>
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-650 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                type="button"
                title={t("common.logout")}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("common.logout")}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLoginClick}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
              type="button"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t("common.login")}</span>
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-24 sm:py-28 flex justify-center items-center overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div
          className="absolute inset-0 bg-[url('/uploadsWelcome/aa.jpg')] bg-cover bg-center bg-no-repeat opacity-40 animate-pulse-slow"
          style={{ filter: 'brightness(0.7) contrast(1.1)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/40 via-slate-50/60 to-slate-50 dark:from-slate-950/40 dark:via-slate-900/60 dark:to-slate-900"></div>

        <div className="relative z-10 max-w-3xl text-center px-6">
          <h1 className="text-5xl md:text-7xl font-black mb-3 leading-tight text-slate-900 dark:text-white tracking-tight">
            IoTLab
          </h1>
          <p className="text-base md:text-xl mb-8 font-medium text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            {t("welcome.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
            <button
              onClick={() => navigate('/guest-products')}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              type="button"
            >
              <Package className="w-4 h-4" />
              <span>{t("welcome.productCatalog") || "Katalog produktów"}</span>
            </button>

            <button
              onClick={user ? handleBackToSidebar : handleLoginClick}
              className="px-6 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              type="button"
            >
              <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t("welcome.adminDashboard") || "Panel administracyjny"}</span>
            </button>
          </div>

          {/* Track Order quick-access */}
          {!user && (
            <TrackOrderBanner language={language} navigate={navigate} />
          )}
        </div>
      </section>

      {/* EXPLORE / KOLEKCJE */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 md:px-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {t("nav.explore")}
            </h2>
          </div>

          {collections.length === 0 ? (
            <p className="text-center text-sm opacity-80 font-semibold text-slate-500 dark:text-slate-400">
              {t("welcome.noCollections")}
            </p>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Left arrow */}
              <NavArrowBtn
                direction="left"
                onClick={() => setCollectionIndex(prev => Math.max(prev - 1, 0))}
                disabled={collectionIndex === 0}
                className="absolute -left-2 sm:-left-4 z-10 shadow-lg"
                title={language === "pl" ? "Poprzednie kolekcje" : "Previous collections"}
                ariaLabel="Previous collections"
              />

              {/* Cards row */}
              <div className="flex gap-6 overflow-hidden px-2 py-3">
                {collections.slice(collectionIndex, collectionIndex + visibleCount).map(collection => (
                  <div
                    key={collection._id}
                    onClick={() => handleCollectionClick(collection)}
                    className="relative group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-6 shadow-sm dark:shadow-lg dark:shadow-black/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col items-center text-center shrink-0 w-[230px] sm:w-[250px] cursor-pointer"
                  >
                    {collection.isDirectLink && (
                      <span
                        className="absolute top-3.5 right-3.5 p-1 rounded-lg bg-slate-50 dark:bg-slate-700/80 text-slate-400 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 transition shadow-2xs"
                        title={collection.directUrl}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    )}

                    <div
                      className="w-16 h-16 rounded-2xl text-2xl flex items-center justify-center mb-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-650 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                      title={collection.logo}
                    >
                      {collection.logo}
                    </div>

                    <h3
                      className="font-extrabold text-sm text-slate-800 dark:text-white truncate w-full group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition"
                      title={collection.name}
                    >
                      {collection.name}
                    </h3>
                  </div>
                ))}
              </div>

              {/* Right arrow */}
              <NavArrowBtn
                direction="right"
                onClick={() =>
                  setCollectionIndex(prev =>
                    Math.min(prev + 1, collections.length - visibleCount)
                  )
                }
                disabled={collectionIndex >= collections.length - visibleCount}
                className="absolute -right-2 sm:-right-4 z-10 shadow-lg"
                title={language === "pl" ? "Następne kolekcje" : "Next collections"}
                ariaLabel="Next collections"
              />
            </div>
          )}
        </div>
      </section>

      {/* LABORATORY FEATURES GRID - shown only if no materials and no notes exist */}
      {materials.length === 0 && notes.length === 0 && (
        <section className="py-16 bg-slate-50/60 dark:bg-slate-950/60 px-4 sm:px-6 md:px-12 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {language === "pl" ? "Możliwości laboratorium" : "Laboratory Features"}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Advanced Hardware */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center text-xl shadow-inner font-bold group-hover:scale-110 transition-transform">
                  🛠️
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === "pl" ? "Zaawansowany sprzęt" : "Advanced Hardware"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {language === "pl"
                    ? "Szeroka baza sensorów, mikrokontrolerów ESP32/Arduino, minikomputerów Raspberry Pi oraz modułów komunikacji bezprzewodowej."
                    : "A wide database of sensors, ESP32/Arduino microcontrollers, Raspberry Pi single-board computers, and communication modules."}
                </p>
              </div>

              {/* Card 2: Quick Booking */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 text-emerald-650 dark:text-emerald-400 flex items-center justify-center text-xl shadow-inner font-bold group-hover:scale-110 transition-transform">
                  📅
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === "pl" ? "Szybka rezerwacja" : "Quick Booking"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {language === "pl"
                    ? "Intuicyjny system wynajmu sprzętu online, pozwalający na sprawne planowanie pracy i projektów studenckich 24/7."
                    : "An intuitive online equipment rental system that allows efficient planning of student work and projects 24/7."}
                </p>
              </div>

              {/* Card 3: Lab Rooms */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/40 text-amber-650 dark:text-amber-400 flex items-center justify-center text-xl shadow-inner font-bold group-hover:scale-110 transition-transform">
                  🏫
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === "pl" ? "Pokoje laboratoryjne" : "Laboratory Rooms"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {language === "pl"
                    ? "Możliwość rezerwacji dedykowanych stanowisk pracy w salach laboratoryjnych wyposażonych w specjalistyczną aparaturę pomiarową."
                    : "Possibility to book dedicated workstations in laboratory rooms equipped with specialized measurement apparatus."}
                </p>
              </div>

              {/* Card 4: Resources */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/40 text-violet-650 dark:text-violet-400 flex items-center justify-center text-xl shadow-inner font-bold group-hover:scale-110 transition-transform">
                  📚
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {language === "pl" ? "Zasoby i linki" : "Resources & Links"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {language === "pl"
                    ? "Dostęp do kart katalogowych, schematów oraz przydatnych linków technicznych dla każdego komponentu dostępnego w bazie."
                    : "Access to datasheets, schematics, and useful links for each component available in the inventory."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAIN SLIDER – shown only if there are materials */}
      {materials.length > 0 && <MainSlider materials={materials} />}

      {/* NOTES & ANNOUNCEMENTS */}
      {(notesLoading || notesError || notes.length > 0) && (
        <section className="py-16 bg-white dark:bg-slate-900 px-4 sm:px-6 md:px-12 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {t("nav.announcements")}
              </h2>
            </div>

            {notesLoading && (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs font-bold">{t("welcome.loadingNotes")}</span>
              </div>
            )}
            {notesError && <p className="text-center text-red-500 font-semibold text-xs">{notesError}</p>}

            {!notesLoading && !notesError && notes.length > 0 && (
              <>
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedNotes.map(note => (
                    <li
                      key={note._id}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-3xl p-6 shadow-sm dark:shadow-xl dark:shadow-black/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed font-semibold whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                          {note.text}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold border-t border-slate-200 dark:border-slate-700/80 pt-3.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-indigo-400/60 dark:border-indigo-500 shadow-xs">
                          {note.author?.profileImage ? (
                            <img
                              src={`${API_BASE}/uploads/users/${note.author.profileImage}`}
                              alt={note.author.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.classList.remove('hidden');
                                }
                              }}
                            />
                          ) : null}
                          <span className={`w-full h-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center ${note.author?.profileImage ? 'hidden' : ''}`}>
                            {(note.author?.name || "A")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-bold text-slate-800 dark:text-white">
                            {note.author?.name || t("welcome.anonymous")}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                            {new Date(note.createdAt).toLocaleDateString(language === "pl" ? "pl-PL" : "en-US", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-8">
                    <NavArrowBtn
                      direction="left"
                      onClick={() => setNotesPage(prev => Math.max(prev - 1, 1))}
                      disabled={notesPage === 1}
                      title={t("welcome.previous")}
                      ariaLabel={t("welcome.previous")}
                    />
                    <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 shadow-xs font-mono">
                      {notesPage} / {totalPages}
                    </span>
                    <NavArrowBtn
                      direction="right"
                      onClick={() => setNotesPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={notesPage === totalPages}
                      title={t("welcome.next")}
                      ariaLabel={t("welcome.next")}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-white/60 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-850 text-center py-6 px-4 text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
        © {new Date().getFullYear()} {t("welcome.footerText")}
      </footer>
    </div>
  );
};

export default WelcomePage;
