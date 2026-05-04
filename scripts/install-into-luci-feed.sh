#!/bin/sh
set -eu
[ $# -eq 1 ] || { echo "Usage: $0 /path/to/openwrt" >&2; exit 1; }
dst="$1/feeds/luci/themes/luci-theme-glassnova"
rm -rf "$dst"
mkdir -p "$(dirname "$dst")"
cp -a "$(dirname "$0")/.." "$dst"
cp "$dst/Makefile.luci-feed" "$dst/Makefile"
echo "Installed to $dst"
