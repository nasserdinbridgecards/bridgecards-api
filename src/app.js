import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';
import ordersRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import { log } from './utils/logger.js';
import { rateLimit } from './middleware/rateLimit.js';
import { CORS_ORIGIN } from './config.js';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow all origins in development; restrict in production via CORS_ORIGIN env var.
const corsOptions = CORS_ORIGIN
  ? { origin: CORS_ORIGIN, credentials: true }
  : {};
app.use(cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
// Raw body required for Stripe webhook signature validation — must come before express.json().
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));

// ── Global rate limiter: 120 requests per minute per IP ──────────────────────
// Individual routes may add stricter per-route limits on top of this.
app.use(rateLimit(120, 60_000));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);
app.use('/auth', authRouter);
app.use('/orders', ordersRouter);
app.use('/admin', adminRouter);

// ── Global error handler ──────────────────────────────────────────────────────
// Catches any unhandled errors propagated via next(err).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  log('ERROR', 'UNHANDLED', { path: req.path, error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
