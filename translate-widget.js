/**
 * Val & Dan — one-click English/Spanish translation.
 *
 * Uses Google's free Website Translator (no API key, no backend, nothing to
 * maintain) to live-translate every page it's dropped into. Adds a small
 * floating "EN / ES" pill button (bottom-right) that flips the whole page
 * to Spanish and back. The choice is remembered across pages via a cookie,
 * so once someone picks Spanish it stays Spanish as they click around.
 *
 * Include on every page with: <script src="translate-widget.js"></script>
 * (use the correct relative path, e.g. "../translate-widget.js" from admin/).
 */
(function () {
  var COOKIE_NAME = 'googtrans';

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setLangCookie(value) {
    var host = location.hostname;
    // Set both with and without a leading-dot domain so it sticks whether
    // we're on a bare domain or a subdomain (Railway, custom domain, etc.).
    document.cookie = COOKIE_NAME + '=' + value + '; path=/;';
    if (host && host.indexOf('localhost') === -1) {
      document.cookie = COOKIE_NAME + '=' + value + '; path=/; domain=.' + host + ';';
    }
  }

  function clearLangCookie() {
    var host = location.hostname;
    document.cookie = COOKIE_NAME + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    if (host && host.indexOf('localhost') === -1) {
      document.cookie = COOKIE_NAME + '=; path=/; domain=.' + host + '; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    }
  }

  function isSpanishActive() {
    var c = getCookie(COOKIE_NAME);
    return !!c && c.indexOf('/es') !== -1;
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      // Hide Google's own translate banner + tooltip chrome so the site
      // keeps its own look — only our pill button is visible.
      '.goog-te-banner-frame.skiptranslate { display: none !important; }',
      'body { top: 0px !important; }',
      '#google_translate_element { display: none !important; }',
      '.goog-tooltip, .goog-tooltip:hover { display: none !important; }',
      '.goog-text-highlight { background: none !important; box-shadow: none !important; }',
      '#vd-lang-toggle {',
      '  position: fixed; bottom: 20px; right: 20px; z-index: 99999;',
      '  display: flex; align-items: center; gap: 6px;',
      '  background: #fff; border: 1px solid rgba(0,0,0,.12); border-radius: 999px;',
      '  padding: 8px 14px; font-family: system-ui, -apple-system, sans-serif; font-size: 13px;',
      '  font-weight: 700; color: #33313a; box-shadow: 0 4px 16px rgba(0,0,0,.14);',
      '  cursor: pointer; user-select: none; transition: transform .15s ease, box-shadow .15s ease;',
      '}',
      '#vd-lang-toggle:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.18); }',
      '#vd-lang-toggle .vd-lang-globe { font-size: 15px; line-height: 1; }',
      '@media (max-width: 640px) { #vd-lang-toggle { bottom: 14px; right: 14px; padding: 7px 12px; font-size: 12px; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function injectHiddenWidgetMount() {
    var div = document.createElement('div');
    div.id = 'google_translate_element';
    document.body.appendChild(div);
  }

  function injectToggleButton() {
    var btn = document.createElement('div');
    btn.id = 'vd-lang-toggle';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Switch language / Cambiar idioma');
    updateButtonLabel(btn);
    btn.addEventListener('click', function () {
      if (isSpanishActive()) {
        clearLangCookie();
      } else {
        setLangCookie('/en/es');
      }
      location.reload();
    });
    document.body.appendChild(btn);
  }

  function updateButtonLabel(btn) {
    var spanish = isSpanishActive();
    btn.innerHTML = '<span class="vd-lang-globe">🌐</span> ' + (spanish ? 'English' : 'Español');
  }

  function loadGoogleTranslateScript() {
    if (window.__vdGoogleTranslateLoading) return;
    window.__vdGoogleTranslateLoading = true;
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'es',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };
    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }

  function init() {
    injectStyles();
    injectHiddenWidgetMount();
    injectToggleButton();
    loadGoogleTranslateScript();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
