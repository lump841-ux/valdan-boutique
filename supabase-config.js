/**
 * Val & Dan Kids Boutique — public-site Supabase connection.
 *
 * Same two PUBLIC values as admin/js/config.js (Supabase's "anon" key is
 * designed to be shipped in client code — protection comes from Row Level
 * Security in admin/schema.sql, not from hiding this key). Fill these in
 * once you've created your Supabase project; see README-ADMIN.md.
 *
 * Every public page (index/shop/collections/about/contact/product) loads
 * this file + the Supabase SDK + site-data.js. If these aren't filled in,
 * the site quietly falls back to its original hardcoded content — nothing
 * breaks for visitors.
 */
window.VD_SUPABASE_URL = 'https://ycdujcaebqaflrrzlxtt.supabase.co';
window.VD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZHVqY2FlYnFhZmxycnpseHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NzYwMTUsImV4cCI6MjEwNTU1MjAxNX0.vnJ5h0AChXTWnHa25FHp8YeJoAVbPPk0WJXFlXRHkJQ';

window.VD_SUPABASE_CONFIGURED =
  window.VD_SUPABASE_URL &&
  window.VD_SUPABASE_URL.indexOf('YOUR_SUPABASE') === -1 &&
  window.VD_SUPABASE_ANON_KEY &&
  window.VD_SUPABASE_ANON_KEY.indexOf('YOUR_SUPABASE') === -1;

window.vdPublicClient = null;
if (window.VD_SUPABASE_CONFIGURED && window.supabase) {
  window.vdPublicClient = window.supabase.createClient(window.VD_SUPABASE_URL, window.VD_SUPABASE_ANON_KEY);
}
