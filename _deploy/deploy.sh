#!/bin/bash
# llmrelay.ai sub2api 一键部署
# 用法: ./deploy.sh              首次或改完代码后跑
#       ./deploy.sh --skip-build 只重新部署已有 image(调试用)
set -euo pipefail
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[0;33m'; NC='\033[0m'

BWG=root@192.69.95.33
IMG=sub2api-llmrelay:latest
CODE_DIR="$(cd "$(dirname "$0")" && pwd)"
SKIP_BUILD=0
[[ "${1:-}" == "--skip-build" ]] && SKIP_BUILD=1

cd "$CODE_DIR"

if [ "$SKIP_BUILD" -eq 0 ]; then
  echo -e "${YLW}>>> [1/4] buildx build linux/amd64 → ${IMG}${NC}"
  T0=$(date +%s)
  docker buildx build --platform linux/amd64 --load -t "$IMG" .
  echo -e "${GRN}    build 用时 $(( $(date +%s) - T0 ))s${NC}"
else
  echo -e "${YLW}>>> [1/4] skip build (--skip-build)${NC}"
  docker image inspect "$IMG" >/dev/null || { echo -e "${RED}本地无 $IMG,不能 skip${NC}"; exit 1; }
fi

echo -e "${YLW}>>> [2/4] save & ssh push 到 bwg${NC}"
T0=$(date +%s)
docker save "$IMG" | gzip -1 | ssh "$BWG" 'gunzip | docker load'
echo -e "${GRN}    push 用时 $(( $(date +%s) - T0 ))s${NC}"

echo -e "${YLW}>>> [3/4] bwg 重启 sub2api${NC}"
ssh "$BWG" 'cd /opt/sub2api && docker compose up -d --force-recreate sub2api 2>&1 | tail -3'

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
