#!/bin/bash
# llmrelay.ai sub2api 从 fork 指定分支部署
# 用法: ./deploy-from-fork.sh <branch> [--no-fetch] [--skip-build]
#   <branch>      必填,fork 上的分支名(如 main、feat/llmrelay-design-v1)
#   --no-fetch    跳过 git fetch + checkout,直接用当前本地代码 build(调试用)
#   --skip-build  复用已 build 好的本地 image(只重新部署到 bwg)
set -euo pipefail
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[0;33m'; NC='\033[0m'

BWG=root@192.69.95.33
IMG=sub2api-llmrelay:latest
CODE_DIR="$(cd "$(dirname "$0")" && pwd)"

# 解析参数
BRANCH=""
NO_FETCH=0
SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --no-fetch)   NO_FETCH=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    --help|-h)
      sed -n '2,8p' "$0"; exit 0 ;;
    -*)
      echo -e "${RED}未知参数: $arg${NC}"; exit 2 ;;
    *)
      [ -z "$BRANCH" ] && BRANCH="$arg" || { echo -e "${RED}只能指定一个分支,已有: $BRANCH${NC}"; exit 2; }
      ;;
  esac
done

if [ -z "$BRANCH" ]; then
  echo -e "${RED}用法: $0 <branch> [--no-fetch] [--skip-build]${NC}"
  echo "示例: $0 main"
  echo "      $0 feat/llmrelay-design-v1"
  exit 2
fi

cd "$CODE_DIR"

# === 0/4 同步 fork 指定分支 ===
if [ "$NO_FETCH" -eq 0 ]; then
  echo -e "${YLW}>>> [0/4] git fetch + checkout ${BRANCH}${NC}"
  git fetch origin --prune
  # 分支存在性检查
  if ! git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    echo -e "${RED}远端分支 origin/${BRANCH} 不存在${NC}"
    echo "可用远端分支:"
    git branch -r | sed 's/^/  /'
    exit 3
  fi
  # 切换并强制对齐远端
  git checkout -B "$BRANCH" "origin/${BRANCH}"
  git reset --hard "origin/${BRANCH}"
  echo -e "${GRN}    当前 HEAD: $(git log --oneline -1)${NC}"
else
  echo -e "${YLW}>>> [0/4] --no-fetch,用本地当前代码${NC}"
  echo "    当前分支: $(git branch --show-current)"
  echo "    HEAD: $(git log --oneline -1)"
fi

# === 1/4 build ===
if [ "$SKIP_BUILD" -eq 0 ]; then
  echo -e "${YLW}>>> [1/4] buildx build linux/amd64 → ${IMG}${NC}"
  T0=$(date +%s)
  docker buildx build --platform linux/amd64 --load -t "$IMG" .
  echo -e "${GRN}    build 用时 $(( $(date +%s) - T0 ))s${NC}"
else
  echo -e "${YLW}>>> [1/4] --skip-build${NC}"
  docker image inspect "$IMG" >/dev/null || { echo -e "${RED}本地无 $IMG,不能 skip${NC}"; exit 1; }
fi

# === 2/4 save & push ===
echo -e "${YLW}>>> [2/4] save & ssh push 到 bwg${NC}"
T0=$(date +%s)
docker save "$IMG" | gzip -1 | ssh "$BWG" 'gunzip | docker load'
echo -e "${GRN}    push 用时 $(( $(date +%s) - T0 ))s${NC}"

# === 3/4 restart ===
echo -e "${YLW}>>> [3/4] bwg 重启 sub2api${NC}"
ssh "$BWG" 'cd /opt/sub2api && docker compose up -d --force-recreate sub2api 2>&1 | tail -3'

# === 4/4 verify ===
echo -e "${YLW}>>> [4/4] 等 healthy + 验证${NC}"
for i in $(seq 1 15); do
  st=$(ssh "$BWG" "docker inspect -f '{{.State.Health.Status}}' sub2api 2>/dev/null" || echo error)
  printf "    [%2d] %s\n" "$i" "$st"
  [ "$st" = "healthy" ] && break
  sleep 3
done

ssh "$BWG" '
  echo "    本地 /health:  $(curl -s -m5 http://localhost:8080/health)"
  printf "    边缘 www      HTTP %s\n" "$(curl -s -m12 --resolve www.llmrelay.ai:443:172.67.186.239 -o /dev/null -w "%{http_code}" https://www.llmrelay.ai/health)"
  printf "    边缘 /v1/models HTTP %s (应401)\n" "$(curl -s -m12 --resolve www.llmrelay.ai:443:172.67.186.239 -o /dev/null -w "%{http_code}" https://www.llmrelay.ai/v1/models)"
'
echo -e "${GRN}==== DONE: 打开 https://www.llmrelay.ai/ 看效果 ====${NC}"
echo -e "${GRN}     部署分支: ${BRANCH}    HEAD: $(git log --oneline -1)${NC}"
