# BridgeCards Project and Business Overview

## What This Project Is

BridgeCards is a backend API for a digital gift card business.

The business model is:

- show customers gift card products
- calculate a sell price with margin and fees included
- collect payment from the customer
- place the gift card order with an upstream supplier
- deliver the card/code to the customer
- keep order history, invoices, and admin controls in one system

In practical terms, this project is the server that runs the store operations behind the customer-facing website or frontend.

## What The Business Does

The business appears to sell digital gift cards, likely cross-border or multi-currency, using an external supplier instead of holding its own direct gift card inventory.

The backend handles:

- customer registration and login
- admin access and internal controls
- product lookup and availability checks
- server-side pricing and profit margin calculation
- Stripe payment intent creation
- order creation and fulfillment
- invoice generation and email sending
- reporting for admins, including users, orders, fraud/error alerts, and settings

## Main User Journey

The intended flow is:

1. The frontend asks the API for products and pricing.
2. The API calculates trusted pricing on the server.
3. The frontend asks the API to create a Stripe payment intent.
4. The customer completes payment.
5. The frontend calls the order endpoint with the product, quantity, and payment intent reference.
6. The API verifies pricing and payment.
7. The API places the order with the gift card supplier.
8. The API stores the order, generates an invoice, and emails the customer.

## What The Codebase Is Doing

The current codebase is structured as a modular Node.js Express API.

Main areas:

- `src/routes/`: HTTP endpoints for public API, auth, orders, and admin
- `src/services/`: integration logic for Stripe, Reloadly, email, FX, and pricing
- `src/db/`: persistence layer using MongoDB when configured, otherwise in-memory storage
- `src/middleware/`: auth and rate limiting
- `src/utils/`: crypto, logging, and fetch helpers
- `src/store.js`: in-process settings and temporary shared state

The `index.js` file is now only the startup entry point.

## Business Rules Implemented In Code

Based on the current implementation, the main business rules are:

- prices are supposed to be calculated on the server, not trusted from the frontend
- Stripe fees are included in the final sell price
- an extra profit margin is added above supplier cost
- admins can override product availability and margin
- users can be blocked
- IP addresses can be blocked
- invoices are generated per order
- order statuses move through values like `pending`, `paid`, `processing`, `delivered`, `failed`, and `refunded`

## External Integrations

This project integrates with several outside services.

### 1. Reloadly

Provider:

- Reloadly

Purpose:

- product catalog lookup
- supplier pricing inputs such as denomination, currency, and discount
- gift card order placement and fulfillment

How it is implemented:

- direct HTTP calls using `fetch`
- OAuth token flow for Reloadly auth
- product fetch and order placement live in `src/services/reloadly.js`

What this means for the business:

- BridgeCards is acting as a reseller layer on top of Reloadly's gift card infrastructure

### 2. Stripe

Provider:

- Stripe

Purpose:

- collecting customer card payments
- creating payment intents
- validating payment status
- issuing refunds when orders fail or payment mismatches happen

How it is implemented:

- direct HTTP calls to Stripe API using `fetch`
- payment logic lives in `src/services/stripe.js`
- API endpoints are exposed through `src/routes/api.js` and order verification in `src/routes/orders.js`

What this means for the business:

- Stripe is the payment processor for customer checkout

### 3. SendGrid

Provider:

- Twilio SendGrid

Purpose:

- transactional email delivery
- invoice emails
- order confirmations
- failure notices
- internal alerts such as chargeback notifications

How it is implemented:

- direct HTTP calls to SendGrid API using `fetch`
- email rendering and sending live in `src/services/email.js`

What this means for the business:

- customer communication and invoicing are automated through email

### 4. Exchange Rate API

Providers:

- ExchangeRate-API when `FX_API_KEY` is configured
- `open.er-api.com` as fallback

Purpose:

- currency conversion support for pricing gift cards in USD terms

How it is implemented:

- FX fetching and cache logic live in `src/services/fx.js`

What this means for the business:

- pricing can adapt across different supplier currencies and include a configurable FX buffer

### 5. MongoDB

Provider:

- MongoDB, accessed through Mongoose

Purpose:

- persistent storage for users and orders

How it is implemented:

- if `MONGODB_URI` is configured, the app uses MongoDB
- otherwise it falls back to in-memory storage
- DB code lives in `src/db/index.js`

What this means for the business:

- production should use MongoDB, otherwise order history can be lost on restart

## What Is Built Internally Versus Externally

Built internally in this repository:

- auth flow using custom JWT logic
- pricing engine
- order orchestration
- admin endpoints and controls
- invoice generation
- integration wrappers around vendor APIs

Provided by external companies:

- payments: Stripe
- gift card supplier operations: Reloadly
- transactional email: SendGrid
- exchange rates: ExchangeRate-API or `open.er-api.com`
- database platform: MongoDB

## Who Made What

There are two separate meanings of "who" here.

### 1. Which company provides each integration

- Stripe provides payment processing
- Reloadly provides gift card supplier APIs
- SendGrid provides email delivery
- ExchangeRate-API and `open.er-api.com` provide FX data
- MongoDB provides the database platform

### 2. Who changed the code in this repository

Based on git history visible in this repository:

- the original monolithic business logic and several feature commits were authored by `nasserdinbridgecards`
- the modular `src/` refactor and recent hardening commits on the current branch were authored by `copilot-swe-agent[bot]`

Important limitation:

- git history can prove what commit author names are recorded in the repository
- git history cannot prove whether some code was originally drafted by a "vibe coder", Claude, or another AI outside the repo unless that information was explicitly committed or documented

## Likely Project Evolution

From repository history, the project appears to have evolved like this:

1. A single-file backend was built first in `index.js`.
2. Business features were added directly into that monolith, including pricing, orders, email, and invoices.
3. The current branch refactored the monolith into a `src/` architecture.
4. The current branch also added hardening such as better startup handling, `helmet`, and safer HTML handling.

## Current Strengths

- clear business purpose
- modular backend structure
- multiple integrations already wired in
- admin controls for operations
- server-side pricing model instead of pure frontend trust

## Current Risks To Be Aware Of

- payment success and order creation are still not fully reconciled by webhook-driven recovery
- if MongoDB is not configured, data is only stored in memory
- the business depends heavily on external providers, especially Reloadly and Stripe
- there is custom auth and custom pricing logic, which means correctness and auditing matter a lot

## Short Plain-English Summary

This project is the backend for a digital gift card reseller business. It uses Reloadly to source and fulfill gift cards, Stripe to take payment, SendGrid to send invoices and customer emails, and optional MongoDB to store users and orders. The older version of the system was a single large file, and the current branch reorganizes it into a more maintainable `src/` architecture.