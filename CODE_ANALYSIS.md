# 项目代码分析报告

> 项目：致班主任 —— 2026届高三7班毕业留念
> 分析日期：2026-06-13
> 分析范围：`index.html`（314 行）、`main.js`（1514 行）、`style.css`（1361 行）

---

## 1. 项目概述

一个面向班级同学的毕业纪念单页应用（SPA），主题为"化学实验报告"。全站围绕化学隐喻（元素符号、化学方程式、烧杯、催化剂、滴定、烟花）展开，营造仪式感与情感共鸣。核心特色是 Canvas 粒子背景、可交互烧杯、翻页时钟、多形态烟花特效和玻璃拟态视觉。

### 主要面向用户
- 班主任（"小利老师"）作为接收方
- 2026届高三7班同学作为内容贡献方

### 部署目标
- 静态站点（GitHub Pages），无构建步骤、无后端依赖
- 数据持久化使用 `localStorage`

---

## 2. 目录结构

```
d:\Backup\Desktop\新建文件夹\
├── index.html              # 唯一页面入口（314 行）
├── main.js                 # 全部交互逻辑（1514 行）
├── style.css               # 全部样式（1361 行）
│
├── *.JPG / *.heic / *.jpg  # 班级照片素材（未在页面中实际使用，仅占位）
├── *.mp4                   # 视频素材（未在页面中实际使用）
├── *.mp3                   # 背景音乐（2 首，配置在 JS 数组中）
│
├── screenshot_*.png        # 烧杯交互测试截图（开发产物）
├── .qoder/rules/1.md       # 编辑器规则（与本项目无关）
│
└── 无 README.md / package.json / 配置文件
```

> 观察：项目未引入 npm/yarn/build 工具，**纯 HTML + 原生 JS + CSS**，符合"最小框架"原则。
> 资源（照片/视频）当前仅作本地占位，未真正接入 `initPhotoWall()`。

---

## 3. 技术栈

| 类别 | 技术 | 备注 |
|------|------|------|
| 标记 | HTML5 | 单页结构，使用 `<canvas>` + 内联 SVG |
| 样式 | CSS3 | 自定义属性 + 玻璃拟态（`backdrop-filter`） |
| 脚本 | 原生 ES6+ JavaScript | 无模块化（无 import/export），全局作用域 |
| 图形 | Canvas 2D API | 3 个 canvas：背景粒子、烧杯、烟花 |
| 音频 | Web Audio API + `<audio>` 标签 | 程序化音效 + 背景音乐 |
| 存储 | `localStorage` | 留言、播放器状态、音量 |
| 字体 | 系统字体栈 + Noto Serif SC | 未通过 web font 加载 |
| 第三方依赖 | **无** | 无 jQuery / Vue / React / 工具库 |

---

## 4. 模块划分与依赖关系

代码按"功能模块"以**全局函数**形式组织，无命名空间，无模块系统。所有 `initXxx()` 在 `DOMContentLoaded` 钩子中按顺序调用。

### 模块清单（11 大功能 + 1 工具）

| # | 模块 | 入口函数 | DOM 容器 | 关键依赖 |
|---|------|----------|----------|----------|
| 1 | Hero Banner + 音频控制 | `initHero()` | `#hero-module` | Web Audio API, `<audio>` |
| 2 | 翻页倒计时 | `updateTimer()` | `#flip-clock` | `setInterval(1s)` |
| 3 | 数据看板 | `initStats()` | `#stats-module` | `IntersectionObserver` |
| 4 | 互动烧杯 | `initBeaker()` | `#beaker-canvas` | Canvas 2D 物理模拟 |
| 5 | 时间轴 | `initTimeline()` | `#timeline` | `timelineData` 常量 |
| 6 | 照片墙 | `initPhotoWall()` | `#photo-wall` | 仅占位生成 |
| 7 | 课堂语录 | `initQuotes()` | `#quotes-container` | `quotesData` 常量 |
| 8 | 化学方程式 | `initEquations()` | `#equations-container` | `eqData` 常量 |
| 9 | 信封动画 | `initEnvelope()` | `#envelope` | CSS class toggle |
| 10 | 签名 + 请假条 | `initSignature()` | `#signature-canvas` | Canvas 2D 鼠标轨迹 |
| 11 | 留言墙 | `initMessages()` | `#messages-container` | `localStorage` |
| 12 | 烟花全屏特效 | `triggerAdvancedFireworksFX()` | `#graduation-fx` | 11 种烟花形状 |
| 13 | 交互式动态背景 | `initInteractiveBg()` | `#interactive-bg` | Canvas 2D 粒子系统 |
| - | 全局动画观察器 | `observeElements()` | `.module-section` | `IntersectionObserver` |
| - | 全局 Toast | `showToast()` | 动态创建 | - |
| - | 全局音效 | `playSound()` | - | AudioContext |

### 模块间耦合关系

```
[initInteractiveBg]  ← 完全独立
       │
       ▼
[observeElements]  ← 全局观察器，影响所有 .module-section
       │
       ▼
[initHero] ──→ playSound, <audio> 标签
[initBeaker] ──→ triggerAdvancedFireworksFX (8 次点击后)
[initSignature] ──→ preloadFireworksAssets + triggerAdvancedFireworksFX
       │
       ▼
[initMessages] ──→ 写 localStorage，再读 localStorage
       │
       ▼
[initStats] ──→ setInterval (跨天检测)
```

**关键耦合点**：
- 烧杯（`initBeaker`）与请假条（`initSignature`）共享烟花触发入口，存在 `typeof` 兜底保护
- 消息墙（`initMessages`）每次启动都**重写** `localStorage`，即"硬编码默认数据 + 本地持久化"
- 数据看板（`initStats`）与翻页时钟（`updateTimer`）是两个独立 `setInterval`，没有共享时间调度

---

## 5. 关键业务流程

### 5.1 页面启动流程

```
DOMContentLoaded
  ├─ initInteractiveBg()     // 启动持续 canvas 渲染（rAF）
  ├─ observeElements()        // 注册全局 IntersectionObserver
  ├─ initHero()               // 绑定音频按钮 + 首次滑动自动播放
  ├─ initBeaker()             // 启动烧杯 rAF 循环
  ├─ initTimeline/Photo/Quotes/Equations  // 渲染数据
  ├─ initEnvelope()           // 绑定点击
  ├─ initSignature()          // 绑定签名
  ├─ initMessages()           // 覆盖 localStorage + 渲染
  ├─ initStats()              // 启动跨天检测 + 数字动画
  └─ 绑定 ESC 关闭烟花
```

### 5.2 翻页倒计时（核心业务）

**时间锚点**：`CONFIG.targetDate = 2026-06-09T17:00:00`（高考结束时刻）
**当前值**：已过期 N 天（页面展示"高考结束已过"）
**算法**：
- `setInterval(updateTimer, 1000)`，且当 `document.hidden` 时跳过
- `diff = now - targetDate`，分别计算天/时/分/秒
- 与 `currentTimerData` 对比，**仅当值变化时**调用 `updateFlipCard`
- `updateFlipCard` 创建临时 `.flip-top`/`.flip-bottom` 节点，250ms 改静态值、500ms 清理，实现翻页动画

### 5.3 相识天数自动递增

**时间锚点**：`CONFIG.startDate = 2024-08-26T08:00:00`
**算法**（与项目 memory 一致）：
- `setInterval(..., 1000)` 内比较 `Math.floor(Date.now() / 86400000)` 是否变化
- 变化时同时更新 `data-target` 属性和 `textContent`（已绕过原数字递增动画）
- **性能影响**：每秒 1 次毫秒级计算，可忽略

### 5.4 烧杯物理 + 状态机

**4 个状态**（颜色/不透明度/液位）：
- `初遇：清澈如水` → `熟悉：融洽的蓝` → `拼搏：炽热的紫` → `回忆：青春的沉淀`

**物理参数**：`lerp(0.05)` 缓动、阻尼 `0.96`、重力 `0.6`、气泡 wobble
**交互**：
- 鼠标/触摸横向移动 → 累积 `targetStir`（搅拌强度）
- 点击画布 → 滴入下一状态颜色的小球，撞到液面后 `transitionState()`
- 连续 8 次点击 → 触发烟花特效（20 秒）

### 5.5 烟花引擎

**粒子系统**：`particles[]` + `rockets[]` + `meteors[]`
**11 种形状**：
- 常规：`circle` / `ring` / `fan` / `doubleRing`
- 特殊（7 种）：`star`（3 尺寸）/ `heart` / `spiral` / `chrysanthemum` / `palm` / `willow` / `crackle`
- 文字：`text_happy`（毕业快乐）/ `text_study`（学海无涯），依赖 `preloadFireworksAssets` 像素采样

**调度**：
- 默认持续 16 秒，支持 `customDuration` 参数（烧杯 20 秒）
- 每 120-470ms 释放一枚
- 25% 概率改出流星雨
- 文字烟花最多触发 2 次
- 用户点击关闭按钮或 ESC → `fireworksStopRequested = true` 立即终止

**文字烟花优化**：`willReadFrequently: true` 提升 `getImageData` 性能

### 5.6 留言墙（数据流）

```
initMessages()
  └─ localStorage.setItem('class7_msgs', JSON.stringify([硬编码7条]))
  └─ renderMessages() 读取并渲染
```

**注意点**：
- 每次启动都**覆盖** localStorage，无法累积用户新增
- 提交表单已被移除，仅展示
- 当前数据：7 条留言（署名：大嘴、石、王心萍、DJ、土豆、蔡宇晗、tt）

### 5.7 交互式背景

**两层视觉**：
- 大尺度缓慢移动的 4 个径向光晕（每 15 秒切换调色板，Aurora/Sunset/Ocean/Nebula）
- 小尺度"化学式"（C₆H₁₂O₆、NaOH、HCl…）和圆点粒子（鼠标排斥）

**性能适配**：
- `isLowEndDevice = innerWidth < 768 || hardwareConcurrency < 4`
- 低端设备隔帧渲染、跳过鼠标光晕

---

## 6. 核心算法与数据处理

| 算法 | 位置 | 说明 |
|------|------|------|
| 线性插值（lerp） | `initBeaker` | 用于颜色/不透明度/液位平滑过渡 |
| 颜色插值 | `initInteractiveBg` | 两套调色板之间 4 个色点逐帧插值 |
| 像素采样文字烟花 | `preloadFireworksAssets` | 4px 步长扫描 alpha>128 的像素生成粒子 |
| 心形参数方程 | `triggerAdvancedFireworksFX` | `x=16sin³t, y=-(13cos t -5cos2t -2cos3t -cos4t)` |
| 缓动函数 easeOutQuart | `initStats` | `1 - (1-t)⁴` 用于数字递增动画 |
| DPR 高分屏适配 | `initBeaker` | `ctx.scale(dpr, dpr)`，逻辑尺寸固定 300x400 |
| 跨天检测 | `initStats` | `Math.floor(Date.now() / 86400000)` 对比索引 |
| 进度条拖拽节流 | `initHero` | `isDraggingProgress` 标志位避免 `timeupdate` 覆盖 |

---

## 7. 代码编写规范

### 7.1 命名约定
- **常量/配置**：`UPPER_SNAKE`（如 `CONFIG`、`starTemplate`）
- **函数/变量**：`camelCase`（如 `initHero`、`currentTimerData`）
- **CSS 类**：连字符 + 模块前缀（如 `.hero-fullscreen`、`.flip-card`、`.glass-panel`）
- **HTML id**：连字符（`flip-days`、`bgm-player`）
- **文件**：`main.js`（全小写）、`style.css`（全小写）、`index.html`（全小写）

### 7.2 注释风格
- 大量**中文模块分割注释**：`// --- 模块 X: 名称 ---`
- 函数上方简短用途说明，关键算法有行内注释
- 化学/物理参数紧贴魔法数字时附中文解释
- CSS 中关键样式块用 `/* --- 模块名 --- */` 分隔

### 7.3 代码组织模式
- **全局函数式**架构，所有 `init*` 显式在 DOMContentLoaded 调用
- 配置集中在文件顶部 `CONFIG` 对象
- 数据与渲染分离：`timelineData` / `quotesData` / `eqData` 集中在文件中部
- 工具函数（`lerp`、`showToast`、`playSound`、`preloadFireworksAssets`）就近声明

### 7.4 常用设计模式
- **策略模式**：烟花 `explode(x, y, color, type, sizeMult)` 通过 `type` 字符串分发
- **状态机**：烧杯 `currentState` 索引 + 数组配置
- **观察者模式**：`IntersectionObserver` 触发模块入场动画
- **工厂模式**：`FormulaParticle` 类、`createParticle` 函数
- **发布订阅**：通过 `window.bgAnimationEnabled` 等全局标志位（轻量）
- **防抖/节流**：resize 使用 `setTimeout` 防抖（200ms）

### 7.5 CSS 组织
- 顶部 `:root` 定义所有设计令牌（颜色、玻璃、字体、动画）
- 通用工具类：`.glass-panel` / `.hidden` / `.fullscreen`
- 每个模块独立区块，块头注释清晰标注模块号
- 关键样式硬编码颜色值（如 `#151d2e` 翻页卡片），未抽到变量（可改进）

---

## 8. 特殊实现 / 巧思

1. **可拖拽进度条 + 状态隔离**：`isDraggingProgress` 标志位让拖拽期间不被 `timeupdate` 覆盖，松手后才真实 seek
2. **音频上下文懒初始化**：首次 `playSound` 时才创建 AudioContext，规避浏览器自动播放策略
3. **首次滑动解锁 BGM**：监听一次性 scroll/touchstart，触发自动播放
4. **跨标签页友好**：倒计时在 `document.hidden` 时跳过，节省 CPU
5. **像素采样做文字烟花**：避免引入图片资源，纯运行时生成
6. **DPR 适配 + 逻辑尺寸**：烧杯在所有屏幕下保持 300x400 内部坐标，CSS 仅控制显示尺寸
7. **数字递增动画 + 跨天同步**：原递增动画结束后，直接覆盖 `textContent` 实现无感切换
8. **按钮可重入保护**：`approve-leave` 用 `this.disabled = true` + setTimeout 后恢复
9. **CSS 玻璃拟态 + transform: translateZ(0)**：强制开启硬件加速，避免 Safari 模糊失效
10. **音效覆盖所有可点击元素**：通过 `document.addEventListener('click', ...)` 事件委托，无需每个按钮单独绑定

---

## 9. 潜在技术债务

### 9.1 错误处理
- ❌ 缺全局 `try/catch`，单个模块报错可能影响全局
- ❌ `preloadFireworksAssets` 的 `getImageData` 未做字体加载完成的等待（中文渲染可能失败）
- ❌ `localStorage` 读写未做 try/catch（隐私模式可能抛错）

### 9.2 性能
- ⚠️ `initInteractiveBg` 与 `initBeaker` 同时跑两个 `requestAnimationFrame` 循环，加上 `updateTimer` 1Hz 与 `initStats` 1Hz，并发任务多
- ⚠️ 烟花全屏期间不暂停背景 rAF（`window.bgAnimationEnabled` 未被设置 false）
- ⚠️ `updateStats` 每秒 setInterval 即便 `data-target` 未变化也持续运行
- ⚠️ 鼠标移动监听 `document` 级 `mousemove`（`{passive: true}` ✓）— 性能可接受但可考虑节流

### 9.3 兼容性
- ⚠️ CSS 诊断曾提示：`-webkit-background-clip` / `-webkit-appearance` 缺标准属性
- ⚠️ 翻页时钟使用 `perspective` + 3D transform，低端 Android 兼容性未知
- ⚠️ 中文文件名 MP3：部分服务器/CDN 可能编码异常（GitHub Pages 已确认需 URL 编码）
- ⚠️ `<audio>` 的 `currentTime` 设置在 iOS 上偶发无响应

### 9.4 可维护性
- ❌ 1514 行单文件 `main.js`，未做模块拆分（`import/export`）
- ❌ 11 个模块共享全局命名空间，存在变量重名风险
- ❌ 硬编码数据与渲染耦合（`initMessages` 启动即覆盖 localStorage）
- ❌ CSS 中部分颜色值未走变量（如 `#151d2e`、`#1c2b59`）
- ❌ 无注释说明烟花形状的物理参数来源
- ❌ 照片墙 `initPhotoWall` 仅生成占位，未读取目录中的真实图片资源

### 9.5 安全
- ✅ 无用户输入提交，已移除表单 → 实际攻击面小
- ⚠️ `innerHTML` 用于留言渲染：当前数据受信任（硬编码），但若未来恢复提交功能须转义
- ⚠️ `<audio src>` 使用相对路径 + 中文文件名，需确认生产环境编码

### 9.6 业务/产品
- ⚠️ 留言数据每次启动**覆盖**为硬编码默认，**用户无法添加/保留新留言**
- ⚠️ 翻页时钟 `targetDate` 写死 2026-06-09，6 月之后场景不再适用
- ⚠️ 相识天数同样锚定 2024-08-26，无配置化入口
- ⚠️ 烟花结束条件：`now < startTime + duration || active`，但 `active` 是粒子任一存在，理论上不会"残留"过早退出

---

## 10. 改进建议（按优先级）

### P0 - 必做
1. **拆分 `main.js`**：按模块拆为 `audio.js` / `beaker.js` / `fireworks.js` / `bg.js` / `stats.js` 等，通过 `<script type="module">` 引入
2. **数据配置外提**：将 `CONFIG`、`timelineData`、`quotesData`、`eqData`、留言数组抽到 `data.js`，便于非开发维护

### P1 - 应做
3. **统一 setInterval 调度**：用一个 `requestAnimationFrame` 主循环按帧率分派更新任务
4. **烟花触发时暂停背景**：在 `triggerAdvancedFireworksFX` 中设置 `window.bgAnimationEnabled = false`，关闭时恢复
5. **CSS 颜色变量化**：把 `#151d2e` 等硬编码颜色抽到 `:root`
6. **错误边界**：在每个 `initXxx()` 顶层加 `try/catch` 并 `console.warn`，单模块失败不影响其他

### P2 - 建议
7. **照片墙接入真实资源**：扫描目录 JPG/HEIC，按 `initPhotoWall` 数组顺序填充
8. **可访问性 (a11y)**：翻页时钟加 `aria-live="polite"`、按钮加 `aria-label`、烟花屏加 `role="dialog"`
9. **iOS 自动播放兼容**：将 `<audio preload="metadata">` 改为仅在用户交互后创建
10. **性能监控开关**：暴露 `window.toggleBGFX()` 调试 API

### P3 - 可选
11. 引入构建工具（Vite）实现代码压缩、按需加载
12. 替换内联 SVG 为 SVG Sprite
13. 添加 PWA manifest 离线访问
14. 添加 `prefers-reduced-motion` 媒体查询，自动降级动画

---

## 11. 关键索引（速查表）

| 关注点 | 位置 |
|--------|------|
| 时间锚点（高考结束） | `main.js:3` `CONFIG.targetDate` |
| 时间锚点（相识日期） | `main.js:4` `CONFIG.startDate` |
| 翻页时钟主循环 | `main.js:153-155` `setInterval` |
| 跨天检测 | `main.js:1688-1700` `initStats` 内 setInterval |
| 烧杯状态机 | `main.js:317-323` `states` 数组 |
| 烟花入口 | `main.js:1049` `triggerAdvancedFireworksFX` |
| 留言硬编码 | `main.js:977-985` `initMessages` |
| 背景调色板 | `main.js:1491-1496` `colorPalettes` |
| 性能降级开关 | `main.js:1512` `isLowEndDevice` |
| 模块调度入口 | `main.js:1637-1661` `DOMContentLoaded` |
| 全局设计令牌 | `style.css:1-22` `:root` |
| 玻璃拟态工具类 | `style.css:81-95` `.glass-panel` |
| 翻页时钟样式 | `style.css:189-321` |

---

## 12. 总结

这是一个**完成度较高的情感向静态站点**，技术选型克制（无构建工具、无依赖），代码组织清晰（全局函数 + 模块注释），视觉与交互细节丰富（11 种烟花、4 态烧杯、玻璃拟态、动态调色板）。

**核心优势**：
- 完全可静态部署，单文件夹即可托管
- 创意实现多（像素采样文字烟花、心形参数方程、DPR 适配）
- 注释密度合理，便于他人接手

**主要短板**：
- 单文件 1514 行 JS，模块化程度低
- 数据与逻辑耦合（硬编码留言、硬编码配置）
- 性能与可访问性有优化空间
- 烟花与背景的并发 rAF 在低端设备上需注意

如后续要扩展（如添加新模块、迁移到构建系统、加入真实留言提交），建议按 P0 优先级先做模块拆分。
