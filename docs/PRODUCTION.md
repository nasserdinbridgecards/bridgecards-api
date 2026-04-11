# Production Runbook

## Purpose

This document describes how to run BridgeCards safely in production after the recent changes to persistence, payment handling, and logging.

## Required Environment Variables

These are required for production startup:

- `NODE_ENV=production`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RELOADLY_CLIENT_ID`
- `RELOADLY_CLIENT_SECRET`

Optional but recommended:

- `SENDGRID_API_KEY`
- `FROM_EMAIL`
- `FX_API_KEY`
- `MIN_PROFIT_MARGIN`
- `RELOADLY_SANDBOX=false`

Startup validation for these values is implemented in [src/config.js](c:/Users/Onyx/Desktop/Projects/bridgecards-api/src/config.js).

## Production Rules

1. Do not run without MongoDB.
2. Do not run without Stripe webhook configuration.
3. Do not use generated secrets or fallback passwords.
4. Do not expose the app directly to the internet without a reverse proxy or load balancer.
5. Enable backups for MongoDB before first live traffic.

## Deployment Steps

1. Install dependencies.

```bash
npm install --omit=dev
```

2. Set production environment variables.

3. Run the data backfill and index sync once before live rollout.

```bash
npm run migrate:prod-data
```

4. Start the API.

```bash
npm start
```

5. Verify health.

```bash
curl -sS http://localhost:3000/api/health
```

Expected `db` value should be `mongodb`.

## Stripe Production Setup

Create a Stripe webhook endpoint that points to:

```text
https://your-domain.example/api/stripe-webhook
```

Subscribe at minimum to:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`

Why:

- `payment_intent.succeeded` marks pending orders as paid
- `payment_intent.payment_failed` marks failed payments in the database
- `charge.dispute.created` creates operational alerts

Webhook reconciliation is implemented in [src/routes/api.js](c:/Users/Onyx/Desktop/Projects/bridgecards-api/src/routes/api.js).

## MongoDB Collections and Schema Changes

This codebase uses Mongoose models, not SQL migrations.

Current collections:

- `users`
- `orders`
- `logs`

### Users

Main fields:

- `id`
- `firstName`
- `lastName`
- `email`
- `password`
- `role`
- `createdAt`
- `isBlocked`
- `orderCount`
- `totalSpent`

### Orders

Main fields:

- `id`
- `userId`
- `email`
- `productId`
- `productName`
- `quantity`
- `unitPrice`
- `totalAmount`
- `invoiceNo`
- `invoiceIssuedAt`
- `paymentMethod`
- `paymentIntentId`
- `status`
- `codes`
- `reloadlyOrderId`
- `createdAt`
- `updatedAt`
- `error`
- `adminNotes`

Newer operational status values used by the app include:

- `pending_payment`
- `paid`
- `processing`
- `delivered`
- `failed`
- `refunded`

### Logs

Main fields:

- `ts`
- `level`
- `action`
- `orderId`
- `paymentIntentId`
- additional dynamic fields from the log payload

Log persistence is implemented in [src/utils/logger.js](c:/Users/Onyx/Desktop/Projects/bridgecards-api/src/utils/logger.js) and [src/db/index.js](c:/Users/Onyx/Desktop/Projects/bridgecards-api/src/db/index.js).

## How Schema Changes Are Applied

This project currently uses additive MongoDB schema evolution:

1. Model definitions are updated in code.
2. Mongoose creates or syncs indexes on boot.
3. A one-time backfill script normalizes existing documents where needed.

Automatic index sync now runs during DB initialization in [src/db/index.js](c:/Users/Onyx/Desktop/Projects/bridgecards-api/src/db/index.js).

The one-time backfill script is:

- [scripts/backfill-prod-data.js](c:/Users/Onyx/Desktop/Projects/bridgecards-api/scripts/backfill-prod-data.js)

It does three things:

1. fills missing operational fields on old orders
2. fills missing counters/flags on old users
3. syncs MongoDB indexes for `users`, `orders`, and `logs`

## Recommended Rollout Sequence

1. Deploy code to staging with production-like env vars.
2. Run `npm run migrate:prod-data` in staging.
3. Test Stripe payment success and failure webhooks.
4. Test one real order end-to-end.
5. Verify data in `orders` and `logs` collections.
6. Repeat the same process in production.

## Minimum Post-Deploy Checks

1. `/api/health` returns `mongodb`.
2. Payment intent creation stores a `pending_payment` order.
3. Stripe success webhook moves the order to `paid`.
4. Order placement moves the order to `processing` or `delivered`.
5. Failed payments or supplier failures are visible in the `logs` collection.

## Operational Advice

1. Enable MongoDB backups and point-in-time recovery if available.
2. Add monitoring for failed Stripe webhooks.
3. Add alerting for repeated `ORDER_ERR`, `WEBHOOK_PAYMENT_FAILED`, and `DB_MONGODB_FAILED` log actions.
4. Review logs by `paymentIntentId` and `orderId` whenever a customer claims they were charged but did not receive delivery.