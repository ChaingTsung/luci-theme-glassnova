#!/bin/sh
set -eu
[ $# -eq 1 ] || { echo "Usage: $0 /path/to/openwrt" >&2; exit 1; }
dst="$1/package/luci-theme-glassnova"
rm -rf "$dst"
mkdir -p "$(dirname "$dst")"
cp -a "$(dirname "$0")/.." "$dst"
echo "Installed to $dst"
