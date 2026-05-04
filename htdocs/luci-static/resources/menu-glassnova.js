'use strict';
'require baseclass';
'require ui';

return baseclass.extend({
  __init__() {
    ui.menu.load().then(L.bind(this.render, this));
  },

  render(tree) {
    this.prepareTopbar();
    this.renderMainFromTree(tree);
    this.renderTabs(tree);
    this.installHandlers();
  },

  prepareTopbar() {
    const topbar = document.querySelector('.gn-topbar');
    const topmenu = document.querySelector('#topmenu');
    if (!topbar || !topmenu) return;

    let nav = topbar.querySelector('.gn-main-nav');
    if (!nav) {
      nav = E('nav', { 'class': 'gn-main-nav', 'aria-label': _('Main navigation') });
      topmenu.parentNode.insertBefore(nav, topmenu);
      nav.appendChild(topmenu);
    }

    if (!topbar.querySelector('.gn-nav-toggle')) {
      const button = E('button', {
        'class': 'gn-nav-toggle', 'type': 'button', 'aria-expanded': 'false', 'aria-controls': 'topmenu'
      }, [ E('span', { 'aria-hidden': 'true' }, [ '☰' ]), E('span', {}, [ _('Menu') ]) ]);

      button.addEventListener('click', ev => {
        ev.preventDefault(); ev.stopPropagation();
        const open = !document.body.classList.contains('gn-nav-open');
        document.body.classList.toggle('gn-nav-open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) this.closeOpenMenus();
      });
      topbar.insertBefore(button, nav);
    }

    if (!document.querySelector('.gn-nav-backdrop')) {
      const backdrop = E('div', { 'class': 'gn-nav-backdrop', 'aria-hidden': 'true' });
      backdrop.addEventListener('click', () => this.closeMobileDrawer());
      document.body.appendChild(backdrop);
    }
  },

  findAdminRoot(tree) {
    const roots = ui.menu.getChildren(tree);
    if (!roots.length) return null;
    const req0 = (L.env.requestpath && L.env.requestpath[0]) || (L.env.dispatchpath && L.env.dispatchpath[0]);
    return roots.filter(n => n.name === req0)[0] || roots.filter(n => n.name === 'admin')[0] || roots[0];
  },

  renderMainFromTree(tree) {
    const root = this.findAdminRoot(tree);
    if (!root) return;
    const topmenu = document.querySelector('#topmenu');
    if (!topmenu) return;
    topmenu.textContent = '';
    topmenu.classList.add('menu', 'menu-horizontal', 'gn-menu-root');
    ui.menu.getChildren(root).forEach(child => this.appendTopItem(topmenu, child, root.name + '/' + child.name));
    topmenu.style.display = '';
  },

  appendTopItem(ul, child, url) {
    const children = ui.menu.getChildren(child);
    const active = L.env.dispatchpath && L.env.dispatchpath.indexOf(child.name) >= 0;
    const li = E('li', { 'class': (children.length ? 'dropdown ' : '') + (active ? 'active' : '') });

    if (children.length) {
      const submenu = this.renderSubmenu(child, url, 0);
      const toggle = E('button', { 'class': 'gn-menu-toggle', 'type': 'button', 'aria-expanded': 'false' }, [
        this.makeIcon(child.name), E('span', { 'class': 'gn-menu-label' }, [ _(child.title) ]), E('span', { 'class': 'gn-menu-chevron', 'aria-hidden': 'true' }, [ '▾' ])
      ]);
      toggle.addEventListener('click', ev => {
        ev.preventDefault(); ev.stopPropagation();
        const open = li.classList.contains('open');
        this.closeOpenMenus();
        if (!open) {
          li.classList.add('open');
          toggle.setAttribute('aria-expanded', 'true');
          this.placeDropdown(toggle, submenu);
        }
      });
      li.appendChild(toggle); li.appendChild(submenu);
    } else {
      li.appendChild(E('a', { 'href': L.url(url) }, [ this.makeIcon(child.name), E('span', { 'class': 'gn-menu-label' }, [ _(child.title) ]) ]));
    }
    ul.appendChild(li);
  },

  renderSubmenu(tree, url, depth) {
    const children = ui.menu.getChildren(tree);
    const ul = E('ul', { 'class': depth ? 'gn-submenu-vertical' : 'dropdown-menu gn-dropdown-menu gn-submenu-vertical' });
    if (!depth) {
      if (children.length >= 10) ul.classList.add('gn-dropdown-menu--columns');
      if (children.length >= 20) ul.classList.add('gn-dropdown-menu--columns-3');
    }
    children.forEach(child => {
      const nextUrl = url + '/' + child.name;
      const nested = this.renderSubmenu(child, nextUrl, (depth || 0) + 1);
      const li = E('li', { 'class': nested.firstElementChild ? 'has-submenu' : '' });
      li.appendChild(E('a', { 'href': L.url(nextUrl) }, [ _(child.title) ]));
      if (nested.firstElementChild) li.appendChild(nested);
      ul.appendChild(li);
    });
    return ul;
  },

  renderTabs(tree) {
    const container = document.querySelector('#tabmenu');
    if (!container || !L.env.dispatchpath || L.env.dispatchpath.length < 3) return;
    let node = tree, url = '';
    for (let i = 0; i < 3 && node; i++) {
      node = node.children[L.env.dispatchpath[i]];
      url += (url ? '/' : '') + L.env.dispatchpath[i];
    }
    if (node) this.renderTabMenu(node, url, 0);
  },

  renderTabMenu(tree, url, level) {
    const container = document.querySelector('#tabmenu');
    const children = ui.menu.getChildren(tree);
    if (!container || !children.length) return;
    const ul = E('ul', { 'class': 'tabs gn-tabs' });
    let activeNode = null;
    children.forEach(child => {
      const active = L.env.dispatchpath[3 + (level || 0)] === child.name;
      ul.appendChild(E('li', { 'class': 'tabmenu-item-%s%s'.format(child.name, active ? ' active' : '') }, [ E('a', { 'href': L.url(url, child.name) }, [ _(child.title) ]) ]));
      if (active) activeNode = child;
    });
    container.appendChild(ul); container.style.display = '';
    if (activeNode) this.renderTabMenu(activeNode, url + '/' + activeNode.name, (level || 0) + 1);
  },

  makeIcon(name) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    const n = String(name || '').toLowerCase();
    const paths = n.indexOf('system') >= 0 ? ['M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z','M19.4 15a1.7 1.7 0 0 0 .34 1.87l.03.03a2 2 0 0 1-2.83 2.83l-.03-.03A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 0 1-4 0v-.04a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.03.03a2 2 0 1 1-2.83-2.83l.03-.03A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 0 1 0-4h.04a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.03-.03a2 2 0 0 1 2.83-2.83l.03.03A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 0 1 4 0v.04a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.03-.03a2 2 0 0 1 2.83 2.83l-.03.03A1.7 1.7 0 0 0 19.4 9c.08.37.3.7.6 1H20a2 2 0 0 1 0 4h-.04c-.3.3-.52.63-.6 1Z'] :
      n.indexOf('network') >= 0 ? ['M6 9a6 6 0 0 1 12 0','M9 12a3 3 0 0 1 6 0','M12 16h.01','M4 19h16'] :
      n.indexOf('status') >= 0 ? ['M4 19V5','M8 17v-5','M12 17V7','M16 17v-9','M20 17v-3'] : ['M4 6h16','M4 12h16','M4 18h16'];
    paths.forEach(d => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); svg.appendChild(p); });
    return E('span', { 'class': 'gn-menu-icon' }, [ svg ]);
  },

  placeDropdown(toggle, menu) {
    const rect = toggle.getBoundingClientRect(), margin = 12;
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const columns = menu.classList.contains('gn-dropdown-menu--columns');
    const three = menu.classList.contains('gn-dropdown-menu--columns-3');
    const width = three ? Math.min(980, vw - margin * 2) : (columns ? Math.min(760, vw - margin * 2) : Math.min(360, vw - margin * 2));
    let left = Math.max(margin, Math.min(rect.left, vw - width - margin));
    let top = rect.bottom + 8;
    if (top + 220 > vh - margin) top = Math.max(margin, vh - 220 - margin);
    menu.style.left = left + 'px'; menu.style.top = top + 'px'; menu.style.width = width + 'px'; menu.style.minWidth = width + 'px'; menu.style.maxHeight = Math.max(220, vh - top - margin) + 'px';
  },

  closeOpenMenus() {
    document.querySelectorAll('.gn-topbar .dropdown.open').forEach(el => {
      el.classList.remove('open');
      const toggle = el.querySelector('.gn-menu-toggle'); if (toggle) toggle.setAttribute('aria-expanded', 'false');
      const menu = el.querySelector('.gn-dropdown-menu'); if (menu) ['left','top','maxHeight','minWidth','width'].forEach(k => menu.style[k] = '');
    });
  },

  closeMobileDrawer() {
    document.body.classList.remove('gn-nav-open');
    const toggle = document.querySelector('.gn-nav-toggle'); if (toggle) toggle.setAttribute('aria-expanded', 'false');
  },

  installHandlers() {
    if (document.body.dataset.gnMenuHandlers === '1') return;
    document.body.dataset.gnMenuHandlers = '1';
    document.addEventListener('click', ev => {
      if (ev.target instanceof Element && ev.target.closest('.gn-topbar .dropdown, .gn-dropdown-menu, .gn-nav-toggle, .gn-theme-select')) return;
      this.closeOpenMenus();
      if (!(ev.target instanceof Element && ev.target.closest('#topmenu'))) this.closeMobileDrawer();
    }, true);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { this.closeOpenMenus(); this.closeMobileDrawer(); } });
  }
});
