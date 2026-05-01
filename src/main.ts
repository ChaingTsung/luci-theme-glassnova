'use strict';

(function () {
  var defaults = {
    mode: 'auto',
    provider: 'local',
    local_url: '/luci-static/glassnova/media/default.svg',
    image_url: '',
    video_url: '',
    api_url: '',
    unsplash_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80',
    pixiv_api: '',
    twitter_api: '',
    selfhosted_api: '',
    youtube_id: '',
    glass_alpha: 0.76,
    glass_blur: 18,
    title_alpha: 0.58,
    reduce_motion: false
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function clampNumber(value, fallback, min, max) {
    var n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function normalizeBoolean(value) {
    return value === true || value === '1' || value === 'true' || value === 'yes' || value === 'on';
  }

  function normalizeConfig(raw) {
    raw = raw || {};
    return {
      mode: ['auto', 'light', 'dark'].indexOf(String(raw.mode)) >= 0 ? String(raw.mode) : defaults.mode,
      provider: ['local', 'image', 'video', 'api', 'unsplash', 'pixiv', 'youtube', 'twitter', 'selfhosted'].indexOf(String(raw.provider)) >= 0 ? String(raw.provider) : defaults.provider,
      local_url: raw.local_url || defaults.local_url,
      image_url: raw.image_url || defaults.image_url,
      video_url: raw.video_url || defaults.video_url,
      api_url: raw.api_url || defaults.api_url,
      unsplash_url: raw.unsplash_url || defaults.unsplash_url,
      pixiv_api: raw.pixiv_api || defaults.pixiv_api,
      twitter_api: raw.twitter_api || defaults.twitter_api,
      selfhosted_api: raw.selfhosted_api || defaults.selfhosted_api,
      youtube_id: raw.youtube_id || defaults.youtube_id,
      glass_alpha: clampNumber(raw.glass_alpha, defaults.glass_alpha, 0.12, 0.95),
      glass_blur: clampNumber(raw.glass_blur, defaults.glass_blur, 0, 64),
      title_alpha: clampNumber(raw.title_alpha, defaults.title_alpha, 0.10, 0.95),
      reduce_motion: normalizeBoolean(raw.reduce_motion)
    };
  }

  function safeUrl(url) {
    var trimmed = String(url || '').trim();
    if (!trimmed) return '';
    if (trimmed.charAt(0) === '/') return trimmed;
    try {
      var parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
    } catch (e) {}
    return '';
  }

  function inferBackgroundType(url) {
    var path = (url.split('?')[0] || '').toLowerCase();
    if (/\.(mp4|webm|m3u8)$/.test(path)) return 'video';
    if (/\.gif$/.test(path)) return 'gif';
    return 'image';
  }

  function fetchJson(url) {
    var safe = safeUrl(url);
    if (!safe) return Promise.resolve(null);
    return fetch(safe, {
      cache: 'no-store',
      credentials: safe.charAt(0) === '/' ? 'same-origin' : 'omit'
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (payload) {
      if (typeof payload === 'string') return { url: safeUrl(payload) };
      if (payload && typeof payload === 'object') return payload;
      return null;
    }).catch(function (error) {
      console.warn('[GlassNova] Background API failed:', error);
      return null;
    });
  }

  function loadConfig() {
    var inline = window.GlassNovaConfig || {};
    var local = {};
    try {
      local = JSON.parse(localStorage.getItem('glassnova:override') || '{}');
    } catch (e) {}
    return Promise.resolve(normalizeConfig(Object.assign({}, defaults, inline, local)));
  }

  function applyThemeMode(config) {
    var root = document.documentElement;
    var reduceMotion = config.reduce_motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var resolved = config.mode === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.mode;

    root.dataset.gnTheme = resolved;
    root.style.setProperty('--gn-glass-alpha', String(config.glass_alpha));
    root.style.setProperty('--gn-login-blur', config.glass_blur + 'px');
    root.style.setProperty('--gn-title-alpha', String(config.title_alpha));
    root.classList.toggle('gn-reduce-motion', reduceMotion);
  }

  function createBackgroundRoot() {
    var root = qs('.gn-background');
    if (!root) {
      root = document.createElement('div');
      root.className = 'gn-background';
      root.innerHTML = '<div class="gn-background__media" aria-hidden="true"></div>';
      document.body.insertBefore(root, document.body.firstChild);
    }
    return root;
  }

  function resolveBackground(config) {
    if (config.provider === 'youtube') return Promise.resolve({ type: 'youtube', id: config.youtube_id });
    if (config.provider === 'video') return Promise.resolve({ type: 'video', url: config.video_url });
    if (config.provider === 'image') return Promise.resolve({ type: inferBackgroundType(config.image_url), url: config.image_url });
    if (config.provider === 'unsplash') return Promise.resolve({ type: 'image', url: config.unsplash_url || defaults.unsplash_url });
    if (config.provider === 'pixiv') return fetchJson(config.pixiv_api).then(function (p) { return p || { type: 'image', url: config.local_url }; });
    if (config.provider === 'twitter') return fetchJson(config.twitter_api).then(function (p) { return p || { type: 'image', url: config.local_url }; });
    if (config.provider === 'selfhosted') return fetchJson(config.selfhosted_api).then(function (p) { return p || { type: 'image', url: config.local_url }; });
    if (config.provider === 'api') return fetchJson(config.api_url).then(function (p) { return p || { type: 'image', url: config.local_url }; });
    return Promise.resolve({ type: inferBackgroundType(config.local_url), url: config.local_url });
  }

  function renderBackground(payload) {
    var root = createBackgroundRoot();
    var media = qs('.gn-background__media', root);
    if (!media) return;
    media.replaceChildren();

    var type = payload.type || (payload.url ? inferBackgroundType(payload.url) : 'image');
    var url = safeUrl(payload.url || '');

    if (type === 'youtube') {
      var match = String(payload.id || '').match(/^[a-zA-Z0-9_-]{6,}$/);
      if (!match) return;
      var iframe = document.createElement('iframe');
      iframe.title = 'Background video';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(match[0]) + '?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=' + encodeURIComponent(match[0]) + '&modestbranding=1&rel=0';
      media.appendChild(iframe);
      return;
    }

    if (!url) return;

    if (type === 'video') {
      var video = document.createElement('video');
      video.src = url;
      video.poster = safeUrl(payload.poster || '');
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
      media.appendChild(video);
      video.play().catch(function () {});
      return;
    }

    var img = document.createElement('img');
    img.src = url;
    img.decoding = 'async';
    img.loading = 'eager';
    img.alt = '';
    media.appendChild(img);
  }

  function isLoginPage() {
    var passwordField = qs('input[type="password"]');
    var submitButton = qs('input[type="submit"], button[type="submit"]');
    var adminMenu = (qs('#topmenu') && qs('#topmenu').children.length) || (qs('#modemenu') && qs('#modemenu').children.length);
    return !!passwordField && !!submitButton && !adminMenu;
  }

  function enhanceLoginPage() {
    var login = isLoginPage();
    document.body.classList.toggle('gn-login', login);
    if (!login) return;

    var main = qs('#maincontent') || document.body;
    qsa('.alert-message.warning, .alert.warning, .alert-message p a[href*="admin/system/admin"]', main).forEach(function (el) {
      var box = el.closest('.alert-message, .alert');
      if (box) box.style.display = 'none';
    });

    var form = qs('form', main);
    var card = form || qs('#login', main) || qs('.login-form', main) || qs('.cbi-map', main);
    if (!card) return;

    card.classList.add('gn-auth-form');
    card.classList.add('gn-login-card');

    if (form) {
      qsa('.cbi-map, .cbi-section, fieldset, .cbi-section-node', form).forEach(function (el) {
        el.classList.add('gn-login-clean');
      });
    }

    var submit = qs('input[type="submit"], button[type="submit"]', card);
    if (submit && !submit.closest('.gn-runway-wrap')) {
      var wrap = document.createElement('span');
      wrap.className = 'gn-runway-wrap';
      submit.classList.add('gn-runway-button');
      submit.parentNode.insertBefore(wrap, submit);
      wrap.appendChild(submit);
    }

    var existingTitle = qs('h2,h3,legend,.cbi-map-title', card);
    if (!existingTitle) {
      var title = document.createElement('div');
      title.className = 'gn-login-title';
      title.textContent = '登录';
      card.insertBefore(title, card.firstChild);
    }

    if (!qs('.gn-login-subtitle', card)) {
      var subtitle = document.createElement('p');
      subtitle.className = 'gn-login-subtitle';
      subtitle.textContent = '请输入用户名和密码以继续访问 LuCI。';
      var titleNode = qs('.gn-login-title, h2, h3, .cbi-map-title, legend', card);
      if (titleNode && titleNode.nextSibling) titleNode.parentNode.insertBefore(subtitle, titleNode.nextSibling);
      else card.appendChild(subtitle);
    }
  }


  function applyDaisyTheme(theme) {
    var allowed = ['fantasy', 'winter', 'forest', 'sunset'];
    if (allowed.indexOf(theme) < 0) theme = 'winter';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.dataset.gnTheme = (theme === 'forest' || theme === 'sunset') ? 'dark' : 'light';
    localStorage.setItem('glassnova:theme', theme);
  }

  function installDaisyThemeSelect(config) {
    if (qs('.gn-theme-select')) return;
    var select = document.createElement('select');
    select.className = 'gn-theme-select select select-bordered select-sm';
    select.setAttribute('aria-label', '选择主题');
    select.innerHTML = '<option value="winter">winter</option><option value="fantasy">fantasy</option><option value="forest">forest</option><option value="sunset">sunset</option>';
    select.value = localStorage.getItem('glassnova:theme') || ((config && config.mode === 'dark') ? 'forest' : 'winter');
    applyDaisyTheme(select.value);
    select.addEventListener('change', function () {
      applyDaisyTheme(select.value);
    });
    document.body.appendChild(select);
  }
  function installThemeToggle(config) {
    var button = document.createElement('button');
    button.className = 'gn-theme-toggle';
    button.type = 'button';
    button.title = '切换亮色/暗色';
    button.setAttribute('aria-label', '切换亮色/暗色');

    function updateIcon() {
      button.textContent = document.documentElement.dataset.gnTheme === 'dark' ? '☀' : '☾';
    }

    updateIcon();
    button.addEventListener('click', function () {
      var next = document.documentElement.dataset.gnTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('glassnova:override', JSON.stringify({ mode: next }));
      applyThemeMode(Object.assign({}, config, { mode: next }));
      updateIcon();
    });

    document.body.appendChild(button);
  }

  function ensureToastStack() {
    var stack = qs('.gn-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'gn-toast-stack';
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(stack);
    }
    return stack;
  }

  function classifyToast(element, fallback) {
    fallback = fallback || 'info';
    var classes = element && element.className ? String(element.className).toLowerCase() : '';
    var text = element && element.textContent ? element.textContent.toLowerCase() : '';
    if (classes.indexOf('error') >= 0 || classes.indexOf('danger') >= 0 || text.indexOf('error') >= 0 || text.indexOf('failed') >= 0) return 'error';
    if (classes.indexOf('warn') >= 0 || text.indexOf('warning') >= 0) return 'warning';
    if (classes.indexOf('success') >= 0 || text.indexOf('success') >= 0) return 'success';
    return fallback;
  }

  function showToast(message, type, timeout) {
    type = type || 'info';
    timeout = timeout || 6200;
    var text = String(message || '').trim();
    if (!text) return;

    var stack = ensureToastStack();
    var toast = document.createElement('div');
    toast.className = 'gn-toast gn-toast--' + type;
    toast.role = type === 'error' ? 'alert' : 'status';
    toast.innerHTML = '<span class="gn-toast__bar"></span><div class="gn-toast__body"></div><button class="gn-toast__close" type="button" aria-label="Close">×</button>';
    qs('.gn-toast__body', toast).textContent = text;

    function close() {
      toast.style.animation = 'gn-toast-out .24s ease forwards';
      window.setTimeout(function () { toast.remove(); }, 260);
    }

    qs('.gn-toast__close', toast).addEventListener('click', close);
    stack.appendChild(toast);
    window.setTimeout(close, timeout);
  }

  function bridgeLuCiMessages() {
    function consume(root) {
      qsa('.alert-message, .alert, .notice', root || document).forEach(function (el) {
        if (el.dataset.gnToastified === '1') return;
        el.dataset.gnToastified = '1';
        var text = (el.innerText || el.textContent || '').trim();
        if (!text) return;
        if (document.body.classList.contains('gn-login') && (el.style.display === 'none' || /No password set|未设置密码|password configuration|密码配置/i.test(text))) {
          el.style.display = 'none';
          return;
        }
        showToast(text, classifyToast(el));
        if (!document.body.classList.contains('gn-login')) el.style.display = 'none';
      });
    }

    consume(document);
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, function (node) {
          if (node instanceof HTMLElement) consume(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function installAuroraScene() {
    if (!document.body.classList.contains('gn-login') || qs('.gn-aurora-scene')) return;
    var scene = document.createElement('div');
    scene.className = 'gn-aurora-scene';
    for (var i = 0; i < 8; i++) {
      var dot = document.createElement('span');
      dot.className = 'gn-aurora-dot';
      scene.appendChild(dot);
    }
    document.body.appendChild(scene);
  }

  function bindTestToastButton() {
    qsa('[data-gn-test-toast], .gn-test-toast').forEach(function (button) {
      if (button.dataset.gnBound === '1') return;
      button.dataset.gnBound = '1';
      button.addEventListener('click', function (ev) {
        ev.preventDefault();
        showToast('这是一个测试通知。', 'info');
      });
    });
  }

  function init() {
    loadConfig().then(function (config) {
      applyThemeMode(config);
      return resolveBackground(config).then(function (payload) {
        renderBackground(payload);
        enhanceLoginPage();
        installAuroraScene();
        installDaisyThemeSelect(config);
        bridgeLuCiMessages();
        bindTestToastButton();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
