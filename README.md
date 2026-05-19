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
- 服务器端口 80/443 可用

### 一键部署

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd TrainMark

# 2. 复制生产环境配置
cp .env.production.example .env.production

# 3. 编辑配置（修改密码、域名等）
nano .env.production

# 4. 运行部署脚本
./scripts/deploy-server.sh
```

部署完成后访问 `http://你的服务器IP` 即可。

### 手动部署

```bash
# 启动所有服务
docker compose -f infra/docker-compose.prod.yml up -d

# 查看日志
docker compose -f infra/docker-compose.prod.yml logs -f

# 停止服务
docker compose -f infra/docker-compose.prod.yml down
```

### 常用服务地址

| 服务 | 地址 |
|------|------|
| 前端 | `http://你的服务器IP` |
| 后端 API | `http://你的服务器IP/api` |
| MinIO 控制台 | `http://你的服务器IP:9001` |
| RabbitMQ 管理 | `http://你的服务器IP:15672` |

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

## 开发原则

- **先闭环后增强** - 优先完成主流程
- **AI 可解释** - 所有 AI 评分都有得分点和扣分原因
- **教师可复核** - 成绩发布前允许复核和修正
- **全程留痕** - 所有操作记录审计日志

## 文档

- [完整产品计划](./PROJECT.md)
- [API 接口文档](./docs/API.md)
- [基础设施说明](./infra/README.md)
