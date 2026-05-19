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
echo "[1/2] 构建前端镜像..."
docker compose -f infra/docker-compose.prod.yml build frontend
docker save trainmark-frontend:latest | gzip > "$OUTPUT_DIR/frontend.tar.gz"
echo "  已导出: $OUTPUT_DIR/frontend.tar.gz"

echo ""
echo "[2/2] 构建后端镜像..."
docker compose -f infra/docker-compose.prod.yml build backend
docker save trainmark-backend:latest | gzip > "$OUTPUT_DIR/backend.tar.gz"
echo "  已导出: $OUTPUT_DIR/backend.tar.gz"

echo ""
echo "=========================================="
echo "  镜像导出完成！"
echo "=========================================="
echo ""
echo "将以下文件传输到服务器："
echo "  1. $OUTPUT_DIR/frontend.tar.gz"
echo "  2. $OUTPUT_DIR/backend.tar.gz"
echo "  3. 整个项目目录 (git clone 或 scp)"
echo ""
echo "传输命令示例："
echo "  scp $OUTPUT_DIR/*.tar.gz root@你的服务器IP:~/TrainMark/"
echo ""
echo "在服务器上运行："
echo "  docker load -i frontend.tar.gz"
echo "  docker load -i backend.tar.gz"
echo "  ./scripts/start-server.sh"
echo ""
