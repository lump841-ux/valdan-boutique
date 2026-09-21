# Val & Dan Kids Boutique — Stripe Checkout Setup

Real payments are now wired into the site's checkout flow. This doc walks
through the one-time setup needed to turn it on. Until you've done this, the
site keeps working exactly as before (the checkout completes in "demo" mode —
no charge, order saved as `pending_payment`).

## How it works, in short

- The customer fills in shipping info on `checkout.html`, same as before.
- Clicking **Place Your Order** now redirects them to Stripe's own secure,
  hosted payment page — this site never collects or stores card numbers.
- After payment, Stripe redirects them back to a confirmation screen.
- Separately (and this is the part that actually matters for security),
  Stripe calls a webhook on this server the moment payment succeeds. That
  webhook is the *only* thing that marks an order "paid" in the database —
  never the customer's browser, and never the redirect alone. This means
  someone can't fake a paid order by messing with the URL.

## 1. Create a Stripe account

Go to [stripe.com](https://stripe.com) and sign up (free). You'll land in
**test mode** by default — good, use test mode until everything works, then
flip to live mode later (step 6).

## 2. Get your Secret key

Stripe Dashboard → **Developers → API keys**. Copy the **Secret key**
(starts with `sk_test_...` in test mode). This is the one credential this
project needs from you.

## 3. Set up the server's environment variables

Copy `.env.example` to `.env` in this project folder, then fill in:

```
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...            (from Supabase → Project Settings → API — the SECRET service_role key, not the anon key)
PUBLIC_BASE_URL=https://your-deployed-site.example.com
PORT=3000
```

`STRIPE_WEBHOOK_SECRET` stays blank for now — you'll get that value in the
next step, only after the site is deployed somewhere Stripe can reach it.

**Never commit `.env` or paste these values into any file that isn't
`.env`.** It's already excluded via `.gitignore`.

## 4. Deploy the site (so Stripe has somewhere to send the webhook)

This project is now a small Node/Express app (`server.js`), not a purely
static site — it needs to actually run somewhere so it can talk to Stripe.
Any Node host works (Render, Railway, Fly.io, etc.). Once you're ready for
this step, let me know and I can set up the hosting and deploy it directly —
I just need you to have created the hosting account, the same way as
Supabase and Stripe.

`npm install` then `npm start` runs it locally too, if you want to test on
your own machine first (`http://localhost:3000`).

## 5. Register the webhook in Stripe

Once the site has a real URL:

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://your-deployed-site.example.com/api/stripe-webhook`
3. Select event: `checkout.session.completed` (optionally also
   `checkout.session.expired` and `checkout.session.async_payment_succeeded`).
4. Save, then click into the new endpoint and copy its **Signing secret**
   (starts with `whsec_...`).
5. Set that as `STRIPE_WEBHOOK_SECRET` in your `.env` (or your host's
   environment variable settings) and restart the server.

## 6. Test it

Stripe's test mode has fake card numbers that always work:

- Card number: `4242 4242 4242 4242`
- Expiry: any future date · CVV: any 3 digits · ZIP: any 5 digits

Place a real test order on the site, pay with that card, and check:

- You land back on a "Thank you" confirmation screen.
- In Supabase → Table Editor → `orders`, the order's `status` is now
  `received` (not `pending_payment`) and `stripe_payment_intent_id` is filled
  in — proof the webhook did its job.
- In Stripe Dashboard → Payments, the test payment shows up.

## 7. Go live

When you're ready to accept real cards: in Stripe, flip from test mode to
live mode (top-left toggle), grab the **live** Secret key, and repeat steps
2–5 with the live key and a live-mode webhook endpoint. Nothing else in the
code needs to change.

## A note on pricing accuracy

Right now, product prices for Stripe come from the same catalog the storefront
already uses. Once a product also exists in the admin **Products** page (the
Supabase-backed catalog), the checkout server automatically double-checks its
price against that record before charging — so publishing your real catalog
there is the more tamper-resistant path if this ever needs to handle real
customer traffic at scale. Shipping ($6.99 flat, free at $60+) and the 8.5%
tax estimate are always calculated by the server itself, never trusted from
the browser, regardless of catalog source.
