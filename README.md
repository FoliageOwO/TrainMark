# TrainMark AI（智训批）

TrainMark AI，中文名“智训批”，是面向高校实训教学场景的实训报告智能批改与管理系统。项目采用 Monorepo 组织，前端、后端、AI 服务、基础设施配置和文档均放在本仓库中。

完整产品计划见 [`PROJECT.md`](./PROJECT.md)。
当前 MVP 接口清单见 [`docs/API.md`](./docs/API.md)。

## 当前进度

已形成可本地演示的 MVP 闭环，当前前端使用内存 mock 数据，后端各服务提供接口骨架和内存模拟实现：

| 模块 | 状态 |
|---|---|
| Monorepo 目录 | 已创建 |
| 前端 React/Vite 工程 | 已创建 |
| 老师端/学生端/管理端角色切换 | 已实现 |
| 课程、班级、任务、名单导入展示 | 已实现 |
| 学生报告上传交互 | 已实现 |
| 报告收集、未交名单、一键催交 | 已实现 |
| 评分标准、AI 批改队列、OCR 结构化 | 已实现 |
| 人工复核、分项改分、批注预览 | 已实现 |
| 成绩发布、撤回、发布审计 | 已实现 |
| 成绩导出 | 已实现 |
| 学生成绩查看、批注入口、申诉 | 已实现 |
| 成绩统计、失分分析、课程目标达成度 | 已实现 |
| 后端 Spring Boot 聚合工程 | 已创建 |
| 微服务接口骨架 | 已创建 |
| Gateway 基础路由 | 已创建 |
| 管理端审计日志 | 已实现 |
| 管理端系统配置 | 已实现 |
| PWA 安装与离线外壳 | 已实现 |
| 本地 Docker Compose 基础设施 | 已创建 |

## 目录结构

```text
TrainMark/
├── apps/web/              # React + TypeScript 前端
├── backend/               # Spring Boot / Spring Cloud 后端服务
├── ai/                    # OCR、评分、批注相关 AI 能力
├── infra/                 # PostgreSQL、Redis、RabbitMQ、MinIO、Nginx
├── scripts/               # 开发、构建、部署脚本
├── PROJECT.md             # 完整项目实现计划
└── README.md
```

## 本地开发

### 1. 安装前端依赖

```bash
pnpm install
```

### 2. 准备环境变量

```bash
cp .env.example .env
```

当前前端 MVP 使用内存 mock 数据，不依赖后端即可演示主流程。后端和基础设施启动后，可逐步切换到真实接口。

切换到后端 gateway 读取数据：

```bash
VITE_API_MODE=http pnpm dev:web
```

HTTP 模式会从 `VITE_API_BASE_URL` 读取课程、名单、复核、发布、申诉、统计和查重数据；单个接口不可用时会自动回退到本地 mock 数据，便于分服务联调。
Gateway 已允许本地 Vite 开发端口 `5173` / `5174` 的跨域请求。

### 3. 启动前端

```bash
pnpm dev:web
```

访问：`http://localhost:5173`

前端静态检查：

```bash
pnpm lint:web
```

当前 MVP 回归验证：

```bash
pnpm verify:mvp
```

### 4. 启动本地基础设施

```bash
pnpm dev:infra
```

常用地址：

| 服务 | 地址 |
|---|---|
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |
| RabbitMQ Management | `http://localhost:15672` |
| MinIO Console | `http://localhost:9001` |
| Nginx | `http://localhost:8088` |

### 5. 构建后端

```bash
pnpm build:backend
```

这一步只用于校验和打包所有 Maven 模块，不会启动后端服务。日常开发可以跳过构建，直接启动需要调试的服务；`spring-boot:run` 会自动编译当前服务及其依赖模块。

### 6. 启动后端服务

```bash
pnpm dev:backend
```

这会一键启动所有后端服务，日志写入 `.logs/backend/*.log`，按 `Ctrl+C` 会停止全部后端服务。

也可以只启动单个服务：

```bash
pnpm dev:backend:auth
pnpm dev:backend:course
pnpm dev:backend:gateway
```

后端是多服务架构，每个服务单独运行、占用独立端口。常用服务端口：

| 脚本 | 服务 | 地址 |
|---|---|---|
| `pnpm dev:backend:gateway` | gateway-service | `http://localhost:8080` |
| `pnpm dev:backend:auth` | auth-service | `http://localhost:8081` |
| `pnpm dev:backend:user` | user-service | `http://localhost:8082` |
| `pnpm dev:backend:course` | course-service | `http://localhost:8083` |
| `pnpm dev:backend:file` | file-service | `http://localhost:8084` |
| `pnpm dev:backend:grading` | grading-service | `http://localhost:8085` |
| `pnpm dev:backend:ocr` | ocr-service | `http://localhost:8086` |
| `pnpm dev:backend:similarity` | similarity-service | `http://localhost:8087` |
| `pnpm dev:backend:notification` | notification-service | `http://localhost:8089` |
| `pnpm dev:backend:admin` | admin-service | `http://localhost:8090` |
| `pnpm dev:backend:analytics` | analytics-service | `http://localhost:8091` |

这些脚本会启用 Maven 的 `dev` profile，加载 Spring Boot DevTools。修改 Java 源码后需要 IDE 或 Maven 编译生成新的 class 文件，DevTools 会检测 classpath 变化并重启对应服务。

示例接口：

| 接口 | 说明 |
|---|---|
| `GET http://localhost:8081/api/auth/me` | 当前用户模拟接口 |
| `GET http://localhost:8083/api/courses` | 课程列表模拟接口 |
| `GET http://localhost:8085/api/grading/results` | 批改结果与复核模拟接口 |
| `GET http://localhost:8091/api/analytics/grade-statistics?assignmentId=1` | 成绩统计模拟接口 |

## 验证命令

```bash
pnpm build:web
mvn -f backend/pom.xml package -DskipTests
```

## 环境说明

当前仓库允许在没有 Docker 的机器上继续编码。后端 Maven 工程和 Docker Compose 配置会持续维护，但本机没有 Docker 时可先不执行基础设施启动。

前端统一使用 pnpm，不再使用 npm workspace。

## 开发原则

| 原则 | 说明 |
|---|---|
| 先闭环后增强 | 优先完成老师端和学生端主流程 |
| AI 可解释 | 所有 AI 评分都必须有得分点、扣分原因和置信度 |
| 教师可复核 | 成绩发布前必须允许教师复核和修正 |
| 全程留痕 | 上传、批改、改分、发布、导出均记录审计日志 |
| 面向生产 | 从一开始考虑权限、安全、异步任务、备份和监控 |

## 下一步

1. 将当前内存模拟服务接入 PostgreSQL / Flyway。
2. 将前端 mock API 切换为真实 HTTP API。
3. 接入真实 OCR、规则评分、语义评分和批注 PDF 生成。
4. 增加基础单元测试、接口文档和端到端冒烟测试。
5. 验证 Docker Compose 本地基础设施和多服务联调。
