'use strict';

'require baseclass';
'require ui';

return baseclass.extend({
	__init__() {
		ui.menu.load().then(L.bind(this.render, this));
	},

	render(tree) {
		let node = tree;
		let url = '';

		this.renderModeMenu(tree);

		if (L.env.dispatchpath.length >= 3) {
			for (let i = 0; i < 3 && node; i++) {
				node = node.children[L.env.dispatchpath[i]];
				url = url + (url ? '/' : '') + L.env.dispatchpath[i];
			}

			if (node)
				this.renderTabMenu(node, url);
		}

		this.installGlobalMenuHandlers();
	},

	installGlobalMenuHandlers() {
		if (document.body.dataset.gnMenuHandlers === '1')
			return;

		document.body.dataset.gnMenuHandlers = '1';

		document.addEventListener('click', ev => {
			if (!(ev.target instanceof Element) || ev.target.closest('.gn-topbar .dropdown'))
				return;
			this.closeOpenMenus();
		});

		window.addEventListener('resize', () => this.closeOpenMenus(), { passive: true });
		window.addEventListener('scroll', () => this.closeOpenMenus(), { passive: true });
	},

	closeOpenMenus() {
		document.querySelectorAll('.gn-topbar .dropdown.open').forEach(el => {
			el.classList.remove('open');
			const toggle = el.querySelector('.gn-menu-toggle');
			if (toggle)
				toggle.setAttribute('aria-expanded', 'false');
			const menu = el.querySelector('.gn-dropdown-menu');
			if (menu) {
				menu.style.left = '';
				menu.style.top = '';
				menu.style.maxHeight = '';
				menu.style.minWidth = '';
			}
		});
	},

	placeDropdown(toggle, menu) {
		const rect = toggle.getBoundingClientRect();
		const margin = 10;
		const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
		const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
		const width = Math.min(360, vw - margin * 2);
		const left = Math.max(margin, Math.min(rect.left, vw - width - margin));
		const top = Math.min(rect.bottom + 8, vh - margin);
		const maxHeight = Math.max(220, vh - top - margin);

		menu.style.left = left + 'px';
		menu.style.top = top + 'px';
		menu.style.minWidth = width + 'px';
		menu.style.maxHeight = maxHeight + 'px';
	},

	makeIcon(name) {
		const ns = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(ns, 'svg');
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('focusable', 'false');

		const n = String(name || '').toLowerCase();
		let paths;
		if (n.indexOf('system') >= 0)
			paths = ['M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z', 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.03.03a2 2 0 0 1-2.83 2.83l-.03-.03A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 0 1-4 0v-.04a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.03.03a2 2 0 1 1-2.83-2.83l.03-.03A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 0 1 0-4h.04a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.03-.03a2 2 0 0 1 2.83-2.83l.03.03A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 0 1 4 0v.04a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.03-.03a2 2 0 0 1 2.83 2.83l-.03.03A1.7 1.7 0 0 0 19.4 9c.08.37.3.7.6 1H20a2 2 0 0 1 0 4h-.04c-.3.3-.52.63-.6 1Z'];
		else if (n.indexOf('network') >= 0)
			paths = ['M6 9a6 6 0 0 1 12 0', 'M9 12a3 3 0 0 1 6 0', 'M12 16h.01', 'M4 19h16'];
		else if (n.indexOf('status') >= 0)
			paths = ['M4 19V5', 'M8 17v-5', 'M12 17V7', 'M16 17v-9', 'M20 17v-3'];
		else if (n.indexOf('service') >= 0)
			paths = ['M4 7h16', 'M4 12h16', 'M4 17h16', 'M7 7v10'];
		else
			paths = ['M3 12h18', 'M12 3v18', 'M5 5l14 14'];

		paths.forEach(d => {
			const p = document.createElementNS(ns, 'path');
			p.setAttribute('d', d);
			svg.appendChild(p);
		});
		return E('span', { 'class': 'gn-menu-icon' }, [ svg ]);
	},

	renderTabMenu(tree, url, level) {
		const container = document.querySelector('#tabmenu');
		if (!container)
			return E([]);

		const ul = E('ul', { 'class': 'tabs gn-tabs' });
		const children = ui.menu.getChildren(tree);
		let activeNode = null;

		children.forEach(child => {
			const isActive = (L.env.dispatchpath[3 + (level || 0)] == child.name);
			const className = 'tabmenu-item-%s%s'.format(child.name, isActive ? ' active' : '');

			ul.appendChild(E('li', { 'class': className }, [
				E('a', { 'href': L.url(url, child.name) }, [ _(child.title) ])
			]));

			if (isActive)
				activeNode = child;
		});

		if (ul.children.length == 0)
			return E([]);

		container.appendChild(ul);
		container.style.display = '';

		if (activeNode)
			this.renderTabMenu(activeNode, url + '/' + activeNode.name, (level || 0) + 1);

		return ul;
	},

	renderSubmenu(tree, url, depth) {
		const ul = E('ul', { 'class': depth ? 'gn-submenu-vertical' : 'dropdown-menu gn-dropdown-menu gn-submenu-vertical' });
		const children = ui.menu.getChildren(tree);

		children.forEach(child => {
			const nextUrl = url + '/' + child.name;
			const nested = this.renderSubmenu(child, nextUrl, (depth || 0) + 1);
			const hasNested = !!nested.firstElementChild;
			const li = E('li', { 'class': hasNested ? 'has-submenu' : '' });
			li.appendChild(E('a', { 'href': L.url(nextUrl) }, [ _(child.title) ]));
			if (hasNested)
				li.appendChild(nested);
			ul.appendChild(li);
		});

		return ul;
	},

	renderMainMenu(tree, url) {
		const ul = document.querySelector('#topmenu');
		if (!ul)
			return E([]);

		ul.classList.add('menu', 'menu-horizontal', 'gn-menu-root');
		const children = ui.menu.getChildren(tree);
		children.forEach(child => {
			const nextUrl = url + '/' + child.name;
			const submenu = this.renderSubmenu(child, nextUrl, 0);
			const hasSubmenu = !!submenu.firstElementChild;
			const li = E('li', { 'class': hasSubmenu ? 'dropdown' : '' });

			if (hasSubmenu) {
				const toggle = E('button', { 'class': 'gn-menu-toggle', 'type': 'button', 'aria-expanded': 'false' }, [
					this.makeIcon(child.name), E('span', { 'class': 'gn-menu-label' }, [ _(child.title) ])
				]);
				toggle.addEventListener('click', ev => {
					ev.preventDefault();
					ev.stopPropagation();
					const isOpen = li.classList.contains('open');
					this.closeOpenMenus();
					if (!isOpen) {
						li.classList.add('open');
						toggle.setAttribute('aria-expanded', 'true');
						this.placeDropdown(toggle, submenu);
					}
				});
				li.appendChild(toggle);
				li.appendChild(submenu);
			} else {
				li.appendChild(E('a', { 'href': L.url(nextUrl) }, [
					this.makeIcon(child.name), E('span', { 'class': 'gn-menu-label' }, [ _(child.title) ])
				]));
			}
			ul.appendChild(li);
		});

		ul.style.display = '';
		return ul;
	},

	renderModeMenu(tree) {
		const ul = document.querySelector('#modemenu');
		if (!ul)
			return;

		ul.classList.add('menu', 'menu-horizontal', 'gn-mode-root');
		const children = ui.menu.getChildren(tree);
		children.forEach((child, index) => {
			const isActive = L.env.requestpath.length ? child.name === L.env.requestpath[0] : index === 0;

			ul.appendChild(E('li', { 'class': isActive ? 'active' : '' }, [
				E('a', { 'href': L.url(child.name) }, [ _(child.title) ])
			]));

			if (isActive)
				this.renderMainMenu(child, child.name);
		});

		if (ul.children.length > 1)
			ul.style.display = '';
	}
});
