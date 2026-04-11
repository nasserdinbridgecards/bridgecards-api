import { Router }       from 'express';
import crypto            from 'crypto';
import { log }           from '../utils/logger.js';
import { rateLimit }     from '../middleware/rateLimit.js';
import { auth }          from '../middleware/auth.js';
import { jwtSign }       from '../utils/crypto.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { dbGetUser, dbSetUser } from '../db/index.js';

const router = Router();

// POST /auth/register
router.post('/register', rateLimit(10, 60_000), async (req, res) => {
  try {
    const { firstName, lastName, email, password, accountType = 'customer' } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (await dbGetUser(normalizedEmail)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = {
      id:         crypto.randomUUID(),
      firstName,
      lastName,
      email:      normalizedEmail,
      password:   await hashPassword(password),
      role:       accountType === 'wholesale' ? 'wholesale' : 'customer',
      createdAt:  new Date().toISOString(),
      isBlocked:  false,
      orderCount: 0,
      totalSpent: 0,
    };
    await dbSetUser(normalizedEmail, user);
    log('INFO', 'REGISTERED', { id: user.id, email: normalizedEmail, role: user.role });

    const token = jwtSign({ userId: user.id, email: normalizedEmail, role: user.role });
    const { password: _, ...safeUser } = user;
    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    log('ERROR', 'REG_ERR', { error: err.message });
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', rateLimit(10, 60_000), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await dbGetUser(normalizedEmail);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ error: 'Account is blocked' });
    if (!await verifyPassword(password, user.password)) {
      log('WARN', 'FAILED_LOGIN', { email: normalizedEmail });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwtSign({ userId: user.id, email: normalizedEmail, role: user.role });
    log('INFO', 'LOGIN', { id: user.id, email: normalizedEmail });
    const { password: _, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (err) {
    log('ERROR', 'LOGIN_ERR', { error: err.message });
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /auth/me
router.get('/me', auth, async (req, res) => {
  const user = await dbGetUser(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safeUser } = user;
  return res.json(safeUser);
});

export default router;
