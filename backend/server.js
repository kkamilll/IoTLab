import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/products', productRoutes);
app.use('/login', authRoutes);

const PORT = process.env.PORT;

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});

