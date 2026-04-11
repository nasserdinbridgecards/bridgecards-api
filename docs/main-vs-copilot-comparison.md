# Main vs Copilot Branch Comparison

Compared branches:

- Base: `main`
- Copilot branch found in the repository: `copilot/enhance-prompt-for-analysis`

Diff summary:

- 22 files changed
- 2854 insertions
- 1064 deletions
- Main architectural change: the single-file API in `index.js` was split into a modular `src/` structure

## What Was Problematic On `main`

### 1. The API was implemented as one large monolithic file

Problem:

- Almost all runtime logic lived in `index.js`
- Routing, auth, pricing, Stripe, Reloadly, email, logging, DB access, and startup were tightly coupled
- This made the code harder to maintain, test, and safely change

Fix:

- The copilot branch split the app into modules under `src/`

How it was fixed:

- `src/routes/` now contains `api.js`, `auth.js`, `orders.js`, and `admin.js`
- `src/services/` isolates pricing, FX, Reloadly, Stripe, and email logic
- `src/middleware/` contains auth and rate limiting
- `src/db/index.js` centralizes persistence logic
- `index.js` is now only responsible for startup, DB init, admin seeding, and server boot

### 2. Startup sequencing was unsafe

Problem:

- On `main`, `app.listen()` started first and only then called DB initialization and admin seeding inside the listen callback
- That creates a race where requests can arrive before storage is ready or before the admin user exists

Fix:

- The copilot branch initializes dependencies before opening the port

How it was fixed:

- `start()` now awaits `initDb()` and `seedAdmin()` first
- The server only begins listening after initialization succeeds
- Server startup now handles listen errors explicitly and exits on fatal startup failure

### 3. HTML email rendering was vulnerable to unescaped content

Problem:

- On `main`, invoice and email HTML interpolated values like email, product name, invoice number, and codes directly into markup
- That can allow HTML injection if any upstream value is not trusted

Fix:

- The copilot branch introduced escaping before injecting dynamic content into HTML emails

How it was fixed:

- `src/services/email.js` adds `escapeHtml()`
- `invoiceHtml()` now escapes rendered values
- Order confirmation, failure, chargeback, and code delivery email content now uses escaped values where needed

### 4. Stripe PaymentIntent IDs were not validated before use

Problem:

- On `main`, PaymentIntent IDs were inserted directly into Stripe URLs
- Malformed values could produce invalid upstream requests and weaker defensive handling

Fix:

- The copilot branch validates PaymentIntent IDs before calling Stripe

How it was fixed:

- `src/services/stripe.js` adds `validatePaymentIntentId()`
- `getPaymentIntent()` and `stripeRefund()` now reject malformed IDs before making requests

### 5. Refund reason handling was inconsistent

Problem:

- On `main`, `stripeRefund(piId, reason)` accepted a reason argument but always sent `reason: 'other'`
- That ignored the caller’s intent and reduced accuracy in refund tracing

Fix:

- The copilot branch passes through the provided refund reason

How it was fixed:

- `src/services/stripe.js` uses the function parameter when building the Stripe refund request

### 6. User order filtering had a real data access bug in the DB layer

Problem:

- On `main`, Mongo-backed `dbAllOrders()` only filtered by `status`
- Email and user filters used by `/orders/user` were ignored for MongoDB
- In-memory filtering also mixed email and user matching in a way that was broader than necessary
- Result: a user could receive the wrong order list depending on runtime storage mode

Fix:

- The copilot branch corrected filtering logic in both persistence paths

How it was fixed:

- `src/db/index.js` now applies `status`, `email`, and `userId` filters consistently for MongoDB
- In-memory filtering now explicitly evaluates `email` and `userId` criteria instead of relying on the previous mixed condition

### 7. Security hardening was minimal at the app level

Problem:

- On `main`, the app used CORS and JSON parsing but lacked general HTTP hardening headers
- There was no centralized global error handler

Fix:

- The copilot branch adds middleware-level hardening and centralized error handling

How it was fixed:

- `src/app.js` adds `helmet()` for standard security headers
- It adds a global rate limiter for all routes
- It adds a centralized Express error handler that logs unhandled failures and returns a consistent 500 response

### 8. Environment configuration was scattered through runtime code

Problem:

- On `main`, configuration values were declared inline inside the large entry file
- That makes validation, reuse, and auditing harder

Fix:

- The copilot branch moved runtime config into a dedicated module

How it was fixed:

- `src/config.js` now owns env loading and exports normalized configuration constants
- It also warns when `JWT_SECRET` is missing and falls back to a generated secret
- Startup logs a warning if `ADMIN_PASSWORD` is not explicitly set

### 9. Shared runtime state was spread across the entry file

Problem:

- On `main`, settings, blocked IPs, product overrides, and duplicate-order tracking were embedded in `index.js`
- That made reuse across routes and services more fragile

Fix:

- The copilot branch centralized shared process state

How it was fixed:

- `src/store.js` now exports `settings`, `productConfigs`, `blockedIPs`, and duplicate-order helpers

### 10. External integration logic was duplicated and harder to reason about

Problem:

- On `main`, timeout handling, Reloadly auth, FX updates, pricing, Stripe calls, and email logic were embedded in one file
- Operational fixes in one area risked accidental regressions elsewhere

Fix:

- The copilot branch extracted integration logic into focused service modules

How it was fixed:

- `src/utils/fetch.js` centralizes timeout-aware fetch behavior
- `src/services/reloadly.js` isolates supplier auth, product fetches, and order placement
- `src/services/fx.js` manages FX cache refresh and fallback behavior
- `src/services/pricing.js` isolates the trusted pricing formula
- `src/services/email.js` owns templates and invoice sending

### 11. Dependency and repository hygiene was incomplete

Problem:

- On `main`, there was no `.gitignore`
- `package-lock.json` was not present
- `helmet` was not installed even though the app would benefit from it

Fix:

- The copilot branch improved repo hygiene and dependency tracking

How it was fixed:

- Added `.gitignore` for `node_modules`, env files, and logs
- Added `package-lock.json` for deterministic installs
- Added `helmet` to `package.json`

## Main Fixes Introduced By Copilot

1. Refactored the API from one large file into a modular `src/` structure.
2. Fixed startup ordering so DB init and admin seeding happen before the server accepts traffic.
3. Added security headers with `helmet()` and centralized error handling.
4. Escaped HTML in invoice and email rendering to reduce injection risk.
5. Validated Stripe PaymentIntent IDs before Stripe API calls.
6. Corrected refund reason handling.
7. Fixed DB-layer order filtering for `email` and `userId`.
8. Centralized configuration, shared state, logging, and utility functions.
9. Added repository hygiene files and lockfile support.

## Notes

- This comparison is against `copilot/enhance-prompt-for-analysis`, which is the only branch in the repository matching the name `copilot`.
- The branch is not just a small bugfix branch. It is a large refactor plus a set of targeted safety and correctness fixes.