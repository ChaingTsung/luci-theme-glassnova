# luci-theme-glassnova fixed

基于 ChaingTsung/luci-theme-glassnova 修改的 OpenWrt 25.12+ LuCI ucode 主题源码包。

## 本版修复

1. 登录后顶部菜单不显示：移除 `header.ut` 中额外的 `#modemenu`，并重写 `menu-glassnova.js`，直接从 LuCI menu tree 渲染 `#topmenu`。
2. 登录表单圆角过大：追加 CSS 覆盖，登录卡片、输入框、按钮、选择器统一为 `5px`。
3. 静态构建产物已同步到 `htdocs/luci-static/glassnova/assets/`，可直接放入 OpenWrt 源码树编译。

## 编译

```sh
cp -a luci-theme-glassnova-fixed /path/to/openwrt/package/luci-theme-glassnova
cd /path/to/openwrt
rm -rf tmp
make defconfig
make package/luci-theme-glassnova/{clean,compile} V=s
```

## 切换主题

```sh
uci set luci.main.mediaurlbase='/luci-static/glassnova'
uci commit luci
rm -rf /tmp/luci-*
/etc/init.d/nginx restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true
/etc/init.d/uwsgi restart 2>/dev/null || true
```
