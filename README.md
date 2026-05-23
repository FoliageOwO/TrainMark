# TrainMark AI（智训批）

面向高校实训场景的**实训报告智能批改与管理系统**。

## 快速开始

### 本地开发（无需 Docker）

```bash
# 1. 安装依赖
pnpm install

# 2. 启动前端（内存 mock 模式，独立演示）
pnpm dev:web

# 访问 http://localhost:5173
```

### 完整本地开发（含后端和数据库）

```bash
# 一键启动所有服务（前端 + 后端 + PostgreSQL + Redis + MinIO）
pnpm dev:mvp:jdbc
```

### 云端服务器部署

```bash
# 一键部署到生产服务器
./scripts/deploy-server.sh
```

详细部署说明见下方 [云端部署](#云端部署) 章节。

## 目录结构

```
TrainMark/
├── apps/web/          # 前端 (React + Vite)
├── backend/           # 后端 (Spring Boot)
├── ai/                # AI 服务 (OCR、评分、批注)
├── infra/             # Docker 基础设施配置
├── scripts/           # 开发和部署脚本
└── docs/              # 文档
```

## 云端部署

### 前提条件

- 服务器已安装 Docker 和 Docker Compose
- 服务器已有 Nginx/OpenResty 运行

### 部署步骤

**本地电脑执行（构建镜像）：**

```bash
# 1. 构建并导出镜像
./scripts/build-and-export.sh

# 2. 传输到服务器
scp deployments/images/*.tar.gz root@你的服务器IP:~/TrainMark/
scp -r . root@你的服务器IP:~/TrainMark/
```

**服务器执行（启动服务）：**

```bash
# 1. 复制配置
cd ~/TrainMark
cp .env.example .env
nano .env  # 修改密码

# 2. 加载镜像并启动
./scripts/start-server.sh
```

### 配置服务器 Nginx 反向代理

在服务器现有的 Nginx/OpenResty 配置中添加：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:30081;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:30080;
    }
}
```

### 手动部署

```bash
# 启动所有服务
docker compose -f infra/docker-compose.prod.yml up -d

# 查看日志
docker compose -f infra/docker-compose.prod.yml logs -f

# 停止服务
docker compose -f infra/docker-compose.prod.yml down
```

### 服务端口说明

所有服务仅监听 `127.0.0.1`，不占用服务器 80/443 端口：

| 服务 | 监听地址 | 说明 |
|------|----------|------|
| 前端 | `127.0.0.1:30081` | 静态文件 + API 转发 |
| 后端 | `127.0.0.1:30080` | API 服务 |
| PostgreSQL | 内部网络 | 数据库 (不暴露端口) |
| Redis | 内部网络 | 缓存 (不暴露端口) |
| MinIO | 内部网络 | 对象存储 (不暴露端口) |
| RabbitMQ | 内部网络 | 消息队列 (不暴露端口) |

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher | teacher123 |
| 学生 | 2024010101 | student123 |

**生产环境必须修改默认密码！**

## 本地开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev:web` | 启动前端 |
| `pnpm dev:backend` | 启动所有后端服务 |
| `pnpm dev:infra` | 启动基础设施 (PostgreSQL, Redis, MinIO) |
| `pnpm dev:mvp:jdbc` | 一键启动完整开发环境 |
| `pnpm build:web` | 构建前端 |
| `pnpm build:backend` | 构建后端 |
| `pnpm smoke:api` | 运行 API 冒烟测试 |

## 环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

核心配置项：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_MODE` | 前端数据模式 (mock/http) | `mock` |
| `POSTGRES_PORT` | PostgreSQL 端口 | `55432` |
| `POSTGRES_PASSWORD` | 数据库密码 | `trainmark_dev` |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | `trainmark` |

## 真实 AI Provider

本地默认仍可用 `local` 模式快速开发。要接入真实 OCR 和语义评分，先启动或部署一个 AI Provider HTTP 服务，再把后端切到 HTTP provider：

```bash
# 安装真实 AI Provider 依赖
python -m pip install -r ai/requirements.txt

# 启动内置桥接服务。生产环境也可以替换成独立 PaddleOCR/BGE 服务。
python ai/bridge_server.py

# 后端环境变量
OCR_PROVIDER=paddleocr-http
OCR_ENDPOINT=http://localhost:5000/api/ai/ocr/paddleocr
SCORING_PROVIDER=semantic-http
SCORING_ENDPOINT=http://localhost:5000/api/ai/scoring/semantic
SCORING_MODEL=BAAI/bge-small-zh-v1.5
TRAINMARK_REQUIRE_REAL_AI=1
```

`TRAINMARK_REQUIRE_REAL_AI=1` 会禁止离线兜底；如果 PaddleOCR 或 SentenceTransformer/BGE 模型没有安装成功，服务会直接报错，适合生产验收。

## 开发原则

- **先闭环后增强** - 优先完成主流程
- **AI 可解释** - 所有 AI 评分都有得分点和扣分原因
- **教师可复核** - 成绩发布前允许复核和修正
- **全程留痕** - 所有操作记录审计日志

## 文档

- [完整产品计划](./PROJECT.md)
- [API 接口文档](./docs/API.md)
- [基础设施说明](./infra/README.md)
