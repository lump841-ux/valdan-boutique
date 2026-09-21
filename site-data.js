/**
 * Public-site data helpers — connects the static Val & Dan pages to the
 * Supabase backend (see supabase-config.js). Every function here fails
 * quietly (returns null / does nothing) if the backend isn't configured, so
 * the site looks and works exactly as it does today until credentials are
 * added.
 */

/* ---------------------------------------------------------------------- */
/* Contact form                                                            */
/* ---------------------------------------------------------------------- */

/**
 * Submits the contact form to Supabase. Includes a honeypot field check and
 * a simple client-side cooldown to cut down on spam/duplicate submissions.
 * Returns { ok: boolean, error?: string }.
 */
async function vdSubmitContactForm(fields) {
  if (fields.company) {
    // Honeypot: real visitors never fill this hidden field in.
    return { ok: true }; // pretend success so bots don't learn anything
  }
  const last = Number(localStorage.getItem('vd_last_contact_submit') || 0);
  if (Date.now() - last < 30000) {
    return { ok: false, error: 'Please wait a moment before sending another message.' };
  }
  if (!window.vdPublicClient) {
    return { ok: false, error: 'Sorry, the contact form is temporarily unavailable. Please email us directly.' };
  }
  const { error } = await window.vdPublicClient.from('contact_messages').insert({
    name: fields.name,
    email: fields.email,
    phone: fields.phone || null,
    subject: fields.subject || null,
    message: fields.message,
  });
  if (error) return { ok: false, error: 'Something went wrong sending your message. Please try again.' };
  localStorage.setItem('vd_last_contact_submit', String(Date.now()));
  return { ok: true };
}

/* ---------------------------------------------------------------------- */
/* Checkout — places an order from the cart                                */
/* ---------------------------------------------------------------------- */

/**
 * Generates an order id/number pair and inserts a `pending_payment` row into
 * Supabase's `orders` table — this happens BEFORE the customer ever reaches
 * Stripe. Row Level Security only allows public inserts that are exactly
 * `pending_payment` with no Stripe identifiers attached (see schema.sql), so
 * nothing the browser sends can mark an order "paid" — only the Stripe
 * webhook can do that, server-side, once a payment actually succeeds.
 * Returns { ok, orderId, orderNumber, error?, demo }.
 */
async function vdPlacePendingOrder(payload) {
  const orderId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('vd-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const orderNumber = 'VD' + Date.now().toString().slice(-8);
  if (!window.vdPublicClient) {
    return { ok: true, orderId, orderNumber, error: null, demo: true };
  }
  const { error } = await window.vdPublicClient.from('orders').insert({
    id: orderId,
    order_number: orderNumber,
    customer_name: payload.customerName,
    email: payload.email,
    phone: payload.phone || null,
    shipping_address: payload.shippingAddress,
    items: payload.items,
    subtotal: payload.subtotal,
    shipping_cost: payload.shippingCost,
    discount: payload.discount || 0,
    total: payload.total,
    promo_code: payload.promoCode || null,
    payment_method: 'card',
    status: 'pending_payment',
  });
  if (error) {
    // Still let the customer proceed — don't block checkout on a backend
    // hiccup — but flag it so we know the order wasn't persisted.
    return { ok: true, orderId, orderNumber, error: error.message, demo: true };
  }
  return { ok: true, orderId, orderNumber, error: null, demo: false };
}

/**
 * Asks this project's own server to create a real Stripe Checkout Session
 * for the given pending order and returns its hosted-payment-page URL. If
 * the server hasn't been configured with Stripe keys yet, resolves with
 * { ok: false, notConfigured: true } instead of throwing, so callers can
 * fall back to the old "demo" confirmation screen.
 */
async function vdCreateStripeCheckoutSession({ orderId, orderNumber, items, shipping, freeShippingPromo }) {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, orderNumber, items, shipping, freeShippingPromo }),
    });
    if (res.status === 501) return { ok: false, notConfigured: true };
    const data = await res.json();
    if (!res.ok || !data.url) return { ok: false, error: data.error || 'Could not start checkout.' };
    return { ok: true, url: data.url };
  } catch (e) {
    return { ok: false, notConfigured: true };
  }
}

/* ---------------------------------------------------------------------- */
/* Hero images — swaps in a published hero image without touching layout   */
/* ---------------------------------------------------------------------- */

/**
 * Looks up the published hero image for `pageSlug` and, if one exists,
 * updates `imgEl`'s src/alt/object-position in place. The element keeps its
 * existing CSS classes (shop-hero-bg, hero-image, etc.) so the surrounding
 * fade/overlay/layout is completely untouched. Safe to call even if the
 * element or the backend isn't present.
 */
async function vdApplyHeroImage(pageSlug, imgEl) {
  if (!imgEl || !window.vdPublicClient) return;
  try {
    const { data, error } = await window.vdPublicClient
      .from('hero_images')
      .select('alt_text, focal_x, focal_y, media_assets(public_url)')
      .eq('page_slug', pageSlug)
      .eq('status', 'published')
      .maybeSingle();
    if (error || !data || !data.media_assets?.public_url) return; // keep existing static image
    const testImg = new Image();
    testImg.onload = () => {
      imgEl.src = data.media_assets.public_url;
      if (data.alt_text) imgEl.alt = data.alt_text;
      const fx = Math.round((data.focal_x ?? 0.5) * 100);
      const fy = Math.round((data.focal_y ?? 0.5) * 100);
      imgEl.style.objectPosition = fx + '% ' + fy + '%';
    };
    // Only swap once the replacement has actually loaded — never show a
    // broken image if the file is temporarily unavailable.
    testImg.onerror = () => {};
    testImg.src = data.media_assets.public_url;
  } catch (e) {
    console.warn('Hero image fetch failed, keeping static image.', e);
  }
}

/* ---------------------------------------------------------------------- */
/* Site content — announcement bar, hero copy, policies, etc.              */
/* ---------------------------------------------------------------------- */

/**
 * Fetches published site_content and applies it to any element with a
 * matching data-vd-content="<content_key>" attribute, without touching
 * anything else on the page (fonts/classes/layout stay put).
 */
async function vdApplySiteContent() {
  if (!window.vdPublicClient) return;
  try {
    const { data, error } = await window.vdPublicClient.from('site_content_public').select('*');
    if (error || !data) return;
    const map = {};
    data.forEach((r) => { map[r.content_key] = r.published_value; });
    document.querySelectorAll('[data-vd-content]').forEach((el) => {
      const key = el.getAttribute('data-vd-content');
      if (map[key]) el.textContent = map[key];
    });
    document.querySelectorAll('[data-vd-content-href]').forEach((el) => {
      const key = el.getAttribute('data-vd-content-href');
      if (map[key]) el.setAttribute('href', map[key]);
    });
  } catch (e) {
    console.warn('Site content fetch failed, keeping static text.', e);
  }
}

/* ---------------------------------------------------------------------- */
/* Products & collections — published rows from the backend, mapped into   */
/* the same shape shop.js already expects, so existing render code (which  */
/* calls luxuryCardHTML / productCardHTML) keeps working unmodified.       */
/* ---------------------------------------------------------------------- */

function vdMapDbProduct(row) {
  const images = (row.product_images || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const primary = images.find((i) => i.is_primary) || images[0];
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    wasPrice: row.sale_price ? Number(row.price) : null,
    // if there's a sale price, show it as the active price and price as "was"
    ...(row.sale_price ? { price: Number(row.sale_price), wasPrice: Number(row.price) } : {}),
    category: row.category,
    sizes: row.sizes || [],
    colors: row.colors || [],
    img: primary?.media_assets?.public_url || '',
    img2: images[1]?.media_assets?.public_url || primary?.media_assets?.public_url || '',
    images: images.map((i) => i.media_assets?.public_url).filter(Boolean),
    desc: row.short_description || row.full_description || '',
    badge: row.is_new_arrival ? 'New' : (row.sale_price ? 'Sale' : null),
  };
}

/**
 * Fetches published products from Supabase. Returns null (meaning "use the
 * existing static PRODUCTS array") if the backend isn't configured or the
 * table is empty — the site never shows a blank shop because of this.
 */
async function vdFetchPublishedProducts() {
  if (!window.vdPublicClient) return null;
  try {
    const { data, error } = await window.vdPublicClient
      .from('products')
      .select('*, product_images(sort_order, is_primary, alt_text, media_assets(public_url))')
      .eq('status', 'published')
      .order('sort_order');
    if (error || !data || !data.length) return null;
    return data.map(vdMapDbProduct);
  } catch (e) {
    console.warn('Product fetch failed, keeping static catalog.', e);
    return null;
  }
}

async function vdFetchPublishedCollections() {
  if (!window.vdPublicClient) return null;
  try {
    const { data, error } = await window.vdPublicClient
      .from('collections')
      .select('*, media_assets(public_url), collection_products(product_id, sort_order)')
      .eq('status', 'published')
      .order('sort_order');
    if (error || !data || !data.length) return null;
    return data.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      img: c.media_assets?.public_url || '',
      showOnHomepage: c.show_on_homepage,
      productIds: (c.collection_products || []).sort((a, b) => a.sort_order - b.sort_order).map((cp) => cp.product_id),
    }));
  } catch (e) {
    console.warn('Collections fetch failed, keeping static collections.', e);
    return null;
  }
}
