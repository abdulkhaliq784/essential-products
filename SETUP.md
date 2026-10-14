# Essential Products: Setup Guide

This guide walks you through everything you need to do to get the store running: on your computer first, then live on the internet. Follow the steps in order. Each step tells you exactly where to click.

**What you'll set up**

| Service | What it does | Cost to start |
|---|---|---|
| **Supabase** | Database, user accounts (login/sign-up), product image storage | Free plan |
| **Razorpay** | Takes payments (UPI, cards, netbanking) | Free; fee per live payment |
| **Vercel** | Hosts the website on the internet | Free (Hobby) plan |
| **GitHub** | Stores your code (already set up) | Free |

> ⏱ Plan for about 1–2 hours the first time.

---

## Contents

1. [Install the prerequisites](#1-install-the-prerequisites)
2. [Create the Supabase project and run the SQL](#2-create-the-supabase-project-and-run-the-sql)
3. [Configure Supabase Auth (emails and redirect URLs)](#3-configure-supabase-auth)
4. [Create a Razorpay account and get test keys](#4-create-a-razorpay-account-and-get-test-keys)
5. [Fill in `.env.local`](#5-fill-in-envlocal)
6. [Run the site locally and test a purchase](#6-run-the-site-locally-and-test-a-purchase)
7. [Make your account an admin](#7-make-your-account-an-admin)
8. [Deploy to Vercel](#8-deploy-to-vercel)
9. [Switch Razorpay from test mode to live mode](#9-switch-razorpay-to-live-mode)
10. [Troubleshooting](#10-troubleshooting)

Appendix: [Pushing code to GitHub](#appendix-a-pushing-code-to-github) · [How the project is organised](#appendix-b-how-the-project-is-organised) · [Things to replace before launch](#appendix-c-before-you-launch)

---

## 1. Install the prerequisites

### 1.1 Node.js (version 20.9 or newer; 22 or 24 LTS recommended)

1. Go to <https://nodejs.org> and download the **LTS** version for Windows.
2. Run the installer and keep all the default options.
3. Open a **new** terminal in VS Code (**Terminal → New Terminal**) and check:

   ```bash
   node --version    # should print v20.9.0 or higher (e.g. v24.13.0)
   npm --version
   ```

### 1.2 Git

Git is already installed on this computer. If you set up on a different computer, install it from <https://git-scm.com/download/win> with the default options, then restart VS Code.

### 1.3 Install the project's packages

In the VS Code terminal, inside the project folder:

```bash
npm install
```

This downloads everything the project needs into a `node_modules` folder. It takes a minute or two.

> **OneDrive note:** this project lives inside your OneDrive folder. OneDrive tries to sync `node_modules` and `.next`, which are thousands of files, and that can make things slow or cause `EPERM` / `EBUSY` errors. If that happens, either **pause OneDrive syncing** while you work (click the OneDrive cloud icon in the taskbar → ⚙ → Pause syncing), or move the project folder somewhere outside OneDrive, such as `C:\Projects\essential-products`.

---

## 2. Create the Supabase project and run the SQL

### 2.1 Create the project

1. Go to <https://supabase.com> and sign up (signing in with GitHub is easiest).
2. Click **New project**.
3. Fill in:
   - **Name:** `essential-products`
   - **Database password:** click *Generate a password* and **save it somewhere safe** (a password manager).
   - **Region:** choose **South Asia (Mumbai)** so the site is fast for Indian customers.
4. Click **Create new project** and wait about 2 minutes for it to finish setting up.

### 2.2 Find your URL and keys

1. In your project, click the **⚙ Project Settings** (gear icon, bottom left), then **API Keys** (or **Data API** / **API**, depending on the dashboard version).
2. You need three values. Keep this tab open; you'll paste them in step 5.

| Value | Where to find it | Goes into |
|---|---|---|
| **Project URL** | Project Settings → **Data API** (looks like `https://abcdxyz.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| **Publishable key** *(or legacy **anon public** key)* | Project Settings → **API Keys** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secret key** *(or legacy **service_role** key)* | Project Settings → **API Keys** → click *Reveal* | `SUPABASE_SERVICE_ROLE_KEY` |

> 🔐 The **secret / service_role key bypasses all security rules**. Never share it, never put it in `.env.example`, never commit it to GitHub, and never put it in a variable starting with `NEXT_PUBLIC_`.
>
> Newer Supabase projects show *publishable* (`sb_publishable_…`) and *secret* (`sb_secret_…`) keys. Older ones show *anon* and *service_role* keys under **Legacy API keys**. Either pair works with this project.

### 2.3 Run the SQL files in order

The `supabase/` folder in the project contains five SQL files. Run them **one at a time, in this order**:

| # | File | What it does |
|---|---|---|
| 1 | `001_schema.sql` | Creates all the tables (products, orders, carts, …) |
| 2 | `002_rls_policies.sql` | Turns on Row Level Security so customers only see their own data |
| 3 | `003_functions_triggers.sql` | Auto-creates profiles on sign-up; the safe "mark order paid" function; search |
| 4 | `004_seed.sql` | Adds the 3 categories and 9 sample products |
| 5 | `005_storage.sql` | Creates the `product-images` storage bucket for admin image uploads |

For each file:

1. In Supabase, click **SQL Editor** (left sidebar) → **+ New query**.
2. In VS Code, open the file (e.g. `supabase/001_schema.sql`), press **Ctrl+A** then **Ctrl+C** to copy everything.
3. Paste it into the Supabase SQL editor and click **Run** (or press **Ctrl+Enter**).
4. You should see **"Success. No rows returned"**. If Supabase warns about "destructive operations", that's expected (the files drop and recreate their own policies and triggers), so click **Run this query**.
5. Repeat for the next file.

**Check it worked:** click **Table Editor** in the sidebar. You should see tables such as `products` (with 9 rows) and `categories` (with 3 rows).

> All five files are safe to run again if something goes wrong halfway. Re-running the seed file **won't** overwrite products you've edited.

---

## 3. Configure Supabase Auth

### 3.1 Site URL and Redirect URLs

These tell Supabase where to send people after they click links in emails (confirm sign-up, reset password).

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:** `http://localhost:3000` (you'll change this to your live address in step 8).
3. Under **Redirect URLs**, click **Add URL** and add:

   ```
   http://localhost:3000/**
   ```

4. Click **Save**.

### 3.2 Email + password sign-in

1. Supabase → **Authentication** → **Sign In / Providers** (called **Providers** in some versions) → **Email**.
2. Make sure **Email** is **enabled**.
3. **Confirm email:**
   - **ON** (recommended for the live site): new users must click a link in their email before they can log in.
   - **OFF** (handy while testing): users are logged in immediately after signing up.

> ⚠️ **Email limits:** Supabase's built-in email service only sends a **few emails per hour** and is meant for testing. Before launch, connect your own email provider: **Authentication → Emails → SMTP Settings**. Free options include Resend, Brevo and Zoho ZeptoMail. Otherwise customers may not receive confirmation or reset emails.

### 3.3 (Recommended) Make email links work in any browser

By default, a password-reset link only works when it's opened in the **same browser** that requested it. Many people request on their laptop and open the email on their phone. To make links work everywhere:

1. Supabase → **Authentication** → **Emails** → **Templates**.
2. **Confirm signup** template: replace the link line with:

   ```html
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/">Confirm your email</a></p>
   ```

3. **Reset Password** template: replace the link line with:

   ```html
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a></p>
   ```

4. Click **Save** on each.

The site supports both link styles, so this step is optional but recommended.

---

## 4. Create a Razorpay account and get test keys

### 4.1 Sign up

1. Go to <https://razorpay.com> → **Sign Up** and create an account with your email and mobile number.
2. You can use **Test Mode** right away, with no KYC or business documents needed. KYC is only needed later for live payments (step 9).

### 4.2 Get your test API keys

1. Log in to the **Razorpay Dashboard** (<https://dashboard.razorpay.com>).
2. Make sure the toggle at the top says **Test Mode**.
3. Go to **Account & Settings** → **API Keys** (under *Website and app settings*).
4. Click **Generate Test Key** (or **Regenerate**).
5. A popup shows the **Key ID** (`rzp_test_…`) and the **Key Secret**. **Download or copy both now.** Razorpay only shows the secret once.

| Value | Goes into |
|---|---|
| Key ID | `RAZORPAY_KEY_ID` |
| Key Secret | `RAZORPAY_KEY_SECRET` |

### 4.3 Choose a webhook secret

A webhook is a message Razorpay sends to your website when a payment succeeds or fails. It's a backup in case the customer closes the browser before the payment is confirmed.

1. Make up a long random password for the webhook, for example by running this in the VS Code terminal:

   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```

2. Save it. It goes into `RAZORPAY_WEBHOOK_SECRET`.

Razorpay can only send webhooks to a **public** internet address, not `localhost`. So you'll **create the webhook in the Razorpay dashboard in step 8**, after the site is deployed. Local testing still works without it, because the site also confirms payments directly in the browser flow. To test webhooks locally, see [Testing webhooks locally](#testing-webhooks-locally-optional).

---

## 5. Fill in `.env.local`

`.env.local` holds your secret keys. It is listed in `.gitignore`, so it **never** gets uploaded to GitHub.

1. In VS Code, if there is no `.env.local` file in the project root yet, copy `.env.example` and rename the copy to `.env.local`.
2. Open `.env.local` and fill in your values:

```bash
# Supabase (step 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://abcdxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...        # or the legacy anon key (eyJ...)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...                 # or the legacy service_role key (eyJ...)

# Razorpay (step 4)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=the-random-string-you-generated

# Site address
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Save the file.

Rules to remember:

- No quotes and no spaces around `=`.
- **Restart** `npm run dev` after changing `.env.local`; changes aren't picked up while it's running.
- Real keys go in **`.env.local` only**, never in `.env.example` (which *is* uploaded to GitHub).
- If your `.env.local` has an old `NEXT_PUBLIC_RAZORPAY_KEY_ID` line, you can delete it. It's no longer used.

---

## 6. Run the site locally and test a purchase

### 6.1 Start the site

```bash
npm run dev
```

Open <http://localhost:3000> in your browser. You should see the home page with the 3 categories and featured products.

To stop the server, click the terminal and press **Ctrl+C**.

### 6.2 Test a full purchase (test mode, no real money)

1. **Browse as a guest:** open a product and click **Add to cart**. The cart icon in the header shows the item count.
2. **Sign up:** click **Login → Create an account**.
   - If *Confirm email* is ON, click the link in the email you receive.
   - Your guest cart is automatically moved into your account after you log in.
3. **Checkout:** go to **Cart → Proceed to checkout**.
4. **Add a delivery address:** use a 10-digit mobile number starting with 6–9 and a 6-digit PIN code, for example `9876543210` and `560001`.
5. Click **Pay ₹…**. The Razorpay payment window opens, showing **Test Mode**.
6. Pay with one of these **test** methods:

   | Method | What to enter | Result |
   |---|---|---|
   | **UPI** (easiest) | UPI ID `success@razorpay` | ✅ Payment succeeds |
   | UPI | UPI ID `failure@razorpay` | ❌ Payment fails |
   | Card | A test card from <https://razorpay.com/docs/payments/payments/test-card-details/>, any future expiry date, any CVV | ✅ Succeeds (choose *Success* on the bank page) |
   | Netbanking | Pick any bank | Choose *Success* or *Failure* on the test bank page |

7. After a successful payment you land on the **Order confirmed** page.
8. Check **Account → My orders**: the order shows as **Paid**.
9. Check the product's stock has gone down: Supabase → **Table Editor → products**, or the admin panel.
10. In the Razorpay Dashboard (Test Mode) → **Transactions → Payments**, you'll see the test payment.

**Also try:** close the payment window without paying. You should see "Payment was cancelled", your cart is still there, and you can pay again.

---

## 7. Make your account an admin

1. Sign up on the site with the email you want to use as admin (if you haven't already).
2. In Supabase, open the **SQL Editor** → **+ New query** and run this, with your own email in place of the example:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

   It should say **"Success. 1 rows affected"**. If it says *0 rows*, check the email is exactly the one you signed up with.

3. On the website, **log out and log in again** (or just refresh the page).
4. Click your name in the header → **Admin panel** (or go to <http://localhost:3000/admin>).

In the admin panel you can:

- **Products:** add new products, edit names, descriptions, prices (in ₹), MRP, stock, images, and hide or feature products. To stop selling a product, untick **Active** instead of deleting it.
- **Orders:** see all paid orders, filter by status, open an order to see items, address and payment, and change the status (Paid → Processing → Shipped → Delivered, or Cancelled).

To remove admin rights later, run the same SQL with `set role = 'customer'`.

---

## 8. Deploy to Vercel

### 8.1 Make sure your code is on GitHub

See [Appendix A](#appendix-a-pushing-code-to-github). All your code needs to be pushed to the `main` branch of <https://github.com/abdulkhaliq784/essential-products>.

### 8.2 Import the project into Vercel

1. Go to <https://vercel.com> → **Sign Up** → **Continue with GitHub**.
2. Click **Add New… → Project**.
3. Find **essential-products** in the list and click **Import**. If it's not listed, click *Adjust GitHub App Permissions* and give Vercel access to the repo.
4. The **Framework Preset** should say **Next.js**. Leave the build settings as they are.
5. Open **Environment Variables** and add **every** variable from your `.env.local`, one by one (the name on the left, the value on the right):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | same as local |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as local |
   | `SUPABASE_SERVICE_ROLE_KEY` | same as local |
   | `RAZORPAY_KEY_ID` | same as local (test key for now) |
   | `RAZORPAY_KEY_SECRET` | same as local |
   | `RAZORPAY_WEBHOOK_SECRET` | same as local |
   | `NEXT_PUBLIC_SITE_URL` | `https://essential-products.vercel.app` *(your Vercel address; you can fix it after the first deploy)* |

   Tip: you can paste the whole contents of `.env.local` into the first *Key* box and Vercel will split it into separate variables automatically. Then change `NEXT_PUBLIC_SITE_URL`.

6. Click **Deploy** and wait 1–3 minutes.
7. When it finishes, Vercel shows your live address, e.g. `https://essential-products-abc123.vercel.app`. Under **Settings → Domains** you'll see the main production domain. Use that one.
8. If the address differs from what you entered for `NEXT_PUBLIC_SITE_URL`, go to **Settings → Environment Variables**, edit it, then **Deployments → ⋯ → Redeploy**.

> Every time you push to `main` on GitHub, Vercel redeploys automatically.

### 8.3 Update Supabase for the live address

Supabase → **Authentication → URL Configuration**:

1. **Site URL:** change it to your live address, e.g. `https://essential-products.vercel.app`.
2. **Redirect URLs:** keep `http://localhost:3000/**` (so local testing still works) and **add** your live address:

   ```
   https://essential-products.vercel.app/**
   ```

3. Click **Save**.

### 8.4 Create the Razorpay webhook

1. Razorpay Dashboard (still in **Test Mode**) → **Account & Settings** → **Webhooks** → **+ Add New Webhook**.
2. Fill in:
   - **Webhook URL:** `https://essential-products.vercel.app/api/webhooks/razorpay` (your live address + `/api/webhooks/razorpay`)
   - **Secret:** the exact same value as `RAZORPAY_WEBHOOK_SECRET`
   - **Alert email:** your email (Razorpay emails you if the webhook keeps failing)
   - **Active events:** tick **`payment.captured`**, **`payment.failed`** and **`order.paid`**
3. Click **Create Webhook**.

**Test it:** make a test purchase on the live site. Then go to Razorpay → **Webhooks** → click your webhook. The recent deliveries should show response code **200**.

### 8.5 Using your own domain (optional)

If you buy a domain such as `essentialproducts.in`:

1. Vercel → your project → **Settings → Domains** → add it and follow the DNS instructions.
2. Then update **all three** places to the new address:
   - `NEXT_PUBLIC_SITE_URL` in Vercel (then redeploy)
   - Site URL and Redirect URLs in Supabase
   - The webhook URL in Razorpay

---

## 9. Switch Razorpay to live mode

Do this when you're ready to accept **real money**.

1. **Activate your account:** Razorpay Dashboard → complete the **KYC / account activation** form (business details, PAN, bank account, website URL). Razorpay reviews it, which usually takes a few working days.
   - Razorpay checks that your website has these pages: **Contact Us, Terms & Conditions, Privacy Policy, Refund/Cancellation Policy, Shipping Policy**. Add them before applying (see [Appendix C](#appendix-c-before-you-launch)).
2. Once activated, switch the dashboard toggle to **Live Mode**.
3. **Account & Settings → API Keys → Generate Live Key.** Save the live **Key ID** (`rzp_live_…`) and **Key Secret**.
4. **Account & Settings → Webhooks** (in **Live Mode**; live and test webhooks are separate) → **Add New Webhook** with:
   - the same URL: `https://your-domain/api/webhooks/razorpay`
   - a **new** random secret
   - events: `payment.captured`, `payment.failed`, `order.paid`
5. In **Vercel → Settings → Environment Variables**, update:
   - `RAZORPAY_KEY_ID` → live Key ID
   - `RAZORPAY_KEY_SECRET` → live Key Secret
   - `RAZORPAY_WEBHOOK_SECRET` → the new live webhook secret
6. **Deployments → ⋯ → Redeploy** (environment changes only apply after a redeploy).
7. Make one small real purchase yourself to confirm everything works, then refund it from Razorpay → **Payments → (the payment) → Refund**.

> Keep the **test** keys in your local `.env.local` so you never charge real money while developing.

---

## 10. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| Blue box says **"Store not configured yet"** | `.env.local` is missing or the Supabase values are empty. Fill them in (step 5) and **restart** `npm run dev`. On Vercel: add the env variables and redeploy. |
| Home page shows **"We couldn't load this page"** | The Supabase URL or key is wrong, or the SQL files weren't run. Check step 2.3. The terminal running `npm run dev` shows the actual error. |
| `relation "public.products" does not exist` | You skipped `001_schema.sql` or ran the files out of order. Run them again in order 001 → 005. |
| No products appear | Run `004_seed.sql`. Also check products are ticked **Active** in the admin panel. |
| Sign-up email never arrives | Check the spam folder. Supabase's built-in email is limited to a few emails per hour: wait, or set up custom SMTP (step 3.2), or turn **Confirm email** OFF while testing. |
| Email link says **"invalid or has expired"** | Links expire after 1 hour and work only once. With default templates they must be opened in the same browser. Do step 3.3, or request a new link. Also check the Redirect URLs (step 3.1) include your site. |
| Clicking the email link goes to `localhost` on the live site | Supabase **Site URL** is still `http://localhost:3000`. Update it (step 8.3). |
| **"Payment service is unavailable"** at checkout | Razorpay keys are missing or wrong. Check `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (test keys start with `rzp_test_`) and restart or redeploy. |
| **"Payment verification failed"** | `RAZORPAY_KEY_SECRET` doesn't match the Key ID (e.g. a live secret with a test key). Regenerate the keys and update both. |
| Payment succeeded but order still says **"Awaiting payment"** | Refresh after a few seconds. If it stays, check the Razorpay webhook (step 8.4) shows 200 responses. A 400 response means the webhook secret doesn't match `RAZORPAY_WEBHOOK_SECRET`. A 500 response means the server logs (Vercel → project → **Logs**) show the error. |
| Webhook can't reach `localhost` | That's expected; Razorpay needs a public URL. Test webhooks after deploying, or see the next section. |
| Admin panel redirects to the home page | Your profile isn't admin yet. Run the SQL in step 7 with the exact sign-up email, then log out and back in. |
| Image upload in admin fails | Run `supabase/005_storage.sql`. Images must be JPEG, PNG, WebP or AVIF and under 5 MB. |
| Uploaded images don't show on the live site | `NEXT_PUBLIC_SUPABASE_URL` must be set in Vercel **before** building. Redeploy after adding it. |
| `npm run build` fails with `EPERM` / `EBUSY` / `operation not permitted` | OneDrive is locking files. Pause OneDrive syncing or move the project out of OneDrive (step 1.3), delete the `.next` folder and try again. |
| `'git' is not recognized` | Close and reopen VS Code after installing Git. |
| Port 3000 already in use | Another `npm run dev` is still running. Close that terminal, or run `npm run dev -- -p 3001` (and use `http://localhost:3001`). |
| Changes to `.env.local` have no effect | Stop (`Ctrl+C`) and restart `npm run dev`. |

### Testing webhooks locally (optional)

1. Install ngrok from <https://ngrok.com/download> and sign up for a free account.
2. With `npm run dev` running, open a second terminal and run `ngrok http 3000`.
3. Copy the `https://….ngrok-free.app` address it shows.
4. Add a **Test Mode** webhook in Razorpay with the URL `https://….ngrok-free.app/api/webhooks/razorpay`, your webhook secret, and the 3 events.
5. Make a test payment. The ngrok terminal shows `POST /api/webhooks/razorpay 200`.

---

## Appendix A: Pushing code to GitHub

The project is already a Git repository connected to `https://github.com/abdulkhaliq784/essential-products.git`.

**The first push needs you to sign in.** In the VS Code terminal run:

```bash
git push -u origin main
```

A browser window opens. Sign in to GitHub and click **Authorize**. Your login is remembered after that.

To save and upload future changes:

```bash
git add -A
git commit -m "Describe what you changed"
git push
```

Never commit `.env.local`. It's already in `.gitignore`, and `git status` should never list it.

---

## Appendix B: How the project is organised

```
essential-products/
├─ supabase/              SQL files to run in the Supabase SQL Editor (step 2.3)
├─ public/images/         Product images used by the seed products
├─ src/
│  ├─ proxy.ts            Runs before each page: keeps users logged in, protects /account, /checkout, /admin
│  ├─ app/                Pages (each folder is a URL)
│  │  ├─ page.tsx         Home page
│  │  ├─ category/        /category/garbage-bags …
│  │  ├─ product/         /product/<slug>
│  │  ├─ cart/, checkout/, order/, account/, search/
│  │  ├─ (auth)/          login, signup, forgot-password, reset-password
│  │  ├─ admin/           Admin panel
│  │  └─ api/             Server endpoints: create Razorpay order, verify payment, webhook
│  ├─ components/         Reusable UI (header, footer, product cards, cart, forms)
│  └─ lib/                Helpers: Supabase clients, Razorpay, pricing, validation, formatting
├─ .env.example           List of required settings (no real values!)
└─ .env.local             Your real keys (never committed)
```

**How payments stay secure:**

1. The browser only sends the chosen **address ID**. The server reads the cart from the database and loads **current prices from the database**, so prices sent from a browser are never trusted.
2. The server calculates the total (with ₹49 shipping below ₹499) and creates the Razorpay order **in paise**.
3. After payment, the server **verifies Razorpay's signature** using the secret key, re-checks the amount with Razorpay, then marks the order paid.
4. **Stock is reduced only after a successful payment**, inside one database transaction (`mark_order_paid`). Paying twice can never reduce stock twice.
5. The **webhook** repeats step 4 independently, in case the customer's browser closed early.

**Shipping rule:** free on orders of ₹499 or more, otherwise ₹49. Change it in `src/lib/pricing.ts`.

---

## Appendix C: Before you launch

- [ ] **Replace `public/images/oil-bottles/oil-3.png`.** It contains a "pngtree" watermark and is only a placeholder. Upload a proper photo through **Admin → Products → Refined Sunflower Oil → Upload image**, then remove the old one.
- [ ] Use real photos of **your** products. The sample oil images show essential-oil bottles rather than cooking oil.
- [ ] Check every product's price, MRP, stock and description in the admin panel.
- [ ] Change the support email in `src/components/layout/Footer.tsx` (currently `support@essentialproducts.in`).
- [ ] Add policy pages required by Razorpay (Contact, Terms, Privacy, Refunds, Shipping).
- [ ] Set up custom SMTP in Supabase (step 3.2) so customers reliably receive emails.
- [ ] Turn **Confirm email** ON in Supabase.
- [ ] Switch Razorpay to live mode (step 9).
