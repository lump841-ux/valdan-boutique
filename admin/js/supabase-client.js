/**
 * Initializes the shared Supabase client for the admin dashboard.
 * Requires config.js to be loaded first, and the Supabase JS SDK
 * (https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2) to be loaded before
 * this file.
 */
window.sb = null;

if (window.VD_SUPABASE_CONFIGURED && window.supabase) {
  window.sb = window.supabase.createClient(window.VD_SUPABASE_URL, window.VD_SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
} else {
  console.warn(
    '[Val & Dan Admin] Supabase is not configured yet. Edit admin/js/config.js with your ' +
      'project URL + anon key. See README-ADMIN.md for setup steps.'
  );
}

/** Small helper so every admin page can bail out with one clear message. */
function vdRequireSupabase() {
  if (!window.sb) {
    const el = document.getElementById('vd-config-warning');
    if (el) el.style.display = 'flex';
    return false;
  }
  return true;
}
