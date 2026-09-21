# Val & Dan Kids Boutique — Admin Backend

A private admin dashboard and Supabase backend now sit behind the existing public
site. The public pages look and behave exactly as before; they've been quietly
wired to pull live content when it's available, and fall back to their original
static content when it isn't.

## 1. What was built

- A Supabase backend: Postgres database with row-level security, 4 storage
  buckets for images, and email/password auth for admins only.
- A private admin dashboard at `/admin` (not linked from public nav) covering
  Hero Images, Products, Collections, New Arrivals, Media Library, Website
  Content, Contact Messages, Settings, and an Activity Log.
- A draft/publish workflow: admins can save changes as drafts and preview them
  before anything appears on the live site.
- A new public Contact page (`contact.html`) wired to a real contact form that
  lands in the admin Messages inbox, with spam protection (honeypot + cooldown).
- Public pages upgraded to pull hero images, product data, and editable text
  from the backend when configured, while remaining fully functional as static
  pages if the backend isn't set up or an image fails to load.

Nothing about the existing homepage, Shop, Collections, About, or product page
layout, fonts, colors, spacing, or animations was changed. The two intentional
scope decisions are called out in Section 9.

## 2. Files created or changed

**New — backend & admin**
- `admin/schema.sql` — full database schema, tables, and RLS policies
- `admin/storage.sql` — storage buckets and their access policies
- `admin/js/config.js` — Supabase URL/key placeholders (fill in during setup)
- `admin/js/supabase-client.js`, `admin/js/auth-guard.js`, `admin/js/upload.js`,
  `admin/js/activity-log.js`, `admin/js/ui.js` — shared admin logic
- `admin/admin.css` — dashboard-only styling (doesn't touch public `styles.css`)
- `admin/login.html`, `admin/reset-password.html`
- `admin/dashboard.html`, `admin/hero-images.html`, `admin/products.html`,
  `admin/collections.html`, `admin/new-arrivals.html`, `admin/media-library.html`,
  `admin/content.html`, `admin/messages.html`, `admin/settings.html`

**New — public site**
- `contact.html` — new Contact page, matching the existing design system
- `supabase-config.js` — Supabase URL/key placeholders for the public site
- `site-data.js` — helper functions that fetch published content and fall back
  safely to static content

**Changed — public site**
- `shop.js` — added a hook that syncs the product catalog from the backend if any published products exist
- `index.html`, `shop.html`, `collections.html`, `about.html`, `product.html` —
  added the 3 Supabase script tags, wired hero images and editable text to the
  backend, exposed a re-render hook so the product grid updates once real data
  loads
- `index.html`, `shop.html`, `collections.html`, `about.html`, `product.html`,
  `cart.html`, `wishlist.html`, `account.html` — added a "Contact" link to the
  header nav, mobile nav, and footer (previously missing or pointed to a dead
  `mailto:` link)

No file's visual design, CSS, or component structure was altered — only new
attributes (`data-vd-content`, `id`) and new `<script>` tags were added.

## 3. Database schema

Run `admin/schema.sql` once in the Supabase SQL Editor. It creates:

| Table | Purpose |
|---|---|
| `admin_users` | Approved admin accounts (manually added — no public signup) |
| `site_pages` | The 6 manageable pages (home, shop, collections, new-arrivals, about, contact) |
| `hero_images` | Per-page hero image, versioned by draft/published/archived status |
| `products` | Product catalog with pricing, sizes, colors, status, flags |
| `product_images` | Multiple images per product, ordered, with alt text |
| `collections` | Curated collections with cover image and homepage visibility |
| `collection_products` | Which products belong to which collection, ordered |
| `media_assets` | Every uploaded image — the Media Library's source of truth |
| `site_content` | Editable text fields (announcement bar, hero copy, policies, etc.) with separate draft/published values |
| `contact_messages` | Messages submitted through the public Contact form |
| `activity_logs` | Every meaningful admin action, for the Activity Log |

Every table has row-level security enabled. Public visitors can only read rows
where `status = 'published'` (or, for `site_content`, only the `site_content_public`
view — drafts never leak). Only approved admins (checked via an `is_admin()`
function) can insert, update, or delete anything except contact form submissions.

## 4. Storage buckets

Run `admin/storage.sql` once, after `schema.sql`. It creates 4 public-read,
admin-write buckets, each capped at 10MB and restricted to JPG/PNG/WEBP:

- `hero-images`
- `products`
- `collections`
- `media-library`

Uploaded files are always renamed to a random unique filename — the original
filename is never trusted or exposed.

## 5. Environment variables / configuration

There's no build step, so "environment variables" here just means two config
files with placeholders to fill in:

- `admin/js/config.js` — `VD_SUPABASE_URL`, `VD_SUPABASE_ANON_KEY`
- `supabase-config.js` (site root) — same two values

Both need your Supabase project's URL and **anon (public) key** — found in
Supabase → Project Settings → API. The anon key is safe to expose in
client-side code; it only grants what your RLS policies allow. The
**service_role key must never be pasted into any file in this project.**

## 6. Setup instructions

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run `admin/schema.sql`, then `admin/storage.sql`.
3. In Project Settings → API, copy the Project URL and the `anon public` key.
4. Paste both into `admin/js/config.js` and `supabase-config.js` (replacing the
   `YOUR_SUPABASE_...` placeholders).
5. Deploy the site as usual (see Section 8) — no other setup is required.

## 7. Creating the first admin account

There's intentionally no public admin signup. To create the first admin:

1. In Supabase → Authentication → Users, click **Add user** and create an
   account with the boutique owner's email and a temporary password (or have
   them use "Forgot Password" from `admin/login.html` after this step).
2. Copy that user's UUID from the Users table.
3. In the SQL Editor, run:
   ```sql
   insert into admin_users (id, email, full_name, is_active)
   values ('paste-the-uuid-here', 'owner@example.com', 'Owner Name', true);
   ```
4. They can now sign in at `yoursite.com/admin/login.html`.

To add more admins later, repeat steps 1–3 with their info.

## 8. Deploying

This is still a static site — deploy it exactly as before (Netlify, or any
static host), as long as `admin/js/config.js` and `supabase-config.js` are
filled in first. The `/admin` folder deploys along with everything else; it's
private because of authentication, not because it's hidden — anyone can reach
`/admin/login.html`, but only approved admins can get past it.

## 9. How the client uploads or changes photos

Walking through the Hero Images flow as an example (the same pattern applies
to Products, Collections, and Media Library):

1. Go to `yoursite.com/admin/login.html` and sign in.
2. Click **Hero Images** in the sidebar.
3. Click the page you want to update (e.g. About Us).
4. Click to upload a replacement image (JPG, PNG, or WEBP, under 10MB).
5. Click on the preview to set the focal point — this controls what part of
   the image stays visible on smaller screens.
6. Optionally update the alt text and left/center/right alignment.
7. Click **Save as Draft** to preview without going live, or **Publish** to
   make it live immediately.
8. The public page updates automatically — no code changes, no redeploy.

If an image is ever temporarily unavailable, the page quietly keeps showing
its previous image rather than breaking.

## 10. Confirmation: existing design was not altered

The homepage, Shop, Collections, New Arrivals section, About Us, and product
pages keep their original HTML structure, CSS classes, fonts, colors, spacing,
animations, and responsive behavior. All backend wiring was additive: new
`<script>` tags, new `data-vd-content` attributes on existing elements, and one
new `id`/class hook per hero image. No layout, component, or stylesheet was
rewritten.

Two intentional, honest scope limitations:

- **Collections page:** the 6 "Featured Collections" cards on `collections.html`
  keep their current hand-written copy and images rather than being replaced
  by a live database grid — restructuring that section into a generic
  database-driven layout would have meant redesigning it, which was explicitly
  out of scope. The admin Collections page and database fully support this if
  you'd like that page rebuilt as data-driven in a future pass.
- **New Arrivals:** the admin Hero Images page lists a "New Arrivals" slug (per
  the original spec), but New Arrivals is a homepage section
  (`index.html#new-arrivals`), not its own page, so there's no dedicated hero
  image element for it to control. New Arrivals products themselves are fully
  manageable from the admin New Arrivals page and do appear on the homepage.

## Final testing checklist

- [ ] Log in at `/admin/login.html` with an approved account
- [ ] Upload a new About Us hero image, set focal point, publish
- [ ] Confirm About Us page shows the new image with fade/overlay intact
- [ ] Confirm mobile view crops the image sensibly
- [ ] Create, edit, duplicate, and delete a test product
- [ ] Add multiple images to a product and reorder them
- [ ] Create a collection and assign products to it
- [ ] Toggle a product as a New Arrival and confirm it appears on the homepage
- [ ] Save a draft, confirm it does NOT appear publicly, then publish it
- [ ] Submit the public Contact form and confirm it appears in Messages
- [ ] Try accessing `/admin/dashboard.html` while logged out — confirm redirect to login
- [ ] Use "Forgot Password" and confirm the reset email flow works
