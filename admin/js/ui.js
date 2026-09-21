/** Shared toast, confirm-modal, and mobile-sidebar helpers for admin pages. */

function vdToast(message, type) {
  let wrap = document.querySelector('.vd-toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'vd-toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'vd-toast' + (type ? ' ' + type : '');
  el.textContent = message;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3800);
}

/**
 * Shows a confirm modal. Returns a Promise<boolean>.
 * opts: { title, body, confirmLabel, danger, listItems }
 */
function vdConfirm(opts) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('vd-confirm-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'vd-confirm-overlay';
      overlay.className = 'vd-modal-overlay';
      overlay.innerHTML = `
        <div class="vd-modal">
          <h3 id="vd-confirm-title"></h3>
          <p id="vd-confirm-body"></p>
          <ul id="vd-confirm-list" style="display:none"></ul>
          <div class="vd-btn-row">
            <button class="btn btn-outline btn-sm" id="vd-confirm-cancel">Cancel</button>
            <button class="btn btn-sm" id="vd-confirm-ok">Confirm</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    overlay.querySelector('#vd-confirm-title').textContent = opts.title || 'Are you sure?';
    overlay.querySelector('#vd-confirm-body').textContent = opts.body || 'This action cannot be undone.';
    const list = overlay.querySelector('#vd-confirm-list');
    if (opts.listItems && opts.listItems.length) {
      list.style.display = 'block';
      list.innerHTML = opts.listItems.map((i) => `<li>${i}</li>`).join('');
    } else {
      list.style.display = 'none';
      list.innerHTML = '';
    }
    const okBtn = overlay.querySelector('#vd-confirm-ok');
    okBtn.textContent = opts.confirmLabel || 'Delete';
    okBtn.className = 'btn btn-sm ' + (opts.danger === false ? 'btn-primary' : 'btn-danger');
    overlay.classList.add('open');

    const cleanup = (result) => {
      overlay.classList.remove('open');
      okBtn.onclick = null;
      overlay.querySelector('#vd-confirm-cancel').onclick = null;
      resolve(result);
    };
    okBtn.onclick = () => cleanup(true);
    overlay.querySelector('#vd-confirm-cancel').onclick = () => cleanup(false);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.vd-mobile-nav-toggle');
  const sidebar = document.querySelector('.vd-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
});
