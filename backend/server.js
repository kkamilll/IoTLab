import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import userRoutes from './routes/user.js';
import noteRoutes from './routes/noteRoutes.js';
import ordersRoutes from './routes/order.js';

dotenv.config();

const app = express();
const verificationTokens = new Map(); // Map do kodów resetowania hasła

// Middleware
app.use(cors());
app.use(express.json());

// ROUTES
app.use('/products', productRoutes);
app.use('/login', authRoutes);
app.use('/users', userRoutes);
app.use('/notes', noteRoutes);
app.use('/orders', ordersRoutes);
app.use('/api/auth', authRoutes);

// Endpoint do wysyłania kodu resetowania hasła
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email jest wymagany' });

  // Generowanie 6-cyfrowego kodu
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000; // 15 minut ważności
  verificationTokens.set(email, { code, expires });

  console.log(`Kod weryfikacyjny dla ${email}: ${code}`); // W produkcji wysyłaj mailem
  res.json({ success: true, message: 'Kod weryfikacyjny wysłany na email' });
});

// Endpoint do resetowania hasła
app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
  }

  const record = verificationTokens.get(email);
  if (!record) return res.status(400).json({ message: 'Brak kodu weryfikacyjnego dla tego email' });
  if (record.code !== code) return res.status(400).json({ message: 'Nieprawidłowy kod weryfikacyjny' });
  if (Date.now() > record.expires) {
    verificationTokens.delete(email);
    return res.status(400).json({ message: 'Kod weryfikacyjny wygasł' });
  }

  // Tutaj dodaj logikę aktualizacji hasła w bazie (MongoDB)
  console.log(`Hasło dla ${email} zmienione na: ${newPassword}`);

  verificationTokens.delete(email);
  res.json({ success: true, message: 'Hasło zostało zmienione' });
});

// Połączenie z MongoDB i start serwera
const PORT = process.env.PORT || 3500;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend działa na http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Błąd połączenia z MongoDB:', err);
  });
