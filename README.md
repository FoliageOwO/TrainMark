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
| 上传格式、大小和完成校验 | 已实现 |
| 上传错误统一响应 | 已实现 |
| 报告收集、未交名单、一键催交 | 已实现 |
| 评分标准、AI 批改队列、OCR 结构化 | 已实现 |
| 人工复核、分项改分、批注预览 | 已实现 |
| 批注 PDF 查看入口 | 已实现 |
| HTTP 资源链接解析 | 已实现 |
| 成绩发布、撤回、发布审计 | 已实现 |
| 成绩导出 | 已实现 |
| 成绩导出下载入口 | 已实现 |
| 批注与导出资源下载 | 已实现 |
| 学生成绩查看、批注入口、申诉 | 已实现 |
| 成绩统计、失分分析、课程目标达成度 | 已实现 |
| 后端 Spring Boot 聚合工程 | 已创建 |
| 微服务接口骨架 | 已创建 |
| Gateway 基础路由 | 已创建 |
| 后端运行参数绑定 | 已修复 |
| 用户与组织 PostgreSQL 存储 | 已支持 |
| 课程与任务 PostgreSQL 存储 | 已支持 |
| 上传与提交 PostgreSQL 存储 | 已支持 |
| OCR 任务 PostgreSQL 存储 | 已支持 |
| 催交通知 PostgreSQL 存储 | 已支持 |
| 查重任务 PostgreSQL 存储 | 已支持 |
| 统计分析 PostgreSQL 存储 | 已支持 |
| 管理端 PostgreSQL 存储 | 已支持 |
| 管理端审计日志 | 已实现 |
| 管理端系统配置 | 已实现 |
| PWA 安装、离线外壳与角色快捷入口 | 已实现 |
| OCR Provider CLI 契约 | 已创建 |
| OCR 后端 Provider 切换 | 已实现 |
| 评分 Provider CLI 契约 | 已创建 |
| 评分后端 Provider 切换 | 已实现 |
| AI Provider 错误统一响应 | 已实现 |
| 批注 PDF Provider CLI 契约 | 已创建 |
| 批注后端 Provider 切换 | 已实现 |
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

AI provider 契约验证：

```bash
pnpm verify:ai
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

用户与组织服务默认使用内存数据，方便不启动数据库也能联调。需要切换到 PostgreSQL 时，先启动基础设施并设置：

```bash
TRAINMARK_USER_STORE=jdbc \
TRAINMARK_USER_JDBC_URL=jdbc:postgresql://localhost:5432/trainmark_ai \
TRAINMARK_USER_JDBC_USERNAME=trainmark \
TRAINMARK_USER_JDBC_PASSWORD=trainmark_dev \
pnpm dev:backend:user
```

Docker 初始化会执行 `backend/db/migration/` 下的核心表、角色权限和 demo 用户组织种子 SQL。

课程服务同样默认使用内存数据。需要让课程、教学班、任务和任务班级关联写入 PostgreSQL 时，设置：

```bash
TRAINMARK_COURSE_STORE=jdbc \
TRAINMARK_COURSE_JDBC_URL=jdbc:postgresql://localhost:5432/trainmark_ai \
TRAINMARK_COURSE_JDBC_USERNAME=trainmark \
TRAINMARK_COURSE_JDBC_PASSWORD=trainmark_dev \
pnpm dev:backend:course
```

文件服务默认使用内存上传会话和提交记录。需要让上传初始化、上传完成和提交列表写入 PostgreSQL 时，设置：

```bash
TRAINMARK_FILE_STORE=jdbc \
TRAINMARK_FILE_JDBC_URL=jdbc:postgresql://localhost:5432/trainmark_ai \
TRAINMARK_FILE_JDBC_USERNAME=trainmark \
TRAINMARK_FILE_JDBC_PASSWORD=trainmark_dev \
pnpm dev:backend:file
```

OCR 服务默认使用内存任务结果。需要让 OCR 任务和结构化块写入 PostgreSQL 时，设置：

```bash
TRAINMARK_OCR_STORE=jdbc \
TRAINMARK_OCR_JDBC_URL=jdbc:postgresql://localhost:5432/trainmark_ai \
TRAINMARK_OCR_JDBC_USERNAME=trainmark \
TRAINMARK_OCR_JDBC_PASSWORD=trainmark_dev \
pnpm dev:backend:ocr
```

通知服务默认使用内存数据。需要从 PostgreSQL 计算提交收集状态、未交名单，并将催交消息写入通知事件表时，设置：

```bash
TRAINMARK_NOTIFICATION_STORE=jdbc \
TRAINMARK_NOTIFICATION_JDBC_URL=jdbc:postgresql://localhost:5432/trainmark_ai \
TRAINMARK_NOTIFICATION_JDBC_USERNAME=trainmark \
TRAINMARK_NOTIFICATION_JDBC_PASSWORD=trainmark_dev \
pnpm dev:backend:notification
```

查重服务默认使用内存数据。需要让查重任务和相似片段写入 PostgreSQL 时，设置：

```bash
TRAINMARK_SIMILARITY_STORE=jdbc \
TRAINMARK_SIMILARITY_JDBC_URL=jdbc:postgresql://localhost:5432/trainmark_ai \
TRAINMARK_SIMILARITY_JDBC_USERNAME=trainmark \
TRAINMARK_SIMILARITY_JDBC_PASSWORD=trainmark_dev \
pnpm dev:backend:similarity
```

统计分析服务默认使用内存数据。需要从 PostgreSQL 最新快照读取成绩统计、失分点和课程目标达成度时，设置：

```bash
TRAINMARK_ANALYTICS_STORE=jdbc \
TRAINMARK_ANALYTICS_JDBC_URL=jdbc:postgresql://localhost:5432/trainmark_ai \
TRAINMARK_ANALYTICS_JDBC_USERNAME=trainmark \
TRAINMARK_ANALYTICS_JDBC_PASSWORD=trainmark_dev \
pnpm dev:backend:analytics
```

管理端服务默认使用内存数据。需要从 PostgreSQL 读取审计日志和系统配置时，设置：

```bash
TRAINMARK_ADMIN_STORE=jdbc \
TRAINMARK_ADMIN_JDBC_URL=jdbc:postgresql://localhost:5432/trainmark_ai \
TRAINMARK_ADMIN_JDBC_USERNAME=trainmark \
TRAINMARK_ADMIN_JDBC_PASSWORD=trainmark_dev \
pnpm dev:backend:admin
```

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

### 7. 一键启动 MVP 联调

```bash
pnpm dev:mvp
```

该脚本会先启动所有后端服务，等待 `pnpm smoke:api` 通过后，再以 `VITE_API_MODE=http` 启动前端。后端总控日志写入 `.logs/dev-mvp-backend.log`，各服务日志仍写入 `.logs/backend/`。

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

后端服务启动后可运行 API 冒烟检查：

```bash
pnpm smoke:api
```

如果服务仍在启动，可以让冒烟检查等待重试：

```bash
SMOKE_RETRIES=30 SMOKE_RETRY_DELAY_SECONDS=2 pnpm smoke:api
```

需要覆盖提交、批改、导出、催交和查重写接口时：

```bash
SMOKE_INCLUDE_WRITES=1 SMOKE_RETRIES=30 SMOKE_RETRY_DELAY_SECONDS=2 pnpm smoke:api
```

仅查看将要检查的端点：

```bash
SMOKE_DRY_RUN=1 pnpm smoke:api
```

`pnpm verify:mvp` 会执行 smoke dry-run，确保核心 gateway 端点清单能随 MVP 验证一起被检查。

生成本地发布包：

```bash
pnpm deploy:local
```

发布包默认输出到 `deployments/<时间戳>/`，包含前端静态产物、后端服务 JAR、infra 配置和关键文档。

## 本地备份

备份脚本会读取 `.env`，默认输出到 `backups/<时间戳>/`，其中 PostgreSQL 使用 custom dump 格式，MinIO / S3 兼容对象存储会优先使用 `mc mirror`，没有 `mc` 时尝试 `aws s3 sync`。

```bash
pnpm backup
```

恢复脚本需要显式确认，避免误覆盖本地数据：

```bash
BACKUP_DIR=backups/20260514-120000 CONFIRM_RESTORE=trainmark-ai-restore pnpm restore
```

常用环境变量：

| 变量 | 说明 |
|---|---|
| `ENV_FILE` | 指定环境变量文件，默认 `.env` |
| `BACKUP_ROOT` | 指定备份根目录，默认 `backups` |
| `REQUIRE_OBJECT_BACKUP=1` | 缺少 `mc` / `aws` 时让对象存储备份失败退出 |
| `REQUIRE_OBJECT_RESTORE=1` | 缺少对象备份或对象存储 CLI 时让恢复失败退出 |

## 环境说明

当前仓库允许在没有 Docker 的机器上继续编码。后端 Maven 工程和 Docker Compose 配置会持续维护；如果本机没有 Docker 或暂不需要联调基础设施，可先不执行基础设施启动。

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
