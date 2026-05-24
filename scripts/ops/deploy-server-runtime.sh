#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  TrainMark AI 云端部署脚本"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[错误] Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "[错误] Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查配置文件
if [ ! -f ".env" ]; then
    echo "[提示] 未找到 .env，从示例文件创建..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[警告] 请编辑 .env 修改默认密码"
    else
        echo "[错误] 未找到 .env.example"
        exit 1
    fi
fi

echo ""
echo "[1/3] 构建前端镜像..."
docker compose -f infra/docker-compose.prod.yml build frontend

echo ""
echo "[2/3] 构建后端镜像..."
docker compose -f infra/docker-compose.prod.yml build backend

echo ""
echo "[3/3] 启动服务..."
docker compose -f infra/docker-compose.prod.yml up -d

# 等待数据库就绪
echo "等待数据库就绪..."
MAX_RETRIES=30
RETRY_COUNT=0
while ! docker compose -f infra/docker-compose.prod.yml exec -T postgres pg_isready -U trainmark &> /dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "[错误] 数据库启动超时"
        docker compose -f infra/docker-compose.prod.yml logs postgres
        exit 1
    fi
    echo "  等待中... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "服务已启动在内部端口："
echo "  前端: 容器内 3000 端口"
echo "  后端: 容器内 8080 端口"
echo ""
echo "请在服务器 Nginx/OpenResty 中添加反向代理配置："
echo ""
echo "  location / {"
echo "      proxy_pass http://127.0.0.1:3000;"
echo "  }"
echo ""
echo "  location /api/ {"
echo "      proxy_pass http://127.0.0.1:8080;"
echo "  }"
echo ""
echo "管理控制台（仅监听 127.0.0.1）："
echo "  MinIO:    http://127.0.0.1:9001"
echo "  RabbitMQ: http://127.0.0.1:15672"
echo ""
echo "默认账号："
echo "  管理员: admin / admin123"
echo "  教师:   teacher / teacher123"
echo "  学生:   2024010101 / student123"
echo ""
echo "查看日志: docker compose -f infra/docker-compose.prod.yml logs -f"
echo "停止服务: docker compose -f infra/docker-compose.prod.yml down"
echo ""
