# luci-theme-glassnova

GlassNova is a modern glassmorphism LuCI theme prototype for OpenWrt 25.12+.
This variant targets **nginx + uwsgi LuCI** deployments and intentionally does **not** depend on `uhttpd` or directly select `luci-base`.

## Runtime profile

- Web server: `nginx` / `nginx-ssl` with LuCI served through `uwsgi`.
- LuCI compatibility: package dependency uses `luci-compat`.
- No custom `/www/cgi-bin/*` endpoint is used. The active UCI configuration is read in `header.ut` through the ucode `uci` module and injected into `window.GlassNovaConfig`.
- For complete LuCI-on-nginx setup, install/use `luci-nginx` or `luci-ssl-nginx` in your image, then select this theme.

## Features

- Vite 7 + Tailwind CSS v4 + pnpm static asset pipeline.
- Light, dark and browser-following modes with a floating toggle.
- Centered responsive login panel.
- Configurable glass opacity, blur radius and frosted title opacity.
- Login background providers: local image/GIF/video, direct remote image/GIF, direct remote video, generic JSON API, Unsplash URL, Pixiv proxy API, X/Twitter proxy API, self-hosted API and YouTube video ID.
- Floating stacked notifications in the top-right corner with spring-style animation.

## Build static assets

```sh
pnpm install
pnpm build
```

The bundle is emitted as:

```text
htdocs/luci-static/glassnova/assets/glassnova.css
htdocs/luci-static/glassnova/assets/glassnova.js
```

The fixed filenames are intentional because LuCI theme templates reference static assets through `{{ media }}`.

## Add to OpenWrt buildroot

```sh
cp -R luci-theme-glassnova feeds/luci/themes/
./scripts/feeds update luci
./scripts/feeds install luci-theme-glassnova
make menuconfig
# LuCI -> Themes -> luci-theme-glassnova
make package/feeds/luci/luci-theme-glassnova/compile V=s
```

## Recommended image profile for nginx

Use either `luci-nginx` or `luci-ssl-nginx` as the LuCI collection, then add this theme:

```text
+luci-nginx
+luci-compat
+luci-theme-glassnova
```

or HTTPS-first:

```text
+luci-ssl-nginx
+luci-compat
+luci-theme-glassnova
```

This package's Makefile also depends on `nginx`, `nginx-mod-luci` and `uwsgi-luci-support` so a standalone install does not pull in `uhttpd`.

## Switch theme

```sh
uci set luci.themes.GlassNova='/luci-static/glassnova'
uci set luci.main.mediaurlbase='/luci-static/glassnova'
uci commit luci
/etc/init.d/nginx reload
/etc/init.d/uwsgi reload 2>/dev/null || true
```

## Background API contract

A generic API can return a plain URL string:

```json
"https://example.com/wallpaper.webp"
```

or an object:

```json
{
  "type": "image",
  "url": "https://example.com/wallpaper.webp"
}
```

Supported `type` values:

- `image`
- `gif`
- `video`
- `youtube`

Video example:

```json
{
  "type": "video",
  "url": "https://example.com/bg.webm",
  "poster": "https://example.com/poster.webp"
}
```

YouTube example:

```json
{
  "type": "youtube",
  "id": "dQw4w9WgXcQ"
}
```

For Pixiv and X/Twitter, use a proxy API. Do not put service credentials into browser-visible URLs.

## UCI config

```uci
config theme 'main'
        option mode 'auto'
        option provider 'local'
        option local_url '/luci-static/glassnova/media/default.svg'
        option glass_alpha '0.56'
        option glass_blur '22'
        option title_alpha '0.42'
        option reduce_motion '0'
```

The LuCI settings page is available at:

```text
System -> GlassNova Theme
```

## Notes

This is a functional prototype. For a production distribution theme, merge the current upstream `luci-theme-bootstrap` `header.ut` and `footer.ut` from the exact LuCI branch you ship, then retain the GlassNova CSS/JS injection and UCI config block.
