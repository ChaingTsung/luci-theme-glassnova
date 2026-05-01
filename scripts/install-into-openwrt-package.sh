#!/bin/sh
set -eu

if [ $# -lt 1 ]; then
  echo "Usage: $0 /path/to/openwrt" >&2
  exit 1
fi

OPENWRT="$1"
DEST="$OPENWRT/package/luci-theme-glassnova"
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)" "$DEST"
echo "Installed to $DEST"
echo "Run: rm -rf tmp && make defconfig && make menuconfig"
echo "Menu path: LuCI -> 4. Themes -> luci-theme-glassnova"
