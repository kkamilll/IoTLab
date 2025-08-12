import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // dodajemy do przekierowania

const ResetPassword = ({ email }) => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // hook do przekierowania

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setError('Hasła nie są takie same');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3500/api/auth/reset-password', {
        email,
        otpCode: otp, // upewniamy się, że wysyłamy otpCode, nie otp
        newPassword,
      });

      if (response.data.success) {
        setSuccessMessage('Hasło zostało zresetowane pomyślnie. Przekierowuję do logowania...');
        // przekierowanie po 2 sekundach
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Coś poszło nie tak.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd serwera');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center text-blue-900">Resetowanie hasła</h2>

      {error && <div className="mb-4 text-red-600 font-medium text-center">{error}</div>}
      {successMessage && <div className="mb-4 text-green-600 font-medium text-center">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Kod weryfikacyjny"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nowe hasło"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={6}
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Potwierdź nowe hasło"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={6}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-full font-semibold shadow-lg transition duration-300 disabled:opacity-50"
        >
          {loading ? 'Przetwarzanie...' : 'Resetuj hasło'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
