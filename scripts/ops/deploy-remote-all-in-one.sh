#!/usr/bin/env bash
set -euo pipefail
if [ -z "${1:-}" ]; then
  echo "用法: ./scripts/ops/deploy-remote-all-in-one.sh root@你的服务器IP"
  exit 1
fi
SERVER="$1"
echo "=========================================="
echo "  TrainMark AI 一键部署"
echo "=========================================="
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# 1. 本地构建后端 JAR
echo "[1/4] 本地构建后端 JAR..."
mvn -f backend/pom.xml package -DskipTests -q
# 2. 本地构建 Docker 镜像
echo "[2/4] 本地构建 Docker 镜像..."
docker compose -f infra/docker-compose.prod.yml build frontend backend
# 3. 导出镜像并传输
echo "[3/4] 导出镜像并传输到服务器..."
mkdir -p /tmp/trainmark-deploy
docker save trainmark-frontend:latest | gzip > /tmp/trainmark-deploy/frontend.tar.gz
docker save trainmark-backend:latest | gzip > /tmp/trainmark-deploy/backend.tar.gz
ssh "$SERVER" "mkdir -p /root/TrainMark"
scp /tmp/trainmark-deploy/*.tar.gz infra/docker-compose.prod.yml infra/nginx/prod.conf .env.example "$SERVER:/root/TrainMark/"
# 4. 远程启动
echo "[4/4] 远程启动服务..."
ssh "$SERVER" << 'REMOTE'
cd /root/TrainMark
[ ! -f .env ] && cp .env.example .env
docker load -i frontend.tar.gz
docker load -i backend.tar.gz
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo "请在服务器 Nginx 配置反向代理："
echo "  location / { proxy_pass http://127.0.0.1:30081; }"
echo "  location /api/ { proxy_pass http://127.0.0.1:30080; }"
REMOTE
rm -rf /tmp/trainmark-deploy
echo "清理完成。"
