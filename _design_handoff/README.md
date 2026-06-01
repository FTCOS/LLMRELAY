# Handoff: LLMRELAY 前端重写（Apple 清新风 · 模型平权）

## Overview
把 `FTCOS/LLMRELAY`（Wei-Shaw/sub2api 的 fork）的 `frontend/` 重写成全新 Apple 清新风 SPA，
主题「模型平权 / Model Equality」——一个 Key 接入 Claude / GPT / DeepSeek / Qwen，按量付费、价格最优。
保留 **Vue 3.4 + Vite + TypeScript** 技术栈（产物 `frontend/dist/` 被 Go `embed.FS` 编进二进制，**不可换技术栈**）。

> ⚠️ 目标分支 `feat/llmrelay-design-v1`，**不要碰 `main`**，**不要碰 `backend/`、`Dockerfile`、`deploy/`、`.github/`**。

## About the Design Files（重要）
`design/` 里是用 **HTML + 浏览器内 React/JSX** 做的**设计参考稿**（高保真原型，展示最终观感与交互），
**不是要直接搬进去的生产代码**。任务是：**用仓库现有的 Vue 3 SFC + Vite + Tailwind 体系，把这些设计 1:1 复刻出来**，
并接通真实后端 API（见 `API_ENDPOINTS.md`），去掉所有 mock 数据。

- 打开 `design/index.html` 即可预览全部 5 类页面（右上「中/EN」切语言，左下「方向」切 classic/equity/mono，工具栏 Tweaks 跳转各页）。
- 逐文件对应见下方「页面映射」。

## Fidelity：**High-fidelity（hifi）**
颜色、字号、间距、圆角、阴影、动效都已定稿，按 `design/` 像素级复刻。
若某动效 Vue 不好实现可简化（**功能可用 > 视觉 100% 还原**）。

---

## 设计 Tokens（搬到 `src/assets/styles/tokens.css`，`main.ts` import 一次）
全部定义在 `design/styles.css` `:root` 与 `html[data-dir=...]`。核心:

**中性色**:`--ink:#1d1d1f` `--ink-2:#515154` `--ink-3:#86868b` `--bg:#fff` `--surface:#f5f5f7` `--line:rgba(0,0,0,.1)`
**强调色(随方向切)**:
- `classic`（默认）:`--accent:#0071e3`（Apple 蓝）`--accent-ink:#0066cc` `--tint:#f5f5f7`
- `equity`（**对应原 sub2api 品牌青 #14b8a6**）:`--accent:#00a386` `--tint:#f0f6f4`
- `mono`:`--accent:#1d1d1f`（近黑，编辑式排版）
切换方式:`<html data-dir="classic|equity|mono">`（与设计稿一致）。

**字体栈(macOS 原生 SF + 苹方)**:
`-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", system-ui, sans-serif`；等宽 `"SF Mono", ui-monospace, Menlo`。
**圆角**:`--radius-sm:10 / --radius:18 / --radius-lg:28 / --pill:980px`
**阴影**:`--card-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 28px rgba(0,0,0,.06)`；lift 版更重。
**按钮**:药丸形(`border-radius:980px`)；主按钮填充 accent 白字；次按钮浅灰 / 描边。
**动效**:`fadeUp .7s cubic-bezier(.22,.61,.36,1)`；卡片 hover translateY(-3px)+阴影；环形进度 1s 缓动。
**栅格**:内容最大宽 1120px；强用 flex/grid + gap。

## i18n（vue-i18n）
文案在 `design/i18n.js`（落地/登录/仪表盘）+ `design/i18n-admin.js`（查询页/后台），均为 `{ zh, en }` 结构。
搬到 `src/i18n/zh.json` `en.json`（+ admin 拆分）。语言用 `<html data-lang>` 或 vue-i18n locale 切换。

---

## 页面映射 Screens（落到 `frontend/src/views/`）

| 设计文件 | 目标 Vue | 路由 | 守卫 | 说明 |
|---|---|---|---|---|
| `design/landing.jsx` | `views/Landing.vue` | `/` | 公开 | Hero（终端窗口 mock）+ 模型阵容 + 价值主张 + 平权宣言 + 定价 + CTA。`site_name/subtitle` 取 `GET /settings/public` |
| `design/auth.jsx` | `views/Login.vue` `Register.vue` | `/login` `/register` | 公开 | 邮箱+密码 + GitHub/Google OAuth；接 `/auth/login` `/auth/register`、OAuth start |
| `design/dashboard.jsx` | `views/Dashboard.vue` | `/dashboard` | 登录 | 侧边栏 + 概览(指标卡/各模型配额环/7日柱图) + API Keys 表 + 最近请求。接 `/usage/dashboard/*`、`/keys`、`/user/platform-quotas`、`/payment/*` |
| `design/keyusage.jsx` | `views/KeyUsage.vue` | `/usage` | 公开 | 凭 Key 查用量（**环形进度**:余额/今日/本月 + 明细）。接 `/user/api-keys/:id/usage/daily` 或专用查询端点 |
| `design/admin.jsx` | `views/Admin/*.vue` | `/admin/*` | admin | 总览/用户/账号池/用量/兑换码 拆成子页 |
| `design/shared.jsx` | `components/layout/`（Nav/Footer/Logo） | — | — | 顶栏、页脚、LLMRELAY 文字标志、语言切换 |
| `design/icons.jsx` | `components/icons/*.vue` | — | — | 线性图标；或用 unplugin-icons |
| `design/tweaks-panel.jsx` | `components/dev/TweaksPanel.vue` | — | — | **仅开发态**，用 `import.meta.env.DEV` 条件渲染，生产不打包 |

**Admin 子页路由**（admin.jsx 内已分区）:
`/admin/dashboard`（总览,接 `/admin/dashboard/*`）·`/admin/users`（`/admin/users`）·
`/admin/accounts`（`/admin/accounts`）·`/admin/usage`（`/admin/usage`）·`/admin/redeem`（`/admin/redeem-codes`）。
> 可接受妥协:先把**总览**做扎实，其余子页留占位但路由要在。

## Interactions & States
- 语言切换、方向切换:写 `<html>` 属性，全局 CSS 变量响应。
- 表单:登录/注册需基本校验(邮箱格式、密码≥8)、loading 态、错误态(后端 4xx 文案)。
- 仪表盘环形/柱状:挂载后从 0 动画到目标值。
- 路由守卫:`GET /auth/me` 拿角色;无 token → `/login`;非 admin 访问 `/admin/*` → 403/重定向。
- 复制 API Key:点击复制 + 「已复制」反馈。

## State / Data
- 复用现有 **pinia**(authStore/appStore 已存在于原 sub2api) + **vue-router**。
- `appStore.fetchPublicSettings()` 已有，落地页 `site_name` 等沿用。
- 所有写死数据(模型列表、用量、配额、Key 列表、兑换码)→ 换成 `src/api/` client 调真实端点。

## 真实 API
见 **`API_ENDPOINTS.md`**（完整端点清单，base `/api/v1`，已按 auth/user/admin/payment 分组）。
字段对不上时**改前端适配后端**。不确定的端点在 PR description 里列出来。

## Files（本包内容）
- `design/`            —— 设计稿全部源文件（打开 index.html 预览）
- `API_ENDPOINTS.md`   —— 后端端点清单
- `CLAUDE_CODE_TASK.md`—— 可直接粘贴给 Claude Code 的执行指令
- `README.md`          —— 本文件

## 交付要求
- 分支 `feat/llmrelay-design-v1`；commit:`feat: rewrite frontend with LLMRELAY Apple-fresh design — landing/auth/dashboard/admin/usage (Vue 3 SFC + TS)`
- push 前在 `frontend/` 跑 `pnpm install && pnpm build` 自检通过
- PR description 列出:已对接的功能 / 占位的子页 / 不清楚的 API
