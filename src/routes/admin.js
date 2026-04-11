import { Router }     from 'express';
import { admin }       from '../middleware/auth.js';
import { log, getRecentFraudAlerts } from '../utils/logger.js';
import { dbAllOrders, dbAllUsers, dbGetUser, dbSetUser, getDbHandle } from '../db/index.js';
import { settings, productConfigs, blockedIPs } from '../store.js';
import { getLiveFX, getFxCacheInfo } from '../services/fx.js';

const router = Router();

// GET /admin/stats
router.get('/stats', admin, async (req, res) => {
  const [orders, users, fxRates] = await Promise.all([
    dbAllOrders({}),
    dbAllUsers(),
    getLiveFX(),
  ]);
  const { updatedAt } = getFxCacheInfo();
  const delivered     = orders.filter((o) => o.status === 'delivered');

  return res.json({
    totalOrders:       orders.length,
    totalUsers:        users.length,
    totalRevenue:      delivered.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2),
    estimatedProfit:   delivered.reduce((sum, o) => sum + o.totalAmount * settings.globalMargin, 0).toFixed(2),
    failed:            orders.filter((o) => o.status === 'failed').length,
    refunded:          orders.filter((o) => o.status === 'refunded').length,
    pending:           orders.filter((o) => ['pending', 'processing'].includes(o.status)).length,
    byStatus: {
      pending:    orders.filter((o) => o.status === 'pending').length,
      paid:       orders.filter((o) => o.status === 'paid').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      delivered:  delivered.length,
      failed:     orders.filter((o) => o.status === 'failed').length,
      refunded:   orders.filter((o) => o.status === 'refunded').length,
    },
    fxRates,
    fxUpdatedAt:  new Date(updatedAt).toISOString(),
    dbType:       getDbHandle()?.isMongoose ? 'mongodb' : 'in-memory',
    fraudAlerts:  getRecentFraudAlerts(20),
    recentOrders: orders.slice(0, 10).map((o) => ({
      id:        o.id,
      email:     o.email,
      status:    o.status,
      amount:    o.totalAmount,
      createdAt: o.createdAt,
    })),
  });
});

// GET /admin/users
router.get('/users', admin, async (req, res) => {
  const users = await dbAllUsers();
  return res.json(users.map(({ password: _, ...user }) => user));
});

// PATCH /admin/users/:email
router.patch('/users/:email', admin, async (req, res) => {
  const user = await dbGetUser(req.params.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.body.isBlocked !== undefined) user.isBlocked = req.body.isBlocked;
  if (req.body.role)                    user.role      = req.body.role;
  await dbSetUser(req.params.email, user);
  const { password: _, ...safeUser } = user;
  return res.json(safeUser);
});

// POST /admin/block-ip
router.post('/block-ip', admin, (req, res) => {
  const { ip, block } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  if (block) {
    blockedIPs.add(ip);
  } else {
    blockedIPs.delete(ip);
  }
  log('INFO', 'IP_BLOCK', { ip, block, admin: req.user.email });
  return res.json({ blockedIPs: [...blockedIPs] });
});

// GET /admin/settings
router.get('/settings', admin, (req, res) => res.json(settings));

// PATCH /admin/settings
router.patch('/settings', admin, (req, res) => {
  const allowed = ['globalMargin', 'fxBuffer', 'allowedPayments', 'maintenanceMode'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  }
  return res.json(settings);
});

// PATCH /admin/products/:id
router.patch('/products/:id', admin, (req, res) => {
  const { id }  = req.params;
  const cfg     = productConfigs.get(id) || { id };
  const allowed = ['enabled', 'availability', 'margin'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) cfg[key] = req.body[key];
  }
  productConfigs.set(id, cfg);
  return res.json(cfg);
});

export default router;
