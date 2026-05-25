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

### 4. 启动完整本地栈 + AI Provider

完整 AI 链路需要额外开一个 PowerShell 窗口启动 Python bridge。这个 bridge 会暴露
PaddleOCR 和语义评分 HTTP provider，后端仍然使用现有 provider JSON 契约。

第一次使用先准备项目内独立 Python 环境，不要使用其他项目的嵌入式 Python：

```powershell
uv python install 3.12
uv venv --python 3.12 .venv-ai
uv pip install --python .\.venv-ai\Scripts\python.exe -r ai\requirements.txt
```

启动时开两个 PowerShell 窗口：

```powershell
# 窗口 1：启动 AI bridge，默认强制真实 OCR，不强制真实语义评分
pnpm start:ai

# 窗口 2：启动完整本地栈，并把 OCR/评分 provider 指向 AI bridge
pnpm start:stack:ai
```

看到 `AI Provider bridge started: http://localhost:5000` 就表示 bridge 已启动。
浏览器访问根路径出现 404 是正常的，健康检查地址是 `http://localhost:5000/health`。

`pnpm start:ai` 默认设置 `TRAINMARK_REQUIRE_REAL_OCR=1`，所以 PaddleOCR 不可用或找不到文件时会直接报错，不会悄悄走离线兜底。
如果还要强制真实语义评分，可以在启动 AI bridge 前设置：

```powershell
$env:TRAINMARK_REQUIRE_REAL_SCORING="1"
$env:SCORING_MODEL="BAAI/bge-small-zh-v1.5"
pnpm start:ai
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm start:web` | 前端 mock 模式 |
| `pnpm start:backend` | 启动全部后端服务 |
| `pnpm start:stack` | 启动完整本地开发环境 |
| `pnpm start:ai` | 启动项目内置 AI bridge，默认强制真实 OCR |
| `pnpm start:stack:ai` | 启动完整本地开发环境，并把 OCR/评分接到 AI bridge |
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

## 前端主要使用流程

### 教师端

1. 进入 `课程与班级`，先选择课程。
2. 可以新建班级、删除班级、导入学生名单。导入时已有学生会复用账号并加入当前班级，不会因为学号已存在而阻止加入新班级。
3. 进入 `实训任务`，选择课程班级后创建任务；发布后学生端才能看到并提交。
4. `报告收集` 支持切换班级查看已交报告、未交名单和一键催交。
5. `AI 批改中心` 支持按班级启动 OCR、评分和批改。
6. `人工复核` 支持按实训任务和班级切换复核报告，并处理学生申诉。
7. `AI 批改中心` 下的查重检测也会按当前班级过滤提交与查重结果。

删除班级只会删除教学班级及其课程/任务关联，不会删除学生账号。

### 学生端

1. 进入 `我的课程` 切换课程。
2. 进入 `提交报告`，选择对应课程任务上传报告。
3. 同一任务重复提交会覆盖上一份提交，教师端会以最新提交为准。
4. 成绩发布后，学生端可以查看批改报告并提交申诉。

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

现在建议你优先只记住这几条：

```bash
pnpm start:web
pnpm start:backend
pnpm start:stack
pnpm start:ai
pnpm start:stack:ai
```

其余命令都属于专项操作。

## 真实 AI Provider

默认本地开发可以不接真实 AI。需要验证 PaddleOCR / 语义评分 HTTP provider 时，
按上面的“完整本地栈 + AI Provider”启动。更详细的 provider 契约见：

- `ai/ocr/README.md`
- `ai/scoring/README.md`

AI bridge 不需要外部 API key；它使用本地 PaddleOCR / SentenceTransformer/BGE 模型。
如果设置 `TRAINMARK_AI_API_KEY`，后端也要配置对应的 `OCR_API_KEY` 和
`SCORING_API_KEY`。

当前内置 bridge 的处理规则：

- 图片文件（`.png`、`.jpg`、`.jpeg`）走真实 PaddleOCR。
- 文本型 Word/PDF 文件优先走真实文本提取，避免把 Word 文件硬交给 OCR。
- 上传后的对象 key 会自动从 `UPLOAD_OBJECT_ROOT` 解析，默认是 `.data/uploads`。
- `TRAINMARK_REQUIRE_REAL_OCR=1` 时不允许离线兜底，适合验收真实 OCR 是否可用。

## 兼容说明

- 旧的 `pnpm dev:*`、`pnpm verify:mvp`、`pnpm smoke:mvp:*` 仍然保留，避免打断已有习惯
- 新文档统一以 `start:*`、`verify:*`、`ops:*` 为主
