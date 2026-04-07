# BridgeCards API

## Quick start

```bash
npm install
PORT=3000 node index.js
```

Base URL:

```bash
export BASE_URL="http://localhost:3000"
```

---

## Auth setup for testing

### 1) Register a customer

```bash
curl -sS -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Test",
    "lastName":"User",
    "email":"user@example.com",
    "password":"Passw0rd!"
  }'
```

Save token from response as `USER_TOKEN`.

### 2) Login as admin (seeded account)

By default the server seeds an admin with:
- email: `admin@bridgecards.org` (or `ADMIN_EMAIL` env var)
- password: `Admin@BridgeCards2026!` (or `ADMIN_PASSWORD` env var)

```bash
curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bridgecards.org","password":"Admin@BridgeCards2026!"}'
```

Save token from response as `ADMIN_TOKEN`.

---

## Endpoint list + how to test

## Public/API endpoints

### GET `/api/health`
Returns service health, mode, version, and db type.

```bash
curl -sS "$BASE_URL/api/health"
```

### GET `/api/stripe-key`
Returns Stripe publishable key.

```bash
curl -sS "$BASE_URL/api/stripe-key"
```

### GET `/api/fx-rates`
Returns FX rates cache and update timestamp.

```bash
curl -sS "$BASE_URL/api/fx-rates"
```

### GET `/api/settings`
Returns public settings (`allowedPayments`, `maintenanceMode`).

```bash
curl -sS "$BASE_URL/api/settings"
```

### GET `/api/availability`
Returns product availability overrides set by admin.

```bash
curl -sS "$BASE_URL/api/availability"
```

### POST `/api/price`
Server-side trusted pricing for a product/denomination.

```bash
curl -sS -X POST "$BASE_URL/api/price" \
  -H "Content-Type: application/json" \
  -d '{"productId":"12345","denomination":10}'
```

### GET `/api/products`
Lists Reloadly products (filtered by admin enable/disable config if present).

```bash
curl -sS "$BASE_URL/api/products"
```

### POST `/api/check-product`
Checks if product is available/active.

```bash
curl -sS -X POST "$BASE_URL/api/check-product" \
  -H "Content-Type: application/json" \
  -d '{"productId":"12345"}'
```

### POST `/api/create-payment-intent`
Creates a Stripe payment intent.

```bash
curl -sS -X POST "$BASE_URL/api/create-payment-intent" \
  -H "Content-Type: application/json" \
  -d '{"amount":15.99,"currency":"usd","email":"user@example.com","productId":"12345"}'
```

### POST `/api/stripe-webhook`
Stripe webhook endpoint (raw body + stripe signature validation if configured).

```bash
curl -sS -X POST "$BASE_URL/api/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"ping"}'
```

---

## Authentication endpoints

### POST `/auth/register`
Registers a user.

```bash
curl -sS -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"A","lastName":"B","email":"new@example.com","password":"Passw0rd!"}'
```

### POST `/auth/login`
Logs in an existing user.

```bash
curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"Passw0rd!"}'
```

### GET `/auth/me`
Returns authenticated user profile.

```bash
curl -sS "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

## Order endpoints

### POST `/orders`
Creates an order, validates pricing/payment, and triggers fulfillment.

```bash
curl -sS -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId":"12345",
    "quantity":1,
    "paymentMethod":"visa-card",
    "paymentIntentId":"pi_example",
    "unitPrice":10
  }'
```

### GET `/orders/user`
Returns current user orders (codes masked as `hasCodes`).

```bash
curl -sS "$BASE_URL/orders/user" \
  -H "Authorization: Bearer $USER_TOKEN"
```

### GET `/orders/user/:id`
Returns one user order.

```bash
curl -sS "$BASE_URL/orders/user/ORDER_ID" \
  -H "Authorization: Bearer $USER_TOKEN"
```

### GET `/orders/user/:id/invoice`
Returns invoice HTML for that order.

```bash
curl -sS "$BASE_URL/orders/user/ORDER_ID/invoice" \
  -H "Authorization: Bearer $USER_TOKEN"
```

### GET `/orders/admin`
Admin list/orders pagination.

```bash
curl -sS "$BASE_URL/orders/admin?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### PATCH `/orders/:id`
Admin updates order status/notes.

```bash
curl -sS -X PATCH "$BASE_URL/orders/ORDER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"processing","notes":"manual review done"}'
```

---

## Admin endpoints

### GET `/admin/stats`
Admin dashboard stats, fx snapshot, and recent fraud alerts.

```bash
curl -sS "$BASE_URL/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### GET `/admin/users`
Lists users (password removed).

```bash
curl -sS "$BASE_URL/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### PATCH `/admin/users/:email`
Blocks/unblocks user or changes role.

```bash
curl -sS -X PATCH "$BASE_URL/admin/users/user@example.com" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isBlocked":true,"role":"customer"}'
```

### POST `/admin/block-ip`
Blocks/unblocks an IP.

```bash
curl -sS -X POST "$BASE_URL/admin/block-ip" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip":"203.0.113.8","block":true}'
```

### GET `/admin/settings`
Gets internal settings object.

```bash
curl -sS "$BASE_URL/admin/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### PATCH `/admin/settings`
Updates margin/fx/payment settings.

```bash
curl -sS -X PATCH "$BASE_URL/admin/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"globalMargin":0.15,"fxBuffer":0.04,"maintenanceMode":false}'
```

### PATCH `/admin/products/:id`
Overrides product config (`enabled`, `availability`, `margin`).

```bash
curl -sS -X PATCH "$BASE_URL/admin/products/12345" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled":true,"availability":"in-stock","margin":0.2}'
```

---

## Optional quick smoke script

```bash
# 1) health
curl -sS "$BASE_URL/api/health"

# 2) register
REGISTER_RESP=$(curl -sS -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Smoke","lastName":"Test","email":"smoke@example.com","password":"Passw0rd!"}')

# 3) login
LOGIN_RESP=$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@example.com","password":"Passw0rd!"}')

# 4) me (replace token extraction as needed)
# USER_TOKEN=...
# curl -sS "$BASE_URL/auth/me" -H "Authorization: Bearer $USER_TOKEN"
```
