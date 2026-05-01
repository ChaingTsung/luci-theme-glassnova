(() => {
  'use strict';

  const defaults = {
    mode: 'auto',
    provider: 'local',
    local_url: '/luci-static/glassnova/media/default.svg',
    image_url: '',
    video_url: '',
    api_url: '',
    unsplash_url: 'https://source.unsplash.com/featured/1920x1080/?abstract,network,router',
    pixiv_api: '',
    twitter_api: '',
    selfhosted_api: '',
    youtube_id: '',
    glass_alpha: 0.56,
    glass_blur: 22,
    title_alpha: 0.42,
    reduce_motion: false
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function clampNumber(value, fallback, min, max) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function normalizeBoolean(value) {
    return value === true || value === '1' || value === 'true' || value === 'yes' || value === 'on';
  }

  function normalizeConfig(raw) {
    raw = raw || {};
    return {
      ...defaults,
      ...raw,
      mode: ['auto', 'light', 'dark'].includes(String(raw.mode)) ? String(raw.mode) : defaults.mode,
      provider: ['local', 'image', 'video', 'api', 'unsplash', 'pixiv', 'youtube', 'twitter', 'selfhosted'].includes(String(raw.provider)) ? String(raw.provider) : defaults.provider,
      glass_alpha: clampNumber(raw.glass_alpha, defaults.glass_alpha, 0.12, 0.95),
      glass_blur: clampNumber(raw.glass_blur, defaults.glass_blur, 0, 64),
      title_alpha: clampNumber(raw.title_alpha, defaults.title_alpha, 0.10, 0.95),
      reduce_motion: normalizeBoolean(raw.reduce_motion)
    };
  }

  function safeUrl(url) {
    const trimmed = String(url || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('/')) return trimmed;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
    } catch (_) {}
    return '';
  }

  function inferBackgroundType(url) {
    const path = (url.split('?')[0] || '').toLowerCase();
    if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.m3u8')) return 'video';
    if (path.endsWith('.gif')) return 'gif';
    return 'image';
  }

  async function fetchJson(url) {
    const safe = safeUrl(url);
    if (!safe) return null;
    try {
      const res = await fetch(safe, { cache: 'no-store', credentials: safe.startsWith('/') ? 'same-origin' : 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      if (typeof payload === 'string') return { url: safeUrl(payload) };
      if (payload && typeof payload === 'object') return payload;
    } catch (error) {
      console.warn('[GlassNova] Background API failed:', error);
    }
    return null;
  }

  async function loadConfig() {
    const inline = window.GlassNovaConfig || {};
    let api = {};
    try {
      const res = await fetch('/cgi-bin/glassnova-config', { cache: 'no-store', credentials: 'same-origin' });
      if (res.ok) api = await res.json();
    } catch (_) {}

    let local = {};
    try {
      local = JSON.parse(localStorage.getItem('glassnova:override') || '{}');
    } catch (_) {}

    return normalizeConfig({ ...defaults, ...inline, ...api, ...local });
  }

  function applyThemeMode(config) {
    const root = document.documentElement;
    const reduceMotion = config.reduce_motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resolved = config.mode === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.mode;

    root.dataset.gnTheme = resolved;
    root.style.setProperty('--gn-glass-alpha', String(config.glass_alpha));
    root.style.setProperty('--gn-login-blur', `${config.glass_blur}px`);
    root.style.setProperty('--gn-title-alpha', String(config.title_alpha));
    root.classList.toggle('gn-reduce-motion', reduceMotion);
  }

  function createBackgroundRoot() {
    let root = qs('.gn-background');
    if (!root) {
      root = document.createElement('div');
      root.className = 'gn-background';
      root.innerHTML = '<div class="gn-background__media" aria-hidden="true"></div>';
      document.body.prepend(root);
    }
    return root;
  }

  async function resolveBackground(config) {
    if (config.provider === 'youtube') return { type: 'youtube', id: config.youtube_id };
    if (config.provider === 'video') return { type: 'video', url: config.video_url };
    if (config.provider === 'image') return { type: inferBackgroundType(config.image_url), url: config.image_url };
    if (config.provider === 'unsplash') return { type: 'image', url: config.unsplash_url || defaults.unsplash_url };
    if (config.provider === 'pixiv') return await fetchJson(config.pixiv_api) || { type: 'image', url: config.local_url };
    if (config.provider === 'twitter') return await fetchJson(config.twitter_api) || { type: 'image', url: config.local_url };
    if (config.provider === 'selfhosted') return await fetchJson(config.selfhosted_api) || { type: 'image', url: config.local_url };
    if (config.provider === 'api') return await fetchJson(config.api_url) || { type: 'image', url: config.local_url };
    return { type: inferBackgroundType(config.local_url), url: config.local_url };
  }

  function renderBackground(payload) {
    const root = createBackgroundRoot();
    const media = qs('.gn-background__media', root);
    if (!media) return;
    media.replaceChildren();

    const type = payload.type || (payload.url ? inferBackgroundType(payload.url) : 'image');
    const url = safeUrl(payload.url || '');

    if (type === 'youtube') {
      const match = String(payload.id || '').match(/^[a-zA-Z0-9_-]{6,}$/);
      const id = match && match[0];
      if (!id) return;
      const iframe = document.createElement('iframe');
      iframe.title = 'Background video';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${encodeURIComponent(id)}&modestbranding=1&rel=0`;
      media.append(iframe);
      return;
    }

    if (!url) return;

    if (type === 'video') {
      const video = document.createElement('video');
      video.src = url;
      video.poster = safeUrl(payload.poster || '');
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
      media.append(video);
      video.play().catch(() => undefined);
      return;
    }

    const img = document.createElement('img');
    img.src = url;
    img.decoding = 'async';
    img.loading = 'eager';
    img.alt = '';
    media.append(img);
  }

  function detectLoginPage() {
    const passwordField = qs('input[type="password"]');
    const submitButton = qs('input[type="submit"], button[type="submit"]');
    const hasAdminMenu = !!qs('#mainmenu, .mainmenu, nav[aria-label="Navigation"]');
    const maybeLoginPath = location.pathname.includes('/cgi-bin/luci') || location.pathname.endsWith('/admin');
    const isLogin = !!passwordField && !!submitButton && (!hasAdminMenu || maybeLoginPath);
    document.body.classList.toggle('gn-login', isLogin);
  }

  function installThemeToggle(config) {
    const button = document.createElement('button');
    button.className = 'gn-theme-toggle';
    button.type = 'button';
    button.title = 'Toggle light/dark theme';
    button.setAttribute('aria-label', 'Toggle light/dark theme');

    const updateIcon = () => { button.textContent = document.documentElement.dataset.gnTheme === 'dark' ? '☀' : '☾'; };
    updateIcon();

    button.addEventListener('click', () => {
      const next = document.documentElement.dataset.gnTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('glassnova:override', JSON.stringify({ mode: next }));
      applyThemeMode({ ...config, mode: next });
      updateIcon();
      window.dispatchEvent(new CustomEvent('glassnova:theme-change', { detail: { mode: next } }));
    });

    document.body.append(button);
  }

  function ensureToastStack() {
    let stack = qs('.gn-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'gn-toast-stack';
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('aria-relevant', 'additions');
      document.body.append(stack);
    }
    return stack;
  }

  function classifyToast(element, fallback = 'info') {
    const classes = element && element.className ? String(element.className).toLowerCase() : '';
    const text = element && element.textContent ? element.textContent.toLowerCase() : '';
    if (classes.includes('error') || classes.includes('danger') || text.includes('error') || text.includes('failed')) return 'error';
    if (classes.includes('warn') || text.includes('warning')) return 'warning';
    if (classes.includes('success') || text.includes('success')) return 'success';
    return fallback;
  }

  function showToast(message, type = 'info', timeout = 6200) {
    const text = String(message || '').trim();
    if (!text) return;

    const stack = ensureToastStack();
    const toast = document.createElement('div');
    toast.className = `gn-toast gn-toast--${type}`;
    toast.role = type === 'error' ? 'alert' : 'status';
    toast.innerHTML = '<span class="gn-toast__bar"></span><div class="gn-toast__body"></div><button class="gn-toast__close" type="button" aria-label="Close">×</button>';
    qs('.gn-toast__body', toast).textContent = text;

    const close = () => {
      toast.style.animation = 'gn-toast-out .24s ease forwards';
      window.setTimeout(() => toast.remove(), 260);
    };

    const closeBtn = qs('.gn-toast__close', toast);
    if (closeBtn) closeBtn.addEventListener('click', close);
    stack.append(toast);
    if (timeout > 0) window.setTimeout(close, timeout);
  }

  function installToastBridge() {
    const seen = new WeakSet();
    const selectors = [
      '.alert-message', '.alert', '.errorbox', '.notice', '.warning', '.cbi-section-error',
      '[data-notification]', '[role="alert"]'
    ].join(',');

    const scan = (root = document) => {
      qsa(selectors, root).forEach((element) => {
        if (seen.has(element) || element.closest('.gn-toast-stack')) return;
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || text.length < 2) return;
        seen.add(element);
        showToast(text, classifyToast(element));
      });
    };

    scan();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node);
        });
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.GlassNovaToast = showToast;
  }

  async function boot() {
    const config = await loadConfig();
    applyThemeMode(config);
    renderBackground(await resolveBackground(config));
    detectLoginPage();
    installThemeToggle(config);
    installToastBridge();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (config.mode === 'auto') applyThemeMode(config);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
