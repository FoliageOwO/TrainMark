# TrainMark AI（智训批）

TrainMark AI，中文名“智训批”，是面向高校实训教学场景的实训报告智能批改与管理系统。项目采用 Monorepo 组织，前端、后端、AI 服务、基础设施配置和文档均放在本仓库中。

完整产品计划见 [`PROJECT.md`](./PROJECT.md)。

## 当前进度

已完成阶段 1 的基础骨架：

| 模块 | 状态 |
|---|---|
| Monorepo 目录 | 已创建 |
| 前端 React/Vite 工程 | 已创建 |
| 老师端/学生端首屏 UI 骨架 | 已创建 |
| 后端 Spring Boot 聚合工程 | 已创建 |
| 微服务启动类 | 已创建 |
| Gateway 基础路由 | 已创建 |
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
npm install
```

### 2. 启动前端

```bash
npm run dev:web
```

访问：`http://localhost:5173`

### 3. 启动本地基础设施

```bash
npm run dev:infra
```

常用地址：

| 服务 | 地址 |
|---|---|
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |
| RabbitMQ Management | `http://localhost:15672` |
| MinIO Console | `http://localhost:9001` |
| Nginx | `http://localhost:8088` |

### 4. 构建后端

```bash
npm run build:backend
```

### 5. 启动后端示例服务

```bash
mvn -f backend/pom.xml -pl auth-service spring-boot:run
mvn -f backend/pom.xml -pl course-service spring-boot:run
mvn -f backend/pom.xml -pl gateway-service spring-boot:run
```

示例接口：

| 接口 | 说明 |
|---|---|
| `GET http://localhost:8081/api/auth/me` | 当前用户模拟接口 |
| `GET http://localhost:8083/api/courses` | 课程列表模拟接口 |

## 开发原则

| 原则 | 说明 |
|---|---|
| 先闭环后增强 | 优先完成老师端和学生端主流程 |
| AI 可解释 | 所有 AI 评分都必须有得分点、扣分原因和置信度 |
| 教师可复核 | 成绩发布前必须允许教师复核和修正 |
| 全程留痕 | 上传、批改、改分、发布、导出均记录审计日志 |
| 面向生产 | 从一开始考虑权限、安全、异步任务、备份和监控 |

## 下一步

1. 接入数据库迁移工具并建立用户、课程、班级基础表。
2. 实现登录、角色和菜单权限。
3. 实现课程与班级管理页面。
4. 实现学生名单 Excel 导入。
5. 实现创建实训任务和学生提交入口。
