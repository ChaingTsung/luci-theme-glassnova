'use strict';
(function () {
  var defaults = { mode: 'auto', provider: 'local', local_url: '/luci-static/glassnova/media/default.svg', glass_alpha: 0.76, glass_blur: 18, title_alpha: 0.58, reduce_motion: false };
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function cfg() { return Object.assign({}, defaults, window.GlassNovaConfig || {}); }
  function applyTheme(c) {
    var root = document.documentElement;
    var dark = c.mode === 'dark' || (c.mode === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.gnTheme = dark ? 'dark' : 'light';
    root.style.setProperty('--gn-glass-alpha', String(c.glass_alpha || defaults.glass_alpha));
    root.style.setProperty('--gn-login-blur', String(c.glass_blur || defaults.glass_blur) + 'px');
    root.style.setProperty('--gn-title-alpha', String(c.title_alpha || defaults.title_alpha));
  }
  function safeUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (u[0] === '/') return u; try { var x = new URL(u); return /https?:/.test(x.protocol) ? x.toString() : ''; } catch(e) { return ''; } }
  function renderBackground(c) {
    var box = qs('.gn-background__media'); if (!box) return;
    var url = safeUrl(c.local_url || defaults.local_url); if (!url) return;
    var img = document.createElement('img'); img.src = url; img.alt = ''; img.decoding = 'async';
    box.replaceChildren(img);
  }
  function isLoginPage() {
    return !!qs('input[type="password"]') && !!qs('input[type="submit"], button[type="submit"]') && !(qs('#topmenu') && qs('#topmenu').children.length);
  }
  function enhanceLogin() {
    var login = isLoginPage(); document.body.classList.toggle('gn-login', login); if (!login) return;
    var main = qs('#maincontent') || document.body;
    qsa('.alert-message.warning, .alert.warning', main).forEach(function (el) { el.style.display = 'none'; });
    var form = qs('form', main); var card = form || qs('#login', main) || qs('.login-form', main) || qs('.cbi-map', main); if (!card) return;
    card.classList.add('gn-auth-form', 'gn-login-card');
    qsa('.cbi-map, .cbi-section, fieldset, .cbi-section-node', card).forEach(function (el) { el.classList.add('gn-login-clean'); });
    var submit = qs('input[type="submit"], button[type="submit"]', card);
    if (submit && !submit.closest('.gn-runway-wrap')) { var wrap = document.createElement('span'); wrap.className = 'gn-runway-wrap'; submit.classList.add('gn-runway-button'); submit.parentNode.insertBefore(wrap, submit); wrap.appendChild(submit); }
    if (!qs('h2,h3,legend,.cbi-map-title,.gn-login-title', card)) { var title = document.createElement('div'); title.className = 'gn-login-title'; title.textContent = '登录'; card.insertBefore(title, card.firstChild); }
  }
  function installThemeSelect(c) {
    if (qs('.gn-theme-select')) return;
    var select = document.createElement('select'); select.className = 'gn-theme-select'; select.setAttribute('aria-label', '选择主题');
    select.innerHTML = '<option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option>';
    select.value = localStorage.getItem('glassnova:mode') || c.mode || 'auto';
    select.addEventListener('change', function () { localStorage.setItem('glassnova:mode', select.value); applyTheme(Object.assign({}, c, { mode: select.value })); });
    document.body.appendChild(select);
  }
  function init() { var c = cfg(); c.mode = localStorage.getItem('glassnova:mode') || c.mode; applyTheme(c); renderBackground(c); enhanceLogin(); installThemeSelect(c); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
