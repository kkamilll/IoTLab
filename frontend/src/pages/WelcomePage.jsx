import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MainMenu from '../components/MainMenu';
import MainSlider from '../components/MainSlider'
import { buildTree } from "../utils/categoryUtils";

const WelcomePage = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const [categories, setCategories] = useState([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState(null);

  useEffect(() => {fetchCategories();}, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3500/categories/public");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Błąd pobierania kategorii:", err);
    }
  };

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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      setNotesLoading(true);
      setNotesError(null);

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('http://localhost:3500/notes', { headers });

        if (res.data.success && Array.isArray(res.data.data)) {
          setNotes(res.data.data);
        } else {
          setNotesError('Nieprawidłowa odpowiedź z serwera');
        }
      } catch (err) {
        console.error('Fetch notes error:', err.response ? err.response.data : err.message);
        setNotesError('Błąd podczas pobierania notatek');
      } finally {
        setNotesLoading(false);
      }
    };

    fetchNotes();
  }, [token]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBackToSidebar = () => {
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (user?.role === 'lecturer') {
      navigate('/customer-dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-full min-h-screen font-sans bg-gradient-to-b from-blue-900 to-blue-700 text-gray-900 ">
      {/* TOPBAR */}
      <div className="w-full bg-transparent py-2 px-4 text-white text-sm font-semibold tracking-wide shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-2">

        {/* Data i czas */}
        <span>
          {currentTime.toLocaleString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>

        {user && (
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white px-4 py-2 rounded-full shadow-md text-black text-sm font-semibold">
            <span className="truncate max-w-[140px] sm:max-w-none">{user.name}</span>

            <button
              onClick={handleBackToSidebar}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white rounded-full px-5 py-2 shadow-md shadow-green-400/50
                 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Powrót
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-full px-5 py-2 shadow-md shadow-red-400/50
                 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              Wyloguj
            </button>
          </div>
        )}
      </div>

      {/* HERO SECTION */}
      <section className="relative flex flex-col justify-center items-center min-h-[50vh] bg-gradient-to-b from-blue-900 to-blue-700 overflow-visible py-10">
        <div className="relative z-20 px-8 max-w-4xl text-center">
          <div className="mt-6 relative z-50">
            <MainMenu categoryTree={categoryTree} />
          </div>
        </div>
      </section>
      
      <section className="relative flex flex-col justify-center items-center min-h-[40vh] bg-transparent border-4 overflow-hidden">
        <div className="relative z-20 px-6 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight drop-shadow-lg text-white">
            System Inwentaryzacyjny
          </h1>
          <p className="text-base md:text-lg mb-6 font-light drop-shadow-md text-blue-200">
            Efektywne zarządzanie zasobami w Twojej firmie
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button
                onClick={handleLoginClick}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-2.5 rounded-full shadow-lg hover:shadow-xl transition duration-300"
              >
                Zaloguj się
              </button>

              <button
                onClick={() => navigate('/guest-products')}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-2.5 rounded-full shadow-lg hover:shadow-xl transition duration-300"
              >
                Zamów jako gość
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className=" bg-transparent text-gray-900 ">
        <div className="max-w-8xl  bg-red-400 mx-auto"> 
          {/* //max-w-[1920px] */}
          <MainSlider categoryTree={categoryTree}/>
          {/* <h2 className="text-4xl font-extrabold text-center mb-14 tracking-tight text-blue-900">
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
          </div> */}
        </div>
      </section>

      {/* ANNOUNCEMENTS & NOTES SECTION */}
      <section className="py-20 bg-gradient-to-b from-blue-900 to-blue-950 text-white px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-12 text-center tracking-wide">Ogłoszenia i Notatki</h2>

          {notesLoading && (
            <p className="text-center text-lg font-medium opacity-90">Ładowanie ogłoszeń i notatek...</p>
          )}
          {notesError && <p className="text-center text-red-400 font-semibold">{notesError}</p>}

          {!notesLoading && !notesError && notes.length === 0 && (
            <p className="text-center text-lg opacity-80 font-light">
              Brak aktualnych ogłoszeń i notatek do wyświetlenia.
            </p>
          )}

          <ul className="grid gap-8 sm:grid-cols-2">
            {notes.map((note) => (
              <li
                key={note._id}
                className="bg-blue-800 bg-opacity-90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl cursor-default hover:scale-[1.04] hover:shadow-3xl transition-transform duration-300"
              >
                <p className="text-white text-lg leading-relaxed font-medium">{note.text}</p>
                <div className="mt-4 text-blue-300 text-sm font-light italic">
                  Dodane przez <strong>{note.author?.name || 'Anonim'}</strong> •{' '}
                  {new Date(note.createdAt).toLocaleString('pl-PL', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-blue-950 text-center py-6 text-sm text-blue-300 font-light tracking-wide">
        © {new Date().getFullYear()} System Inwentaryzacyjny. Wszelkie prawa zastrzeżone.
      </footer>
    </div>
  );
};

export default WelcomePage;
