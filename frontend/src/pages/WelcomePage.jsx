import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login'); // dodaje do historii
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-700 to-purple-400 text-white">
      <h1 className="text-5xl font-bold mb-8">Witaj w Inventory Management</h1>
      <p className="mb-10 text-lg">Proszę się zalogować, aby kontynuować.</p>
      <button
        onClick={handleLoginClick}
        className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-gray-100 transition"
      >
        Zaloguj
      </button>
    </div>
  );
};

export default WelcomePage;
