# Scripts Guide

`scripts/` 现在只负责一件事：把工程入口按职责分清楚。

## 目录

### `scripts/dev/`

开发期启动脚本。

| 文件 | 作用 |
| --- | --- |
| `backend-all.sh` | 打包并启动全部后端服务 |
| `backend-service.sh` | 单独启动一个后端服务 |
| `fullstack.sh` | 启动后端并等待 API 就绪，再启前端 HTTP 模式 |
| `fullstack-jdbc.sh` | 在 `fullstack.sh` 之前再拉起基础设施并补数据库迁移 |
| `infra-restart.sh` | 重启本地基础设施 |
| `infra-reset.sh` | 清空卷后重建本地基础设施 |
| `frontend-mock-with-infra.sh` | 启动基础设施后再跑前端 mock，偏临时调试用途 |

### `scripts/verify/`

联调验证与 smoke。

| 文件 | 作用 |
| --- | --- |
| `check-stack.sh` | 校验当前全栈主链路 |
| `check-ai.sh` | 校验 AI provider 与 bridge |
| `check-httpapi-strict-writes.mjs` | 校验 HTTP 模式关键写接口不会回退到 mock |
| `check-httpapi-no-degradable-calls.mjs` | 校验 `httpApi.ts` 不包含 `getOr/mutateOr` 可降级调用 |
| `check-httpapi-no-relaxed-read.mjs` | 校验 `httpApi.ts` 不存在宽松 `mustGet` 读取回退，仅允许 `mustGetStrict` |
| `check-role-section-guards.mjs` | 校验角色与 section 的 URL 访问守卫关键逻辑存在 |
| `check-student-workflow-guides.mjs` | 校验学生核心页面存在“当前阻塞 + 下一步动作”引导逻辑 |
| `check-student-results-no-mock-copy.mjs` | 校验学生成绩页不包含硬编码 mock 批注文案/语义 |
| `check-teacher-workflow-guides.mjs` | 校验教师核心流程页面存在“当前阻塞 + 下一步动作”引导逻辑，以及“前往下一步”可点击动作 |
| `check-workspace-error-no-clear.mjs` | 校验 HTTP 加载失败时不清空工作区快照，且有快照时使用轻量错误条 |
| `check-workspace-http-branch.mjs` | 校验 `App.tsx` 在 HTTP 分支不直接使用 `mockApi` 作为数据源 |
| `check-workspace-strict-reads.mjs` | 校验 `loadWorkspaceData` 使用严格读取链路（`mustGetStrict`） |
| `http-auth-ui-guards.sh` | 校验前端登录页守卫/会话清理/会话恢复关键代码，并执行严格鉴权 smoke |
| `init-http-manual-acceptance.sh` | 生成当日人工验收记录文件（`docs/HTTP_MANUAL_ACCEPTANCE_YYYY-MM-DD.md`），自动填入“验收日期”，并支持 `HTTP_ACCEPTANCE_ENV`/`HTTP_ACCEPTANCE_REVIEWER` 自动写入验收环境与验收人 |
| `http-teacher-acceptance-auto.sh` | 自动执行 HTTP 教师验收基线（严格写链路 + 严格鉴权 + 流程引导守卫 + 前端构建） |
| `http-teacher-acceptance-sync-report.sh` | 执行自动验收并同步更新 HTTP 教师验收报告（支持仅同步模式） |
| `smoke-api.sh` | 核心 API / health 冒烟 |
| `smoke-auth-strict.sh` | 严格认证链路冒烟 |

### `scripts/ops/`

运维、发布、备份、部署。

| 文件 | 作用 |
| --- | --- |
| `db-migrate-local.sh` | 本地数据库迁移补齐 |
| `backup-local.sh` | 备份本地 PostgreSQL / MinIO |
| `restore-local.sh` | 从本地备份恢复 |
| `build-all.sh` | 构建前后端 |
| `package-local-release.sh` | 生成本地发布目录 |
| `build-images-and-export.sh` | 构建并导出生产镜像 |
| `deploy-server-runtime.sh` | 在服务器上构建并启动生产容器 |
| `start-server-runtime.sh` | 在服务器上加载镜像并启动生产容器 |
| `deploy-remote-all-in-one.sh` | 本地构建、传输并远程启动服务器 |

### `scripts/lib/`

通用工具。

| 文件 | 作用 |
| --- | --- |
| `run-bash-script.mjs` | 在 Node/Pnpm 下稳定调用 bash 脚本，兼容 Git Bash / WSL / Windows |

## 使用原则

- 日常开发先看根 `README.md`
- 只有在主命令不够用时，才直接进入 `scripts/`
- `dev/` 是开发入口，`verify/` 是校验入口，`ops/` 是发布运维入口

## 常用示例

- 初始化当日人工验收记录（自动写入日期、环境、验收人）：
  `HTTP_ACCEPTANCE_ENV='本地HTTP联调' HTTP_ACCEPTANCE_REVIEWER='你的名字' pnpm verify:http:manual:init`
- 强制重建当日人工验收记录（覆盖已有同名文件）：
  `pnpm verify:http:manual:init -- --force`
- HTTP 全栈联调（默认关闭 Rabbit health 阻塞，避免本地消息队列账号导致 smoke 失败）：
  `pnpm start:stack:http`
- 需要强校验批注导出资源时可显式开启：
  `SMOKE_CHECK_ANNOTATION_EXPORT=1 SMOKE_CHECK_ANNOTATED_EXPORT_BUNDLE=1 pnpm smoke:api`
- 指定 smoke 学生账号（当本地种子账号不是默认值时）：
  `SMOKE_STUDENT_USERNAME=2024010101 SMOKE_STUDENT_PASSWORD=trainmark pnpm smoke:api`

- 初始化当日人工截图证据索引：
  `pnpm verify:http:evidence:init`

- 将已勾选截图索引同步到当日人工验收记录：
  `pnpm verify:http:evidence:sync`

- 一键收尾（证据回填 + 总报告同步）：
  `pnpm verify:http:closeout`

- 校验剩余人工截图证据是否齐全：
  `pnpm verify:http:evidence:check`
