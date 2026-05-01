include $(TOPDIR)/rules.mk

LUCI_TITLE:=GlassNova Theme
LUCI_DEPENDS:=+luci-base +rpcd +uhttpd +libubox
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=GlassNova Maintainers

# The Vite/Tailwind bundle is committed under htdocs/luci-static/glassnova.
# Run `pnpm install && pnpm build` before packaging to regenerate assets.

define Package/luci-theme-glassnova/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.GlassNova
	uci -q commit luci
}
endef

include ../../luci.mk
# call BuildPackage - OpenWrt buildroot signature
