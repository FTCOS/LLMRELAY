# LLMRELAY — Backend API 端点清单

> 从 fork `FTCOS/LLMRELAY` 的 `backend/internal/server/routes/` 提取(commit `bc5813f0`)。
> **统一前缀:`/api/v1`**(网关代理端点除外,见末尾)。
> 鉴权:`jwtAuth` = 登录用户(Bearer JWT);`adminAuth` = 管理员;其余为公开。
> 前端对接时:把设计稿里所有写死的数据换成调下列端点。**字段对不上时优先改前端,不改 backend。**

---

## 1. 认证 Auth（公开） `/api/v1/auth`
| Method | Path | 说明 |
|---|---|---|
| POST | `/auth/register` | 注册(限流 5/min) |
| POST | `/auth/login` | 登录(限流 20/min) |
| POST | `/auth/login/2fa` | 2FA 登录 |
| POST | `/auth/send-verify-code` | 发送邮箱验证码 |
| POST | `/auth/refresh` | 刷新 token |
| POST | `/auth/logout` | 登出(撤销 refresh token) |
| POST | `/auth/validate-promo-code` | 校验优惠码 |
| POST | `/auth/validate-invitation-code` | 校验邀请码 |
| POST | `/auth/forgot-password` | 忘记密码 |
| POST | `/auth/reset-password` | 重置密码 |

### OAuth(GitHub / Google / LinuxDo / WeChat / OIDC / DingTalk）
每个 provider 形如:
`GET /auth/oauth/{provider}/start`、`GET /auth/oauth/{provider}/callback`、
`POST /auth/oauth/{provider}/complete-registration`、`.../bind-login`、`.../create-account`、
绑定入口 `GET /auth/oauth/{provider}/bind/start`。
通用 pending 流:`POST /auth/oauth/pending/exchange | send-verify-code | create-account | bind-login`。
微信支付授权:`GET /auth/oauth/wechat/payment/start | callback`。

## 2. 当前用户 / 公开设置
| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/auth/me` | JWT | 当前用户信息（角色判断 admin 用） |
| POST | `/auth/revoke-all-sessions` | JWT | 撤销所有会话 |
| GET | `/settings/public` | 公开 | **站点公开设置**:site_name / site_logo / site_subtitle / doc_url / home_content（落地页用） |

---

## 3. 用户端 User（JWT） `/api/v1`
**Profile**
`GET /user/profile` · `PUT /user`(更新资料) · `PUT /user/password` · `GET /user/aff` · `POST /user/aff/transfer`
账号绑定:`POST /user/account-bindings/email/send-code`、`POST /user/account-bindings/email`、`DELETE /user/account-bindings/:provider`
通知邮箱:`POST /user/notify-email/send-code | verify`、`PUT /user/notify-email/toggle`、`DELETE /user/notify-email`
TOTP:`GET /user/totp/status | verification-method`、`POST /user/totp/send-code | setup | enable | disable`
平台配额:`GET /user/platform-quotas`、`GET /user/api-keys/:id/usage/daily`

**API Keys** `/keys`（→ Dashboard「API Keys」卡）
| GET | `/keys` | 列表 |
| GET | `/keys/:id` | 详情 |
| POST | `/keys` | 创建 |
| PUT | `/keys/:id` | 更新 |
| DELETE | `/keys/:id` | 删除 |

**可用分组 / 渠道**（→ 模型列表 & 定价）
`GET /groups/available` · `GET /groups/rates`（费率倍率）· `GET /channels/available`

**用量 Usage** `/usage`（→ Dashboard 概览 / 图表）
`GET /usage`（日志列表）· `GET /usage/:id` · `GET /usage/stats`
`GET /usage/dashboard/stats`（**仪表盘指标卡**）· `GET /usage/dashboard/trend`（**趋势图**）·
`GET /usage/dashboard/models`（**模型分布**）· `POST /usage/dashboard/api-keys-usage`

**其它**
公告:`GET /announcements`、`POST /announcements/:id/read`
兑换:`POST /redeem`、`GET /redeem/history`
订阅:`GET /subscriptions | /active | /progress | /summary`
渠道监控(只读):`GET /channel-monitors`、`GET /channel-monitors/:id/status`

---

## 4. 充值 / 支付 Payment（JWT） `/api/v1/payment`
`GET /payment/config` · `GET /payment/checkout-info` · `GET /payment/plans`（**充值套餐**）·
`GET /payment/channels`（支付宝/微信）· `GET /payment/limits`
订单:`POST /payment/orders`（下单）· `POST /payment/orders/verify` · `GET /payment/orders/my` ·
`GET /payment/orders/:id` · `POST /payment/orders/:id/cancel` · `POST /payment/orders/:id/refund-request`
公开:`POST /payment/public/orders/verify | resolve`
Webhook(无需前端):`/payment/webhook/{easypay|alipay|wxpay|stripe|airwallex}`

---

## 5. 管理后台 Admin（JWT + admin 角色） `/api/v1/admin`
**总览 Dashboard** `/admin/dashboard`
`GET /stats`（指标卡）· `GET /realtime` · `GET /trend` · `GET /models` · `GET /groups` ·
`GET /api-keys-trend` · `GET /users-trend` · `GET /users-ranking`（**活跃用户榜**）·
`POST /users-usage` · `POST /api-keys-usage` · `GET /user-breakdown` · `GET /snapshot-v2`

**用户管理** `/admin/users`
`GET ""` · `GET /:id` · `POST ""` · `PUT /:id` · `DELETE /:id` ·
`POST /:id/balance`（改余额）· `GET /:id/api-keys` · `GET /:id/usage` · `GET /:id/balance-history` ·
`POST /:id/replace-group` · `GET|PUT /:id/platform-quotas` · `POST /batch-concurrency` · `GET|PUT /:id/attributes`

**分组 Groups** `/admin/groups` — list/all/usage-summary/capacity-summary/CRUD、rate-multipliers、rpm-overrides、:id/api-keys
**账号池 Accounts** `/admin/accounts` — list/CRUD、:id/test、:id/refresh、:id/stats、:id/usage、:id/models、batch-*、import/export、Claude/OpenAI/Gemini/Antigravity OAuth 接入
**兑换码 Redeem** `/admin/redeem-codes` — `GET ""`、`GET /stats`、`GET /export`、`POST /generate`、`POST /create-and-redeem`、`DELETE /:id`、`POST /batch-delete | batch-update`、`POST /:id/expire`
**优惠码 Promo** `/admin/promo-codes` — CRUD + `/:id/usages`
**用量 Usage** `/admin/usage` — `GET ""`、`GET /stats`、`GET /search-users`、`GET /search-api-keys`、cleanup-tasks
**订阅 Subscriptions** `/admin/subscriptions` — list/CRUD、assign/bulk-assign、:id/extend、:id/reset-quota
**渠道 Channels** `/admin/channels` — list、`GET /model-pricing`（**模型定价**）、`GET /pricing/sync-models`、CRUD
**渠道监控** `/admin/channel-monitors`（+ templates）
**设置 Settings** `/admin/settings` — `GET ""`、`PUT ""`、SMTP/邮件模板、admin-api-key、各类冷却/超时/整流/Beta 策略
**支付管理** `/admin/payment` — dashboard、config、orders、plans、providers
**风控 RiskControl** `/admin/risk-control` — config、api-keys/test、status、logs、users/:id/unban、hashes
**运维 Ops** `/admin/ops` — concurrency、realtime-traffic、alert-rules/events、dashboard/overview、request-errors、system-logs、`GET /ws/qps`(WebSocket)
**其它** proxies、data-management、backups、system(version/update/restart)、user-attributes、affiliates、tls-fingerprint-profiles、error-passthrough-rules、scheduled-test-plans

---

## 6. 网关代理（API Key 鉴权，**非 `/api/v1`**）
OpenAI 兼容,供用户拿 `sk-relay-...` 调模型(落地页/文档展示用):
- `POST /v1/chat/completions`、`POST /v1/messages`、`POST /v1/responses` 等
- base_url = `https://www.llmrelay.ai`,`Authorization: Bearer sk-relay-...`
> 这是给最终用户的「调用入口」,前端只需在文档/快速开始里展示,不直接调。

---

### 角色判断
`GET /auth/me` 返回里有 role 字段 → `admin` 走 `/admin/*`,否则 `/dashboard`。
路由守卫:`/dashboard` 需登录;`/admin/*` 需 admin;`/`、`/usage`、`/login`、`/register` 公开。
