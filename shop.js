// ═══════════════════════════════════════════════════════════════
//  Val & Dan Kids Boutique — product data + cart/wishlist (localStorage)
// ═══════════════════════════════════════════════════════════════

// ── Live product catalog ──────────────────────────────────────────
// Product photos now come entirely from what's published in the admin
// console (Products page) — there is no hardcoded demo catalog anymore.
// ALL_PRODUCTS starts empty and is filled in by vdBootstrapLiveCatalog()
// below once real products are fetched from Supabase. Every page that
// renders products already exposes window.vdRerenderCatalog, which this
// bootstrap calls once live data arrives so the page updates in place.
let ALL_PRODUCTS = [];

(async function vdBootstrapLiveCatalog() {
  if (typeof vdFetchPublishedProducts !== 'function') return; // site-data.js not loaded on this page
  try {
    const live = await vdFetchPublishedProducts();
    if (live && live.length) {
      ALL_PRODUCTS = live;
      if (typeof window.vdRerenderCatalog === 'function') window.vdRerenderCatalog();
    }
  } catch (e) {
    console.warn('Live product catalog fetch failed.', e);
  }
})();


function getProductById(id) { return ALL_PRODUCTS.find(p => p.id === id) || null; }

// ── Cart / wishlist (localStorage) ───────────────────────────────
const CART_KEY = 'vd_cart';
const WISH_KEY = 'vd_wishlist';

function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateHeaderBadges(); }

function addToCart(productId, size, qty) {
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find(i => i.productId === productId && i.size === size);
  if (existing) { existing.qty += qty; }
  else { cart.push({ productId, size: size || null, qty }); }
  saveCart(cart);
}

function updateCartQty(productId, size, qty) {
  let cart = getCart();
  const item = cart.find(i => i.productId === productId && i.size === size);
  if (!item) return;
  item.qty = qty;
  if (item.qty <= 0) cart = cart.filter(i => i !== item);
  saveCart(cart);
}

function removeFromCart(productId, size) {
  const cart = getCart().filter(i => !(i.productId === productId && i.size === size));
  saveCart(cart);
}

function cartCount() { return getCart().reduce((n, i) => n + i.qty, 0); }
function cartSubtotal() {
  return getCart().reduce((sum, i) => {
    const p = getProductById(i.productId);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

// ── Promo code (LITTLEFERNS = free shipping over $60, site-wide promo) ───
const PROMO_KEY = 'vd_promo';
const VALID_PROMOS = { LITTLEFERNS: { type: 'free-shipping', label: 'Free shipping unlocked' } };

function getAppliedPromo() {
  try { return JSON.parse(localStorage.getItem(PROMO_KEY) || 'null'); } catch (e) { return null; }
}
function applyPromoCode(code) {
  const key = (code || '').trim().toUpperCase();
  const promo = VALID_PROMOS[key];
  if (!promo) return { ok: false, error: 'That code isn\'t valid.' };
  localStorage.setItem(PROMO_KEY, JSON.stringify({ code: key, ...promo }));
  return { ok: true, promo };
}
function clearPromoCode() { localStorage.removeItem(PROMO_KEY); }

/** Shipping is free at $60+ subtotal (site-wide threshold) or with a valid free-shipping promo applied. */
function cartShipping(subtotal) {
  if (subtotal === 0) return 0;
  if (subtotal >= 60) return 0;
  const promo = getAppliedPromo();
  if (promo && promo.type === 'free-shipping') return 0;
  return 6.99;
}

/** Estimated sales tax — flat 8.5% of subtotal, shown as its own line in cart/checkout summaries. */
function cartTax(subtotal) {
  return subtotal > 0 ? subtotal * 0.085 : 0;
}

function getWishlist() { return JSON.parse(localStorage.getItem(WISH_KEY) || '[]'); }
function saveWishlist(list) { localStorage.setItem(WISH_KEY, JSON.stringify(list)); updateHeaderBadges(); }

function toggleWishlist(productId) {
  let list = getWishlist();
  if (list.includes(productId)) { list = list.filter(id => id !== productId); }
  else { list.push(productId); }
  saveWishlist(list);
  return list.includes(productId);
}

function isWishlisted(productId) { return getWishlist().includes(productId); }

// ── Header badge sync (call on every page load) ──────────────────
function updateHeaderBadges() {
  const cartEl = document.getElementById('cart-count');
  const wishEl = document.getElementById('wish-count');
  if (cartEl) cartEl.textContent = cartCount();
  if (wishEl) wishEl.textContent = getWishlist().length;
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('vd-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vd-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── Product card builder (shared by index/shop/collections) ─────
// `badgeOverride` lets a section force its own badge label (e.g. "New" on
// the homepage's New This Week row, "Best Seller" on Mom's Favorites)
// without mutating the shared product data used elsewhere on the site.
function productCardHTML(p, badgeOverride) {
  const wished = isWishlisted(p.id);
  const badge = badgeOverride || p.badge;
  const extraClass = badgeOverride ? ' mini-product-card' : '';
  return `
    <div class="product-card${extraClass}" data-id="${p.id}">
      <div class="product-photo">
        <a href="product.html?id=${p.id}"><img src="${p.img}" alt="${p.name}" loading="lazy" /></a>
        ${badge ? `<span class="product-badge">${badge}</span>` : ''}
        <button class="wish-btn ${wished ? 'active' : ''}" data-wish="${p.id}" aria-label="Add to wishlist">${wished ? '♥' : '♡'}</button>
      </div>
      <div class="product-info">
        <div class="product-name"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="product-price">${p.wasPrice ? `<span class="was">$${p.wasPrice.toFixed(2)}</span>` : ''}$${p.price.toFixed(2)}</div>
      </div>
    </div>`;
}

function wireWishButtons(root) {
  (root || document).querySelectorAll('[data-wish]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const id = this.getAttribute('data-wish');
      const active = toggleWishlist(id);
      this.classList.toggle('active', active);
      this.textContent = active ? '♥' : '♡';
      showToast(active ? 'Added to wishlist 💗' : 'Removed from wishlist');
    });
  });
}

// ── Mobile hamburger nav (shared across every page) ──────────────
function wireMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const panel = document.getElementById('mobile-nav-panel');
  const closeBtn = document.getElementById('mobile-nav-close');
  if (!toggle || !panel) return;
  const open = () => { panel.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { panel.classList.remove('open'); document.body.style.overflow = ''; };
  toggle.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

// ── Floating header goes solid after scrolling past the hero ─────
function wireHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header || !document.body.classList.contains('page-home')) return;
  const onScroll = () => {
    if (window.scrollY > 60) header.classList.add('solid');
    else header.classList.remove('solid');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Fade sections in as they scroll into view ─────────────────────
function wireFadeIns() {
  const els = document.querySelectorAll('.fade-in-up');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in-view')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  updateHeaderBadges();
  wireMobileNav();
  wireHeaderScroll();
  wireFadeIns();
  vdSyncCatalogFromBackend();
});

/**
 * If the Supabase backend is configured and has published products, quietly
 * upgrades the in-memory catalog (ALL_PRODUCTS/PRODUCTS) in place and asks
 * the current page to redraw whatever it's showing. Runs after the page has
 * already rendered its static/demo catalog, so there's never a blank or
 * broken state — this only ever swaps content once real data is confirmed
 * available, and does nothing at all if the backend isn't set up yet.
 */
async function vdSyncCatalogFromBackend() {
  if (typeof vdFetchPublishedProducts !== 'function') return; // site-data.js not loaded on this page
  const backendProducts = await vdFetchPublishedProducts();
  if (!backendProducts || !backendProducts.length) return;

  ALL_PRODUCTS.length = 0;
  ALL_PRODUCTS.push(...backendProducts);
  PRODUCTS.length = 0;
  PRODUCTS.push(...backendProducts);

  if (typeof window.vdRerenderCatalog === 'function') {
    window.vdRerenderCatalog();
  }
}

// ── Luxury product card (shared by index/shop — with Quick View + Quick Add) ─
function luxuryCardHTML(p) {
  const wished = isWishlisted(p.id);
  return `
    <div class="luxury-card" data-id="${p.id}">
      <div class="luxury-photo">
        <a href="product.html?id=${p.id}"><img src="${p.img}" alt="${p.name}" loading="lazy" /></a>
        ${p.badge ? `<span class="luxury-ribbon ${p.badge.toLowerCase().replace(/\s+/g, '-')}">${p.badge}</span>` : ''}
        <button class="luxury-heart ${wished ? 'active' : ''}" data-wish="${p.id}" aria-label="Add to wishlist">${wished ? '♥' : '♡'}</button>
        <div class="luxury-actions">
          <button class="qv-btn" data-qv="${p.id}">Quick View</button>
          <button class="qa-btn" data-qa="${p.id}">Quick Add</button>
        </div>
      </div>
      <div class="luxury-info">
        <div class="cat">${p.category}</div>
        <div class="name"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="price">${p.wasPrice ? `<span class="was">$${p.wasPrice.toFixed(2)}</span>` : ''}$${p.price.toFixed(2)}</div>
      </div>
    </div>`;
}

// ── Quick Add — wire [data-qa] buttons within root (or whole doc) ────────
function wireQuickAdd(root) {
  (root || document).querySelectorAll('[data-qa]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      addToCart(this.getAttribute('data-qa'), null, 1);
      showToast('Added to cart 🛍️');
    });
  });
}

// ── Quick View modal — wire [data-qv] buttons + the #qv-overlay chrome ───
function wireQuickView(root) {
  const qvOverlay = document.getElementById('qv-overlay');
  if (!qvOverlay) return;
  (root || document).querySelectorAll('[data-qv]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const p = getProductById(this.getAttribute('data-qv'));
      if (!p) return;
      document.getElementById('qv-img').src = p.img;
      document.getElementById('qv-img').alt = p.name;
      document.getElementById('qv-cat').textContent = p.category;
      document.getElementById('qv-name').textContent = p.name;
      document.getElementById('qv-price').textContent = '$' + p.price.toFixed(2);
      document.getElementById('qv-desc').textContent = p.desc || '';
      document.getElementById('qv-view-full').href = 'product.html?id=' + p.id;
      document.getElementById('qv-add').onclick = () => { addToCart(p.id, null, 1); showToast('Added to cart 🛍️'); };
      qvOverlay.classList.add('open');
    });
  });
  if (!qvOverlay.dataset.wired) {
    qvOverlay.dataset.wired = '1';
    const qvClose = document.getElementById('qv-close');
    if (qvClose) qvClose.addEventListener('click', () => qvOverlay.classList.remove('open'));
    qvOverlay.addEventListener('click', (e) => { if (e.target === qvOverlay) qvOverlay.classList.remove('open'); });
  }
}
