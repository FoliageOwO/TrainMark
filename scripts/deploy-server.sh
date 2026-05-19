#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  TrainMark AI 云端部署脚本"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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
if [ ! -f ".env.production" ]; then
    echo "[提示] 未找到 .env.production，从示例文件创建..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        echo "[警告] 请编辑 .env.production 修改默认密码后再运行此脚本"
        echo "[警告] 现在使用默认配置继续部署（仅用于测试）"
    else
        echo "[错误] 未找到 .env.production.example"
        exit 1
    fi
fi

# 构建前端
echo ""
echo "[1/4] 构建前端..."
pnpm install --frozen-lockfile
pnpm build:web

# 构建后端
echo ""
echo "[2/4] 构建后端..."
mvn -f backend/pom.xml package -DskipTests -q

# 启动基础设施
echo ""
echo "[3/4] 启动基础设施 (PostgreSQL, Redis, MinIO, RabbitMQ)..."
docker compose -f infra/docker-compose.prod.yml up -d

# 等待数据库就绪
echo "[4/4] 等待数据库就绪..."
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
echo "访问地址："
echo "  前端: http://你的服务器IP"
echo "  API:  http://你的服务器IP/api"
echo ""
echo "管理控制台："
echo "  MinIO:    http://你的服务器IP:9001"
echo "  RabbitMQ: http://你的服务器IP:15672"
echo ""
echo "默认账号："
echo "  管理员: admin / admin123"
echo "  教师:   teacher / teacher123"
echo "  学生:   2024010101 / student123"
echo ""
echo "查看日志: docker compose -f infra/docker-compose.prod.yml logs -f"
echo "停止服务: docker compose -f infra/docker-compose.prod.yml down"
echo ""
