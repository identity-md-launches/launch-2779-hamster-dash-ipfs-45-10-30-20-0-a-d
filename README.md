# Hamster Dash｜仓鼠能量站

一个完整可玩的 45 秒仓鼠收集小游戏。深绿色能量站、原创仓鼠插画和荧光绿界面，支持中文与 English、电脑与手机。

这是献给 Squeekchain 社区的独立粉丝游戏，与官方无关联或背书。官网链接为 <https://squeekchain.com/>。游戏没有链上功能、钱包连接、空投或收益，也没有广告、追踪或付费 API。

## 直接使用与 IPFS 交付

**可发布的完整站点在 [`dist/`](dist/)，入口为 [`dist/index.html`](dist/index.html)。** 源码、锁文件与静态导出一并交付。发布方直接将整个 `dist/` 目录固定到 IPFS，即可从目录的 `index.html` 访问，不需要重建、后台服务、账户或密钥。最终 CID 与网关地址由交付平台生成；本仓库没有虚构一个已发布地址。

Vite 使用 `base: './'`，JS、CSS、字体、图标与分享图均为相对路径；已实际在 `/preview/` 子路径验证。导航只使用页内锚点，网关无需路由重写。请通过 HTTP(S) 静态服务器或 IPFS 网关打开，浏览器直接双击 `file://` HTML 可能阻止模块加载。

## 玩法

| 物品 | 得分 |
| --- | ---: |
| 种子 | +10 |
| 电池 | +30 |
| 石头 | −20，最低 0 分 |

每局 45 秒，掉落速度和频率逐渐增加。方向键或 A / D 左右移动；也可在游戏区域拖动，或按住下方左右按钮。空格、Escape 或右上角暂停按钮暂停；选择「继续游戏」恢复。重新开始会立即清空当前回合。结算显示得分、三类碰撞数量和本地纪录，并可直接再玩一局。

切换标签页、离开窗口或页面隐藏时会自动暂停；明显的前台卡顿也会暂停以保留剩余时间。不会自动恢复。切换语言或打开玩法说明时也会暂停正在进行的回合。

音效默认关闭，由右上角按钮开启，使用本地 Web Audio 合成短音。音效不可用时提供提示，游戏仍可正常进行。

## 安装、开发、预览与重建

需要 Node.js **22.18+** 与 npm。验证时使用 Node.js 24.22.1、React 19.3.1、Vite 7.3.7、TypeScript 5.9.3；准确版本以 `package-lock.json` 为准。

```bash
npm ci
npm run dev
```

查看终端给出的本地开发地址。生成和预览生产导出：

```bash
npm run typecheck
npm run build
npm run preview
```

`npm run build` 重建完整 `dist/`。静态发布时上传其全部内容；保留 `assets/`、`favicon.svg` 与 `og-image.png`。没有需要配置的环境变量。安装依赖需要网络；游戏运行资源全部随站点提供，不调用外部 API。

## 检查与实际结果

```bash
npm test
npx playwright install --with-deps chromium webkit
npm run test:browser
```

`npm test` 使用 Node 内置测试运行器，无需浏览器。浏览器检查自己启动临时 HTTP 服务器，在 `/preview/` 路径加载**生产导出**，测试结束后关闭浏览器和服务器。默认报告与截图写到 `/tmp/hamster-dash-check`，可通过 `HAMSTER_CHECK_OUT` 指定其他输出目录；不修改生产数据。

本次实际结果：

- 生产构建、`tsc --noEmit`：通过。
- 游戏逻辑：**9/9** 通过，覆盖三类计分、最低 0 分、漏接、暂停冻结、45 秒结算、单次结束事件、重开、移动边界和 30/60/120 Hz 一致性。
- Chromium / WebKit：**25/25 组检查**通过，覆盖完整回合、四个键位、长按和拖动、触屏输入、暂停与焦点、重开、结算、语言和最高分保存、存储被禁用时的降级、自动暂停、帮助与官方链接。
- 英文布局在 320、390、768、1100、1440 像素无横向溢出；中文首屏和桌面截图已人工查看。两个浏览器的 axe 扫描均为 **0 项违规**。
- pinned `taste@1 --offline`：**16/16**。390 像素首屏的产品与开始按钮可见，所有探针检查到的操作目标均至少 44 像素。
- 生产子路径下无脚本错误、失败请求或外部运行请求。

完整覆盖、修复位置、对比度测量与限制见 [`artifacts/validation.md`](artifacts/validation.md)，原始检查摘要见 [`artifacts/browser-checks.json`](artifacts/browser-checks.json) 和 [`artifacts/taste-summary.json`](artifacts/taste-summary.json)。

限制：没有实体手机、真实读屏或浏览器原生 200% 缩放验证；触控为浏览器模拟。WebKit 使用临时补齐的 Linux 图形运行库和软件渲染；该环境下音效不可用，已验证可见提示与正常游戏降级。没有声称试听过音效，也没有声称在公开 IPFS 网关完成发布验证。完整回合检查使用虚拟时钟和固定随机数，不会在生产中固定掉落。

## 源码与设计

| 路径 | 内容 |
| --- | --- |
| `src/game.ts` | 独立于渲染的计时、移动、碰撞、计分和加速逻辑 |
| `src/useGame.ts` | 动画循环、键盘、暂停、音效与本地纪录协调 |
| `src/renderer.ts` | 自适应 Canvas 场景与原始 SVG 精灵绘制 |
| `src/App.tsx`、`src/Icons.tsx` | 页面、游戏状态、触控按钮与图标 |
| `src/i18n.ts` | 完整中英文文案 |
| `src/storage.ts`、`src/sound.ts` | 存储降级与本地合成音效 |
| `src/styles.css` | 设计变量、组件与响应式规则 |
| `src/assets/` | 原创插画、分享图 SVG 源文件、自托管 Nunito 字体 |
| `public/` | favicon 和 1200×630 PNG 分享图 |
| `tests/` | 可重复运行的逻辑和浏览器检查 |
| `DESIGN.md` | 最终实现的设计系统与交互约定 |

最高分及语言选择分别以 `hamster-dash:best`、`hamster-dash:language` 保存于当前站点的 `localStorage`，只在当前浏览器和来源内有效。禁用存储时最高分仅保留到本页面关闭；没有排行榜服务器，不发送或收集玩家数据。没有服务工作线程，未承诺关闭网页后仍可离线重新加载。

仓鼠、种子、电池、石头、favicon 和分享图均为本项目创作的矢量素材，没有借用官方标志。Nunito 的 OFL、React 的 MIT 及设计指导的署名和许可保留在 [`licenses/`](licenses/)。设计过程使用 pinned Better Interface 的六领域指导与 Impeccable 文档方法，最终实现说明见 `DESIGN.md`。

交付不包含 `node_modules`、包缓存或依赖压缩包。新增 `.gitignore` 的明确路径预算为 **256 字节**：排除所有层级的依赖/缓存和临时检查目录，并显式保留 `dist/` 及被既有规则忽略的 `artifacts/` 审阅文件。静态导出与必要源文件完整保留，实际字节数及总大小见 `artifacts/bundle-budget.json`。
