require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const bankRoutes = require('./routes/bankRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- newly added
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/admin', adminRoutes);          // <-- newly added
app.use('/api/chat', chatRoutes);

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    app: 'Kubera',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ── Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ── Database & Server Start ────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kubera';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected → kubera');
    app.listen(PORT, () => {
      console.log(`🚀 Kubera server running on http://localhost:${PORT}`);
      console.log(`📡 API base: http://localhost:${PORT}/api`);
      console.log('─────────────────────────────────────────');
      console.log('  Auth:       /api/auth/login | /register');
      console.log('  Bank:       /api/bank/balance | /qr');
      console.log('  Payment:    /api/payment/pay | /history');
      console.log('  Settings:   /api/settings');
      console.log('  Dashboard:  /api/dashboard');
      console.log('  Investment: /api/investment');
      console.log('  Health:     /api/health');
      console.log('─────────────────────────────────────────');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
