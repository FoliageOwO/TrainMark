# TrainMark AI

高校实训场景下的实训报告智能批改与管理系统。

这个仓库现在按一个常见的全栈项目来理解就够了：

- `apps/web/`: 前端 Web 应用
- `backend/`: Spring Boot 后端服务
- `infra/`: PostgreSQL、Redis、RabbitMQ、MinIO、Nginx 等本地基础设施
- `ai/`: OCR、评分、批注相关的 AI provider 与 bridge
- `scripts/`: 开发、验证、运维脚本，已按职责分组

## 先看启动

### 1. 只看前端界面

```bash
pnpm install
pnpm start:web
```

- 访问 `http://localhost:5173`
- 这是前端 mock 模式，不依赖后端
- 当前页面数据默认来自 `apps/web/src/api/mockApi.ts`

### 2. 只启动后端

```bash
pnpm start:backend
```

- 会打包并启动所有 Spring Boot 服务
- 日志在 `.logs/backend/`
- 适合后端联调或排查单个服务问题

### 3. 启动完整本地栈

```bash
pnpm start:stack
```

这条命令会串起完整开发链路：

1. 启动 `infra/docker-compose.yml` 里的本地基础设施
2. 检查并补齐本地数据库迁移
3. 启动所有后端服务
4. 等待 API smoke 检查通过
5. 以前端 HTTP 模式启动 Web

如果你只想在“已有数据库 / 已有基础设施”的前提下跑前后端，不想自动起 Docker，可用：

```bash
pnpm start:stack:http
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm start:web` | 前端 mock 模式 |
| `pnpm start:backend` | 启动全部后端服务 |
| `pnpm start:stack` | 启动完整本地开发环境 |
| `pnpm infra:up` | 单独启动本地基础设施 |
| `pnpm infra:down` | 停止本地基础设施 |
| `pnpm infra:restart` | 重启本地基础设施 |
| `pnpm infra:reset` | 重建本地基础设施并清空卷数据 |
| `pnpm infra:status` | 查看本地基础设施状态 |
| `pnpm db:migrate:local` | 对本地 PostgreSQL 执行迁移补齐 |
| `pnpm start:service:auth` | 只启动单个后端服务 |
| `pnpm verify:stack` | 校验前端、后端、AI、smoke 脚本主链路 |
| `pnpm verify:ai` | 校验 AI provider/bridge |
| `pnpm smoke:api` | 跑 API smoke |
| `pnpm ops:backup:local` | 备份本地 PostgreSQL 和 MinIO |
| `pnpm ops:restore:local` | 恢复本地备份 |
| `pnpm ops:release:local` | 生成本地发布包 |
| `pnpm ops:images:export` | 构建并导出生产镜像 |

## 项目结构

```text
TrainMark/
├── apps/
│   └── web/                # React + Vite 前端
├── backend/                # Spring Boot 微服务
├── infra/                  # docker compose 与生产镜像配置
├── ai/                     # OCR / 评分 / 批注 provider 与 bridge
├── scripts/
│   ├── dev/                # 开发启动脚本
│   ├── verify/             # smoke / verify 脚本
│   ├── ops/                # 备份 / 发布 / 部署 / 迁移
│   └── lib/                # 通用脚本运行器
├── docs/
│   └── API.md              # API 说明
├── PROJECT.md              # 项目说明
└── PROGRESS.md             # 开发过程记录
```

脚本清单见 `scripts/README.md`。

## 关于那些原来看不懂的名字

- `mvp`: 这里实际表示“把前后端主链路跑起来的联调入口”
- `jdbc`: 表示后端数据存储显式切到 PostgreSQL 等真实基础设施，而不是纯内存模式
- `smoke`: 表示轻量联通性检查，不是完整测试
- `ops`: 表示运维/发布类脚本，不是日常开发入口

现在建议你优先只记住这三条：

```bash
pnpm start:web
pnpm start:backend
pnpm start:stack
```

其余命令都属于专项操作。

## 真实 AI Provider

默认本地开发可以不接真实 AI。需要验证 PaddleOCR / 语义评分 HTTP provider 时：

1. 先阅读 `ai/ocr/README.md` 和 `ai/scoring/README.md`
2. 单独启动 `ai/bridge_server.py`
3. 再用 `pnpm start:stack` 启动整套本地环境，并通过环境变量把后端 provider 切到 HTTP 模式

这部分属于专项验收能力，不是普通启动路径。

## 兼容说明

- 旧的 `pnpm dev:*`、`pnpm verify:mvp`、`pnpm smoke:mvp:*` 仍然保留，避免打断已有习惯
- 新文档统一以 `start:*`、`verify:*`、`ops:*` 为主
