// Main Express application
// This file configures middleware and mounts all routes
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// ===== Global middleware =====

// Enable CORS so frontend (different port) can call this API
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Parse JSON bodies automatically
app.use(express.json());

// Simple request logger (helpful in dev)
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ===== Health check =====
app.get('/', (_req, res) => {
  res.json({ message: 'Cashflow API is running 🚀', status: 'ok' });
});

// ===== API routes =====
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ===== 404 handler =====
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ===== Error handler (must be last) =====
app.use(errorHandler);

export default app;
