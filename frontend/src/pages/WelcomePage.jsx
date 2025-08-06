import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="w-full text-white font-sans">
      {/* TOPBAR WITH DATE & TIME */}
      <div className="w-full bg-purple-900 text-center py-2 text-sm">
        {formatDateTime(currentTime)}
      </div>

      {/* HERO SECTION */}
      <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-purple-800 to-purple-600 relative">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          autoPlay
          loop
          muted
        >
          <source src="https://www.videvo.net/videvo_files/converted/2016_11/preview/161006A_004_Inventory.mp420486.webm" type="video/webm" />
        </video>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">Inventory Management System</h1>
          <p className="text-lg md:text-xl mb-8">Efektywne zarządzanie zasobami w Twojej firmie</p>
          <button
            onClick={handleLoginClick}
            className="px-8 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Zaloguj się
          </button>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 bg-white text-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Dlaczego nasz system?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl shadow-md hover:shadow-xl transition">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="font-semibold text-xl mb-2">Pełna kontrola magazynu</h3>
              <p>Śledź ilość, dostępność i lokalizację produktów w czasie rzeczywistym.</p>
            </div>
            <div className="p-6 rounded-xl shadow-md hover:shadow-xl transition">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-xl mb-2">Raporty & Statystyki</h3>
              <p>Twórz zaawansowane raporty dotyczące sprzedaży, stanu magazynowego i zamówień.</p>
            </div>
            <div className="p-6 rounded-xl shadow-md hover:shadow-xl transition">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-semibold text-xl mb-2">Bezpieczny dostęp</h3>
              <p>System z autoryzacją dla administratorów i pracowników z różnymi poziomami uprawnień.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENTS SECTION */}
      <section className="py-20 bg-gradient-to-b from-purple-700 to-purple-500 text-center px-4">
        <h2 className="text-4xl font-bold mb-6">Ogłoszenia</h2>
        <p className="max-w-3xl mx-auto text-lg">📢 Nowa wersja systemu 2.0 już dostępna! Sprawdź nowe funkcje dotyczące integracji z zewnętrznymi dostawcami i automatyzacji zamówień.</p>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-20 bg-white text-gray-800">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-4xl font-bold mb-4">O systemie</h2>
            <p className="text-lg">Nasz Inventory Management System to narzędzie stworzone dla firm, które chcą zoptymalizować zarządzanie zasobami, ograniczyć straty i zyskać pełną kontrolę nad przepływem towarów. Dzięki nowoczesnym technologiom Twoje magazyny staną się w pełni zautomatyzowane.</p>
          </div>
          <div className="flex-1">
            <img src="https://cdn.pixabay.com/photo/2017/08/10/03/29/inventory-2617228_1280.png" alt="Inventory Illustration" className="rounded-xl shadow-lg" />
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-b from-purple-500 to-purple-400 text-center px-4">
        <h2 className="text-4xl font-bold mb-6">Zarządzaj magazynem efektywnie</h2>
        <button
          onClick={handleLoginClick}
          className="px-8 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Przejdź do logowania
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-purple-900 text-center py-6 text-sm">
        © {new Date().getFullYear()} Inventory Management System. All rights reserved.
      </footer>
    </div>
  );
};

export default WelcomePage;
