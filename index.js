/**
 * BridgeCards API — entry point.
 *
 * Responsibilities:
 *  1. Initialise the database (and wait for it to be ready).
 *  2. Seed the admin user on first run.
 *  3. Start the HTTP server.
 *
 * All application logic lives in src/.
 */

import crypto from 'crypto';
import app from './src/app.js';
import { initDb, getDbHandle, dbGetUser, dbSetUser } from './src/db/index.js';
import { PORT, SANDBOX, ADMIN_EMAIL, ADMIN_PASSWORD, validateRuntimeConfig } from './src/config.js';
import { log } from './src/utils/logger.js';
import { hashPassword } from './src/utils/crypto.js';

async function seedAdmin() {
  const email = ADMIN_EMAIL.toLowerCase();
  if (!await dbGetUser(email)) {
    await dbSetUser(email, {
      id: crypto.randomUUID(),
      firstName: 'Admin',
      lastName: 'BridgeCards',
      email,
      password: await hashPassword(ADMIN_PASSWORD),
      role: 'admin',
      createdAt: new Date().toISOString(),
      isBlocked: false,
      orderCount: 0,
      totalSpent: 0,
    });
    log('INFO', 'ADMIN_SEEDED', { email });
  }
}

async function start() {
  validateRuntimeConfig();

  // Initialise DB first so no requests can hit uninitialised storage.
  await initDb();
  await seedAdmin();

  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, resolve);
    server.on('error', reject);
  });

  const db = getDbHandle();
  log('INFO', 'STARTED', {
    port: PORT,
    sandbox: SANDBOX,
    version: '3.1.0',
    db: db?.isMongoose ? 'mongodb' : 'unavailable',
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
