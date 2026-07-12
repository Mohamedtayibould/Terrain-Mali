require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const terrainRoutes = require('./routes/terrains');
const reservationRoutes = require('./routes/reservations');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();

// On Vercel, /api/ prefix is stripped before reaching Express
const isVercel = process.env.VERCEL === '1';
const prefix = isVercel ? '' : '/api';

// Security
if (!isVercel) app.use(helmet());
if (!isVercel) app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Trop de requetes, veuillez reessayer plus tard.' }
});
app.use(limiter);

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://terrain-mali.netlify.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(prefix + '/auth', authRoutes);
app.use(prefix + '/terrains', terrainRoutes);
app.use(prefix + '/reservations', reservationRoutes);
app.use(prefix + '/payments', paymentRoutes);
app.use(prefix + '/admin', adminRoutes);

// Health check
app.get(prefix + '/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvee' });
});

if (!isVercel) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Terrain Mali API running on port ${PORT}`);
  });
}

module.exports = app;
