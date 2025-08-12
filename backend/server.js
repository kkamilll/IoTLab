import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import userRoutes from './routes/user.js';
import noteRoutes from './routes/noteRoutes.js';
import ordersRoutes from './routes/order.js';
import authRoutess from './routes/authRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/products', productRoutes);
app.use('/login', authRoutes);
app.use('/users', userRoutes);
app.use('/notes', noteRoutes);
app.use('/orders', ordersRoutes);
app.use('/api/auth', authRoutess);

const PORT = process.env.PORT || 3500;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email jest wymagany' });

  // Generowanie 6-cyfrowego kodu
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000; // 15 min ważności

  verificationTokens.set(email, { code, expires });
  console.log(`Kod weryfikacyjny dla ${email}: ${code}`);

  res.json({ success: true, message: 'Kod weryfikacyjny wysłany na email' });
});

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

  // Tutaj dodaj logikę aktualizacji hasła w bazie (tu tylko log)
  console.log(`Hasło dla ${email} zmienione na: ${newPassword}`);

  verificationTokens.delete(email);
  res.json({ success: true, message: 'Hasło zostało zmienione' });
});

app.listen(PORT, () => {
  console.log(`Backend działa na http://localhost:${PORT}`);
});