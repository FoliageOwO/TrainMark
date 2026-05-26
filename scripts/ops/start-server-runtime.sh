#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  TrainMark AI - 启动服务"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        docker compose "$@"
        return
    fi
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose "$@"
        return
    fi
    echo "[错误] 未找到 docker compose 或 docker-compose" >&2
    exit 1
}

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[错误] Docker 未安装"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
    echo "[错误] Docker Compose 未安装"
    exit 1
fi

# 检查配置文件
if [ ! -f ".env" ]; then
    echo "[提示] 未找到 .env，从示例文件创建..."
    cp .env.example .env
    echo "[警告] 请编辑 .env 修改默认密码"
fi

# 加载镜像（如果存在）
if [ -f "frontend.tar.gz" ]; then
    echo "[1/3] 加载前端镜像..."
    docker load -i frontend.tar.gz
fi

if [ -f "backend.tar.gz" ]; then
    echo "[2/3] 加载后端镜像..."
    docker load -i backend.tar.gz
fi

echo "[3/3] 启动服务..."
compose_cmd -f infra/docker-compose.prod.yml up -d

# 等待数据库就绪
echo "等待数据库就绪..."
MAX_RETRIES=30
RETRY_COUNT=0
while ! compose_cmd -f infra/docker-compose.prod.yml exec -T postgres pg_isready -U trainmark &> /dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "[错误] 数据库启动超时"
        compose_cmd -f infra/docker-compose.prod.yml logs postgres
        exit 1
    fi
    echo "  等待中... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo ""
echo "=========================================="
echo "  启动完成！"
echo "=========================================="
echo ""
echo "请在服务器 Nginx/OpenResty 配置反向代理："
echo "  location / { proxy_pass http://127.0.0.1:30081; }"
echo "  location /api/ { proxy_pass http://127.0.0.1:30080; }"
echo ""
echo "查看日志: docker compose -f infra/docker-compose.prod.yml logs -f"
echo "停止服务: docker compose -f infra/docker-compose.prod.yml down"
echo ""
