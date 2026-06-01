# llmrelay.ai UI 开发部署

> 这是 `Wei-Shaw/sub2api` 的二开工作目录,改完前端 UI 一键部署到 bwg (`https://www.llmrelay.ai/`)。

## 你的工作流(目标)

1. 在 claude.ai 跟 Claude 协作改前端代码(Vue 文件,主要在 `frontend/src/`)
2. 把改动落到本机仓库(直接复制粘贴,或 git 操作)
3. 在 mini 上执行 `./deploy.sh`,等 ~10 分钟,bwg 自动更新
4. 打开 https://www.llmrelay.ai/ 看效果

## 仓库与镜像

- 源仓库: https://github.com/Wei-Shaw/sub2api (License: LGPL-3.0,自用 fork 合规)
- 本地路径: `/Users/blake/Code/sub2api-llmrelay`(mini 上)
- 自建镜像名: `sub2api-llmrelay:latest`(本机 build,不进任何 registry,通过 ssh 直接 push 到 bwg)
- 跑在 bwg: `/opt/sub2api/` (compose + override.yml 覆盖 image 为 sub2api-llmrelay:latest)

## 前端目录速查

| 路径 | 是什么 |
|---|---|
| `frontend/src/views/` | 页面级 Vue 组件(登录、仪表盘、设置等) |
| `frontend/src/components/` | 通用组件 |
| `frontend/src/stores/` | Pinia 状态管理 |
| `frontend/src/api/` | API 调用(后端契约) |
| `frontend/src/router/` | 路由 |
| `frontend/tailwind.config.*` | Tailwind 主题、颜色 |
| `frontend/src/assets/` | 图片、CSS |
| `frontend/index.html` | 入口模板(改标题、favicon 在这) |

> 改样式优先动 Tailwind class;改文案动 Vue 组件;改主题色动 tailwind.config + assets。

## 一键部署

```bash
ssh mini   # 上 mac mini
cd /Users/blake/Code/sub2api-llmrelay
./deploy.sh        # 完整流程: build + push + restart + 验证
./deploy.sh --skip-build  # 只复用现有 image 重新部署(很少用)
```

预期时间(估算):
- 首次 build: ~10 分钟(下依赖 + Vite build + Go build)
- 后续 build(有 Docker layer cache): 2-5 分钟,主要看改的是前端还是后端
- save + ssh push: 30-60 秒(走 SSH 压缩传 250MB 镜像)
- bwg restart + healthcheck: ~15 秒

## 跟上游同步

```bash
cd /Users/blake/Code/sub2api-llmrelay
git fetch origin main
git rebase origin/main   # 或 reset --hard 如果不想保留改动
```

如果之后做了多次本地改动想保留,建议把这个目录变成你 GitHub 的 fork:

```bash
# 假设你 fork 到 github.com/<youraccount>/sub2api
git remote rename origin upstream
git remote add origin git@github.com:<youraccount>/sub2api.git
git push -u origin main
```

## 验证

部署后这些应该都通:
- 本机 mini:`curl -s http://192.69.95.33:8080/health` → `{"status":"ok"}`
- 边缘:`curl -s -o /dev/null -w "%{http_code}\n" https://www.llmrelay.ai/health` → 200
- 后台:浏览器开 https://www.llmrelay.ai/ 应该看到登录页

## 回滚

如果某次部署后 sub2api 跑不起来,临时切回官方 latest:

```bash
ssh root@192.69.95.33
cd /opt/sub2api
# 注释掉 override.yml 里的 image: sub2api-llmrelay:latest 那行
# 或: mv docker-compose.override.yml docker-compose.override.yml.disabled
docker compose pull sub2api  # 重拉官方
docker compose up -d --force-recreate sub2api
```

## 故障排查

| 现象 | 排查 |
|---|---|
| build 卡在 pnpm install | 网络问题。可在 mini 上手动 `cd frontend && pnpm install` 看进度 |
| build 失败但本地能开 | 看 `/tmp/sub2api-build.log`,关注 vue-tsc / vite build 报错 |
| 部署后页面打不开 | `ssh root@192.69.95.33 'docker logs sub2api --tail 30'`,看启动报错 |
| 页面打开但样式没变 | 浏览器强刷(Cmd+Shift+R),Vite 出来的 hash 文件名会变,但 CDN/浏览器可能缓存 index.html |
