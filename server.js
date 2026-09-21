/**
 * Val & Dan Kids Boutique — small Express server.
 *
 * Serves the static site exactly as before, and adds two routes that make
 * real payments work:
 *
 *   POST /api/create-checkout-session
 *     Called by checkout.html once the customer has filled in shipping info.
 *     Recomputes shipping/tax/total itself (never trusts the browser's math),
 *     creates a Stripe Checkout Session, and returns its URL for the browser
 *     to redirect to. The customer enters their card on Stripe's own hosted
 *     page — this server, and this site's code, never sees card details.
 *
 *   POST /api/stripe-webhook
 *     Stripe calls this once a payment actually succeeds. This is the ONLY
 *     place an order is marked "paid" — never the browser — because this is
 *     the only party that has both the Stripe webhook signing secret (proves
 *     the request really came from Stripe) and the Supabase service_role key
 *     (which can write past Row Level Security).
 *
 * If STRIPE_SECRET_KEY / SUPABASE_* env vars aren't set yet, both routes
 * return a clear 501 so the site's existing "demo mode" checkout flow keeps
 * working exactly as it did before this file existed.
 */

const path = require('path');
const express = require('express');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
const PORT = process.env.PORT || 3000;

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

const app = express();

// Same shipping/tax rules as shop.js's cartShipping()/cartTax(), kept in sync
// on purpose — this is what actually decides the charged amount, so it must
// match what the customer saw on screen, not just trust what they submit.
const FREE_SHIPPING_THRESHOLD = 60;
const FLAT_SHIPPING_CENTS = 699; // $6.99
const TAX_RATE = 0.085; // 8.5%

function computeShippingCents(subtotalCents, freeShippingPromo) {
  if (subtotalCents === 0) return 0;
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD * 100) return 0;
  if (freeShippingPromo) return 0;
  return FLAT_SHIPPING_CENTS;
}

function computeTaxCents(subtotalCents) {
  return subtotalCents > 0 ? Math.round(subtotalCents * TAX_RATE) : 0;
}

/**
 * Looks up the authoritative price for a product in Supabase's `products`
 * table when one exists there (the admin Products page writes real products
 * to this table). Falls back to the price the browser sent when there's no
 * Supabase connection configured, or the product isn't in the table yet —
 * this keeps the demo/static catalog (shop.js) working before the backend
 * is fully populated. Documented as a known limitation in SETUP-STRIPE.md.
 */
async function resolveUnitPriceCents(item) {
  const fallbackCents = Math.round(Number(item.price || 0) * 100);
  if (!supabaseAdmin || !item.productId) return fallbackCents;
  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select('price')
      .eq('id', item.productId)
      .maybeSingle();
    if (data && typeof data.price === 'number') return Math.round(data.price * 100);
  } catch (e) {
    // Table may not exist yet, or productId isn't a Supabase product id
    // (static catalog items use slug-style ids) — fall back quietly.
  }
  return fallbackCents;
}

// --------------------------------------------------------------------------
// Stripe webhook — MUST be registered before express.json() below, because
// Stripe's signature verification needs the exact raw request body.
// --------------------------------------------------------------------------
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(501).send('Stripe webhook not configured yet.');
  }

  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const orderId = session.client_reference_id || session.metadata?.orderId;
      if (!orderId) {
        console.warn('[stripe-webhook] session has no orderId, skipping:', session.id);
        return res.status(200).send('ok');
      }
      if (!supabaseAdmin) {
        console.warn('[stripe-webhook] payment succeeded but Supabase is not configured — order not persisted:', orderId);
        return res.status(200).send('ok');
      }
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'received',
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'pending_payment'); // never overwrite an order that's already past this stage
      if (error) {
        console.error('[stripe-webhook] failed to update order', orderId, error.message);
        return res.status(500).send('Database update failed'); // let Stripe retry
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const orderId = session.client_reference_id || session.metadata?.orderId;
      if (orderId && supabaseAdmin) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('status', 'pending_payment');
      }
    }
    return res.status(200).send('ok');
  } catch (err) {
    console.error('[stripe-webhook] unexpected error:', err);
    return res.status(500).send('Internal error');
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname), { extensions: ['html'] }));

// --------------------------------------------------------------------------
// Create Checkout Session
// --------------------------------------------------------------------------
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(501).json({ error: 'Stripe is not configured on this server yet.' });
  }

  try {
    const { orderId, orderNumber, items, shipping, freeShippingPromo } = req.body || {};

    if (!orderId || !orderNumber || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing order details.' });
    }
    if (!shipping || !shipping.email) {
      return res.status(400).json({ error: 'Missing shipping/contact details.' });
    }

    const lineItems = [];
    let subtotalCents = 0;

    for (const item of items) {
      const qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
      const unitAmount = await resolveUnitPriceCents(item);
      if (!unitAmount || unitAmount <= 0) {
        return res.status(400).json({ error: `Couldn't price "${item.name || item.productId}" — please refresh your cart and try again.` });
      }
      subtotalCents += unitAmount * qty;
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name: item.size ? `${item.name} (Size: ${item.size})` : item.name,
          },
        },
      });
    }

    const shippingCents = computeShippingCents(subtotalCents, !!freeShippingPromo);
    const taxCents = computeTaxCents(subtotalCents);

    if (taxCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: { currency: 'usd', unit_amount: taxCents, product_data: { name: 'Sales Tax (8.5%)' } },
      });
    }

    const shippingOptions = shippingCents > 0
      ? [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: shippingCents, currency: 'usd' }, display_name: 'Standard Shipping' } }]
      : [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 0, currency: 'usd' }, display_name: 'Free Shipping' } }];

    const baseUrl = PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: orderId,
      customer_email: shipping.email,
      metadata: { orderId, orderNumber },
      line_items: lineItems,
      shipping_options: shippingOptions,
      success_url: `${baseUrl}/checkout.html?order=${encodeURIComponent(orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout.html?cancelled=1`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session] error:', err);
    return res.status(500).json({ error: 'Could not start checkout. Please try again in a moment.' });
  }
});

// Lets the confirmation screen ask "did this session actually complete?"
// without trusting the redirect alone (the webhook is still the source of
// truth for whether the order is marked paid in the database).
app.get('/api/checkout-session/:id', async (req, res) => {
  if (!stripe) return res.status(501).json({ error: 'Stripe is not configured on this server yet.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    return res.json({
      status: session.status,
      payment_status: session.payment_status,
      email: session.customer_details?.email || session.customer_email || null,
    });
  } catch (err) {
    return res.status(404).json({ error: 'Session not found.' });
  }
});

app.get('/healthz', (req, res) => res.json({ ok: true, stripeConfigured: !!stripe, supabaseConfigured: !!supabaseAdmin }));

app.listen(PORT, () => {
  console.log(`Val & Dan Boutique server running on port ${PORT}`);
  console.log(`Stripe configured: ${!!stripe}`);
  console.log(`Supabase (service role) configured: ${!!supabaseAdmin}`);
});
