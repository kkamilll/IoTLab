import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config/db.js';

import authMiddleware from './middleware/authMiddleware.js'
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

dotenv.config();


const app = express();

// HTTP request Logger
const accessLogStream = fs.createWriteStream(path.join(process.cwd(), 'access.log'), { flags: 'a' });
morgan.token('remote-user', (req) => (req.user ? req.user._id : '-')); // user id
morgan.token('date', () => new Date().toLocaleString('en-GB')); // local time zone
app.use(morgan('combined', { stream: accessLogStream }));

app.use(cors());
app.use(express.json());

// handle wrong JSON requests
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }
  next();
});

// // disallow any communication other than localhost
// app.use((req, res, next) => {
//   const ip = req.ip || req.socket.remoteAddress;

//   // Normalize IPv6 localhost (::1) and IPv4 (127.0.0.1)
//   if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
//     next(); // allow
//   } else {
//     res.status(403).json({ message: 'Access denied. Only localhost allowed.' });
//   }
// });

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/notes', noteRoutes);

app.use(errorHandler);

// Global 404 handler (for any route that doesn't match)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});