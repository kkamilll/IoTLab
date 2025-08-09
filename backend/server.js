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
app.use(cors());
app.use(express.json());

app.use('/products', productRoutes);
app.use('/login', authRoutes);
app.use('/users', userRoutes);
app.use('/notes', noteRoutes);
app.use('/orders', ordersRoutes);
const PORT = process.env.PORT || 3500;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});
