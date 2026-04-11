import { jwtVerify } from '../utils/crypto.js';

/**
 * Require a valid Bearer JWT.
 * On success, attaches the decoded payload to `req.user`.
 */
export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const payload = jwtVerify(header.slice(7));
  if (!payload) {
    return res.status(401).json({ error: 'Session expired — please sign in again' });
  }
  req.user = payload;
  return next();
}

/**
 * Require a valid Bearer JWT *and* `role === 'admin'`.
 */
export function admin(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin required' });
    }
    return next();
  });
}
