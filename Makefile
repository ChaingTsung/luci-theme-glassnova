include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-glassnova
PKG_VERSION:=2.12.0
PKG_RELEASE:=1
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
GlassNova is a modern glassmorphism LuCI theme for OpenWrt 25.12+.
This fixed build restores the LuCI top menu and normalizes login/form radius to 5px.
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
