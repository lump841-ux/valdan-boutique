/**
 * Session + admin-role guard, shared by every protected admin page.
 * Call vdRequireAdmin() at the top of each page's script. It resolves with
 * { id, email, full_name, role } once confirmed, or redirects to login.html
 * and never resolves.
 */
window.vdCurrentAdmin = null;

async function vdRequireAdmin() {
  if (!vdRequireSupabase()) return null;

  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) {
    vdGoToLogin();
    return null;
  }

  // RLS on admin_users means this only ever returns a row for an approved,
  // active admin — if the signed-in user isn't one, this comes back empty.
  const { data: adminRow, error } = await window.sb
    .from('admin_users')
    .select('id, email, full_name, role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || !adminRow) {
    await window.sb.auth.signOut();
    vdGoToLogin('not-authorized');
    return null;
  }

  window.vdCurrentAdmin = adminRow;
  const nameEl = document.getElementById('vd-admin-name');
  if (nameEl) nameEl.textContent = adminRow.full_name || adminRow.email;
  return adminRow;
}

function vdGoToLogin(reason) {
  const here = encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html');
  const reasonParam = reason ? '&reason=' + reason : '';
  location.href = 'login.html?redirect=' + here + reasonParam;
}

async function vdLogout() {
  if (window.sb) await window.sb.auth.signOut();
  location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutEls = document.querySelectorAll('[data-vd-logout]');
  logoutEls.forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); vdLogout(); }));
});
