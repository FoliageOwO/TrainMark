# TrainMark AI Infra

本目录提供本地开发依赖组件：PostgreSQL、Redis、RabbitMQ、MinIO 和 Nginx。

PostgreSQL 首次初始化会执行 `backend/db/migration/` 下的核心 schema、角色权限、demo 用户组织、demo 课程班级、任务种子数据、上传会话表、通知事件表、系统配置表、评分标准扩展和评阅域表。默认 demo 账号包括 `teacher`、`2024010101` 和 `admin`，用于本地 API 冒烟和前端 HTTP 模式联调。

启动：

```bash
docker compose -f infra/docker-compose.yml up -d
```

常用地址：

| 服务 | 地址 |
|---|---|
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |
| RabbitMQ Management | `http://localhost:15672` |
| MinIO Console | `http://localhost:9001` |
| Nginx | `http://localhost:8088` |

开发账号密码仅用于本地环境，生产环境必须通过密钥管理或环境变量覆盖。
