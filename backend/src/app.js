require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// ─── Environment ───
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security headers ───
app.use(helmet());

// ─── Request logging ───
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ─── Gzip compression ───
app.use(compression());

// ─── Global rate limiting ───
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: isProduction ? 100 : 1000,  // requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ─── Stricter rate limit for auth endpoints ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' },
});

// ─── Database URL validation ───
function validateDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    console.error('DATABASE_URL is missing. Add it to your .env file.');
    return false;
  }

  const hasMultipleAtInAuthority = /:\/\/[^/]*@[^/]*@/.test(rawUrl);
  if (hasMultipleAtInAuthority) {
    console.error('DATABASE_URL appears malformed: password likely contains unencoded "@". Use "%40" for "@" in password.');
    return false;
  }

  try {
    const parsed = new URL(rawUrl);
    const isPgProtocol = parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:';

    if (!isPgProtocol || !parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
      console.error('DATABASE_URL appears malformed. Expected format: postgresql://user:pass@host:5432/dbname');
      return false;
    }

    return true;
  } catch (error) {
    console.error('DATABASE_URL is not a valid URL. Expected format: postgresql://user:pass@host:5432/dbname');
    return false;
  }
}

// ─── CORS ───
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Body parsing with size limits ───
// rawBody is captured here so the Plaid webhook verifier can check the SHA-256 body hash
app.use(express.json({
  limit: '10kb',
  verify: (req, _res, buf) => { req.rawBody = buf.toString(); },
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Trust proxy (for rate limiting behind reverse proxies in prod) ───
if (isProduction) {
  app.set('trust proxy', 1);
}

// ─── Health check ───
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MoniqoFi API',
    version: '1.0.0',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── Database connection ───
const pool = require('./config/db');
const isDatabaseUrlValid = validateDatabaseUrl(process.env.DATABASE_URL);

if (isDatabaseUrlValid) {
  pool.connect()
    .then(() => console.log('Connected to Supabase PostgreSQL'))
    .catch(err => console.error('Database connection error', err));
}

// ─── Routes ───
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const healthScoreRoutes = require('./routes/healthScoreRoutes');
const personalityRoutes = require('./routes/personalityRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const goalRoutes = require('./routes/goalRoutes');
const coachRoutes = require('./routes/coachRoutes');
const plaidRoutes = require('./routes/plaidRoutes');
const importRoutes = require('./routes/importRoutes');
const aaRoutes = require('./routes/aaRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/health-score', healthScoreRoutes);
app.use('/api/personality', personalityRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/transactions/import', importRoutes);
app.use('/api/aa', aaRoutes);

// ─── 404 handler ───
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ───
app.use((err, req, res, _next) => {
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: origin not allowed' });
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.stack || err.message);

  // Don't leak stack traces in production
  res.status(err.status || 500).json({
    message: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ─── Start server ───
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});

// ─── Graceful shutdown ───
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    pool.end().then(() => {
      console.log('Database pool closed.');
      process.exit(0);
    });
  });

  // Force shutdown after 10s
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled errors ───
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});
