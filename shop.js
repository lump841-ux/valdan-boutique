// ═══════════════════════════════════════════════════════════════
//  Val & Dan Kids Boutique — product data + cart/wishlist (localStorage)
// ═══════════════════════════════════════════════════════════════

const PRODUCTS = [
  { id:'flutter-sleeve-romper', name:'Flutter Sleeve Romper', category:'Girls', price:24.99, wasPrice:null,
    img:'product-pink-romper.jpg',
    img2:'product-denim-overalls.jpg',
    badge:'New', desc:'A breezy flutter-sleeve romper in the softest cotton blend — perfect for warm days and easy diaper changes with snap closures.', sizes:['0-3M','3-6M','6-12M','12-18M'] },
  { id:'little-explorer-set', name:'Little Explorer Set', category:'Boys', price:28.99, wasPrice:null,
    img:'product-denim-overalls.jpg',
    img2:'product-pink-romper.jpg',
    badge:'New', desc:'Durable denim overalls paired with a striped tee — built for crawling, climbing, and everything in between.', sizes:['6-12M','12-18M','18-24M','2T'] },
  { id:'cozy-knit-romper', name:'Cozy Knit Romper', category:'Unisex', price:22.99, wasPrice:26.99,
    img:'product-knit-set.jpg',
    img2:'product-cream-cardigan.jpg',
    badge:'Sale', desc:'A ribbed knit romper that feels like a warm hug. Soft, stretchy, and gentle on delicate skin.', sizes:['NB','0-3M','3-6M','6-12M'] },
  { id:'lavender-dreams-dress', name:'Lavender Dreams Dress', category:'Girls', price:26.99, wasPrice:null,
    img:'product-twirl-dress.jpg',
    img2:'product-pink-romper.jpg',
    badge:null, desc:'A twirl-worthy dress in soft lavender with a delicate bow detail — sweet enough for every little moment.', sizes:['12-18M','18-24M','2T','3T'] },
  { id:'classic-knit-cardigan', name:'Classic Knit Cardigan', category:'Unisex', price:23.99, wasPrice:null,
    img:'product-cream-cardigan.jpg',
    img2:'product-cream-cardigan.jpg',
    badge:null, desc:'A timeless button-up cardigan in a chunky knit — layers beautifully over rompers and dresses alike.', sizes:['0-3M','3-6M','6-12M','12-18M'] },
  { id:'sunshine-overalls', name:'Sunshine Overalls', category:'Boys', price:25.99, wasPrice:null,
    img:'product-mustard-tote.jpg',
    img2:'product-denim-overalls.jpg',
    badge:null, desc:'Sunny yellow corduroy overalls with adjustable straps that grow with your little one.', sizes:['6-12M','12-18M','18-24M','2T'] },
  { id:'meadow-bloom-set', name:'Meadow Bloom Set', category:'Girls', price:29.99, wasPrice:34.99,
    img:'product-cream-cardigan.jpg',
    img2:'product-twirl-dress.jpg',
    badge:'Sale', desc:'A floral top-and-bloomers set with a hand-tied bow — a boutique favorite for spring photos.', sizes:['NB','0-3M','3-6M','6-12M'] },
  { id:'starlight-footie', name:'Starlight Footie Pajama', category:'Unisex', price:21.99, wasPrice:null,
    img:'product-knit-set.jpg',
    img2:'product-mustard-tote.jpg',
    badge:null, desc:'Buttery-soft footie pajamas with a two-way zipper for fast, fuss-free midnight changes.', sizes:['NB','0-3M','3-6M','6-12M','12-18M'] },
];

const ACCESSORY_PRODUCTS = [
  { id:'bow-headband-duo', name:'Bow Headband Duo', category:'Accessories', price:12.99, wasPrice:null,
    img:'product-cream-cardigan.jpg',
    img2:'product-knit-set.jpg',
    badge:null, desc:'Two hand-tied bow headbands in coordinating pastels — soft elastic, no tugging.', sizes:['One Size'] },
  { id:'mary-jane-booties', name:'Little Mary Jane Booties', category:'Accessories', price:18.99, wasPrice:null,
    img:'product-mustard-tote.jpg',
    img2:'product-denim-overalls.jpg',
    badge:null, desc:'Soft-sole Mary Jane booties with a delicate strap — dressy enough for photos, soft enough for naps.', sizes:['0-6M','6-12M','12-18M'] },
];

const GIFT_PRODUCTS = [
  { id:'welcome-baby-gift-set', name:'Welcome Baby Gift Set', category:'Gift Sets', price:39.99, wasPrice:null,
    img:'product-pink-romper.jpg',
    img2:'product-twirl-dress.jpg',
    badge:'New', desc:'A curated box with a footie, a knit hat, and a swaddle blanket — beautifully wrapped and ready to gift.', sizes:['NB','0-3M'] },
];

// ── Collection-specific product lines (Princess / Gentleman / Cozy /
//    Seasonal / Newborn Bundles / Gift Sets) — used by the six standalone
//    collection pages (princess-collection.html, etc.) and folded into
//    ALL_PRODUCTS so product.html / cart / wishlist all work normally.
const PRINCESS_PRODUCTS = [
  { id:'dreamy-tulle-princess-romper', name:'Dreamy Tulle Princess Romper', category:'Lovely Rompers', collection:'Princess Collection', price:42.00, wasPrice:null,
    img:'product-princess-tulle-romper.jpg', img2:'product-princess-tulle-romper.jpg', badge:'New',
    desc:'A dreamy layer of soft tulle over a comfortable cotton romper base — twirl-ready for every princess moment.', sizes:['0-3M','3-6M','6-12M','12-18M','2T'] },
  { id:'rosebud-heirloom-smocked-dress', name:'Rosebud Heirloom Smocked Dress', category:'Dreamy Dresses', collection:'Princess Collection', price:48.00, wasPrice:null,
    img:'product-princess-rosebud-dress.jpg', img2:'product-princess-rosebud-dress.jpg', badge:'Best Seller',
    desc:'Hand-smocked bodice with a delicate rosebud print — an heirloom-quality dress made to be passed down.', sizes:['6-12M','12-18M','2T','3T'] },
  { id:'royal-meadow-velvet-tutu-set', name:'Royal Meadow Velvet Tutu Set', category:'Fluffy Tutus', collection:'Princess Collection', price:52.00, wasPrice:null,
    img:'product-princess-velvet-tutu.jpg', img2:'product-princess-velvet-tutu.jpg', badge:'Limited Edition',
    desc:'A plush velvet bodysuit paired with a full, fluffy tutu skirt in blush pink — dreamy for photos and parties alike.', sizes:['3-6M','6-12M','12-18M','2T'] },
  { id:'lace-vintage-empire-waist-gown', name:'Lace Vintage Empire-Waist Gown', category:'Dreamy Dresses', collection:'Princess Collection', price:45.00, wasPrice:null,
    img:'product-princess-lace-gown.jpg', img2:'product-princess-lace-gown.jpg', badge:null,
    desc:'Vintage-inspired lace overlay on an empire-waist silhouette — timeless and gentle on delicate skin.', sizes:['0-3M','3-6M','6-12M','12-18M'] },
  { id:'lavender-woodland-princess-set', name:'Lavender Woodland Princess Set', category:'Lovely Rompers', collection:'Princess Collection', price:38.00, wasPrice:null,
    img:'product-princess-lavender-set.jpg', img2:'product-princess-lavender-set.jpg', badge:null,
    desc:'A soft lavender romper set with woodland embroidery — sweet and storybook-perfect for everyday wear.', sizes:['NB','0-3M','3-6M','6-12M'] },
  { id:'sweetheart-velvet-princess-bonnet', name:'Sweetheart Velvet Princess Bonnet', category:'Storybook Accessories', collection:'Princess Collection', price:28.00, wasPrice:null,
    img:'product-princess-bonnet.jpg', img2:'product-princess-bonnet.jpg', badge:null,
    desc:'A plush velvet bonnet with a delicate bow tie — the finishing touch for any princess look.', sizes:['One Size'] },
];

const GENTLEMAN_PRODUCTS = [
  { id:'heritage-denim-overalls', name:'Heritage Denim Overalls', category:'Classic Overalls', collection:'Little Gentleman', price:36.00, wasPrice:null,
    img:'product-gentleman-overalls.jpg', img2:'product-gentleman-overalls.jpg', badge:'Best Seller',
    desc:'Sturdy heritage-wash denim overalls with brass-tone hardware — built for climbing, crawling, and everything between.', sizes:['6-12M','12-18M','18-24M','2T','3T'] },
  { id:'dapper-bowtie-collared-set', name:'Dapper Bow-Tie Collared Set', category:'Dapper Collared Sets', collection:'Little Gentleman', price:44.00, wasPrice:null,
    img:'product-gentleman-bowtie-set.jpg', img2:'product-gentleman-bowtie-set.jpg', badge:'New',
    desc:'A crisp collared shirt and shorts set finished with a matching bow tie — portrait-day polish.', sizes:['0-3M','3-6M','6-12M','12-18M'] },
  { id:'vintage-suspender-romper', name:'Vintage Suspender Romper', category:'Vintage Rompers', collection:'Little Gentleman', price:40.00, wasPrice:null,
    img:'product-gentleman-suspender-romper.jpg', img2:'product-gentleman-suspender-romper.jpg', badge:null,
    desc:'A one-piece romper styled with faux suspenders and a bow tie print — vintage charm, modern comfort.', sizes:['NB','0-3M','3-6M','6-12M'] },
  { id:'little-lord-corduroy-set', name:'Little Lord Corduroy Set', category:'Classic Overalls', collection:'Little Gentleman', price:46.00, wasPrice:null,
    img:'product-gentleman-corduroy-set.jpg', img2:'product-gentleman-corduroy-set.jpg', badge:null,
    desc:'Fine-wale corduroy overalls layered over a soft knit tee — a classic look that wears in beautifully.', sizes:['6-12M','12-18M','18-24M','2T'] },
  { id:'gentlemans-plaid-vest-set', name:"Gentleman's Plaid Vest Set", category:'Dapper Collared Sets', collection:'Little Gentleman', price:48.00, wasPrice:null,
    img:'product-gentleman-plaid-vest.jpg', img2:'product-gentleman-plaid-vest.jpg', badge:'Limited Edition',
    desc:'A tailored plaid vest over a collared shirt and shorts — sharp enough for the holidays, soft enough for playtime.', sizes:['12-18M','2T','3T'] },
  { id:'classic-newsboy-cap', name:'Classic Newsboy Cap', category:'Gentleman Accessories', collection:'Little Gentleman', price:26.00, wasPrice:null,
    img:'product-gentleman-newsboy-cap.jpg', img2:'product-gentleman-newsboy-cap.jpg', badge:null,
    desc:'A soft cotton newsboy cap with an adjustable snap back — the finishing touch for any little gentleman.', sizes:['One Size'] },
];

const COZY_ESSENTIALS_PRODUCTS = [
  { id:'cloudsoft-knit-two-piece-set', name:'Cloudsoft Knit Two-Piece Set', category:'Soft Knit Sets', collection:'Cozy Essentials', price:38.00, wasPrice:null,
    img:'product-cozy-knit-set.jpg', img2:'product-cozy-knit-set.jpg', badge:'Best Seller',
    desc:'A ribbed knit top and pant set in a buttery-soft cotton blend — everyday cozy, made to layer.', sizes:['NB','0-3M','3-6M','6-12M','12-18M'] },
  { id:'organic-cotton-bodysuit-trio', name:'Organic Cotton Bodysuit Trio', category:'Organic Bodysuits', collection:'Cozy Essentials', price:28.00, wasPrice:null,
    img:'product-cozy-bodysuit-trio.jpg', img2:'product-cozy-bodysuit-trio.jpg', badge:null,
    desc:'Three GOTS-certified organic cotton bodysuits in soft neutral tones — gentle on the most sensitive skin.', sizes:['NB','0-3M','3-6M','6-12M'] },
  { id:'cozy-ribbed-layering-set', name:'Cozy Ribbed Layering Set', category:'Layering Essentials', collection:'Cozy Essentials', price:34.00, wasPrice:null,
    img:'product-cozy-ribbed-layering.jpg', img2:'product-cozy-ribbed-layering.jpg', badge:'New',
    desc:'A ribbed long-sleeve and legging set designed to layer easily under rompers, dresses, or overalls.', sizes:['3-6M','6-12M','12-18M','2T'] },
  { id:'oatmeal-waffle-knit-romper', name:'Oatmeal Waffle Knit Romper', category:'Soft Knit Sets', collection:'Cozy Essentials', price:32.00, wasPrice:null,
    img:'product-cozy-waffle-romper.jpg', img2:'product-cozy-waffle-romper.jpg', badge:null,
    desc:'A textured waffle-knit romper in warm oatmeal — soft, breathable, and easy for quick changes.', sizes:['NB','0-3M','3-6M','6-12M'] },
  { id:'snuggle-fleece-zip-footie', name:'Snuggle Fleece Zip Footie', category:'Layering Essentials', collection:'Cozy Essentials', price:46.00, wasPrice:null,
    img:'product-cozy-fleece-footie.jpg', img2:'product-cozy-fleece-footie.jpg', badge:null,
    desc:'A plush fleece footie with a two-way zipper — the coziest layer for chilly nights.', sizes:['0-3M','3-6M','6-12M','12-18M'] },
  { id:'knit-beanie-mitten-set', name:'Knit Beanie & Mitten Set', category:'Cozy Accessories', collection:'Cozy Essentials', price:24.00, wasPrice:null,
    img:'product-cozy-beanie-mitten.jpg', img2:'product-cozy-beanie-mitten.jpg', badge:null,
    desc:'A matching knit beanie and mitten set in a soft brushed yarn — small, warm, and easy to love.', sizes:['One Size'] },
];

const SEASONAL_PRODUCTS = [
  { id:'fair-isle-holiday-sweater', name:'Fair Isle Holiday Sweater', category:'Holiday Knits', collection:'Seasonal Favorites', price:42.00, wasPrice:null,
    img:'product-seasonal-fairisle-sweater.jpg', img2:'product-seasonal-fairisle-sweater.jpg', badge:'Best Seller',
    desc:'A classic Fair Isle knit sweater in festive reds and creams — a seasonal favorite year after year.', sizes:['6-12M','12-18M','18-24M','2T','3T'] },
  { id:'cranberry-velvet-party-dress', name:'Cranberry Velvet Party Dress', category:'Festive Dresses', collection:'Seasonal Favorites', price:55.00, wasPrice:null,
    img:'product-seasonal-velvet-party-dress.jpg', img2:'product-seasonal-velvet-party-dress.jpg', badge:'Limited Edition',
    desc:'A rich cranberry velvet dress with a full skirt — made for holiday photos and festive celebrations.', sizes:['6-12M','12-18M','2T','3T'] },
  { id:'woodland-fox-fleece-set', name:'Woodland Fox Fleece Set', category:'Woodland Collection', collection:'Seasonal Favorites', price:38.00, wasPrice:null,
    img:'product-seasonal-fox-fleece-set.jpg', img2:'product-seasonal-fox-fleece-set.jpg', badge:'New',
    desc:'A cozy fleece two-piece printed with playful woodland foxes — soft, warm, and made for crisp days.', sizes:['NB','0-3M','3-6M','6-12M'] },
  { id:'snowfall-puffer-vest', name:'Snowfall Puffer Vest', category:'Winter Warmers', collection:'Seasonal Favorites', price:48.00, wasPrice:null,
    img:'product-seasonal-puffer-vest.jpg', img2:'product-seasonal-puffer-vest.jpg', badge:null,
    desc:'A lightweight quilted puffer vest that layers easily over knits and rompers for extra winter warmth.', sizes:['12-18M','2T','3T'] },
  { id:'evergreen-plaid-pinafore', name:'Evergreen Plaid Pinafore', category:'Festive Dresses', collection:'Seasonal Favorites', price:36.00, wasPrice:null,
    img:'product-seasonal-plaid-pinafore.jpg', img2:'product-seasonal-plaid-pinafore.jpg', badge:null,
    desc:'A pinafore-style jumper in evergreen plaid, layered over a soft cotton bodysuit — sweet seasonal styling.', sizes:['3-6M','6-12M','12-18M'] },
  { id:'cable-knit-winter-beanie', name:'Cable Knit Winter Beanie', category:'Holiday Knits', collection:'Seasonal Favorites', price:32.00, wasPrice:null,
    img:'product-seasonal-winter-beanie.jpg', img2:'product-seasonal-winter-beanie.jpg', badge:null,
    desc:'A chunky cable-knit beanie with a soft pom — keeps little heads warm in style.', sizes:['One Size'] },
];

const NEWBORN_BUNDLE_PRODUCTS = [
  { id:'organic-layette-5piece-set', name:'Organic Layette 5-Piece Set', category:'Layette Sets', collection:'Newborn Bundles', price:52.00, wasPrice:null,
    img:'product-newborn-layette-set.jpg', img2:'product-newborn-layette-set.jpg', badge:'Best Seller',
    desc:'A complete 5-piece layette in certified organic cotton — gowns, bodysuits, and a cap for the first days home.', sizes:['NB','0-3M'] },
  { id:'muslin-swaddle-wrap-duo', name:'Muslin Swaddle Wrap Duo', category:'Organic Wraps & Swaddles', collection:'Newborn Bundles', price:32.00, wasPrice:null,
    img:'product-newborn-swaddle-duo.jpg', img2:'product-newborn-swaddle-duo.jpg', badge:null,
    desc:'Two breathable organic muslin swaddle wraps in soft coordinating prints — gentle for the tiniest sleepers.', sizes:['One Size'] },
  { id:'coming-home-outfit-set', name:'Coming Home Outfit Set', category:'First Outfit Sets', collection:'Newborn Bundles', price:44.00, wasPrice:null,
    img:'product-newborn-coming-home-outfit.jpg', img2:'product-newborn-coming-home-outfit.jpg', badge:'New',
    desc:'A gentle, heirloom-style outfit set designed for baby’s very first ride home — soft seams, no scratchy tags.', sizes:['NB','0-3M'] },
  { id:'knit-welcome-blanket-hat', name:'Knit Welcome Blanket & Hat', category:'Newborn Accessories', collection:'Newborn Bundles', price:38.00, wasPrice:null,
    img:'product-newborn-blanket-hat.jpg', img2:'product-newborn-blanket-hat.jpg', badge:null,
    desc:'A hand-finished knit blanket paired with a matching cap — a sweet keepsake for those first photos.', sizes:['One Size'] },
  { id:'soft-cotton-kimono-layette', name:'Soft Cotton Kimono Layette', category:'Layette Sets', collection:'Newborn Bundles', price:58.00, wasPrice:null,
    img:'product-newborn-kimono-layette.jpg', img2:'product-newborn-kimono-layette.jpg', badge:'Limited Edition',
    desc:'Wrap-style kimono gowns in the softest organic cotton, easy to change without disturbing sleepy newborns.', sizes:['NB','0-3M'] },
  { id:'first-bootie-mitten-set', name:'First Bootie & Mitten Set', category:'Newborn Accessories', collection:'Newborn Bundles', price:28.00, wasPrice:null,
    img:'product-newborn-bootie-mitten.jpg', img2:'product-newborn-bootie-mitten.jpg', badge:null,
    desc:'Soft-knit booties and no-scratch mittens in a matching set — the smallest, coziest essentials.', sizes:['One Size'] },
];

const GIFT_SET_PRODUCTS = [
  { id:'welcome-baby-gift-box', name:'Welcome Baby Gift Box', category:'Baby Shower Gifts', collection:'Gift Sets', price:48.00, wasPrice:null,
    img:'product-giftset-welcome-baby-box.jpg', img2:'product-giftset-welcome-baby-box.jpg', badge:'Best Seller',
    desc:'A beautifully wrapped gift box with a footie, knit hat, and swaddle blanket — ready to give.', sizes:['NB','0-3M'] },
  { id:'first-birthday-outfit-set', name:'First Birthday Outfit Set', category:'First Birthday Sets', collection:'Gift Sets', price:56.00, wasPrice:null,
    img:'product-giftset-first-birthday.jpg', img2:'product-giftset-first-birthday.jpg', badge:'New',
    desc:'A celebration-ready outfit set with a matching "ONE" banner — made for cake smashes and milestone photos.', sizes:['12-18M','2T'] },
  { id:'keepsake-memory-box-set', name:'Keepsake Memory Box Set', category:'Keepsake Boxes', collection:'Gift Sets', price:72.00, wasPrice:null,
    img:'product-giftset-keepsake-memory-box.jpg', img2:'product-giftset-keepsake-memory-box.jpg', badge:'Limited Edition',
    desc:'A keepsake wooden box filled with a milestone blanket, cards, and a hand-embroidered keepsake — a gift they’ll keep for years.', sizes:['One Size'] },
  { id:'plush-bear-blanket-duo', name:'Plush Bear & Blanket Duo', category:'Plush & Comfort', collection:'Gift Sets', price:35.00, wasPrice:null,
    img:'product-giftset-plush-bear-blanket.jpg', img2:'product-giftset-plush-bear-blanket.jpg', badge:null,
    desc:'A huggable plush bear paired with a matching soft blanket — a sweet, simple gift for any occasion.', sizes:['One Size'] },
  { id:'new-parent-essentials-set', name:'New Parent Essentials Set', category:'Baby Shower Gifts', collection:'Gift Sets', price:64.00, wasPrice:null,
    img:'product-giftset-new-parent-essentials.jpg', img2:'product-giftset-new-parent-essentials.jpg', badge:null,
    desc:'A thoughtfully curated set of everyday newborn essentials, wrapped and ready for the baby shower.', sizes:['NB','0-3M'] },
  { id:'milestone-cards-onesie-set', name:'Milestone Cards & Onesie Set', category:'First Birthday Sets', collection:'Gift Sets', price:42.00, wasPrice:null,
    img:'product-giftset-milestone-cards-onesie.jpg', img2:'product-giftset-milestone-cards-onesie.jpg', badge:null,
    desc:'A set of monthly milestone cards paired with a soft cotton onesie — perfect for tracking baby’s first year.', sizes:['0-3M','3-6M'] },
];

const ALL_PRODUCTS = [...PRODUCTS, ...ACCESSORY_PRODUCTS, ...GIFT_PRODUCTS, ...PRINCESS_PRODUCTS, ...GENTLEMAN_PRODUCTS, ...COZY_ESSENTIALS_PRODUCTS, ...SEASONAL_PRODUCTS, ...NEWBORN_BUNDLE_PRODUCTS, ...GIFT_SET_PRODUCTS];

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
