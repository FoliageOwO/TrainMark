# TrainMark AI Infra

本目录提供本地开发依赖组件：PostgreSQL、Redis、RabbitMQ、MinIO 和 Nginx。

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
