# luci-theme-glassnova

GlassNova is a modern LuCI theme for OpenWrt 25.12+ style LuCI ucode templates. It is built as a static asset package with Vite 7, Tailwind CSS v4 and pnpm.

## Important packaging note

This archive is the **portable OpenWrt package variant**. It is intended to be copied directly into:

```sh
package/luci-theme-glassnova
```

The default `Makefile` uses the normal OpenWrt `package.mk` interface, so it can be discovered by `make menuconfig` without relying on the relative `../../luci.mk` path used inside the LuCI feed.

A LuCI-feed Makefile is still provided as `Makefile.luci-feed`. Use it only when placing the package under:

```sh
feeds/luci/themes/luci-theme-glassnova
```

## nginx / uwsgi profile

The theme package is web-server neutral:

- it does **not** depend on `uhttpd`
- it does **not** directly depend on `luci-base`
- it directly depends on `luci-compat`, `rpcd` and `ucode-mod-uci`

For nginx LuCI runtime, install/select the nginx LuCI stack separately, for example `luci-nginx` or the equivalent packages for your tree: `nginx`, `nginx-mod-luci`, `uwsgi-luci-support`.

> LuCI itself normally requires its core runtime in the final image. This package avoids a direct `+luci-base` dependency as requested, but your selected LuCI collection/runtime may still pull core LuCI packages transitively.

## Install into OpenWrt source tree

Recommended direct package mode:

```sh
unzip luci-theme-glassnova-openwrt-selectable.zip
cd luci-theme-glassnova
./scripts/install-into-openwrt-package.sh /path/to/openwrt
cd /path/to/openwrt
rm -rf tmp
make defconfig
make menuconfig
```

Menu path:

```text
LuCI -> 4. Themes -> luci-theme-glassnova
```

Build only this package:

```sh
make package/luci-theme-glassnova/compile V=s
```

## Alternative: install into the LuCI feed

```sh
unzip luci-theme-glassnova-openwrt-selectable.zip
cd luci-theme-glassnova
./scripts/install-into-luci-feed.sh /path/to/openwrt
cd /path/to/openwrt
./scripts/feeds update luci
./scripts/feeds install luci-theme-glassnova
rm -rf tmp
make defconfig
make menuconfig
```

## If it still does not appear

Run these checks from the OpenWrt root:

```sh
find package feeds -path '*/luci-theme-glassnova/Makefile' -print
make package/luci-theme-glassnova/{clean,compile} V=s
./scripts/feeds search luci-theme-glassnova || true
grep -R "luci-theme-glassnova" tmp/.config-package.in tmp/info/.packageinfo 2>/dev/null || true
```

Common causes:

1. Package was placed under `package/luci-theme-glassnova/luci-theme-glassnova` due to an extra nested directory.
2. Old `tmp/` metadata was not regenerated.
3. Using the LuCI-feed `../../luci.mk` Makefile outside `feeds/luci/themes`.
4. The tree does not have `luci-compat`; update/install the LuCI feed first.
5. Custom forks rename the LuCI category or omit the LuCI feed entirely.

## Runtime theme switch

After installing the IPK:

```sh
uci set luci.main.mediaurlbase='/luci-static/glassnova'
uci commit luci
/etc/init.d/nginx reload 2>/dev/null || true
/etc/init.d/uwsgi reload 2>/dev/null || true
```

## Frontend development

```sh
pnpm install
pnpm build
```

The Vite build writes deterministic LuCI asset names:

```text
htdocs/luci-static/glassnova/assets/glassnova.css
htdocs/luci-static/glassnova/assets/glassnova.js
```

## Background media API

The frontend accepts the following JSON shapes from self-hosted, Unsplash proxy, Pixiv proxy, X/Twitter proxy or any other API endpoint:

```json
{ "type": "image", "url": "https://example.com/bg.jpg" }
```

```json
{ "type": "video", "url": "https://example.com/bg.mp4", "poster": "https://example.com/poster.jpg" }
```

```json
{ "type": "youtube", "id": "dQw4w9WgXcQ" }
```

## Rescue / recovery

If a broken theme prevents LuCI from rendering, SSH into the router and switch back to Bootstrap:

```sh
uci set luci.main.mediaurlbase='/luci-static/bootstrap'
uci commit luci
rm -rf /tmp/luci-*
/etc/init.d/nginx restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true
```

For nginx + uwsgi deployments, restarting nginx is normally enough after clearing `/tmp/luci-*`.
