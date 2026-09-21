/**
 * Val & Dan Kids Boutique — Supabase connection config.
 *
 * Fill these two values in after you create your Supabase project
 * (Project Settings → API). Both are PUBLIC values — Supabase is designed to
 * have this "anon" key shipped in client-side code; it grants no access on
 * its own. All real protection comes from the Row Level Security policies in
 * schema.sql (see README-ADMIN.md). Never put your service_role key here or
 * anywhere in this folder — it must never leave the Supabase dashboard.
 */
window.VD_SUPABASE_URL = 'https://ycdujcaebqaflrrzlxtt.supabase.co';
window.VD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZHVqY2FlYnFhZmxycnpseHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NzYwMTUsImV4cCI6MjEwNTU1MjAxNX0.vnJ5h0AChXTWnHa25FHp8YeJoAVbPPk0WJXFlXRHkJQ';

window.VD_SUPABASE_CONFIGURED =
  window.VD_SUPABASE_URL &&
  window.VD_SUPABASE_URL.indexOf('YOUR_SUPABASE') === -1 &&
  window.VD_SUPABASE_ANON_KEY &&
  window.VD_SUPABASE_ANON_KEY.indexOf('YOUR_SUPABASE') === -1;
