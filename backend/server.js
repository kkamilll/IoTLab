import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config/db.js';

// import authMiddleware from './middleware/authMiddleware.js'

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import materialRoutes from "./routes/materialRoutes.js";

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();


const app = express();

// HTTP request Logger
const accessLogStream = fs.createWriteStream(path.join(process.cwd(), 'access.log'), { flags: 'a' });
morgan.token('remote-user', (req) => (req.user ? req.user._id : '-')); // user id
morgan.token('date', () => new Date().toLocaleString('en-GB')); // local time zone
app.use(morgan('combined', { stream: accessLogStream }));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/materials', materialRoutes);


app.use(errorHandler);

// Global 404 handler (for any route that doesn't match)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, '0.0.0.0', async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});