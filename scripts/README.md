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
