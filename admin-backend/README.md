# Admin Backend

Express + Prisma + PostgreSQL (Neon) API built to match your existing admin
frontend's exact expectations — field names, routes, and all.

This **replaces** the earlier `pos-backend` scaffold, which didn't match this
frontend's contract (different field names: `basePrice` vs `price`,
`quantity` vs `stock`, different routes entirely).

## Entities
- **User**: firstName/lastName/email/password, roles ADMIN/STAFF/CASHIER/AUDITOR
- **Category**: name/slug/description, optional parent (for nesting)
- **Product**: basePrice, costPrice, quantity, lowStockThreshold, sku, featuredImageUrl, status
- **Contact**
- **Order** + **OrderItem**: orderNumber, grandTotal, paymentMethod (cash/mpesa/card), paymentStatus (pending/paid/failed), channel

## Routes (all match your frontend's `apiFetch`/`api.get` calls exactly)

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | none | Returns `{ token, user }` |
| GET | `/api/admin/users` | ADMIN | |
| POST | `/api/admin/users` | ADMIN | Create user with role |
| PUT | `/api/admin/users/:id/role` | ADMIN | |
| GET/POST/PUT/DELETE | `/api/contacts` | any authenticated | |
| GET/POST/PUT/DELETE | `/api/categories` | GET: any, writes: ADMIN | |
| GET/POST/PUT/DELETE | `/api/products` | GET: any, writes: ADMIN/STAFF | Query: `search`, `categoryId`, `limit` |
| GET | `/api/orders` | any authenticated | Query: `status`, `search` |
| GET | `/api/orders/:id` | any authenticated | |
| POST | `/api/orders/pos` | any authenticated | Transactional checkout, decrements stock |
| POST | `/api/mpesa/stkpush` | any authenticated | **Simulated** — auto-marks paid after 5s |
| GET | `/api/mpesa/status/:orderId` | any authenticated | Polled by the POS page |
| POST | `/api/pesapal/initiate` | any authenticated | **Simulated** — returns placeholder redirect URL |
| GET | `/api/dashboard` | any authenticated | Powers `useDashboardData` — sales, profit, charts, low stock, etc. |

## ⚠️ M-Pesa & Pesapal are in simulation mode

Real STK push and Pesapal hosted-redirect both need live credentials
(Safaricom Daraja app, Pesapal merchant account) which I don't have. Both
controllers are structured with clear `TODO` comments showing exactly where
to plug in the real API calls — search for `MPESA_SIMULATE` and
`PESAPAL_SIMULATE` in `.env`. Right now:
- M-Pesa STK push auto-marks the order **paid** after 5 seconds (simulates the customer entering their PIN)
- Pesapal returns a placeholder URL instead of a real hosted checkout page

This lets your whole POS flow work end-to-end for testing/demo purposes.
When you're ready to go live, set `MPESA_SIMULATE=false` /
`PESAPAL_SIMULATE=false` and fill in the real credentials — I can wire up
the actual Daraja/Pesapal calls at that point.

## ⚠️ No expense tracking yet

`profit.expenses` always returns 0 — there's no expenses table. If you want
real expense tracking (e.g. rent, salaries) feeding into the profit
calculation, that's a small additional model + a few endpoints away.

## Setup

### 1. Install dependencies
```
npm install
```

### 2. Environment
Copy `.env.example` to `.env`. Fill in `DATABASE_URL` / `DIRECT_URL` from
your Neon dashboard (pooled + direct connection strings), plus `JWT_SECRET`.
Leave `MPESA_SIMULATE=true` / `PESAPAL_SIMULATE=true` for now.

### 3. Migrate + seed
```
npx prisma migrate dev --name init
npm run seed
```
Creates an admin login: **admin@minimingle.com** / **admin123**

### 4. Run
```
npm run dev
```
API runs on `http://localhost:5000`. Your Next.js `next.config.js` already
rewrites `/api/:path*` to this, so the frontend just works once both are running.

## Frontend fix included

Your `src/lib/api.tsx` currently contains the wrong content (a duplicate of
the point-of-sale page, not API functions) — nothing in the app can
actually fetch data right now. Replace it with `api.tsx` from this package,
which implements:
- `apiFetch(path, options)` — used by most pages
- `fetchDashboardData()` — used by `useDashboardData`
- default export `api` — an axios instance, used by `products.tsx`

Also replaced: `src/lib/export.tsx` had `new blob(...)` (lowercase — `blob`
isn't a global, `Blob` is) which would crash on use. Fixed to `new Blob(...)`.
