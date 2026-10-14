# Essential Products

An online store for everyday household essentials (cleaning towels, garbage bags and cooking oil) for customers in India. Prices are in INR.

**Stack:** Next.js 16 (App Router, TypeScript, Tailwind CSS) · Supabase (Postgres, Auth, Row Level Security, Storage) · Razorpay · deploys to Vercel.

👉 **New here? Follow [SETUP.md](SETUP.md)**. It's a step-by-step guide from installing Node.js to accepting live payments.

## Features

- Home page with hero, categories and featured products; category pages; product pages with stock status
- Product search
- Cart for guests (saved in the browser) that merges into the account cart on login
- Email + password accounts with sign up, login, logout, and forgot/reset password
- Checkout with saved Indian addresses (PIN code and mobile validation) and Razorpay (UPI, cards, netbanking)
- Order confirmation and My Orders history
- Admin panel: add/edit products (price, MRP, stock, images, visibility) and manage order status
- Mobile-first, white and red design

## Payment security

- Totals are calculated **on the server from database prices**. Prices sent by the browser are never trusted.
- Razorpay orders are created on the server, in paise.
- Payment signatures are verified on the server (HMAC-SHA256) before an order is marked paid.
- A signed webhook (`payment.captured`, `payment.failed`, `order.paid`) acts as a backup.
- Stock is reduced only after a successful payment, atomically and exactly once (`mark_order_paid` in `supabase/003_functions_triggers.sql`).
- Secrets are only used on the server; Row Level Security is enabled on every table.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your keys (see SETUP.md step 5)
npm run dev                  # http://localhost:3000
```

Run the SQL files in `supabase/` (001 → 005) in the Supabase SQL Editor first.

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the code |
