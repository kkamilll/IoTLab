import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/auth/login`, {
        email,
        password,
      });

      const { success, user, token, message } = response.data;

      if (success) {
        await login(user, token);
        navigate(user.role === 'admin' ? '/admin-dashboard' : '/admin-dashboard');
      } else {
        setError(message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server is not responding');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle "Forgot Password" click
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 px-4">
      <h2 className="text-4xl font-extrabold mb-8 text-white drop-shadow-lg">
        Inventory System
      </h2>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <h3 className="text-3xl font-bold mb-6 text-blue-900 text-center">
          Login
        </h3>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-6 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-full font-semibold shadow-lg transition duration-300 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <button
          onClick={handleForgotPassword}
          className="mt-6 w-full bg-blue-50 text-blue-700 py-2 px-4 rounded-full border border-blue-200 hover:bg-blue-100 transition-all shadow-sm font-medium"
          type="button"
        >
          Forgot Password
        </button>
      </div>
    </div>
  );
};

export default Login;
