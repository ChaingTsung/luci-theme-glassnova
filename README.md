# luci-theme-glassnova

GlassNova 是一个面向 OpenWrt 25.12+ / LuCI ucode 模板的现代化毛玻璃主题原型，静态资源由 Vite 7、Tailwind CSS v4 和 pnpm 构建。

## 功能

- 登录页背景支持本地图片、GIF、SVG、WebP、远程图片、MP4/WebM、YouTube 静音循环背景，以及通用 JSON API。
- 可通过自托管 API 适配 Unsplash、Pixiv、X/Twitter 或自己的媒体服务。
- 登录表单居中，支持自定义透明度和高斯模糊半径。
- 亮色、暗色、跟随浏览器三种模式，并提供前台快速切换按钮。
- LuCI 提示信息会桥接为右上角浮动 Toast，支持堆叠显示和弹簧动画。
- 主题设置页：`系统 -> GlassNova Theme`。

## 目录结构

```text
luci-theme-glassnova/
├── Makefile
├── package.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   └── styles/glassnova.css
├── htdocs/
│   └── luci-static/
│       ├── glassnova/                 # Vite 构建输出和内置媒体
│       └── resources/view/glassnova/  # LuCI JS 设置页面
├── ucode/template/themes/glassnova/    # LuCI 25.12+ ucode 主题模板
├── root/etc/config/glassnova           # 默认 UCI 配置
├── root/etc/uci-defaults/30_luci-theme-glassnova
├── root/usr/share/luci/menu.d/luci-theme-glassnova.json
├── root/usr/share/rpcd/acl.d/luci-theme-glassnova.json
└── root/www/cgi-bin/glassnova-config   # 登录页可读取的轻量 JSON 配置 API
```

## 构建静态资源

```sh
corepack enable
pnpm install
pnpm build
```

构建输出位于：

```text
htdocs/luci-static/glassnova/assets/glassnova.css
htdocs/luci-static/glassnova/assets/glassnova.js
```

仓库中已包含一份预构建 CSS/JS，方便直接放入 OpenWrt 编译树测试。

## 放入 OpenWrt 源码树

将目录复制到：

```text
feeds/luci/themes/luci-theme-glassnova
```

然后：

```sh
./scripts/feeds update luci
./scripts/feeds install luci-theme-glassnova
make menuconfig
# LuCI -> Themes -> luci-theme-glassnova
make package/feeds/luci/luci-theme-glassnova/compile V=s
```

安装后切换主题：

```sh
opkg install /tmp/luci-theme-glassnova_*.ipk
uci set luci.main.mediaurlbase='/luci-static/glassnova'
uci commit luci
/etc/init.d/uhttpd restart
```

## 背景 API 协议

GlassNova 支持 API 返回两类内容：

```json
"https://example.com/background.webp"
```

或：

```json
{
  "type": "image",
  "url": "https://example.com/background.webp"
}
```

视频：

```json
{
  "type": "video",
  "url": "https://example.com/background.mp4",
  "poster": "https://example.com/poster.webp"
}
```

YouTube：

```json
{
  "type": "youtube",
  "id": "VIDEO_ID"
}
```

## 本地媒体

把文件放入路由器：

```sh
scp background.webp root@192.168.1.1:/www/luci-static/glassnova/media/background.webp
uci set glassnova.main.provider='local'
uci set glassnova.main.local_url='/luci-static/glassnova/media/background.webp'
uci commit glassnova
```

## 注意

- Pixiv、X/Twitter 不建议把令牌或抓取逻辑放在浏览器端；请用自托管 API 返回已经可访问的媒体 URL。
- YouTube 背景使用 `youtube-nocookie.com` iframe，受浏览器自动播放策略和网络环境影响。
- 当前 `header.ut` 是轻量原型模板，适合登录页效果验证。若要作为完整生产主题发布，建议以官方 `luci-theme-bootstrap` 的当前 `header.ut` / `footer.ut` 为基底，保留本项目的 `<link rel="stylesheet" ...glassnova.css>`、`window.GlassNovaConfig` 和 `<script type="module" ...glassnova.js>` 注入点，以继承完整导航菜单与兼容行为。
