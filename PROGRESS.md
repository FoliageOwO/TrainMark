# TrainMark AI（智训批）开发进度

## 已完成

### 1. 项目规划

- 已根据原始项目说明书整理完整产品方案。
- 已写入 `PROJECT.md`。
- 项目名称确定为 `TrainMark AI（智训批）`。

### 2. 工程结构

- 已创建 Monorepo 结构。
- 前端、后端、AI、基础设施、脚本和文档均放在同一仓库。
- 已切换为 `pnpm workspace`。

主要文件：

- `pnpm-workspace.yaml`
- `package.json`
- `apps/web/`
- `backend/`
- `ai/`
- `infra/`
- `scripts/`

### 3. 前端基础

- 已创建 React + TypeScript + Vite 前端工程。
- 已完成基础 UI 风格。
- 已实现老师端、学生端、管理端角色切换。
- 已实现老师端工作台基础页面。
- 已实现学生端任务与上传报告页面。

主要代码：

- `apps/web/src/pages/App.tsx`
- `apps/web/src/styles/global.css`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`

### 4. 后端基础

- 已创建 Spring Boot / Spring Cloud 多服务骨架。
- 已创建共享模块 `shared`。
- 已补充基础 DTO、枚举和统一响应结构。
- 当前后端以接口骨架和内存模拟服务为主，方便无 Maven / Docker 环境继续开发。

已创建服务：

- `gateway-service`
- `auth-service`
- `user-service`
- `course-service`
- `file-service`
- `grading-service`
- `ocr-service`
- `similarity-service`
- `analytics-service`
- `notification-service`
- `admin-service`

### 5. 认证与课程

- 已实现模拟登录接口。
- 已实现当前用户接口。
- 已实现课程列表、创建课程接口。
- 已实现教学班列表、创建教学班接口。
- 已实现实训任务列表、创建任务接口。

主要代码：

- `backend/auth-service/src/main/java/com/trainmark/auth/`
- `backend/course-service/src/main/java/com/trainmark/course/`

### 6. 用户与组织

- 已实现组织列表、创建组织接口。
- 已实现用户列表、创建用户接口。
- 已实现学生名单导入接口骨架。
- 前端已加入学生名单导入和组织学生展示面板。

主要代码：

- `backend/user-service/src/main/java/com/trainmark/user/`
- `backend/shared/src/main/java/com/trainmark/shared/dto/`

### 7. 学生提交

- 已实现上传初始化接口骨架。
- 已实现上传完成接口骨架。
- 已实现提交列表接口骨架。
- 前端学生端已加入上传报告 UI，包括文件名、识别信息、进度和提交回执。

主要代码：

- `backend/file-service/src/main/java/com/trainmark/file/`
- `apps/web/src/pages/App.tsx`

### 8. 报告收集与催交

- 已实现报告收集概览 DTO。
- 已实现未交学生 DTO。
- 已实现一键催交接口骨架。
- 前端老师端已加入报告收集看板、未交名单和一键催交反馈。

主要代码：

- `backend/notification-service/src/main/java/com/trainmark/notification/`
- `backend/shared/src/main/java/com/trainmark/shared/dto/ReminderRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/ReminderResult.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/SubmissionCollectionOverview.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/UnsubmittedStudent.java`

### 9. 数据库与基础设施

- 已添加 PostgreSQL 核心表迁移脚本。
- 已添加角色权限种子脚本。
- 已添加本地 Docker Compose 配置。
- 当前机器没有 Docker，因此配置已写好但未本地验证。

主要文件：

- `backend/db/migration/V1__init_core_schema.sql`
- `backend/db/migration/V2__seed_roles_permissions.sql`
- `infra/docker-compose.yml`

### 10. 评分标准与 AI 批改基础

- 已实现评分标准 DTO。
- 已实现评分项、得分点、关键词、同义词、课程目标字段。
- 已实现评分标准列表和创建接口骨架。
- 已实现 AI 批改任务列表和创建接口骨架。
- 已在老师端加入评分标准摘要和批改队列面板。
- 当前批改任务为内存模拟数据，后续需要接入 OCR、规则评分和语义评分。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/`
- `backend/shared/src/main/java/com/trainmark/shared/GradingJobStatus.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/CreateRubricRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/RubricSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/CreateGradingJobRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradingJobSummary.java`
- `apps/web/src/pages/App.tsx`

### 11. OCR 与文档结构化基础

- 已实现 OCR 任务状态枚举。
- 已实现 OCR 任务创建 DTO。
- 已实现 OCR 任务摘要、结构块、识别结果 DTO。
- 已实现 OCR 任务列表、创建任务、查看结果接口骨架。
- 已在老师端加入 OCR 处理状态和结构识别结果面板。
- 当前 OCR 为内存模拟数据，后续需要接入 PaddleOCR 和真实文件转换流程。

主要代码：

- `backend/ocr-service/src/main/java/com/trainmark/ocr/`
- `backend/shared/src/main/java/com/trainmark/shared/OcrJobStatus.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/CreateOcrJobRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/OcrJobSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/OcrResultSummary.java`
- `apps/web/src/pages/App.tsx`

### 12. 人工复核

- 已实现批改结果 DTO，包含学生、提交文件、AI 初评、教师复核分、总评、批注 PDF 地址、分项评分和证据。
- 已实现单项分数、扣分原因、教师评语、批注摘要 DTO。
- 已实现人工复核状态枚举。
- 已实现批改结果列表、详情、单项改分、复核通过接口骨架。
- 已在老师端加入人工复核工作区，包括模拟 PDF 预览、批注列表、AI/教师得分对照、分项改分表单、扣分原因、证据标签、教师评语和复核通过操作。
- 当前复核结果仍为内存模拟数据，后续需要接入真实提交、批注 PDF 文件、审计日志和成绩发布流程。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradingReviewController.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/shared/src/main/java/com/trainmark/shared/ReviewStatus.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradingResultSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradingItemReview.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradingAnnotationSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/UpdateReviewItemRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/ReviewDecisionRequest.java`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/styles/global.css`

## 已验证

前端构建已通过：

```bash
pnpm build:web
```

人工复核相关后端模块已通过编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

Docker Compose 暂未本地验证，因为当前机器没有 Docker。

## 已提交记录

主要提交：

- `feat: init project plan`
- `feat: complete the project structure`
- `refactor(frontend): change to pnpm`
- `feat: add backend foundation`
- `feat(frontend): add role workspace`
- `feat: add user directory`
- `feat: add submissions`
- `feat: add reminders`
- `feat: add grading`
- `feat: add ocr`
- `feat: add manual review`

## 接下来需要做

### 1. 成绩发布与学生查看结果

- 实现成绩发布接口。
- 实现成绩撤回和修改审计。
- 学生端加入成绩、批注、申诉入口。

### 2. 统计分析

- 实现成绩统计接口。
- 实现失分分析接口。
- 实现课程目标达成度接口。
- 前端加入图表展示。

### 3. 真实 AI / OCR 接入

- 接入 PaddleOCR。
- 增加 PDF / Word / 图片转换流程。
- 实现 OCR 结果入库和结构化文本存储。
- 实现规则评分、关键词匹配和语义相似度评分。
- 实现批注 PDF 生成。

### 4. 持久化与真实联调

- 接入 PostgreSQL / Flyway。
- 将当前内存服务替换为数据库实现。
- 安装 Docker 后验证 `infra/docker-compose.yml`。

### 5. 工程质量

- 拆分前端页面组件。
- 增加 ESLint 配置。
- 增加基础测试。
- 补接口文档。
- 补 `.env.example`。
