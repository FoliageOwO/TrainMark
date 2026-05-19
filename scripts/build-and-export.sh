#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  TrainMark AI - 本地构建并导出镜像"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OUTPUT_DIR="${OUTPUT_DIR:-./deployments/images}"
mkdir -p "$OUTPUT_DIR"

echo ""
echo "[1/4] 本地构建后端 JAR (利用本地 Maven 缓存，秒级完成)..."
mvn -f backend/pom.xml package -DskipTests -q

echo ""
echo "[2/4] 构建前端镜像..."
docker compose -f infra/docker-compose.prod.yml build frontend
docker save trainmark-frontend:latest | gzip > "$OUTPUT_DIR/frontend.tar.gz"
echo "  已导出: $OUTPUT_DIR/frontend.tar.gz"

echo ""
echo "[3/4] 构建后端镜像 (仅打包 JAR，无需下载依赖)..."
docker compose -f infra/docker-compose.prod.yml build backend
docker save trainmark-backend:latest | gzip > "$OUTPUT_DIR/backend.tar.gz"
echo "  已导出: $OUTPUT_DIR/backend.tar.gz"

echo ""
echo "=========================================="
echo "  镜像导出完成！"
echo "=========================================="
echo ""
echo "传输到服务器："
echo "  scp $OUTPUT_DIR/*.tar.gz root@你的服务器IP:~/TrainMark/"
echo ""
echo "服务器启动："
echo "  cd ~/TrainMark && ./scripts/start-server.sh"
echo ""
