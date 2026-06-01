# CLAUDE CODE 执行指令（在本地 clone 的 FTCOS/LLMRELAY 仓库根目录运行）

把这段连同本文件夹（`design/`、`API_ENDPOINTS.md`、`README.md`）一起给 Claude Code。

---

## 任务
基于 `design/` 设计稿，把本仓库 `frontend/` 重写成生产级 Apple 清新风 SPA，替换原 Vue 实现。
完成后 commit & push 到新分支 `feat/llmrelay-design-v1`，**不要碰 main**。

## 硬约束
1. **保留 Vue 3.4 + Vite + TypeScript**（产物 `frontend/dist/` 被 Go embed.FS 编进二进制）。不要换 React。把 `design/*.jsx` 用 Vue 3 SFC `<script setup lang="ts">` 重写。
2. **复用现有工程文件** `frontend/package.json`、`vite.config.ts`、`tsconfig.json`，只在 dependencies 里按需补（vue-router / pinia / vue-i18n 若缺）。
3. **绝不触碰** `backend/`、`Dockerfile*`、`docker-compose*`、`deploy/`、`.github/workflows/`。
4. **接通真实 API**，删掉所有 mock：端点清单见 `API_ENDPOINTS.md`（base `/api/v1`）。字段对不上时**改前端适配后端**，不改 backend；不确定的端点列进 PR。

## 页面映射（详见 README.md「页面映射」表）
- `design/landing.jsx` → `src/views/Landing.vue`（`/`，公开，site_name 取 `GET /settings/public`）
- `design/auth.jsx` → `src/views/Login.vue` + `Register.vue`（`/login` `/register`，接 `/auth/login|register` + OAuth）
- `design/dashboard.jsx` → `src/views/Dashboard.vue`（`/dashboard`，登录；接 `/usage/dashboard/*`、`/keys`、`/user/platform-quotas`、`/payment/*`）
- `design/keyusage.jsx` → `src/views/KeyUsage.vue`（`/usage`，公开，环形进度）
- `design/admin.jsx` → `src/views/Admin/*.vue`（`/admin/dashboard|users|accounts|usage|redeem`，admin 角色；接 `/admin/*`）
- `design/shared.jsx` → `src/components/layout/`（Nav/Footer/Logo）
- `design/icons.jsx` → `src/components/icons/`
- `design/tweaks-panel.jsx` → `src/components/dev/TweaksPanel.vue`，**仅 `import.meta.env.DEV` 渲染**，生产不打包

## 设计 token / i18n
- 把 `design/styles.css` `landing.css` `app-extra.css` 的 `:root` 变量、字体栈、阴影、动画搬到 `src/assets/styles/tokens.css`，`main.ts` import 一次。Apple 风 + 3 方向（classic/equity/mono）靠 `<html data-dir>` 切换。
- 默认方向 `classic`（Apple 蓝）；`equity` = 原品牌青 `#14b8a6` 体系。
- `design/i18n.js` + `i18n-admin.js`（`{zh,en}`）→ `src/i18n/zh.json` + `en.json`（admin 可拆）。vue-i18n。

## 路由守卫
`GET /auth/me` 取角色：无 token → `/login`；`/dashboard` 需登录；`/admin/*` 需 admin；`/`、`/usage`、`/login`、`/register` 公开。

## 可接受的妥协
- admin 5 子页若写不完：先把「总览」做扎实，其余留占位但路由要在。
- 动效 Vue 不好实现可简化（功能可用 > 视觉 100%）。
- 不清楚的 API 写进 commit / PR。

## 提交
- 分支 `feat/llmrelay-design-v1`
- commit: `feat: rewrite frontend with LLMRELAY Apple-fresh design — landing/auth/dashboard/admin/usage (Vue 3 SFC + TS)`
- push 前在 `frontend/` 跑 `pnpm install && pnpm build` 自检通过
- PR description 列：已对接功能 / 占位子页 / 不清楚的 API
