include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-glassnova
PKG_VERSION:=2.2.0
PKG_RELEASE:=2
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=GlassNova Maintainers
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)
PKGARCH:=all

include $(INCLUDE_DIR)/package.mk

define Package/luci-theme-glassnova
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=4. Themes
  TITLE:=GlassNova Theme for nginx/uwsgi
  DEPENDS:=+luci-compat +rpcd +ucode-mod-uci
endef

define Package/luci-theme-glassnova/description
GlassNova is a modern glassmorphism LuCI theme with responsive layout,
light/dark mode switching, configurable login media background, frosted-glass
login card, stacked notifications, and spring-like animations. This package is
web-server neutral and does not select uhttpd. For nginx deployments, install
and configure luci-nginx, nginx-mod-luci and uwsgi-luci-support separately.
endef

define Build/Prepare
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/luci-theme-glassnova/install
	$(INSTALL_DIR) $(1)/www
	$(CP) ./htdocs/* $(1)/www/
	$(INSTALL_DIR) $(1)/usr/share/ucode/luci
	$(CP) ./ucode/* $(1)/usr/share/ucode/luci/
	$(INSTALL_DIR) $(1)/
	$(CP) ./root/* $(1)/
endef

define Package/luci-theme-glassnova/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	( . /etc/uci-defaults/30_luci-theme-glassnova ) && rm -f /etc/uci-defaults/30_luci-theme-glassnova
}
exit 0
endef

define Package/luci-theme-glassnova/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.GlassNova
	uci -q commit luci
}
exit 0
endef

$(eval $(call BuildPackage,luci-theme-glassnova))
