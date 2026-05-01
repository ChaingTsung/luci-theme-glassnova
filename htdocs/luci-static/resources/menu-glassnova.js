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
		const width = Math.min(560, vw - margin * 2);
		const left = Math.max(margin, Math.min(rect.left, vw - width - margin));
		const top = Math.min(rect.bottom + 8, vh - margin);
		const maxHeight = Math.max(220, vh - top - margin);

		menu.style.left = left + 'px';
		menu.style.top = top + 'px';
		menu.style.minWidth = width + 'px';
		menu.style.maxHeight = maxHeight + 'px';
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

	renderMainMenu(tree, url, level) {
		const ul = level ? E('ul', { 'class': 'dropdown-menu gn-dropdown-menu' }) : document.querySelector('#topmenu');
		if (!ul)
			return E([]);

		const children = ui.menu.getChildren(tree);
		if (children.length == 0 || level > 1)
			return E([]);

		children.forEach(child => {
			const submenu = this.renderMainMenu(child, url + '/' + child.name, (level || 0) + 1);
			const hasSubmenu = !!submenu.firstElementChild;
			const li = E('li', { 'class': (!level && hasSubmenu) ? 'dropdown' : '' });

			if (!level && hasSubmenu) {
				const toggle = E('button', { 'class': 'gn-menu-toggle', 'type': 'button', 'aria-expanded': 'false' }, [ _(child.title) ]);

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
			}
			else {
				li.appendChild(E('a', { 'href': hasSubmenu ? '#' : L.url(url, child.name) }, [ _(child.title) ]));
				if (hasSubmenu)
					li.appendChild(submenu);
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
