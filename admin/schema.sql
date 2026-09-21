-- ============================================================================
-- Val & Dan Kids Boutique — Admin Backend Schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query)
-- on a fresh Supabase project. Safe to re-run: uses IF NOT EXISTS guards.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. admin_users — approved administrator accounts.
--    A row here is what turns a Supabase Auth user into a dashboard admin.
--    Rows must be created manually (see README-ADMIN.md) — there is no public
--    sign-up flow, by design.
-- ----------------------------------------------------------------------------
create table if not exists admin_users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text,
  role         text not null default 'admin' check (role in ('admin','owner')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Helper used by every RLS policy below. SECURITY DEFINER avoids recursive
-- RLS lookups when admin_users itself is queried.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid() and is_active = true
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. site_pages — lookup table of pages that have a manageable hero image.
-- ----------------------------------------------------------------------------
create table if not exists site_pages (
  slug   text primary key,
  name   text not null
);
insert into site_pages (slug, name) values
  ('home','Homepage'),
  ('shop','Shop'),
  ('collections','Collections'),
  ('new-arrivals','New Arrivals'),
  ('about','About Us'),
  ('contact','Contact')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 3. media_assets — every uploaded file, regardless of where it's used.
--    storage_path is unique + machine-generated (never the original filename).
-- ----------------------------------------------------------------------------
create table if not exists media_assets (
  id                 uuid primary key default gen_random_uuid(),
  storage_bucket     text not null,
  storage_path       text not null unique,
  public_url         text not null,
  original_filename  text,
  mime_type          text,
  file_size_bytes    bigint,
  width              integer,
  height             integer,
  alt_text           text default '',
  category           text not null default 'media-library'
                       check (category in ('hero','product','collection','media-library')),
  uploaded_by        uuid references admin_users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. hero_images — one row per (page, status). A draft and a published row
--    can coexist for the same page; publishing archives the old published row.
-- ----------------------------------------------------------------------------
create table if not exists hero_images (
  id              uuid primary key default gen_random_uuid(),
  page_slug       text not null references site_pages(slug) on delete cascade,
  media_asset_id  uuid references media_assets(id),
  alt_text        text default '',
  focal_x         numeric(4,3) not null default 0.500 check (focal_x between 0 and 1),
  focal_y         numeric(4,3) not null default 0.500 check (focal_y between 0 and 1),
  alignment       text not null default 'left' check (alignment in ('left','center','right')),
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  published_at    timestamptz,
  created_by      uuid references admin_users(id),
  updated_by      uuid references admin_users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_hero_images_page_status on hero_images(page_slug, status);

-- ----------------------------------------------------------------------------
-- 5. collections
-- ----------------------------------------------------------------------------
create table if not exists collections (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  description        text default '',
  media_asset_id     uuid references media_assets(id),
  status             text not null default 'draft' check (status in ('draft','published','archived')),
  show_on_homepage   boolean not null default false,
  sort_order         integer not null default 0,
  created_by         uuid references admin_users(id),
  updated_by         uuid references admin_users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. products
-- ----------------------------------------------------------------------------
create table if not exists products (
  id                 uuid primary key default gen_random_uuid(),
  sku                text unique,
  slug               text not null unique,
  name               text not null,
  short_description  text default '',
  full_description   text default '',
  price              numeric(10,2) not null default 0,
  sale_price         numeric(10,2),
  category           text,               -- Girls / Boys / Unisex / Accessories / Gift Sets
  department         text,               -- Newborn / Baby / Toddler / Kids
  sizes              text[] not null default '{}',
  colors             text[] not null default '{}',
  inventory_qty      integer not null default 0,
  status             text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured        boolean not null default false,
  is_new_arrival     boolean not null default false,
  new_arrival_start  date,
  new_arrival_end    date,
  sort_order         integer not null default 0,
  created_by         uuid references admin_users(id),
  updated_by         uuid references admin_users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_new_arrival on products(is_new_arrival, new_arrival_start, new_arrival_end);

-- ----------------------------------------------------------------------------
-- 7. product_images — ordered gallery per product; exactly one is_primary.
-- ----------------------------------------------------------------------------
create table if not exists product_images (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  media_asset_id  uuid not null references media_assets(id),
  alt_text        text default '',
  is_primary      boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists idx_product_images_product on product_images(product_id, sort_order);

-- ----------------------------------------------------------------------------
-- 8. collection_products — many-to-many, with per-collection ordering.
-- ----------------------------------------------------------------------------
create table if not exists collection_products (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid not null references collections(id) on delete cascade,
  product_id     uuid not null references products(id) on delete cascade,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (collection_id, product_id)
);

-- ----------------------------------------------------------------------------
-- 9. site_content — editable text, keyed by a fixed set of content_key values.
--    draft_value is what the admin is editing; published_value is what the
--    public site reads. They only converge when the admin hits Publish.
-- ----------------------------------------------------------------------------
create table if not exists site_content (
  content_key      text primary key,
  label            text not null,
  draft_value      text default '',
  published_value  text default '',
  updated_by       uuid references admin_users(id),
  published_by     uuid references admin_users(id),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz
);
insert into site_content (content_key, label, draft_value, published_value) values
  ('announcement_bar',   'Announcement Bar',            '🚚  Free shipping on orders over $75', '🚚  Free shipping on orders over $75'),
  ('home_hero_eyebrow',  'Homepage Hero — Small Heading','Adorable Styles',                       'Adorable Styles'),
  ('home_hero_title',    'Homepage Hero — Main Heading', 'Made For Little Moments 💗',            'Made For Little Moments 💗'),
  ('home_hero_sub',      'Homepage Hero — Paragraph',    'Beautiful clothing created with love for your little one.', 'Beautiful clothing created with love for your little one.'),
  ('btn_shop_girls',     'Button Label — Shop Girls',    'Shop Girls', 'Shop Girls'),
  ('btn_shop_boys',      'Button Label — Shop Boys',     'Shop Boys', 'Shop Boys'),
  ('about_story',        'About Us — Story',             '', ''),
  ('mission_statement',  'Mission Statement',            '', ''),
  ('contact_email',      'Contact Email',                'hello@valdankids.com', 'hello@valdankids.com'),
  ('contact_phone',      'Contact Phone',                '', ''),
  ('social_instagram',   'Instagram URL',                '#', '#'),
  ('social_facebook',    'Facebook URL',                 '#', '#'),
  ('social_pinterest',   'Pinterest URL',                '#', '#'),
  ('shipping_message',   'Shipping Message',             'Free shipping on orders over $75. Orders ship within 1–2 business days.', 'Free shipping on orders over $75. Orders ship within 1–2 business days.'),
  ('return_policy',      'Return Policy Summary',        '30-day returns on unworn items with tags attached.', '30-day returns on unworn items with tags attached.')
on conflict (content_key) do nothing;

-- Public-safe view: only ever exposes the published value, never the draft.
create or replace view site_content_public as
  select content_key, published_value from site_content;

-- ----------------------------------------------------------------------------
-- 10. contact_messages
-- ----------------------------------------------------------------------------
create table if not exists contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text,
  subject      text,
  message      text not null,
  status       text not null default 'unread' check (status in ('unread','read','archived')),
  ip_address   text,
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  archived_at  timestamptz
);
create index if not exists idx_contact_messages_status on contact_messages(status, created_at desc);

-- ----------------------------------------------------------------------------
-- 10b. orders — placed via the public checkout flow (checkout.html)
-- ----------------------------------------------------------------------------
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  customer_name    text not null,
  email            text not null,
  phone            text,
  shipping_address jsonb not null,        -- { line1, line2, city, state, zip, country }
  items            jsonb not null,        -- [{ productId, name, size, qty, price }]
  subtotal         numeric(10,2) not null,
  shipping_cost    numeric(10,2) not null default 0,
  discount         numeric(10,2) not null default 0,
  total            numeric(10,2) not null,
  promo_code       text,
  payment_method   text default 'card',
  stripe_session_id         text,          -- set by the server once a Stripe Checkout Session is created
  stripe_payment_intent_id  text,          -- set by the Stripe webhook once payment succeeds
  status           text not null default 'pending_payment' check (status in ('pending_payment','received','processing','shipped','delivered','cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_orders_status on orders(status, created_at desc);
create index if not exists idx_orders_email on orders(email);
create unique index if not exists idx_orders_stripe_session on orders(stripe_session_id) where stripe_session_id is not null;

-- ----------------------------------------------------------------------------
-- 11. activity_logs
-- ----------------------------------------------------------------------------
create table if not exists activity_logs (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references admin_users(id),
  action       text not null,           -- e.g. 'login', 'hero_image.publish', 'product.create'
  entity_type  text,                    -- e.g. 'hero_image', 'product', 'collection'
  entity_id    uuid,
  details      jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_activity_logs_created on activity_logs(created_at desc);

-- updated_at auto-touch trigger, reused across tables
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
do $$
declare t text;
begin
  foreach t in array array['admin_users','media_assets','hero_images','collections','products','orders']
  loop
    execute format('drop trigger if exists trg_touch_updated_at on %I;', t);
    execute format('create trigger trg_touch_updated_at before update on %I for each row execute function touch_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Public (anon) visitors: read-only on published content, insert-only on
-- contact_messages. Everything else requires is_admin().
-- ============================================================================
alter table admin_users        enable row level security;
alter table site_pages         enable row level security;
alter table media_assets       enable row level security;
alter table hero_images        enable row level security;
alter table collections        enable row level security;
alter table products           enable row level security;
alter table product_images     enable row level security;
alter table collection_products enable row level security;
alter table site_content       enable row level security;
alter table contact_messages   enable row level security;
alter table orders             enable row level security;
alter table activity_logs      enable row level security;

-- admin_users: an admin can see the roster; nobody can self-insert (created
-- manually via the SQL editor or Supabase dashboard — see README-ADMIN.md).
drop policy if exists "admins read admin_users" on admin_users;
create policy "admins read admin_users" on admin_users for select using (is_admin());
drop policy if exists "admins update own row" on admin_users;
create policy "admins update own row" on admin_users for update using (auth.uid() = id);

-- site_pages: public read (just page slugs/names, nothing sensitive)
drop policy if exists "public read site_pages" on site_pages;
create policy "public read site_pages" on site_pages for select using (true);

-- media_assets: public read (these are public storage URLs by design);
-- writes are admin-only.
drop policy if exists "public read media_assets" on media_assets;
create policy "public read media_assets" on media_assets for select using (true);
drop policy if exists "admins write media_assets" on media_assets;
create policy "admins write media_assets" on media_assets for all using (is_admin()) with check (is_admin());

-- hero_images: public can only read published rows; admins read/write everything.
drop policy if exists "public read published hero_images" on hero_images;
create policy "public read published hero_images" on hero_images for select using (status = 'published');
drop policy if exists "admins manage hero_images" on hero_images;
create policy "admins manage hero_images" on hero_images for all using (is_admin()) with check (is_admin());

-- collections
drop policy if exists "public read published collections" on collections;
create policy "public read published collections" on collections for select using (status = 'published');
drop policy if exists "admins manage collections" on collections;
create policy "admins manage collections" on collections for all using (is_admin()) with check (is_admin());

-- products
drop policy if exists "public read published products" on products;
create policy "public read published products" on products for select using (status = 'published');
drop policy if exists "admins manage products" on products;
create policy "admins manage products" on products for all using (is_admin()) with check (is_admin());

-- product_images: readable if the parent product is published
drop policy if exists "public read product_images of published products" on product_images;
create policy "public read product_images of published products" on product_images for select
  using (exists (select 1 from products p where p.id = product_images.product_id and p.status = 'published'));
drop policy if exists "admins manage product_images" on product_images;
create policy "admins manage product_images" on product_images for all using (is_admin()) with check (is_admin());

-- collection_products: readable if the parent collection is published
drop policy if exists "public read collection_products of published collections" on collection_products;
create policy "public read collection_products of published collections" on collection_products for select
  using (exists (select 1 from collections c where c.id = collection_products.collection_id and c.status = 'published'));
drop policy if exists "admins manage collection_products" on collection_products;
create policy "admins manage collection_products" on collection_products for all using (is_admin()) with check (is_admin());

-- site_content: public cannot select the base table directly (draft_value
-- would leak); they use the site_content_public view instead. Admins get
-- full read/write on the base table.
drop policy if exists "admins manage site_content" on site_content;
create policy "admins manage site_content" on site_content for all using (is_admin()) with check (is_admin());
-- (no public select policy on site_content itself — access only via the view,
-- and views run with the querying role's privileges unless marked security
-- definer, so we grant select on the view to anon/authenticated instead.)
grant select on site_content_public to anon, authenticated;

-- contact_messages: public can insert only; admins can do everything.
drop policy if exists "public submit contact_messages" on contact_messages;
create policy "public submit contact_messages" on contact_messages for insert with check (true);
drop policy if exists "admins manage contact_messages" on contact_messages;
create policy "admins manage contact_messages" on contact_messages for all using (is_admin()) with check (is_admin());

-- orders: public can insert only, and only as a fresh pending_payment order with
-- no Stripe identifiers attached yet — marking an order "paid" is something
-- only the server (via the service_role key, which bypasses RLS entirely) can
-- do, from the Stripe webhook, once payment actually succeeds. Public has no
-- select/update policy, so a placed order can't be read back or tampered with
-- through the anon key.
drop policy if exists "public place orders" on orders;
create policy "public place orders" on orders for insert
  with check (status = 'pending_payment' and stripe_session_id is null and stripe_payment_intent_id is null);
drop policy if exists "admins manage orders" on orders;
create policy "admins manage orders" on orders for all using (is_admin()) with check (is_admin());

-- activity_logs: admin-only, both read and write.
drop policy if exists "admins manage activity_logs" on activity_logs;
create policy "admins manage activity_logs" on activity_logs for all using (is_admin()) with check (is_admin());

-- ============================================================================
-- DONE. Next: create the 4 storage buckets + policies — see storage.sql —
-- then create your first admin account — see README-ADMIN.md.
-- ============================================================================
