#!/bin/sh
set -eu

if [ $# -lt 1 ]; then
  echo "Usage: $0 /path/to/openwrt" >&2
  exit 1
fi

OPENWRT="$1"
DEST="$OPENWRT/feeds/luci/themes/luci-theme-glassnova"
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)" "$DEST"
cp "$DEST/Makefile.luci-feed" "$DEST/Makefile"
echo "Installed to $DEST with luci.mk feed Makefile"
echo "Run: ./scripts/feeds update luci && ./scripts/feeds install luci-theme-glassnova"
echo "Then: rm -rf tmp && make defconfig && make menuconfig"
