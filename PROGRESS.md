# TrainMark AI（智训批）开发进度

## 已完成

### 近期收敛（HTTP 真实数据 + 学生端流程）

- 前端 HTTP 数据读取继续收敛：`apps/web/src/api/httpApi.ts` 工作区关键读取统一使用 `mustGetStrict(...)`，并删除未使用的宽松 `mustGet(...)`，减少回退空间。
- OCR 队列与识别结果读取切换为严格模式，后端失败将显式暴露，而不是伪装成空结果。
- 学生端成绩批注预览移除硬编码示例内容，`annotationPdfUrl` 缺失时显示明确空态说明，避免“假数据像真数据”。
- 学生端工作流引导守卫新增并接入：
  - `scripts/verify/check-student-workflow-guides.mjs`
  - `package.json` 增加 `verify:student-workflow-guides`
  - `scripts/verify/http-teacher-acceptance-auto.sh` 与 `scripts/verify/check-stack.sh` 均纳入该校验

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

### 10.1 评分标准 PostgreSQL 存储

- 已为评分标准抽象 `RubricStore`，默认保留内存实现，继续支持无数据库演示。
- 已新增 JDBC 实现，可将评分标准、评分项和得分点写入 `rubrics`、`rubric_items`、`rubric_points`。
- 已新增得分点标题字段迁移，补齐 `RubricPointSummary.title` 的数据库承载。
- 已保持批改任务、复核、发布、申诉和导出流程继续使用现有内存实现，降低本次改动范围。
- 已补充 PostgreSQL 切换环境变量和 README 启动说明。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/RubricStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/InMemoryRubricStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/JdbcRubricStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/db/migration/V11__rubric_point_titles.sql`
- `backend/grading-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 10.2 成绩导出 PostgreSQL 存储

- 已为成绩导出记录抽象 `GradeExportStore`，默认保留内存实现。
- 已新增 JDBC 实现，可将导出文件名、格式、行数、下载地址、状态和操作者写入 `grade_exports`。
- 已保持导出行数按当前已发布成绩计算，确保 HTTP/mock 和默认内存演示行为一致。
- 已复用 grading-service 的 PostgreSQL 连接配置，并补充独立 `TRAINMARK_GRADING_EXPORT_STORE` 切换项。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradeExportStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/InMemoryGradeExportStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/JdbcGradeExportStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/grading-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 10.3 成绩发布审计 PostgreSQL 存储

- 已为成绩发布/撤回审计记录抽象 `GradePublicationAuditStore`，默认保留内存实现。
- 已新增 JDBC 实现，可将发布、撤回动作、操作者、原因和时间写入 `grade_publication_audits`。
- 已让发布审计列表接口通过 store 读取，发布和撤回操作通过 store 追加审计记录。
- 已复用 grading-service 的 PostgreSQL 连接配置，并补充独立 `TRAINMARK_GRADING_PUBLICATION_AUDIT_STORE` 切换项。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradePublicationAuditStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/InMemoryGradePublicationAuditStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/JdbcGradePublicationAuditStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/grading-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 10.4 成绩申诉 PostgreSQL 存储

- 已为成绩申诉抽象 `AppealStore`，默认保留内存实现和演示种子数据。
- 已新增 JDBC 实现，可将申诉原因、调整诉求、状态、教师回复和处理时间写入 `grade_appeals`。
- 已支持按批改结果、学生和申诉状态筛选数据库申诉列表，并关联 `users` 读取学生姓名。
- 已让申诉创建和处理流程通过 store 持久化，并保留仅已发布成绩可申诉、处理状态不可回到 `SUBMITTED` 的业务校验。
- 已复用 grading-service 的 PostgreSQL 连接配置，并补充独立 `TRAINMARK_GRADING_APPEAL_STORE` 切换项。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/AppealStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/InMemoryAppealStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/JdbcAppealStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/grading-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 10.5 批改任务 PostgreSQL 存储

- 已为批改任务抽象 `GradingJobStore`，默认保留内存实现和演示种子任务。
- 已新增 JDBC 实现，可将批改任务写入 `grading_jobs`，并按作业读取任务列表。
- 已保持创建任务时同步生成当前内存批改结果，避免本模块扩大到批改结果持久化。
- 已复用 grading-service 的 PostgreSQL 连接配置，并补充独立 `TRAINMARK_GRADING_JOB_STORE` 切换项。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradingJobStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/InMemoryGradingJobStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/JdbcGradingJobStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/grading-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 10.6 批改结果 PostgreSQL 存储

- 已为批改结果抽象 `GradingResultStore`，默认保留内存实现和演示种子结果。
- 已新增 JDBC 实现，可读写 `grading_results`、`grading_result_items` 和 `grading_annotations`。
- 已支持按作业和复核状态筛选批改结果，并重建评分分项、证据和批注列表。
- 已让分项复核、批准、发布/撤回、成绩导出行数和批改任务自动生成结果统一通过结果 store。
- 已复用 grading-service 的 PostgreSQL 连接配置，并补充独立 `TRAINMARK_GRADING_RESULT_STORE` 切换项。
- 已修复 PostgreSQL 初始化脚本遗漏 `V3__extend_assessment_schema.sql` 和 `V4__add_grade_exports.sql` 的问题，确保新库包含批改、导出、申诉、查重和统计相关表。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradingResultStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/InMemoryGradingResultStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/JdbcGradingResultStore.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingResultStoreSupport.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/grading-service/src/main/resources/application.yml`
- `infra/postgres/init.sql`
- `.env.example`
- `README.md`
- `PROGRESS.md`

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

### 11.1 OCR 任务 PostgreSQL 存储

- 已为 OCR 服务抽象 `OcrStore`，默认保留内存实现，继续支持无数据库演示。
- 已新增 JDBC 实现，可将 OCR 任务写入 `ocr_jobs`，并将结构化识别块写入 `ocr_blocks`。
- 已复用现有 OCR provider 契约，JDBC 模式下创建任务后同步执行本地/命令 provider 并落库。
- 已支持从数据库读取 OCR 任务列表和按任务重建结构化识别结果。
- 已补充 PostgreSQL 切换环境变量和 README 启动说明。

主要代码：

- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrStore.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/InMemoryOcrStore.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/JdbcOcrStore.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrService.java`
- `backend/ocr-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

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

### 13. 成绩发布与学生查看结果

- 已实现成绩发布状态枚举。
- 已实现成绩发布摘要、发布请求、撤回请求、发布审计记录 DTO。
- 已实现成绩发布列表、发布成绩、撤回发布、查看发布审计接口骨架。
- 已在老师端人工复核工作区加入发布状态、发布成绩、撤回发布和发布审计记录。
- 已在学生端加入已发布成绩与批注面板，展示最终成绩、总评、分项得分、扣分原因、查看批注 PDF 和提交申诉入口。
- 当前发布和撤回仍为内存模拟数据，后续需要接入真实提交状态、成绩可见性权限、申诉处理和审计日志持久化。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradingReviewController.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/shared/src/main/java/com/trainmark/shared/PublicationStatus.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradePublicationSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradePublicationAuditEntry.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/PublishGradeRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/WithdrawGradeRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradingResultSummary.java`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/styles/global.css`

### 14. 统计分析

- 已实现成绩统计 DTO，包含提交数、发布数、均分、标准差、最高分、最低分、难度系数、区分度和分数段分布。
- 已实现高频失分点 DTO，包含评分项、课程目标、平均失分、影响人数和主要原因。
- 已实现课程目标达成度 DTO，包含目标值、达成值和达成状态。
- 已实现成绩统计、失分分析、课程目标达成度接口骨架。
- 已在老师端加入统计分析面板，展示成绩指标、分数段条形图、高频失分点和课程目标达成度。
- 当前统计数据仍为内存模拟数据，后续需要接入真实成绩、评分项和课程目标关联计算。

主要代码：

- `backend/analytics-service/src/main/java/com/trainmark/analytics/AnalyticsController.java`
- `backend/analytics-service/src/main/java/com/trainmark/analytics/AnalyticsService.java`
- `backend/analytics-service/pom.xml`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradeStatisticsSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/ScoreBucketSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/LossPointSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/CourseOutcomeAchievementSummary.java`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/styles/global.css`

### 14.1 统计分析 PostgreSQL 存储

- 已为统计分析服务抽象 `AnalyticsStore`，默认保留内存实现，继续支持无数据库演示。
- 已新增 JDBC 实现，可从 `grade_statistics_snapshots` 读取最新成绩统计快照。
- 已新增 JDBC 失分点和课程目标达成度读取，分别对接 `loss_point_snapshots` 和 `course_outcome_snapshots`。
- 已补充 PostgreSQL 切换环境变量和 README 启动说明。

主要代码：

- `backend/analytics-service/src/main/java/com/trainmark/analytics/AnalyticsStore.java`
- `backend/analytics-service/src/main/java/com/trainmark/analytics/InMemoryAnalyticsStore.java`
- `backend/analytics-service/src/main/java/com/trainmark/analytics/JdbcAnalyticsStore.java`
- `backend/analytics-service/src/main/java/com/trainmark/analytics/AnalyticsService.java`
- `backend/analytics-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 15. 学生申诉

- 已实现申诉状态枚举。
- 已实现申诉摘要、申诉提交请求、申诉处理请求 DTO。
- 已实现申诉列表、学生提交申诉、教师处理申诉接口骨架。
- 已在学生端成绩与批注面板加入提交申诉操作和“我的申诉”状态反馈。
- 已在老师端加入学生申诉处理面板，支持采纳、驳回和教师处理回复。
- 当前申诉数据仍为内存模拟数据，后续需要接入真实成绩变更、二次发布、审计日志和消息通知。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradingReviewController.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/shared/src/main/java/com/trainmark/shared/AppealStatus.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/AppealSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/CreateAppealRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/ResolveAppealRequest.java`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/styles/global.css`

### 16. MVP 运行说明与环境样例

- 已补充 `.env.example`，覆盖前端 API 地址、PostgreSQL、Redis、RabbitMQ、MinIO 和 AI/OCR provider 占位配置。
- 已更新 `README.md` 当前进度，反映课程/任务、提交、催交、评分、OCR、复核、发布、申诉、统计等 MVP 功能。
- 已补充本地启动、后端接口示例和验证命令说明。

主要文件：

- `.env.example`
- `README.md`
- `PROGRESS.md`

### 17. 查重检测与网关路由

- 已实现查重任务状态枚举。
- 已实现查重任务创建请求、任务摘要和相似片段匹配 DTO。
- 已实现查重任务列表、创建任务、查看任务详情接口骨架。
- 已在老师端加入查重检测面板，展示检测份数、最高相似度、高风险组数和相似片段。
- 已补充 gateway 路由，覆盖用户、文件、评分、OCR、查重、通知和统计接口。
- 当前查重结果仍为内存模拟数据，后续需要接入真实文本指纹、向量相似度和跨班历史样本库。

主要代码：

- `backend/similarity-service/src/main/java/com/trainmark/similarity/SimilarityController.java`
- `backend/similarity-service/src/main/java/com/trainmark/similarity/SimilarityService.java`
- `backend/similarity-service/pom.xml`
- `backend/gateway-service/src/main/resources/application.yml`
- `backend/shared/src/main/java/com/trainmark/shared/SimilarityJobStatus.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/CreateSimilarityJobRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/SimilarityJobSummary.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/SimilarityMatchSummary.java`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/styles/global.css`

### 17.1 查重任务 PostgreSQL 存储

- 已为查重服务抽象 `SimilarityStore`，默认保留内存实现，避免无数据库环境影响 MVP 演示。
- 已新增 JDBC 实现，可将查重任务写入 `similarity_jobs`，并将相似片段写入 `similarity_matches`。
- 已支持按任务读取相似片段，并从提交与用户表补全学生姓名。
- 已补充 PostgreSQL 切换环境变量和 README 启动说明。

主要代码：

- `backend/similarity-service/src/main/java/com/trainmark/similarity/SimilarityStore.java`
- `backend/similarity-service/src/main/java/com/trainmark/similarity/InMemorySimilarityStore.java`
- `backend/similarity-service/src/main/java/com/trainmark/similarity/JdbcSimilarityStore.java`
- `backend/similarity-service/src/main/java/com/trainmark/similarity/SimilarityService.java`
- `backend/similarity-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 18. 前端 HTTP API 数据层

- 已补充前端 HTTP API 数据层，支持通过 `VITE_API_MODE=http` 从 gateway 拉取数据。
- 已覆盖课程、班级、任务、组织、学生、收集概览、未交名单、评分标准、批改任务、OCR、复核结果、统计分析、申诉和查重等主流程读取接口。
- 已实现单接口失败回退 mock 数据，避免后端部分服务未启动时阻断前端演示。
- 已在界面用户信息处显示当前数据来源。
- 已修正 gateway 通知路由为 `/api/notifications/**`。
- 已补充 Vite 环境变量类型声明。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/vite-env.d.ts`
- `backend/gateway-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 19. 评阅域持久化迁移

- 已新增评阅域 Flyway 迁移脚本，补齐提交文件、评分点、OCR 任务、OCR 结构块、批改任务、批改结果、分项复核、PDF 批注、发布审计、学生申诉、查重任务、查重片段、成绩统计快照、失分点快照和课程目标达成度快照等表。
- 已为高频查询路径补充索引，覆盖提交文件、OCR 任务、批改结果状态、学生成绩、发布审计、申诉、查重任务和统计快照。
- 该模块先建立数据库契约，后续服务实现可以逐步从内存数据切换到 PostgreSQL。

主要代码：

- `backend/db/migration/V3__extend_assessment_schema.sql`
- `PROGRESS.md`

### 20. 前端 ESLint 验证入口

- 已补充 Vite/React 前端的 ESLint flat config。
- 已启用 TypeScript recommended、React Hooks 和 React Refresh 规则。
- 已在根目录新增 `pnpm lint:web` 脚本，方便从仓库根目录执行前端静态检查。
- 已在 README 补充前端静态检查命令。

主要代码：

- `apps/web/eslint.config.js`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 21. MVP 接口文档

- 已新增 `docs/API.md`，按服务分组整理当前 MVP API。
- 已记录 gateway 地址、直连服务端口、统一响应 envelope、主要请求 DTO 和响应 DTO。
- 已覆盖认证、组织用户、课程任务、提交上传、收集催交、评分标准、OCR、人工复核、发布审计、申诉、查重和统计分析接口。
- 已在 README 增加接口文档入口。

主要代码：

- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 22. 前端页面外壳组件拆分

- 已从 `App.tsx` 拆出 `AppChrome` 组件，统一承载侧边栏、顶部角色切换和 hero 区域。
- `App.tsx` 保留业务状态、老师端工作台和学生端工作台，减少单文件职责。
- 拆分后前端 lint 和构建均已通过。

主要代码：

- `apps/web/src/components/AppChrome.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.1 学生端工作台组件拆分

- 已从 `App.tsx` 拆出 `StudentDashboard`，学生端任务、成绩批注、申诉和上传回执状态独立维护。
- 已新增共享 `formatDate` 工具，老师端和学生端复用同一日期格式化逻辑。
- `App.tsx` 继续保留顶层角色、HTTP/mock 数据装配和老师/管理端工作台，减少本次拆分范围。
- 拆分后前端 lint 和生产构建均已通过。

主要代码：

- `apps/web/src/components/StudentDashboard.tsx`
- `apps/web/src/utils/formatDate.ts`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.2 管理端工作台组件拆分

- 已从 `App.tsx` 拆出 `AdminDashboard`，组织账号、审计日志和系统配置视图独立维护。
- `AdminDashboard` 改用前端类型定义描述 props，避免继续依赖 `mockApi` 返回类型。
- `App.tsx` 继续保留角色切换、课程选择和数据装配，工作台展示职责继续下沉。

主要代码：

- `apps/web/src/components/AdminDashboard.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.3 教师端 AI 流水线组件拆分

- 已从教师端工作台中拆出 `TeacherAiPipeline`，评分标准、批改队列、OCR 任务和结构化识别结果集中维护。
- 批改/OCR 状态文案随组件下沉，减少 `App.tsx` 顶层展示常量。
- `App.tsx` 仅向该组件传入评分标准、批改任务、OCR 任务和启动批改动作。

主要代码：

- `apps/web/src/components/TeacherAiPipeline.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.4 教师端人工复核组件拆分

- 已从教师端工作台中拆出 `TeacherReviewWorkspace`，人工复核、批注预览、分项复核、发布/撤回和发布审计视图集中维护。
- 复核状态、发布状态和批注 PDF 链接解析随组件下沉，减少 `App.tsx` 展示职责。
- `App.tsx` 继续负责复核结果状态更新和 HTTP/mock 写操作兜底。

主要代码：

- `apps/web/src/components/TeacherReviewWorkspace.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.5 教师端成绩分析组件拆分

- 已从教师端工作台中拆出 `TeacherAnalyticsPanel`，成绩统计、导出记录、高频失分点和课程目标达成度集中维护。
- 成绩导出下载链接解析和日期展示随组件下沉，减少 `App.tsx` 分析报表展示逻辑。
- `App.tsx` 继续负责导出任务创建和导出记录状态合并。

主要代码：

- `apps/web/src/components/TeacherAnalyticsPanel.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.6 教师端收集催交组件拆分

- 已从教师端工作台中拆出 `TeacherCollectionPanel`，报告收集率、未交名单和一键催交结果集中维护。
- 提交率环形进度的 CSS 变量计算随组件下沉，`App.tsx` 不再暴露 `CSSProperties` 展示细节。
- `App.tsx` 继续负责调用催交接口并保存催交回执。

主要代码：

- `apps/web/src/components/TeacherCollectionPanel.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.7 教师端查重检测组件拆分

- 已从教师端工作台中拆出 `TeacherSimilarityPanel`，查重任务列表、匹配明细和启动查重按钮集中维护。
- 查重风险等级展示和相似度百分比格式化随组件下沉，减少 `App.tsx` 查重展示逻辑。
- `App.tsx` 继续负责启动查重并合并最新查重任务状态。

主要代码：

- `apps/web/src/components/TeacherSimilarityPanel.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.8 教师端申诉处理组件拆分

- 已从教师端工作台中拆出 `TeacherAppealPanel`，学生申诉列表、状态文案和采纳/驳回操作集中维护。
- 申诉状态文案随组件下沉，减少 `App.tsx` 顶层展示常量。
- `App.tsx` 继续负责调用申诉处理接口并合并处理结果。

主要代码：

- `apps/web/src/components/TeacherAppealPanel.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.9 教师端课程任务组件拆分

- 已从教师端工作台中拆出 `TeacherCoursePanel`，顶部指标、课程切换、班级列表和实训任务卡片集中维护。
- 课程/任务状态文案和任务截止时间格式化随组件下沉，减少 `App.tsx` 课程任务展示逻辑。
- `App.tsx` 继续负责当前课程选择状态和课程相关数据装配。

主要代码：

- `apps/web/src/components/TeacherCoursePanel.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.10 教师端名单组织组件拆分

- 已从教师端工作台中拆出 `TeacherRosterPanel`，学生名单导入、导入预览统计、组织链和学生列表集中维护。
- 名单导入图标和组织/学生展示逻辑随组件下沉，减少 `App.tsx` 末端管理面板展示职责。
- `App.tsx` 继续负责名单、组织和导入预览数据装配。

主要代码：

- `apps/web/src/components/TeacherRosterPanel.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.11 教师端运维能力组件拆分

- 已从教师端工作台中拆出 `TeacherOperationsPanel`，AI 批改流水线步骤和生产运维能力说明集中维护。
- 固定流水线步骤和底部能力图标随组件下沉，`App.tsx` 不再保留纯展示常量和底部静态 JSX。
- `App.tsx` 继续负责老师端数据装配、写操作和各业务面板组合。

主要代码：

- `apps/web/src/components/TeacherOperationsPanel.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 22.12 教师端工作台容器组件拆分

- 已从 `App.tsx` 拆出 `TeacherDashboard` 容器，老师端局部交互状态、写操作 handler 和各业务面板组合集中维护。
- `App.tsx` 不再直接依赖老师端子面板、写操作 API 或表单事件类型，职责收敛为角色路由、顶层数据装配和页面外壳。
- 课程选择状态仍保留在 `App.tsx`，保证 HTTP 工作区数据加载依赖关系不变。

主要代码：

- `apps/web/src/components/TeacherDashboard.tsx`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 23. 前端 HTTP 写操作联调

- 已扩展前端 HTTP API 层，支持在 `VITE_API_MODE=http` 下调用后端写接口。
- 已覆盖启动批改、分项复核保存、复核通过、成绩发布、撤回发布、发布审计刷新、学生申诉、申诉处理、一键催交、启动查重和学生提交回执。
- 写操作失败或未启用 HTTP 模式时仍回退本地 mock，保证单前端演示不受影响。
- 老师端和学生端按钮已接入统一 HTTP/mock 兜底动作，不再只修改本地 mock 状态。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 23.1 前端申诉数据源联调修正

- 已让老师端申诉面板优先使用 HTTP 工作区返回的 `workspaceData.appeals`，HTTP 模式下不再固定读取本地 `mockApi.listAppeals()`。
- 已保留学生端按当前用户过滤申诉的行为，并让学生端和老师端复用同一份申诉数据源。
- Mock 模式仍回退本地申诉列表，保持单前端演示行为不变。

主要代码：

- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 23.2 前端实训任务创建联调

- 已在教师端实训任务面板加入创建任务表单，可填写任务标题、截止时间、总分、说明，并切换 AI 批改和查重检测。
- 已扩展前端 HTTP API 层，`VITE_API_MODE=http` 时调用 `POST /api/assignments` 创建真实任务，失败或 mock 模式回退本地追加。
- 创建成功后当前课程任务列表即时插入新任务，减少老师端从查看到配置任务的断点。
- 已将 `POST /api/assignments` 加入写接口 smoke dry-run 清单，后续 MVP 验证会覆盖任务创建端点。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/components/TeacherDashboard.tsx`
- `apps/web/src/components/TeacherCoursePanel.tsx`
- `apps/web/src/styles/global.css`
- `scripts/smoke-api.sh`
- `PROGRESS.md`

### 23.3 前端学生任务数据源联调

- 已扩展前端 HTTP 工作区数据，读取当前学生的 `/api/submissions?studentId=...` 提交摘要。
- 已将学生端任务卡片从真实任务、提交记录和已发布成绩派生，HTTP 模式下不再固定展示本地 mock 任务。
- 已将后端提交状态压缩为学生端现有的“未提交 / 已提交 / 批改中 / 已发布成绩”状态，避免扩大 UI 改动范围。
- Mock 模式仍回退 `mockApi.listStudentTasks()`，保留单前端演示和本地上传回执的原有行为。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/api/types.ts`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 23.4 前端学生提交任务绑定

- 已在学生端上传报告卡片加入提交任务选择，默认使用当前任务列表的第一项。
- 已让“立即上传”按钮选中对应未提交任务，并清空旧回执与进度状态，避免继续沿用上一次提交结果。
- 已将上传回执创建从固定作业 `1` 改为当前选中任务 ID，HTTP 模式下会提交到真实任务。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/components/StudentDashboard.tsx`
- `apps/web/src/styles/global.css`
- `PROGRESS.md`

### 23.5 前端学生申诉状态同步

- 已稳定学生端接收的当前用户申诉列表，避免父组件每次渲染都传入新的数组引用。
- 已让学生端在 HTTP 工作区申诉数据异步加载后同步刷新“我的申诉”列表。
- 已保留学生端刚提交但父级尚未重新拉取到的本地申诉行，避免提交后界面闪回为空。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/pages/App.tsx`
- `apps/web/src/components/StudentDashboard.tsx`
- `PROGRESS.md`

### 23.6 前端学生提交即时状态反馈

- 已让学生端任务列表在接收工作区任务数据的同时保留本地即时提交反馈。
- 学生上传成功拿到回执后，当前任务会立即从“未提交”更新为“已提交”，避免成功回执和任务状态互相矛盾。
- 后续 HTTP 工作区刷新若返回批改中或已发布成绩，仍会覆盖本地即时状态，保持后端数据优先。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/components/StudentDashboard.tsx`
- `PROGRESS.md`

### 23.7 前端评分标准创建联调

- 已扩展前端 HTTP API 层，支持在 `VITE_API_MODE=http` 下调用 `POST /api/rubrics` 创建真实评分标准。
- 已在教师端 AI 流水线面板加入评分标准创建表单，可选择实训任务、填写标准名称、总分、三项评分项和关键词。
- 已让老师端本地状态即时展示新创建的评分标准，并在没有评分标准时禁用“启动批改”，避免空标准启动批改。
- 已同步 mock 数据层的评分标准创建能力，保持单前端演示可继续推进。
- 已将 `POST /api/rubrics` 加入写接口 smoke dry-run 清单，后续 MVP 验证会覆盖评分标准创建端点。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/components/TeacherAiPipeline.tsx`
- `apps/web/src/components/TeacherDashboard.tsx`
- `apps/web/src/styles/global.css`
- `scripts/smoke-api.sh`
- `PROGRESS.md`

### 23.8 前端批改提交数据联调

- 已将前端 HTTP 工作区提交列表按角色加载：学生只读取自己的提交，教师读取全量提交用于批改任务。
- 已把老师端工作区接入 `workspaceData.submissions`，启动 AI 批改时优先使用当前评分标准所属任务的真实提交 ID。
- 已将 `createGradingJob` 的提交 ID 从固定 `[1]` 改为调用方传入，避免新任务/真实提交联调时仍固定批改演示提交。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/components/TeacherDashboard.tsx`
- `PROGRESS.md`

### 23.9 教师端 HTTP 工作区异步数据同步

- 已让教师端复核结果在 HTTP 工作区数据加载后同步刷新，并在当前选中结果不存在时自动切回第一条可用结果。
- 已让教师端申诉处理、查重任务和成绩导出列表跟随工作区数据刷新，避免首次渲染 mock 后长期停留在旧数据。
- 已保留本地操作后的即时反馈，只有上游 props 更新时才同步覆盖对应列表。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/components/TeacherDashboard.tsx`
- `PROGRESS.md`

### 23.10 教师端作业维度 HTTP 数据同步

- 已让 HTTP 工作区加载先解析当前课程下的作业，再用当前作业 ID 请求收交统计、未交名单、成绩导出、成绩分析、失分点、课程目标达成度和查重任务，避免继续固定读取 `assignmentId=1`。
- 已让教师端评分标准优先匹配当前作业，并让查重启动使用当前作业 ID 和该作业真实提交 ID。
- 已让 mock 查重任务接收作业 ID 和提交 ID，保持 HTTP 失败兜底时的作业维度一致。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/components/TeacherDashboard.tsx`
- `PROGRESS.md`

### 23.11 教师端发布审计 HTTP 首屏同步

- 已将发布审计记录纳入 HTTP 工作区数据模型，工作区加载复核结果后会按结果 ID 拉取发布/撤回审计记录。
- 已让应用入口把发布审计传入教师端，教师端状态随上游工作区数据刷新，首屏不再只能显示空 mock 审计。
- 已保留教师发布/撤回后的即时刷新逻辑，操作后继续只刷新当前结果的审计记录。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/components/TeacherDashboard.tsx`
- `PROGRESS.md`

### 23.12 教师端批改链路作业维度收敛

- 已让 HTTP 工作区按当前作业 ID 请求评分标准、批改任务和复核结果，避免教师切换课程/作业后继续混入其他作业数据。
- 已让 mock 数据层的评分标准、批改任务和复核结果支持按作业过滤，保持 HTTP 失败兜底与真实接口语义一致。
- 已让创建批改任务的 mock fallback 使用当前作业 ID、评分标准 ID 和真实提交 ID，不再固定返回演示作业的批改任务。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/api/mockApi.ts`
- `PROGRESS.md`

### 23.13 Mock 工作区作业维度与空态兜底

- 已让单前端 Mock 模式按当前作业 ID 读取收交统计、未交名单、评分标准、批改任务、复核结果、成绩导出、成绩分析、失分点、课程目标和查重任务。
- 已让 mock 数据层在非演示作业下返回空收交、空统计、空分析和空列表，避免切换课程后继续展示作业 1 的演示数据。
- 已为教师端人工复核工作区补充空结果状态，并修复 0 人作业收交率计算，避免暂无批改结果时页面崩溃或出现 `NaN%`。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/pages/App.tsx`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/components/TeacherDashboard.tsx`
- `apps/web/src/components/TeacherCollectionPanel.tsx`
- `PROGRESS.md`

### 23.14 HTTP 局部失败作业维度兜底

- 已让 HTTP 工作区在收交统计、未交名单、成绩统计、失分点和课程目标接口局部失败时，使用当前作业 ID 生成 mock 兜底数据。
- 已避免局部服务失败时重新混入作业 1 的演示收交或分析数据，保持 HTTP/mock 兜底链路的作业维度一致。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `PROGRESS.md`

### 23.15 学生端 HTTP 跨课程任务加载

- 已让学生角色在 HTTP 工作区加载时读取全量实训任务，而不是只读取默认选中课程的任务。
- 已让学生角色读取全量批改结果后再按本人已发布结果派生成绩，避免跨课程成绩在学生端缺失。
- 已保留教师端按当前课程/作业收敛的数据加载策略，避免影响教师端工作区的作业维度隔离。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `PROGRESS.md`

### 23.16 HTTP 空课程首屏兜底

- 已让应用入口在 HTTP 返回空课程列表时安全派生课程、班级、任务和作业 ID，避免首屏访问 `selectedCourse.id` 崩溃。
- 已为教师端增加空课程提示，课程数据同步前不再继续渲染依赖课程上下文的工作台。
- 已保留学生端和管理端不依赖当前课程的渲染路径，避免空课程影响跨课程任务和管理数据查看。
- 本模块已通过前端 lint、生产构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/pages/App.tsx`
- `PROGRESS.md`

### 24. Gateway 本地跨域联调

- 已为 gateway 增加本地 Vite 开发端口 CORS 配置。
- 已允许 `localhost` / `127.0.0.1` 的 `5173` 和 `5174` 访问 gateway。
- 已覆盖 `GET`、`POST`、`PATCH`、`PUT`、`DELETE`、`OPTIONS` 方法，支持前端 HTTP 读写联调。
- 已在 README 的 HTTP 模式说明中记录本地跨域支持。

主要代码：

- `backend/gateway-service/src/main/resources/application.yml`
- `README.md`
- `PROGRESS.md`

### 25. 成绩导出 MVP

- 已新增成绩导出请求和导出摘要 DTO。
- 已新增成绩导出接口，支持按任务查看导出记录和创建导出任务。
- 已在评分服务中提供 CSV/PDF/ZIP 导出任务模拟实现，并按已发布成绩计算导出行数。
- 已新增 `grade_exports` Flyway 迁移表，保留导出文件、格式、行数、下载地址、操作者和创建时间。
- 已在老师端成绩统计面板加入“导出成绩”入口和导出记录展示。
- 已扩展 HTTP/mock 兜底数据层，前端 HTTP 模式可调用后端导出接口。
- 已更新 README 状态表和 API 文档。

主要代码：

- `backend/shared/src/main/java/com/trainmark/shared/dto/CreateGradeExportRequest.java`
- `backend/shared/src/main/java/com/trainmark/shared/dto/GradeExportSummary.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradeExportController.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/db/migration/V4__add_grade_exports.sql`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 25.1 批注 PDF ZIP 导出包

- 已让 ZIP 格式导出在 `grades.csv` 外附带当前作业批改结果对应的批注 PDF，文件位于 `annotations/annotated-{submissionId}.pdf`。
- 已在 ZIP README 中写入作业 ID 和批注 PDF 数量，便于下载后核对导出内容。
- 已将批注 PDF ZIP 资源地址加入 smoke 端点清单，MVP 验证会覆盖该下载入口。
- 已更新 API 文档和 README，说明 ZIP 导出会包含批注 PDF 包。
- 本模块已通过后端打包、smoke dry-run 和 MVP 验证脚本。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradingAssetController.java`
- `scripts/smoke-api.sh`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 26. MVP 回归验证脚本

- 已新增 `scripts/verify-mvp.sh`，串联当前 MVP 的基础回归验证。
- 验证脚本覆盖前端 ESLint、前端构建、后端全模块打包、读写 smoke dry-run 和 API 路由注解核对。
- 已新增根目录 `pnpm verify:mvp` 脚本，方便从仓库根目录执行。
- 已在 README 补充 MVP 回归验证命令。

主要代码：

- `scripts/verify-mvp.sh`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 27. 本地 OCR 结构化 Provider

- 已扩展 OCR 服务内存实现，创建 OCR 任务时会根据文件名生成确定性的结构化识别结果。
- 新建 OCR 任务会直接进入 `COMPLETED` 状态，并生成页数、文本块数、表格数和平均置信度。
- OCR 服务会保存每个任务的结构化结果，`GET /api/ocr/jobs/{jobId}/result` 返回对应任务结果，不再只返回固定样例。
- 前端 HTTP 模式读取 OCR 列表后会按任务拉取 OCR 结果，补齐结构块展示。
- 该模块为后续 PaddleOCR 接入前的本地 provider 契约，便于端到端联调。

主要代码：

- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrService.java`
- `apps/web/src/api/httpApi.ts`
- `PROGRESS.md`

### 28. 本地规则评分 Provider

- 已扩展评分服务内存实现，创建批改任务时会立即执行本地规则评分。
- 批改任务会返回 `COMPLETED` 状态，完成份数、总份数和置信度可直接用于前端进度展示。
- 当提交尚无批改结果时，服务会根据评分标准、得分点、关键词和分项分值生成可复核的初评结果。
- 生成的分项结果包含 AI 分、教师初始分、扣分说明、教师复核提示、置信度和证据标签。
- 前端 mock 的启动批改行为已同步为完成态，保持 HTTP/mock 演示一致。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `apps/web/src/api/mockApi.ts`
- `PROGRESS.md`

### 29. 管理端审计日志

- 已新增审计日志摘要 DTO。
- 已为 admin-service 增加审计日志服务和查询接口，支持按动作和资源类型筛选。
- 已补充 gateway 到 admin-service 的 `/api/admin/**` 路由。
- 已在前端 mock 和 HTTP 数据层加入审计日志读取。
- 已新增管理端审计看板，管理员角色可查看组织账号状态、关键操作审计、发布和导出等高风险操作统计。
- 已更新 API 文档和 README 状态表。

主要代码：

- `backend/shared/src/main/java/com/trainmark/shared/dto/AuditLogSummary.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/AuditLogService.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/AuditLogController.java`
- `backend/admin-service/pom.xml`
- `backend/gateway-service/src/main/resources/application.yml`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 30. 管理端系统配置

- 已新增系统配置摘要 DTO。
- 已为 admin-service 增加系统配置服务和查询接口，支持按配置分类筛选。
- 已在前端 mock 和 HTTP 数据层加入系统配置读取。
- 已在管理端看板新增系统与模型配置视图，覆盖 AI、文件、导出、通知和安全配置。
- 已更新 API 文档、README 状态表和进度记录。

主要代码：

- `backend/shared/src/main/java/com/trainmark/shared/dto/SystemSettingSummary.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/SystemSettingService.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/SystemSettingController.java`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 30.1 管理端 PostgreSQL 存储

- 已为审计日志抽象 `AuditLogStore`，默认保留内存实现，JDBC 模式读取 `audit_logs` 并关联用户姓名。
- 已为系统配置抽象 `SystemSettingStore`，默认保留内存实现，JDBC 模式读取 `system_settings`。
- 已新增 `system_settings` 迁移和本地默认配置种子，敏感配置在接口返回时保持脱敏。
- 已补充 PostgreSQL 切换环境变量和 README 启动说明。

主要代码：

- `backend/admin-service/src/main/java/com/trainmark/admin/AuditLogStore.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/InMemoryAuditLogStore.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/JdbcAuditLogStore.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/SystemSettingStore.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/InMemorySystemSettingStore.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/JdbcSystemSettingStore.java`
- `backend/db/migration/V10__system_settings.sql`
- `backend/admin-service/src/main/resources/application.yml`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 31. PWA 安装与离线外壳

- 已为前端补充 Web App Manifest，包含应用名称、主题色、显示模式、快捷入口和图标声明。
- 已新增 PWA 图标资源，覆盖普通图标和 maskable 图标。
- 已新增生产环境 Service Worker，缓存应用壳资源并为前端路由提供离线回退。
- 已在 React 入口按生产环境注册 Service Worker，避免开发模式缓存影响 Vite 热更新。
- 已补充移动端 Web App meta 信息，支持手机浏览器安装入口。
- 已更新 README 状态表和进度记录。

主要代码：

- `apps/web/public/manifest.webmanifest`
- `apps/web/public/icons/icon.svg`
- `apps/web/public/icons/maskable.svg`
- `apps/web/public/sw.js`
- `apps/web/src/pwa.ts`
- `apps/web/index.html`
- `apps/web/src/main.tsx`
- `README.md`
- `PROGRESS.md`

### 32. PWA 角色快捷入口

- 已支持从 URL 查询参数读取初始角色，例如 `?role=student`、`?role=teacher` 和 `?role=admin`。
- 已在角色切换时同步更新当前 URL，便于复制链接或安装快捷入口保留角色上下文。
- 已监听浏览器前进/后退事件，保证历史导航后的角色状态与 URL 保持一致。
- 已让 PWA manifest 中的学生端和教师端 shortcuts 能落到对应角色工作台。
- 已更新 README 状态表和进度记录。

主要代码：

- `apps/web/src/pages/App.tsx`
- `README.md`
- `PROGRESS.md`

### 33. 本地备份脚本与环境默认值

- 已将 `.env.example` 的 PostgreSQL 和 RabbitMQ 默认值与 Docker Compose 默认值对齐。
- 已让 Docker Compose 读取环境变量并提供默认值，避免本地联调时 `.env` 与 compose 配置漂移。
- 已将 `backups/` 加入 Git 忽略，防止本地备份产物误提交。
- 已新增 `pnpm backup` 脚本入口。
- 已将 `scripts/backup.sh` 从占位提示升级为可执行备份脚本，支持 PostgreSQL custom dump 和 MinIO / S3 对象同步。
- 已生成备份 manifest，记录备份时间、环境文件、数据库目标和对象存储目标。
- 已在 README 补充本地备份用法和关键环境变量。

主要代码：

- `.env.example`
- `.gitignore`
- `infra/docker-compose.yml`
- `package.json`
- `scripts/backup.sh`
- `README.md`
- `PROGRESS.md`

### 34. 本地恢复脚本

- 已新增 `pnpm restore` 脚本入口。
- 已新增 `scripts/restore.sh`，支持从 `scripts/backup.sh` 生成的备份目录恢复 PostgreSQL custom dump。
- 已支持用 `mc` 或 `aws` 将本地对象备份同步回 MinIO / S3 兼容桶。
- 已要求 `CONFIRM_RESTORE=trainmark-ai-restore` 显式确认，避免误覆盖本地数据。
- 已在 README 补充恢复命令和对象存储恢复严格模式。

主要代码：

- `scripts/restore.sh`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 35. 前端 UI 重构与导航优化

- 已移除冗余的 `TeacherSectionTabs` 组件，侧边栏成为唯一导航入口，避免与顶部导航重复。
- 已拆分"课程与班级"和"实训任务"为独立面板：`TeacherCoursePanel` 专注课程和班级管理，新增 `TeacherAssignmentPanel` 处理实训任务创建和列表。
- 已移除 `AppChrome` 中的冗余 hero card，顶部仅保留页面标题和角色切换、通知、退出等操作。
- 已重写全局 CSS，采用 restrained palette 设计策略：
  - 移除所有蓝绿渐变色（`linear-gradient(135deg, #2563eb, #14b8a6)` 等）。
  - 品牌色改为单一靛蓝 `#4f46e5`，中性色带品牌色调。
  - 卡片采用简洁边框和轻阴影，不再使用玻璃拟态或渐变背景。
  - 状态徽章、进度环、按钮等组件统一采用新配色。
  - 空状态采用图标加文字的简洁引导。
- 已更新 `TeacherOverviewDashboard` 适配新的组件拆分。
- 本模块遵循 impeccable 设计原则：restrained color、4pt spacing system、fixed rem typography（适合 dashboard）、no gradient text、no glassmorphism、no hero-metric template。

主要代码：

- `apps/web/src/styles/global.css`
- `apps/web/src/components/AppChrome.tsx`
- `apps/web/src/components/TeacherDashboard.tsx`
- `apps/web/src/components/TeacherCoursePanel.tsx`
- `apps/web/src/components/TeacherAssignmentPanel.tsx`
- `apps/web/src/components/TeacherOverviewDashboard.tsx`
- `PROGRESS.md`

### 35. API 冒烟检查脚本

- 已新增 `pnpm smoke:api` 脚本入口。
- 已新增 `scripts/smoke-api.sh`，用于在后端服务启动后检查 gateway health、各服务 actuator health 和核心 gateway API。
- 已支持按环境变量覆盖 gateway 和各服务 URL，便于本地、联调环境和测试环境复用。
- 已支持 `SMOKE_DRY_RUN=1`，可在服务未启动时验证脚本端点清单。
- 已在 README 补充 API 冒烟检查命令。

主要代码：

- `scripts/smoke-api.sh`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 36. 本地发布包脚本

- 已将 `scripts/deploy.sh` 从占位提示升级为本地发布包生成脚本。
- 已新增 `pnpm deploy:local` 脚本入口。
- 发布脚本会构建前端和后端，并将前端 dist、后端服务 JAR、infra 配置和关键文档复制到 `deployments/<时间戳>/`。
- 已生成发布包 manifest，便于确认发布包内容。
- 已将 `deployments/` 加入 Git 忽略，防止本地发布产物误提交。
- 已在 README 补充本地发布包命令。

主要代码：

- `.gitignore`
- `package.json`
- `scripts/deploy.sh`
- `README.md`
- `PROGRESS.md`

### 37. OCR Provider CLI 契约

- 已补齐 `ai/ocr/` 目录，承接 PROJECT 中 OCR、评分和批注相关 AI 能力的仓库结构。
- 已新增无第三方依赖的 `local_provider.py`，输出与后端 `OcrResultSummary` 兼容的 JSON。
- 已让本地 OCR CLI 覆盖数据库报告、图片截图和普通报告三类 deterministic 结构识别场景。
- 已新增 PaddleOCR 配置样例，明确后续 PaddleOCR provider 的运行参数、预处理选项和 stdout JSON 输出契约。
- 已新增 OCR provider README，记录本地 provider 调用方式和 PaddleOCR 迁移边界。
- 已忽略 Python `__pycache__` 和 `.pyc` 文件，避免本地校验产物误提交。
- 已更新 README 状态表和进度记录。

主要代码：

- `ai/ocr/README.md`
- `ai/ocr/local_provider.py`
- `ai/ocr/paddleocr.example.yml`
- `.gitignore`
- `README.md`
- `PROGRESS.md`

### 37.1 文档预处理 Provider CLI 契约

- 已补齐 `ai/document/` 目录，承接 PDF / Word / 图片进入 OCR 前的预处理契约。
- 已新增无第三方依赖的 `local_converter.py`，输出包含源对象、规范化对象、源格式、目标格式、页数、图片数和表格提示数的 JSON manifest。
- 已让本地转换 CLI 覆盖 Word 转 PDF、PDF 直通和图片直通三类 MVP 场景，为后续 LibreOffice / PDFBox / 图片转换实现留出稳定边界。
- 已在 OCR 服务中新增 `DocumentPreprocessor`，创建 OCR 任务时会先执行本地文档预处理，再把预处理结果传给 OCR provider。
- 已扩展 command OCR provider 占位符，支持 `{normalizedObjectKey}`、`{sourceFormat}`、`{targetFormat}` 和 `{pageCount}`。
- 已将文档预处理纳入 `pnpm verify:ai` 和 `pnpm verify:mvp`。
- 已更新 README 状态表、OCR provider README、环境变量说明和进度记录。

主要代码：

- `ai/document/README.md`
- `ai/document/local_converter.py`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/DocumentPreprocessor.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/DocumentPreprocessResult.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/LocalDocumentPreprocessor.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/DocumentPreprocessorConfig.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrProvider.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/LocalOcrProvider.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/CommandOcrProvider.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/InMemoryOcrStore.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/JdbcOcrStore.java`
- `scripts/verify-ai.sh`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 37.1.1 PaddleOCR Provider 适配器

- 已新增 `ai/ocr/paddleocr_provider.py`，按 PaddleOCR 3.x `PaddleOCR(...).predict(...)` 形态读取本地归一化文件并输出后端兼容的 `OcrResultSummary` JSON。
- 已让 OCR 服务支持 `OCR_PROVIDER=paddleocr`，默认调用内置 PaddleOCR 适配器，同时保留 `OCR_COMMAND` 覆盖能力。
- 已让 PaddleOCR 未安装或归一化文件不存在时回退确定性结果，并在 JSON 中标记 `PaddleOCR fallback`，保证本地 MVP 验证不依赖外部模型下载。
- 已将 PaddleOCR 适配器纳入 AI provider 验证脚本。
- 本模块已通过 AI provider 验证、后端打包和 MVP 验证脚本。

主要代码：

- `ai/ocr/paddleocr_provider.py`
- `ai/ocr/README.md`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrProviderConfig.java`
- `scripts/verify-ai.sh`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 37.2 文档预处理后端 Provider 切换

- 已新增 `CommandDocumentPreprocessor`，支持通过外部命令执行 Word/PDF/图片预处理并读取 stdout JSON manifest。
- 已让 OCR 服务通过 `DOCUMENT_PREPROCESSOR_PROVIDER` 在本地 Java 预处理和命令预处理之间切换。
- 已补充 `{submissionId}`、`{objectKey}` 命令占位符和超时配置，后续可直接接入 LibreOffice / PDFBox / 图片转换脚本。
- 已加强 `pnpm verify:ai` 对文档预处理输出字段的校验。
- 已更新 README、文档预处理 README、环境变量说明和进度记录。

主要代码：

- `backend/ocr-service/src/main/java/com/trainmark/ocr/CommandDocumentPreprocessor.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/DocumentPreprocessorConfig.java`
- `backend/ocr-service/src/main/resources/application.yml`
- `ai/document/README.md`
- `scripts/verify-ai.sh`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 38. 评分 Provider CLI 契约

- 已补齐 `ai/scoring/` 目录，承接后续规则评分、语义评分和 LLM 评语生成能力。
- 已新增无第三方依赖的 `local_provider.py`，输出与后端 `GradingResultSummary` 兼容的 JSON。
- 已让本地评分 CLI 支持默认 rubric 和外部 rubric JSON 文件。
- 已新增 sample rubric，便于本地验证和后续 provider 联调。
- 已新增语义评分配置样例，明确关键词、语义、结构权重、自动扣分上限和教师复核阈值。
- 已新增评分 provider README，记录本地 provider 调用方式、自定义 rubric 格式和语义评分迁移边界。
- 已更新 README 状态表和进度记录。

主要代码：

- `ai/scoring/README.md`
- `ai/scoring/local_provider.py`
- `ai/scoring/sample-rubric.json`
- `ai/scoring/semantic-scoring.example.yml`
- `README.md`
- `PROGRESS.md`

### 38.1 关键词规则评分引擎

- 已将本地评分 provider 从固定扣分升级为关键词/同义词命中评分。
- 评分会按 rubric 得分点拆分分值预算，统计命中和缺失关键词，并生成可复核 evidence。
- 未配置得分点的评分项会按报告结构完整度保守扣分，避免无规则时给满分。
- 已为 Python CLI 增加 `--evidence-text` 和 `--evidence-file`，便于后续接入 OCR 文本或语义评分结果。
- 已同步升级 Java 后端 `LocalScoringProvider`，创建批改任务时也使用同类规则评分逻辑。
- 已修正 `CommandScoringProvider` 的外部命令工作目录，支持从服务目录启动时调用仓库根目录下的 `ai/scoring` 脚本。
- 已更新评分 README、sample rubric、AI 验证脚本和进度记录。

主要代码：

- `ai/scoring/local_provider.py`
- `ai/scoring/sample-rubric.json`
- `ai/scoring/README.md`
- `backend/grading-service/src/main/java/com/trainmark/grading/LocalScoringProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/CommandScoringProvider.java`
- `scripts/verify-ai.sh`
- `PROGRESS.md`

### 38.2 语义评分 Provider 适配器

- 已新增 `ai/scoring/semantic_provider.py`，按 SentenceTransformers 语义相似度流程优先使用 embedding 相似度，并输出后端兼容的 `GradingResultSummary` JSON。
- 已让语义 provider 在未安装模型库时回退确定性词项相似度，保证本地 MVP 验证不依赖模型下载。
- 已让评分服务支持 `SCORING_PROVIDER=semantic`，默认调用内置语义评分适配器，同时保留 `SCORING_COMMAND` 覆盖能力。
- 已为 `CommandScoringProvider` 增加 `{rubricJson}` 占位符，外部评分 provider 可直接接收当前评分标准。
- 已将语义评分适配器纳入 AI provider 验证脚本。
- 本模块已通过 AI provider 验证、后端打包和 MVP 验证脚本。

主要代码：

- `ai/scoring/semantic_provider.py`
- `ai/scoring/README.md`
- `backend/grading-service/src/main/java/com/trainmark/grading/CommandScoringProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/ScoringProviderConfig.java`
- `scripts/verify-ai.sh`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 39. 批注 PDF Provider CLI 契约

- 已补齐 `ai/annotation/` 目录，承接后续 PDF 批注生成能力。
- 已新增无第三方依赖的 `local_provider.py`，可生成最小可打开的 PDF 批注占位文件。
- 已让批注 provider 输出包含 `annotationPdfPath`、`annotationPdfUrl`、页数和批注列表的 JSON manifest。
- 已新增 PDF 批注配置样例，明确生产 provider 的输入格式、对象存储前缀和批注颜色约定。
- 已新增批注 provider README，记录本地 provider 调用方式和生产迁移边界。
- 已更新 README 状态表和进度记录。

主要代码：

- `ai/annotation/README.md`
- `ai/annotation/local_provider.py`
- `ai/annotation/pdf-annotation.example.yml`
- `README.md`
- `PROGRESS.md`

### 39.1 批注 PDF 摘要生成

- 已让本地 `LocalAnnotationProvider` 根据批改结果生成多条批注摘要，覆盖总分、分项扣分原因和 evidence。
- 已让 `/annotations/submissions/{submissionId}/annotated.pdf` 按提交 ID 查找真实批改结果，生成包含学生、成绩、状态、批注和分项证据的 PDF 摘要。
- 未找到批改结果时仍返回明确的占位 PDF，避免下载接口出现空响应。
- 已为 grading asset controller 的路径参数补充显式 `@PathVariable` 名称，避免运行期依赖 Java 参数名反射。
- 已修正 `CommandAnnotationProvider` 的外部命令工作目录，支持从服务目录启动时调用仓库根目录下的 `ai/annotation` 脚本。
- 已更新批注 provider README、README 和进度记录。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/LocalAnnotationProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/CommandAnnotationProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingAssetController.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `ai/annotation/README.md`
- `README.md`
- `PROGRESS.md`

### 40. AI Provider 验证脚本

- 已新增 `pnpm verify:ai` 脚本入口。
- 已新增 `scripts/verify-ai.sh`，统一验证 OCR、评分和批注 provider。
- 验证脚本会执行 Python 编译检查、运行文档预处理样例、运行 OCR 样例、运行评分样例、运行批注 PDF 样例，并校验 JSON 输出和 PDF 文件头。
- 已在 README 补充 AI provider 契约验证命令。

主要代码：

- `scripts/verify-ai.sh`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 41. MVP 验证覆盖 AI Provider

- 已将 `pnpm verify:mvp` 串接 `pnpm verify:ai`。
- 当前 MVP 主验证会覆盖前端静态检查、前端构建、后端全模块打包、AI provider 契约验证和 API 路由扫描。
- 已更新进度记录。

主要代码：

- `scripts/verify-mvp.sh`
- `PROGRESS.md`

### 42. OCR 后端 Provider 切换

- 已为 `ocr-service` 抽象 `OcrProvider` 接口。
- 已将原本写在 `OcrService` 内部的 deterministic OCR 逻辑迁移到 `LocalOcrProvider`。
- 已新增 `CommandOcrProvider`，支持通过 `OCR_PROVIDER=command` 和 `OCR_COMMAND` 调用外部 OCR CLI。
- 已新增 `OcrProviderConfig`，默认使用本地 provider，配置为 command 时校验命令模板。
- 已为 `ocr-service` 增加 `trainmark.ocr.provider`、`trainmark.ocr.command` 和超时配置。
- 已更新 `.env.example`、OCR provider README、README 状态表和进度记录。

主要代码：

- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrProvider.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/LocalOcrProvider.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/CommandOcrProvider.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrProviderConfig.java`
- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrService.java`
- `backend/ocr-service/src/main/resources/application.yml`
- `.env.example`
- `ai/ocr/README.md`
- `README.md`
- `PROGRESS.md`

### 43. 评分后端 Provider 切换

- 已为 `grading-service` 抽象 `ScoringProvider` 接口和 `ScoringRequest`。
- 已将原本写在 `GradingService` 内部的 deterministic 规则评分逻辑迁移到 `LocalScoringProvider`。
- 已新增 `CommandScoringProvider`，支持通过 `SCORING_PROVIDER=command` 和 `SCORING_COMMAND` 调用外部评分 CLI。
- 已新增 `ScoringProviderConfig`，默认使用本地 provider，配置为 command 时校验命令模板。
- 已为 `grading-service` 增加 `trainmark.scoring.provider`、`trainmark.scoring.command` 和超时配置。
- 已更新 `.env.example`、评分 provider README、README 状态表和进度记录。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/ScoringRequest.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/ScoringProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/LocalScoringProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/CommandScoringProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/ScoringProviderConfig.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/grading-service/src/main/resources/application.yml`
- `.env.example`
- `ai/scoring/README.md`
- `README.md`
- `PROGRESS.md`

### 44. 上传格式与完成校验

- 已为 `file-service` 上传初始化增加文件大小校验，默认上限 50MB。
- 已限制上传内容类型为 PDF、Word、PNG 和 JPEG，并同步校验文件扩展名。
- 已为上传完成增加 objectKey 与初始化会话匹配校验。
- 已为上传完成增加 checksum 一致性校验；初始化和完成都提供 checksum 时必须一致。
- 已按同一学生、同一任务的历史提交计算下一版本号，不再固定为 1。
- 已为 `file-service` 增加上传大小和内容类型环境配置。
- 已更新 `.env.example`、API 文档、README 状态表和进度记录。

主要代码：

- `backend/file-service/src/main/java/com/trainmark/file/UploadService.java`
- `backend/file-service/src/main/resources/application.yml`
- `.env.example`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 45. 上传错误统一响应

- 已为 `file-service` 增加上传接口异常处理器。
- 上传请求体字段校验失败时返回 HTTP 400，并在 `ApiResponse.data` 中返回字段级错误信息。
- 上传业务校验失败时返回 HTTP 400 和 `ApiResponse.fail(...)`，覆盖文件大小、内容类型、扩展名、上传会话、objectKey 和 checksum 错误。
- 请求体无法解析时返回 HTTP 400 和统一错误 envelope，避免暴露 Spring 默认错误结构。
- 已更新 API 文档和 README 状态表。

主要代码：

- `backend/file-service/src/main/java/com/trainmark/file/FileExceptionHandler.java`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 46. AI Provider 错误统一响应

- 已为 `ocr-service` 增加接口异常处理器，覆盖请求校验、请求体解析、业务参数错误和 OCR provider 执行失败。
- 已为 `grading-service` 增加接口异常处理器，覆盖请求校验、请求体解析、业务参数错误和评分 provider 执行失败。
- OCR / 评分命令 provider 超时、退出码非 0、执行失败或解析失败时返回 HTTP 502 和 `ApiResponse.fail(...)`。
- OCR / 评分请求参数错误返回 HTTP 400 和统一响应 envelope，便于前端 HTTP 模式稳定处理失败状态。
- 已更新 API 文档和 README 状态表。

主要代码：

- `backend/ocr-service/src/main/java/com/trainmark/ocr/OcrExceptionHandler.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingExceptionHandler.java`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 47. MVP 冒烟端点覆盖

- 已扩展 `scripts/smoke-api.sh` 的 gateway 核心端点清单，覆盖组织、用户、任务、提交、收集概览、评分标准、批改任务、复核结果、OCR、查重、统计、审计日志和系统设置。
- 已将 `SMOKE_DRY_RUN=1 pnpm smoke:api` 串入 `pnpm verify:mvp`，服务未启动时也能校验冒烟脚本端点清单。
- 已在 README 说明 MVP 验证会覆盖 smoke dry-run。

主要代码：

- `scripts/smoke-api.sh`
- `scripts/verify-mvp.sh`
- `README.md`
- `PROGRESS.md`

### 48. 批注后端 Provider 切换

- 已为 `grading-service` 抽象 `AnnotationProvider` 接口。
- 已新增 `LocalAnnotationProvider`，评分完成后生成本地 deterministic 批注 PDF URL 和批注摘要。
- 已新增 `CommandAnnotationProvider`，支持通过 `ANNOTATION_PROVIDER=command` 和 `ANNOTATION_COMMAND` 调用外部批注 PDF CLI。
- 已新增 `AnnotationProviderConfig`，默认使用本地 provider，配置为 command 时校验命令模板。
- 已让创建批改任务时先执行评分 provider，再执行批注 provider，并把批注 PDF URL 与批注摘要写回批改结果。
- 已为 `grading-service` 增加 `trainmark.annotation.provider`、`trainmark.annotation.command`、输出目录和超时配置。
- 已更新 `.env.example`、批注 provider README、README 状态表和进度记录。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/AnnotationProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/LocalAnnotationProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/CommandAnnotationProvider.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/AnnotationProviderConfig.java`
- `backend/grading-service/src/main/java/com/trainmark/grading/GradingService.java`
- `backend/grading-service/src/main/resources/application.yml`
- `.env.example`
- `ai/annotation/README.md`
- `README.md`
- `PROGRESS.md`

### 49. 批注 PDF 查看入口

- 已将教师端人工复核预览区的批注 PDF 路径升级为可点击入口，可在新标签页打开当前批注文件。
- 已将学生端已发布成绩卡片中的“查看批注 PDF”从静态按钮改为真实链接。
- 已补充紧凑链接样式，复用现有按钮视觉并避免影响复核区工具栏布局。
- 已更新 README 状态表和进度记录。

主要代码：

- `apps/web/src/pages/App.tsx`
- `apps/web/src/styles/global.css`
- `README.md`
- `PROGRESS.md`

### 50. HTTP 资源链接解析

- 已在前端 HTTP API 层新增 `resolveApiAssetUrl`，用于把后端返回的相对资源路径解析到 `VITE_API_BASE_URL`。
- HTTP 模式下，批注 PDF 链接会打开 gateway 资源地址，避免相对路径误落到 Vite 前端域名。
- Mock 模式和绝对 URL 保持原样，避免影响本地纯前端演示。
- 已将教师端和学生端批注 PDF 查看入口接入资源 URL 解析。
- 已更新 README 状态表和进度记录。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `README.md`
- `PROGRESS.md`

### 51. 成绩导出下载入口

- 已将老师端成绩统计区的导出记录从纯文本下载路径改为可点击下载入口。
- 导出下载链接复用 `resolveApiAssetUrl`，HTTP 模式下指向 gateway 资源地址，Mock 模式保持本地相对路径。
- 已补充导出记录链接样式，保留审计列表的紧凑信息密度。
- 已更新 README 状态表和进度记录。

主要代码：

- `apps/web/src/pages/App.tsx`
- `apps/web/src/styles/global.css`
- `README.md`
- `PROGRESS.md`

### 52. 批注与导出资源下载

- 已为 `grading-service` 新增资源下载控制器。
- 已提供 `/annotations/submissions/{submissionId}/annotated.pdf`，返回可下载的本地批注 PDF 占位文件。
- 已提供 `/exports/assignments/{assignmentId}/{fileName}`，按文件扩展名返回 CSV、PDF 或 ZIP 导出占位文件。
- 已将 gateway 的 grading-service 路由扩展到 `/annotations/**` 和 `/exports/**`，让前端 HTTP 模式资源链接可直接通过 gateway 打开。
- 已将批注 PDF 和成绩导出资源端点加入 API 冒烟 dry-run 清单。
- 已更新 API 文档、README 状态表和进度记录。

主要代码：

- `backend/grading-service/src/main/java/com/trainmark/grading/GradingAssetController.java`
- `backend/gateway-service/src/main/resources/application.yml`
- `scripts/smoke-api.sh`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 53. API 冒烟等待重试

- 已为 `scripts/smoke-api.sh` 增加可配置重试能力。
- 已支持 `SMOKE_RETRIES` 控制每个端点最大尝试次数，默认 1 次，保持原有快速失败行为。
- 已支持 `SMOKE_RETRY_DELAY_SECONDS` 控制重试间隔，便于 `pnpm dev:backend` 后等待服务逐步 ready。
- 已在 README 补充等待式 API 冒烟检查示例。

主要代码：

- `scripts/smoke-api.sh`
- `README.md`
- `PROGRESS.md`

### 54. MVP 一键联调脚本

- 已新增 `pnpm dev:mvp` 脚本入口。
- 已新增 `scripts/dev-mvp.sh`，可启动所有后端服务、等待 API 冒烟检查通过，再以前端 HTTP 模式启动 Web。
- 后端总控日志写入 `.logs/dev-mvp-backend.log`，各服务日志继续写入 `.logs/backend/`。
- 已支持通过 `SMOKE_RETRIES`、`SMOKE_RETRY_DELAY_SECONDS`、`VITE_API_MODE` 和 `VITE_API_BASE_URL` 覆盖默认联调参数。
- 已在 README 补充一键启动 MVP 联调说明。

主要代码：

- `scripts/dev-mvp.sh`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 55. 写接口冒烟检查

- 已为 `scripts/smoke-api.sh` 增加可选写接口检查模式。
- 设置 `SMOKE_INCLUDE_WRITES=1` 时会覆盖上传初始化、上传完成、创建 OCR 任务、OCR 结果读取、创建批改任务、复核改分、复核通过、成绩发布、发布审计、学生申诉、处理申诉、创建成绩导出、一键催交和启动查重。
- 上传完成会复用上传初始化返回的 `uploadId` 和 `objectKey`，避免使用伪造会话。
- 复核改分使用 `PATCH` 请求，匹配后端 `GradingReviewController` 的真实接口方法。
- API 读取端点会校验 `ApiResponse.success=true`，下载资源和 actuator health 继续按 HTTP 状态检查。
- 写接口响应会校验 `ApiResponse.success=true`，不再只依赖 HTTP 2xx。
- 已在 README 补充写接口冒烟检查示例。

主要代码：

- `scripts/smoke-api.sh`
- `README.md`
- `PROGRESS.md`

### 56. 后端开发启动修复

- 已修复 `scripts/dev-backend.sh` 的 Maven 启动方式，避免 `spring-boot:run` 误在根聚合 POM 上执行。
- 后端总启动脚本会先安装根父 POM 和 `shared` 模块，再分别从具体服务模块启动 Spring Boot。
- 已新增 `scripts/dev-service.sh`，统一单服务启动流程。
- 已将 `package.json` 中所有 `dev:backend:*` 脚本切换到 `scripts/dev-service.sh`。
- 该修复来自真实启动验证中暴露的 `Unable to find a suitable main class` 错误。

主要代码：

- `scripts/dev-backend.sh`
- `scripts/dev-service.sh`
- `package.json`
- `PROGRESS.md`

### 57. 本地冒烟代理旁路

- 已让 `scripts/smoke-api.sh` 的 curl 请求显式使用 `--noproxy '*'`。
- 修复了 shell 设置 `http_proxy` / `https_proxy` 且未设置 `NO_PROXY` 时，本地 `localhost` 冒烟请求被代理转发并返回 502 的问题。
- 该修复来自真实 `pnpm dev:backend` 启动后执行 live smoke 时的环境问题。

主要代码：

- `scripts/smoke-api.sh`
- `PROGRESS.md`

### 58. Spring MVC 参数名保留

- 已在后端父 POM 的 `maven-compiler-plugin` 中启用 `parameters=true`。
- 修复真实后端联调时 `/api/organizations` 因 Java 参数名未保留，导致 Spring MVC 无法绑定未显式命名的 `@RequestParam` / `@PathVariable` 并返回 500 的问题。
- 该配置作用于所有后端模块，避免同类接口在 live smoke 或前端 HTTP 模式下出现运行期参数绑定错误。

主要代码：

- `backend/pom.xml`
- `README.md`
- `PROGRESS.md`

### 59. 用户与组织 PostgreSQL 存储

- 已将用户目录服务拆成 `UserDirectoryStore` 存储接口，默认仍使用内存实现，保证无数据库环境下的开发和冒烟不受影响。
- 已新增 `JdbcUserDirectoryStore`，设置 `TRAINMARK_USER_STORE=jdbc` 后可将组织、用户、角色和学生名单导入写入 PostgreSQL。
- 已为 `user-service` 增加 PostgreSQL JDBC runtime 驱动，并通过环境变量配置 JDBC URL、用户名和密码。
- 已补充 demo 用户组织种子迁移 `V6__seed_demo_directory.sql`，并让 Docker PostgreSQL 首次初始化时挂载并执行 `backend/db/migration/`。
- 已在 README、infra README 和 `.env.example` 中补充 JDBC 模式说明。

主要代码：

- `backend/user-service/src/main/java/com/trainmark/user/UserDirectoryStore.java`
- `backend/user-service/src/main/java/com/trainmark/user/InMemoryUserDirectoryStore.java`
- `backend/user-service/src/main/java/com/trainmark/user/JdbcUserDirectoryStore.java`
- `backend/user-service/src/main/java/com/trainmark/user/UserDirectoryService.java`
- `backend/db/migration/V6__seed_demo_directory.sql`
- `infra/postgres/init.sql`
- `infra/docker-compose.yml`
- `.env.example`
- `README.md`
- `infra/README.md`
- `PROGRESS.md`

### 60. 课程与任务 PostgreSQL 存储

- 已将课程服务拆成 `CourseStore` 存储接口，默认仍使用内存实现，保证现有本地开发和 smoke 不受数据库影响。
- 已新增 `JdbcCourseStore`，设置 `TRAINMARK_COURSE_STORE=jdbc` 后可将课程、教学班、任务和任务-班级关联写入 PostgreSQL。
- 已为 `course-service` 增加 PostgreSQL JDBC runtime 驱动，并通过环境变量配置 JDBC URL、用户名和密码。
- 已补充 demo 课程班级和任务种子迁移 `V7__seed_demo_courses.sql`，并纳入 Docker PostgreSQL 首次初始化流程。
- 已在 README、infra README 和 `.env.example` 中补充课程 JDBC 模式说明。

主要代码：

- `backend/course-service/src/main/java/com/trainmark/course/CourseStore.java`
- `backend/course-service/src/main/java/com/trainmark/course/InMemoryCourseStore.java`
- `backend/course-service/src/main/java/com/trainmark/course/JdbcCourseStore.java`
- `backend/course-service/src/main/java/com/trainmark/course/CourseService.java`
- `backend/db/migration/V7__seed_demo_courses.sql`
- `infra/postgres/init.sql`
- `.env.example`
- `README.md`
- `infra/README.md`
- `PROGRESS.md`

### 61. 上传与提交 PostgreSQL 存储

- 已将文件服务上传数据拆成 `UploadStore` 存储接口，默认仍使用内存实现，保证现有无数据库开发和 smoke 不受影响。
- 已新增 `JdbcUploadStore`，设置 `TRAINMARK_FILE_STORE=jdbc` 后可将上传会话、上传完成状态和提交记录写入 PostgreSQL。
- 已为 `file-service` 增加 PostgreSQL JDBC runtime 驱动，并通过环境变量配置 JDBC URL、用户名和密码。
- 已补充迁移 `V8__upload_sessions.sql`，为 `submissions` 增加 `file_name` / `object_key`，并新增 `upload_sessions` 表。
- 已在 README、infra README 和 `.env.example` 中补充文件服务 JDBC 模式说明。

主要代码：

- `backend/file-service/src/main/java/com/trainmark/file/UploadStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/InMemoryUploadStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/JdbcUploadStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/UploadService.java`
- `backend/db/migration/V8__upload_sessions.sql`
- `infra/postgres/init.sql`
- `.env.example`
- `README.md`
- `infra/README.md`
- `PROGRESS.md`

### 61.1 学生上传文件内容本地存储

- 已新增 `UploadObjectStore` 与本地文件系统实现，默认将上传文件内容写入 `.data/uploads`。
- 已新增 `PUT /api/submissions/upload/content`，接收 `uploadId`、`objectKey` 和 multipart `file`，返回对象写入摘要。
- 已让学生端 HTTP 模式在初始化上传后发送真实文件内容，再完成提交；没有选择文件时仍生成本地占位文件以保留演示闭环。
- 已将上传内容接口纳入写接口 smoke dry-run，后续 MVP 验证会覆盖该入口。
- 已补充 `.gitignore`、`.env.example`、API 文档和 README 中的本地对象目录说明。
- 本模块已通过前端 lint、前端构建、后端打包、smoke dry-run、MVP 验证脚本和 file-service 真实上传写入验证。

主要代码：

- `backend/shared/src/main/java/com/trainmark/shared/dto/UploadObjectSummary.java`
- `backend/file-service/src/main/java/com/trainmark/file/UploadObjectStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/LocalUploadObjectStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/UploadController.java`
- `backend/file-service/src/main/java/com/trainmark/file/UploadService.java`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/components/StudentDashboard.tsx`
- `scripts/smoke-api.sh`
- `.env.example`
- `README.md`
- `docs/API.md`
- `PROGRESS.md`

### 61.2 学生提交原文件下载入口

- 已新增 `GET /api/submissions/{submissionId}/file`，可按提交 ID 从本地对象目录读回原始报告文件。
- 已让内存和 JDBC 上传存储都能返回提交文件名与 objectKey，保持默认演示和数据库模式一致。
- 已让学生端 HTTP 上传成功回执显示“查看原文件”链接，方便确认刚提交的报告内容可取回。
- 已将原文件下载纳入写接口 smoke 清单，真实写入 smoke 会在上传完成后下载同一提交文件。
- 已更新 API 文档和 README 中的原文件下载说明。
- 本模块已通过前端 lint、前端构建、后端打包、smoke dry-run、MVP 验证脚本和 file-service 真实上传下载验证。

主要代码：

- `backend/file-service/src/main/java/com/trainmark/file/SubmissionFileDescriptor.java`
- `backend/file-service/src/main/java/com/trainmark/file/UploadStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/InMemoryUploadStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/JdbcUploadStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/UploadObjectStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/LocalUploadObjectStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/SubmissionController.java`
- `backend/file-service/src/main/java/com/trainmark/file/UploadService.java`
- `apps/web/src/components/StudentDashboard.tsx`
- `scripts/smoke-api.sh`
- `README.md`
- `docs/API.md`
- `PROGRESS.md`

### 61.3 教师已交报告列表与原文件下载

- 已在教师端报告收集面板新增“已交报告”列表，按当前作业展示最近提交的报告文件。
- 已展示学生姓名、学号、版本和提交状态，便于教师快速核对报告收集情况。
- HTTP 模式下已交报告提供“原文件”下载入口，指向 `/api/submissions/{submissionId}/file`。
- Mock 模式下保留列表展示但隐藏原文件下载链接，避免单前端演示访问不存在的后端资源。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建和 MVP 验证脚本。

主要代码：

- `apps/web/src/components/TeacherCollectionPanel.tsx`
- `apps/web/src/components/TeacherDashboard.tsx`
- `apps/web/src/styles/global.css`
- `README.md`
- `PROGRESS.md`

### 61.4 教师端真实提交 OCR 启动

- 已在 `SubmissionSummary` 中暴露提交报告 `objectKey`，让提交列表不再只包含展示文件名。
- 已让内存和 JDBC 上传存储在提交摘要中返回同一个对象键，保持默认演示和数据库模式一致。
- 已新增前端 HTTP `createOcrJob` 调用，向 `/api/ocr/jobs` 发送真实 `submissionId` 与 `objectKey`。
- 已在教师端 OCR 面板加入“启动 OCR”动作，优先使用当前课程任务下最近的已交报告。
- 已更新 README 当前进度和 API 文档中的 `SubmissionSummary` 说明。
- 本模块已通过前端 lint、前端构建、后端打包、写接口 smoke dry-run 和 MVP 主验证。

主要代码：

- `backend/shared/src/main/java/com/trainmark/shared/dto/SubmissionSummary.java`
- `backend/file-service/src/main/java/com/trainmark/file/InMemoryUploadStore.java`
- `backend/file-service/src/main/java/com/trainmark/file/JdbcUploadStore.java`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/api/types.ts`
- `apps/web/src/components/TeacherAiPipeline.tsx`
- `apps/web/src/components/TeacherDashboard.tsx`
- `README.md`
- `docs/API.md`
- `PROGRESS.md`

### 61.5 教师端真实工作区指标

- 已将教师端顶部“进行中任务、待 AI 批改、待教师复核、未提交学生”从固定 mock 数字改为当前工作区数据派生。
- 进行中任务按当前课程任务状态计算，待批改按批改队列未完成提交数汇总。
- 待复核按复核结果中 `NEEDS_REVIEW` / `IN_REVIEW` 数量计算，未提交学生复用当前任务收交概览。
- 已更新指标趋势文案，避免 HTTP 模式下继续展示静态演示语义。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建和 MVP 主验证。

主要代码：

- `apps/web/src/pages/App.tsx`
- `README.md`
- `PROGRESS.md`

### 61.6 学生端写操作后工作区刷新

- 已为学生端工作台增加写操作后的工作区刷新回调。
- 学生上传报告成功后，会保留本地即时回执和任务状态，并在 HTTP 模式下重新读取工作区数据。
- 学生提交申诉成功后，会先把新申诉加入当前列表，再触发工作区刷新，避免真实接口数据长期停留在写入前状态。
- Mock 模式下刷新回调为 no-op，继续保持单前端演示行为。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建和 MVP 主验证。

主要代码：

- `apps/web/src/pages/App.tsx`
- `apps/web/src/components/StudentDashboard.tsx`
- `README.md`
- `PROGRESS.md`

### 61.7 教师端写操作后工作区刷新

- 已为教师端工作台增加写操作后的工作区刷新回调。
- 创建任务、创建评分标准、启动 AI 批改、启动 OCR、启动查重、创建导出、一键催交、复核改分、复核通过、发布/撤回成绩和处理申诉后，会在保留本地即时反馈的同时重新读取 HTTP 工作区数据。
- 该刷新链路会同步任务列表、评分标准、批改队列、OCR 队列、查重队列、导出列表、复核结果、发布审计、申诉列表和顶部指标，减少真实联调时的旧数据停留。
- Mock 模式下刷新回调为 no-op，继续保持单前端演示行为。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建和 MVP 主验证。

主要代码：

- `apps/web/src/pages/App.tsx`
- `apps/web/src/components/TeacherDashboard.tsx`
- `README.md`
- `PROGRESS.md`

### 61.8 教师端批改队列刷新去重

- 已修复教师端启动 AI 批改后，本地即时任务与 HTTP 刷新回来的同一批改任务可能重复展示的问题。
- 批改队列展示会按任务 ID 过滤本地即时任务和上游任务列表，避免同一个 job 在刷新间隙出现两张卡片。
- 当上游 `gradingJobs` 已包含本地即时启动的任务时，会自动清空 `startedJob`，让后续状态完全以工作区数据为准。
- 本模块已通过前端 lint、前端构建和 MVP 主验证。

主要代码：

- `apps/web/src/components/TeacherDashboard.tsx`
- `PROGRESS.md`

### 61.9 管理端组织与账号创建

- 已在管理端目录面板新增“新增组织”和“新增账号”表单，支持学院/专业/班级节点与学生、教师、课程负责人、督导、管理员账号。
- 已扩展前端 HTTP API 层，HTTP 模式下分别调用 `POST /api/organizations` 和 `POST /api/users`，Mock 模式下写入本地目录数据。
- 已让 HTTP 工作区额外读取 `/api/users` 全量目录，管理端展示全角色账号；教师端名单仍使用 `/api/users?role=STUDENT`。
- 新增组织/账号成功后会保留本地即时反馈，并触发工作区刷新同步后端真实目录。
- 已将组织和用户创建纳入 `SMOKE_INCLUDE_WRITES=1` 的 API smoke 清单。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建、写接口 smoke dry-run 和 MVP 主验证。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/components/AdminDashboard.tsx`
- `apps/web/src/pages/App.tsx`
- `scripts/smoke-api.sh`
- `README.md`
- `PROGRESS.md`

### 61.10 管理端系统配置写入

- 已为管理端系统配置增加 `PATCH /api/admin/settings/{key}` 接口，支持更新 AI、文件、导出、通知和敏感配置项，并同步补充 API 文档。
- 已扩展系统配置 store，内存模式会保留敏感配置真实值并在返回时脱敏，JDBC 模式会写入 `system_settings.setting_value` 并继续对敏感配置脱敏返回。
- 已新增 admin-service 异常处理器，覆盖请求校验、请求体解析、业务参数错误和存储异常。
- 已扩展前端 HTTP/mock API，管理端系统配置面板可直接编辑配置值并刷新工作区。
- 已将系统配置更新纳入 `SMOKE_INCLUDE_WRITES=1` 的 API smoke 清单。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建、admin-service 打包、写接口 smoke dry-run 和 MVP 主验证。

主要代码：

- `backend/shared/src/main/java/com/trainmark/shared/dto/UpdateSystemSettingRequest.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/SystemSettingController.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/SystemSettingService.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/SystemSettingStore.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/InMemorySystemSettingStore.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/JdbcSystemSettingStore.java`
- `backend/admin-service/src/main/java/com/trainmark/admin/AdminExceptionHandler.java`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/components/AdminDashboard.tsx`
- `apps/web/src/styles/global.css`
- `scripts/smoke-api.sh`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 61.11 教师端学生名单导入写入

- 已将教师端学生名单导入从静态展示升级为可写表单，支持粘贴 `学号,姓名,邮箱,手机号` 行并选择导入班级。
- 已扩展前端 HTTP API 层，HTTP 模式下调用 `POST /api/users/students/import`，Mock 模式下写入本地学生目录并返回导入结果。
- 导入完成后教师端会展示本次处理数量、创建数量、跳过数量和最多 3 条告警，并刷新学生列表。
- 已将学生名单导入纳入 `SMOKE_INCLUDE_WRITES=1` 的 API smoke 清单。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建、写接口 smoke dry-run 和 MVP 主验证。

主要代码：

- `apps/web/src/api/types.ts`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/api/mockApi.ts`
- `apps/web/src/components/TeacherDashboard.tsx`
- `apps/web/src/components/TeacherRosterPanel.tsx`
- `apps/web/src/styles/global.css`
- `scripts/smoke-api.sh`
- `README.md`
- `PROGRESS.md`

### 61.12 前端 HTTP 登录接入

- 已将前端角色切换从纯 Mock 登录升级为 HTTP 模式下调用 `POST /api/auth/login`，并在登录成功后保存 access token 和 refresh token。
- 已保留 Mock 模式回退，后端未启动或未启用 HTTP API 时仍可直接使用本地演示数据。
- 已将 URL 初始角色解析和顶部角色切换统一走 `loginAsRole`，保证 HTTP 模式下切换老师、学生、管理员、课程负责人和督导时拿到对应登录身份。
- 已扩展 auth-service 的演示登录身份映射，支持 `teacher`、`student`、`admin`、`owner`、`supervisor` 生成对应角色 profile。
- 已将 `POST /api/auth/login` 纳入 API smoke 清单。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建、auth-service 打包、写接口 smoke dry-run 和 MVP 主验证。

主要代码：

- `backend/auth-service/src/main/java/com/trainmark/auth/AuthService.java`
- `apps/web/src/api/types.ts`
- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/components/AppChrome.tsx`
- `scripts/smoke-api.sh`
- `README.md`
- `PROGRESS.md`

### 62. 数据库迁移版本修复

- 已修复 demo 数据和上传会话迁移文件与既有迁移版本号重复的问题。
- 已将 demo 用户组织迁移调整为 `V6__seed_demo_directory.sql`。
- 已将 demo 课程班级任务迁移调整为 `V7__seed_demo_courses.sql`。
- 已将上传会话迁移调整为 `V8__upload_sessions.sql`。
- 已同步更新 `infra/postgres/init.sql`，避免 Docker PostgreSQL 首次初始化引用旧文件名。

主要代码：

- `backend/db/migration/V6__seed_demo_directory.sql`
- `backend/db/migration/V7__seed_demo_courses.sql`
- `backend/db/migration/V8__upload_sessions.sql`
- `infra/postgres/init.sql`
- `PROGRESS.md`

### 63. 催交通知 PostgreSQL 存储

- 已将通知服务拆成 `NotificationStore` 存储接口，默认仍使用内存实现，保证无数据库环境下的开发和 smoke 不受影响。
- 已新增 `JdbcNotificationStore`，设置 `TRAINMARK_NOTIFICATION_STORE=jdbc` 后可从 PostgreSQL 计算提交收集概览和未交学生名单。
- JDBC 模式下，一键催交会按学生和渠道写入 `notification_events` 表，并返回实际消息数。
- 已为 `notification-service` 增加 PostgreSQL JDBC runtime 驱动，并通过环境变量配置 JDBC URL、用户名和密码。
- 已补充迁移 `V9__notification_events.sql`，并纳入 Docker PostgreSQL 首次初始化流程。
- 已在 README、infra README 和 `.env.example` 中补充通知 JDBC 模式说明。

主要代码：

- `backend/notification-service/src/main/java/com/trainmark/notification/NotificationStore.java`
- `backend/notification-service/src/main/java/com/trainmark/notification/InMemoryNotificationStore.java`
- `backend/notification-service/src/main/java/com/trainmark/notification/JdbcNotificationStore.java`
- `backend/notification-service/src/main/java/com/trainmark/notification/ReminderService.java`
- `backend/db/migration/V9__notification_events.sql`
- `infra/postgres/init.sql`
- `.env.example`
- `README.md`
- `infra/README.md`
- `PROGRESS.md`

### 64. 认证服务 PostgreSQL 用户读取

- 已为 auth-service 增加 `AuthUserStore`，默认内存模式继续保留演示身份映射，避免无数据库环境影响本地 MVP 演示。
- 已新增 `JdbcAuthUserStore`，设置 `TRAINMARK_AUTH_STORE=jdbc` 后可从 PostgreSQL 的 `users`、`user_roles`、`roles` 读取登录用户与角色。
- JDBC 模式支持按 `username`、`student_no`、`teacher_no` 精确登录，并兼容前端角色切换使用的 `student` / `teacher` / `admin` 等演示别名。
- `/api/auth/me` 已支持解析登录返回的 bearer access token 并回查当前用户，无 token 时继续回退教师演示身份。
- API smoke 已改为登录后携带 access token 检查 `/api/auth/me`。
- 已在 API 文档、README 和 `.env.example` 补充认证 JDBC 模式配置。
- 本模块已通过 auth-service 打包、写接口 smoke dry-run 和 MVP 主验证。

主要代码：

- `backend/auth-service/src/main/java/com/trainmark/auth/AuthUserStore.java`
- `backend/auth-service/src/main/java/com/trainmark/auth/InMemoryAuthUserStore.java`
- `backend/auth-service/src/main/java/com/trainmark/auth/JdbcAuthUserStore.java`
- `backend/auth-service/src/main/java/com/trainmark/auth/AuthService.java`
- `backend/auth-service/src/main/java/com/trainmark/auth/AuthController.java`
- `backend/auth-service/src/main/resources/application.yml`
- `backend/auth-service/pom.xml`
- `scripts/smoke-api.sh`
- `docs/API.md`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 65. 认证接口统一错误响应

- 已为 auth-service 增加 `AuthExceptionHandler`，统一处理请求校验失败、非法参数、请求体解析失败和认证存储异常。
- 登录请求字段缺失时会返回 `ApiResponse` 包装的字段错误，避免真实联调时暴露默认 Spring 错误体。
- JDBC 认证存储异常会返回统一失败响应，保持 auth-service 与 grading、file、ocr、admin 等服务的错误响应风格一致。
- 本模块已通过 auth-service 打包、API smoke dry-run 和 MVP 主验证。

主要代码：

- `backend/auth-service/src/main/java/com/trainmark/auth/AuthExceptionHandler.java`
- `PROGRESS.md`

### 66. 前端 HTTP 请求携带登录 Token

- 已让前端 HTTP 数据层在读取接口、JSON 写接口和上传内容接口中自动携带 `Authorization: Bearer <accessToken>`。
- 登录请求本身不依赖旧 token，登录成功后继续写入 `localStorage`，登录失败回退 Mock 时会清除旧 token，避免后续真实请求继续使用过期身份。
- 已保留 Mock 模式行为不变，只有 `VITE_API_MODE=http` 下的 HTTP 请求会携带 token。
- 已更新 README 当前进度。
- 本模块已通过前端 lint、前端构建、写接口 smoke dry-run 和 MVP 主验证。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `README.md`
- `PROGRESS.md`

### 67. 前端五类角色切换入口

- 已将顶部角色切换从教师、学生、管理端扩展为教师、学生、课程负责人、督导和管理端五类角色。
- 已补充 URL 角色参数解析，支持 `role=course_owner`、`role=owner` 和 `role=supervisor` 直达对应身份。
- 课程负责人和督导继续复用教师工作台主链路，并在 hero 区展示对应角色文案，避免新增未闭环页面。
- 本模块已通过前端 lint、前端构建和 MVP 主验证。

主要代码：

- `apps/web/src/components/AppChrome.tsx`
- `apps/web/src/pages/App.tsx`
- `README.md`
- `PROGRESS.md`

### 68. MVP 服务统一错误响应补齐

- 已为用户、课程、通知、查重和统计服务补齐 `@RestControllerAdvice`，使参数校验失败、非法参数、非法请求体和存储异常都返回统一 `ApiResponse`。
- 用户、课程、通知和查重服务与既有 auth/file/grading/ocr/admin 异常处理器保持一致；统计服务额外覆盖缺失查询参数和查询参数类型错误。
- 已保留正常业务接口行为不变，API smoke dry-run 的读写端点清单保持通过。
- 本模块已通过多服务后端编译、写接口 smoke dry-run 和 MVP 主验证。

主要代码：

- `backend/user-service/src/main/java/com/trainmark/user/UserExceptionHandler.java`
- `backend/course-service/src/main/java/com/trainmark/course/CourseExceptionHandler.java`
- `backend/notification-service/src/main/java/com/trainmark/notification/NotificationExceptionHandler.java`
- `backend/similarity-service/src/main/java/com/trainmark/similarity/SimilarityExceptionHandler.java`
- `backend/analytics-service/src/main/java/com/trainmark/analytics/AnalyticsExceptionHandler.java`
- `PROGRESS.md`

### 69. JDBC 模式一键 MVP 联调入口

- 已新增 `pnpm dev:mvp:jdbc`，用于启动 Docker Compose 基础设施，并将认证、用户、课程、文件、OCR、批改、通知、查重、统计和管理端服务统一切换到 PostgreSQL/JDBC 模式。
- 脚本复用现有 `scripts/dev-mvp.sh`，保持后端总控、API smoke 等待和 HTTP 前端启动链路一致，避免维护两套联调流程。
- 已支持 `TRAINMARK_SKIP_INFRA=1` 跳过基础设施启动，便于本机已有 Docker Compose 环境时复用同一入口。
- 已将新启动脚本纳入 `pnpm verify:mvp` 的 shell 语法检查。
- 本模块已通过脚本语法检查、`package.json` 解析校验和 MVP 主验证。

主要代码：

- `scripts/dev-mvp-jdbc.sh`
- `scripts/verify-mvp.sh`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 70. JDBC MVP 联调实跑修复

- 已新增 `scripts/apply-db-migrations.sh`，在复用已有 PostgreSQL volume 且缺少核心表时按版本顺序应用本地 SQL 迁移；检测到 `users` 表存在时会幂等跳过。
- 已将本地 TrainMark PostgreSQL 默认宿主机端口调整为 `55432`，并同步 Docker Compose、环境示例、备份/恢复脚本、JDBC launcher 和文档，避免误连宿主机已有的 `5432` PostgreSQL。
- 已在 `dev:mvp:jdbc` 启动链路中自动执行数据库迁移检查，并保留 `TRAINMARK_SKIP_DB_MIGRATIONS=1` 跳过开关。
- 已为后端控制器补齐显式 `@RequestParam(name = ...)` 和 `@PathVariable("...")` 绑定，避免 `spring-boot:run` 实跑时依赖 Java 参数名反射。
- 本模块已通过 Docker Compose PostgreSQL 55432 配置检查、迁移脚本幂等检查、宿主机 psql 演示用户查询、注解绑定扫描、MVP 主验证，以及 `TRAINMARK_SKIP_INFRA=1 SMOKE_RETRIES=90 SMOKE_RETRY_DELAY_SECONDS=2 timeout 300s pnpm dev:mvp:jdbc` 实跑 smoke。

主要代码：

- `scripts/apply-db-migrations.sh`
- `scripts/dev-mvp-jdbc.sh`
- `infra/docker-compose.yml`
- `.env.example`
- `scripts/backup.sh`
- `scripts/restore.sh`
- `scripts/verify-mvp.sh`
- `package.json`
- `backend/*-service/src/main/java/com/trainmark/**/*`
- `README.md`
- `PROGRESS.md`

### 71. 前端 HTTP 严格联调模式

- 已新增 `VITE_API_STRICT_HTTP=1` 前端开关；HTTP 模式下开启后，登录、查询、上传和写操作失败会抛出真实接口错误，不再静默回退 mock 数据。
- 已在应用外壳中展示 HTTP API 联调失败提示，并在恢复成功后清除错误状态，便于一键 MVP 联调时快速定位后端或网关问题。
- 已让 `pnpm dev:mvp` 默认以 `VITE_API_MODE=http` 和 `VITE_API_STRICT_HTTP=1` 启动前端，保留手动 `VITE_API_STRICT_HTTP=0` 的分服务开发兜底能力。
- 已同步 `.env.example` 和 `README.md`，明确普通 HTTP 模式的 mock 兜底与严格联调模式边界。
- 本模块已通过前端 lint、前端生产构建和 MVP launcher 脚本语法检查。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `scripts/dev-mvp.sh`
- `.env.example`
- `README.md`
- `PROGRESS.md`

### 72. JDBC 演示全角色种子与登录冒烟

- 已新增 `V12__seed_extended_demo_roles.sql`，为 JDBC 演示库补齐课程负责人 `owner` 和督导 `supervisor` 账号，并分别绑定 `COURSE_OWNER` 与 `SUPERVISOR` 角色。
- 已让本地数据库迁移脚本在核心表已存在时仍幂等执行扩展演示角色种子，保证旧 PostgreSQL volume 也能补齐全角色联调数据。
- 已扩展 API smoke 脚本，覆盖 teacher、student、course owner、supervisor 和 admin 五类登录与 `/api/auth/me` 角色校验。
- 本模块已通过迁移脚本语法检查、smoke dry-run、现有 55432 PostgreSQL 迁移补齐查询验证。

主要代码：

- `backend/db/migration/V12__seed_extended_demo_roles.sql`
- `scripts/apply-db-migrations.sh`
- `scripts/smoke-api.sh`
- `README.md`
- `PROGRESS.md`

### 73. JDBC 认证禁用未知账号 mock 回退

- 已为 `AuthUserStore` 增加 mock 回退能力开关，内存模式继续保留任意演示账号登录，JDBC 模式关闭未知账号 mock 回退。
- JDBC 模式下登录未知账号会返回统一 `ApiResponse` 错误 `Invalid username or password`，无效或缺失 token 访问 `/api/auth/me` 会返回 `Authentication is required`。
- 已保留 JDBC 演示角色别名登录能力，`teacher`、`student`、`owner`、`supervisor` 和 `admin` 仍会映射到数据库中的真实演示用户。
- 本模块已通过 auth-service 编译、API smoke dry-run，以及单独启动 JDBC auth-service 后的 owner 登录、未知账号登录失败和无 token `/api/auth/me` 失败 live 验证。

主要代码：

- `backend/auth-service/src/main/java/com/trainmark/auth/AuthUserStore.java`
- `backend/auth-service/src/main/java/com/trainmark/auth/JdbcAuthUserStore.java`
- `backend/auth-service/src/main/java/com/trainmark/auth/AuthService.java`
- `README.md`
- `PROGRESS.md`

### 74. Auth Refresh 保持当前身份

- 已将 `/api/auth/refresh` 从固定返回 teacher mock 改为读取 `Authorization` bearer token，并基于当前用户重新签发 access/refresh token。
- 已复用 JDBC 认证的严格行为：JDBC 模式下缺失、无效或不存在的 token 不再回退 teacher；内存模式仍保留无后端数据库时的演示兜底。
- 已扩展 API smoke 脚本，teacher、student、course owner、supervisor 和 admin 五类登录后都会继续调用 refresh，并校验刷新后的用户角色不漂移。
- 已同步 `docs/API.md`，将 refresh 请求说明从 `none` 改为 bearer access token。
- 本模块已通过 auth-service 编译、smoke dry-run，以及单独启动 JDBC auth-service 后的 owner 登录加 refresh live 验证。

主要代码：

- `backend/auth-service/src/main/java/com/trainmark/auth/AuthController.java`
- `backend/auth-service/src/main/java/com/trainmark/auth/AuthService.java`
- `scripts/smoke-api.sh`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 75. Auth Logout 校验当前身份

- 已将 `/api/auth/logout` 从无条件成功改为读取 `Authorization` bearer token，并复用当前认证用户解析逻辑。
- JDBC 模式下缺失、无效或不存在的 token 调用 logout 会返回统一认证错误；内存模式继续保留演示兜底。
- 已扩展 API smoke 脚本，teacher、student、course owner、supervisor 和 admin 五类登录后都会继续调用 logout，避免登出接口在严格 HTTP/JDBC 联调中退化为空操作。
- 已同步 `docs/API.md`，将 logout 请求说明从 `none` 改为 bearer access token。
- 本模块已通过 auth-service 编译、smoke dry-run、MVP 主验证，以及单独启动 JDBC auth-service 后的 owner token logout 成功和无 token logout 失败 live 验证。

主要代码：

- `backend/auth-service/src/main/java/com/trainmark/auth/AuthController.java`
- `backend/auth-service/src/main/java/com/trainmark/auth/AuthService.java`
- `scripts/smoke-api.sh`
- `docs/API.md`
- `README.md`
- `PROGRESS.md`

### 76. 前端 Auth Refresh/Logout 联调

- 已让前端 HTTP 模式启动时优先使用本地 access token 调用 `/api/auth/refresh` 恢复当前身份，token 对应角色与 URL 角色一致时直接复用刷新后的用户。
- 已新增前端 `/api/auth/logout` 调用，顶部操作区提供退出登录图标按钮，退出后清理本地 token 并按当前 URL 角色重新进入演示登录态。
- 已让无请求体的 auth POST 请求不再发送 JSON body，适配 refresh/logout 这类只依赖 bearer token 的后端接口。
- Mock 模式继续保留本地演示行为，不依赖后端认证接口。
- 本模块已通过前端 lint、前端生产构建和 MVP 主验证。

主要代码：

- `apps/web/src/api/httpApi.ts`
- `apps/web/src/pages/App.tsx`
- `apps/web/src/components/AppChrome.tsx`
- `README.md`
- `PROGRESS.md`

### 77. JDBC 严格认证 Smoke 脚本

- 已新增 `scripts/smoke-auth-strict.sh`，用于单独验证 JDBC/严格认证模式下的 auth-service token 行为。
- 脚本覆盖 owner 登录、`/api/auth/me`、`/api/auth/refresh`、`/api/auth/logout` 正向链路，并校验缺 token refresh/logout 与未知用户 token refresh 的失败响应。
- 已新增 `pnpm smoke:auth:strict` 命令，避免把严格认证负向断言混入默认内存模式 API smoke。
- 已在 README 验证命令中补充严格认证 smoke 的使用入口。
- 本模块已通过脚本语法检查、`package.json` 解析、strict auth smoke dry-run，以及单独启动 JDBC auth-service 后的 strict auth smoke live 验证。

主要代码：

- `scripts/smoke-auth-strict.sh`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 78. MVP 主验证纳入严格认证 Smoke 清单

- 已将 `SMOKE_DRY_RUN=1 pnpm smoke:auth:strict` 纳入 `scripts/verify-mvp.sh`，让主验证链固定检查严格认证 smoke 脚本入口和断言清单。
- 保留 strict auth 的 live 验证为手动命令，避免默认 MVP 验证依赖正在运行的 JDBC auth-service。
- 本模块已通过 `verify-mvp.sh` 语法检查、strict auth smoke dry-run 和 MVP 主验证。

主要代码：

- `scripts/verify-mvp.sh`
- `PROGRESS.md`

### 79. 当前剩余工作清单收口

- 已更新 README “下一步”，移除已经完成的 PostgreSQL/Flyway、前端 HTTP 模式和 Docker Compose 联调旧条目。
- 已将剩余工作聚焦到真实 AI provider 替换、strict HTTP/JDBC live smoke、测试依赖、前端组件拆分和生产化边界验证。
- 已同步本文件 “接下来需要做”，避免后续继续按过期任务重复实现已完成模块。

主要代码：

- `README.md`
- `PROGRESS.md`

### 80. Strict HTTP/JDBC Smoke-Only 入口

- 已为 `scripts/dev-mvp.sh` 增加 `TRAINMARK_MVP_SMOKE_ONLY=1`，允许后端服务通过 API smoke 后直接退出，不再继续占用前端 dev server 端口。
- 已增加 `TRAINMARK_STRICT_AUTH_SMOKE=1` 开关，让同一条后端启动链在服务就绪后继续执行严格认证 token 正负路径 smoke。
- 已新增 `pnpm smoke:mvp:jdbc`，复用 `dev:mvp:jdbc` 的基础设施启动、迁移检查和 JDBC 环境变量，作为 strict HTTP/JDBC live smoke 的可重复入口。
- 已修正 API smoke 对 refresh 响应的角色断言，兼容 profile 响应的 `data.roles` 与 refresh/login 响应的 `data.user.roles`。
- 本模块已通过脚本语法检查、API smoke dry-run、`TRAINMARK_SKIP_INFRA=1 SMOKE_RETRIES=90 SMOKE_RETRY_DELAY_SECONDS=2 timeout 480s pnpm smoke:mvp:jdbc` live 验证，以及 MVP 主验证。

主要代码：

- `scripts/dev-mvp.sh`
- `scripts/smoke-api.sh`
- `package.json`
- `README.md`
- `PROGRESS.md`

### 81. Strict HTTP/JDBC 写路径 Smoke 查重闭环

- 已修正 `SMOKE_INCLUDE_WRITES=1` live smoke 的查重输入，不再固定使用可能不存在的提交 ID `[1,2]`。
- 写路径 smoke 现在会捕获本轮创建的学生 ID，并额外完成第二份真实上传，随后用两个实际 `submissionId` 发起查重任务，避免 JDBC 外键约束导致 similarity 写接口 500。
- 已实跑 `SMOKE_INCLUDE_WRITES=1 TRAINMARK_SKIP_INFRA=1 SMOKE_RETRIES=90 SMOKE_RETRY_DELAY_SECONDS=2 timeout 600s pnpm smoke:mvp:jdbc`，覆盖登录、上传、任务、rubric、批改、OCR、复核、发布、申诉、导出、催交、查重和 strict auth。

主要代码：

- `scripts/smoke-api.sh`
- `PROGRESS.md`

### 82. Strict HTTP/JDBC 写路径 Smoke 字段断言

- 已为 API smoke 增加通用 JSON 字段断言，live 写路径不再只依赖 HTTP 成功和 `ApiResponse.success=true`。
- 已覆盖组织类型、用户角色、学生导入数量、管理配置值、上传回执、任务状态、rubric 总分、批改任务状态、复核状态、发布状态、申诉处理状态、导出状态、催交状态和查重任务提交数量等关键字段。
- 已保持 `SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api` 的端点清单完整输出，并实跑带字段断言的 `SMOKE_INCLUDE_WRITES=1 TRAINMARK_SKIP_INFRA=1 SMOKE_RETRIES=90 SMOKE_RETRY_DELAY_SECONDS=2 timeout 600s pnpm smoke:mvp:jdbc`。

主要代码：

- `scripts/smoke-api.sh`
- `PROGRESS.md`

## 已验证

前端构建已通过：

```bash
pnpm build:web
```

人工复核、成绩发布、学生申诉相关后端模块已通过编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

统计分析相关后端模块已通过编译：

```bash
mvn -f backend/pom.xml -pl analytics-service -am package -DskipTests
```

查重与网关模块已通过编译：

```bash
mvn -f backend/pom.xml -pl similarity-service,gateway-service -am package -DskipTests
```

前端 HTTP API 数据层已通过构建：

```bash
pnpm build:web
```

评阅域持久化迁移加入后，后端全模块打包仍通过：

```bash
mvn -f backend/pom.xml package -DskipTests
```

前端 ESLint 静态检查已通过：

```bash
pnpm --filter trainmark-ai-web lint
```

MVP 接口文档已根据当前控制器注解和 gateway 路由核对：

```bash
rg -n "@(GetMapping|PostMapping|PatchMapping|RequestMapping)" backend/*-service/src/main/java -g "*.java"
```

前端页面外壳组件拆分后已通过静态检查和构建：

```bash
pnpm lint:web
pnpm build:web
```

学生端工作台组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

管理端工作台组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端 AI 流水线组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端人工复核组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端成绩分析组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端收集催交组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端查重检测组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端申诉处理组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端课程任务组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端名单组织组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端运维能力组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端工作台容器组件拆分后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

前端 HTTP 写操作联调已通过静态检查和构建：

```bash
pnpm lint:web
pnpm build:web
```

前端申诉数据源联调修正后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

前端实训任务创建联调后已通过静态检查和构建：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

前端学生任务数据源联调后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

前端学生提交任务绑定后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

前端学生申诉状态同步后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

前端学生提交即时状态反馈后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

前端评分标准创建联调后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

前端批改提交数据联调后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

Gateway 本地跨域配置加入后模块打包通过：

```bash
mvn -f backend/pom.xml -pl gateway-service -am package -DskipTests
```

成绩导出 MVP 已通过后端模块编译、前端静态检查和构建：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
pnpm lint:web
pnpm build:web
```

MVP 回归验证脚本已通过：

```bash
pnpm verify:mvp
```

本地 OCR 结构化 Provider 已通过后端模块编译、前端静态检查和构建：

```bash
mvn -f backend/pom.xml -pl ocr-service -am package -DskipTests
pnpm lint:web
pnpm build:web
```

本地规则评分 Provider 已通过后端模块编译、前端静态检查和构建：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
pnpm lint:web
pnpm build:web
```

管理端审计日志已通过后端模块编译、前端静态检查和构建：

```bash
mvn -f backend/pom.xml -pl admin-service,gateway-service -am package -DskipTests
pnpm lint:web
pnpm build:web
```

管理端系统配置已通过后端模块编译、前端静态检查和构建：

```bash
mvn -f backend/pom.xml -pl admin-service -am package -DskipTests
pnpm lint:web
pnpm build:web
```

PWA 安装与离线外壳已通过前端静态检查和构建，构建产物包含 manifest、service worker 和图标资源：

```bash
pnpm lint:web
pnpm build:web
find apps/web/dist -maxdepth 3 -type f | sort
```

PWA 角色快捷入口已通过前端静态检查和构建：

```bash
pnpm lint:web
pnpm build:web
```

本地备份脚本与环境默认值已通过脚本语法检查和 Docker Compose 配置展开校验：

```bash
bash -n scripts/backup.sh
bash -n scripts/verify-mvp.sh
docker compose -f infra/docker-compose.yml config
```

本地恢复脚本已通过脚本语法检查：

```bash
bash -n scripts/restore.sh
```

API 冒烟检查脚本已通过脚本语法检查和 dry-run 端点清单验证：

```bash
bash -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 pnpm smoke:api
```

本地发布包脚本已通过脚本语法检查；构建链路由 `pnpm verify:mvp` 覆盖：

```bash
bash -n scripts/deploy.sh
pnpm verify:mvp
```

OCR Provider CLI 契约已通过 Python 编译检查和样例输出验证：

```bash
python3 -m py_compile ai/ocr/local_provider.py
python3 ai/ocr/local_provider.py --job-id 1001 --submission-id 1 --object-key assignments/1/students/2/database-report.pdf
python3 ai/ocr/local_provider.py --job-id 1002 --submission-id 2 --object-key assignments/1/students/3/screenshot.png
```

评分 Provider CLI 契约已通过 Python 编译检查和默认 / 自定义 rubric 样例输出验证：

```bash
python3 -m py_compile ai/scoring/local_provider.py
python3 ai/scoring/local_provider.py --result-id 2001 --assignment-id 1 --submission-id 7 --student-id 2 --student-name 张三 --student-no 2024010101
python3 ai/scoring/local_provider.py --result-id 2002 --assignment-id 1 --submission-id 8 --student-id 3 --student-name 李四 --student-no 2024010102 --rubric-file ai/scoring/sample-rubric.json
```

批注 PDF Provider CLI 契约已通过 Python 编译检查、PDF 生成和文件类型验证：

```bash
python3 -m py_compile ai/annotation/local_provider.py
python3 ai/annotation/local_provider.py --result-id 3001 --submission-id 7 --student-name 张三 --output-dir "$(mktemp -d)"
file /tmp/*/annotated-7.pdf
```

AI Provider 验证脚本已通过：

```bash
pnpm verify:ai
```

关键词规则评分引擎已通过 AI 契约验证、grading 模块编译和单服务接口验证：

```bash
pnpm verify:ai
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
bash scripts/dev-service.sh grading-service
curl --noproxy '*' -fsS -X POST http://localhost:8085/api/grading/jobs -H 'Content-Type: application/json' -d '{"assignmentId":1,"rubricId":1,"submissionIds":[901]}'
curl --noproxy '*' -fsS 'http://localhost:8085/api/grading/results?assignmentId=1'
pnpm verify:mvp
```

批注 PDF 摘要生成已通过 grading 模块编译和单服务下载验证：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
bash scripts/dev-service.sh grading-service
curl --noproxy '*' -fsS -X POST http://localhost:8085/api/grading/jobs -H 'Content-Type: application/json' -d '{"assignmentId":1,"rubricId":1,"submissionIds":[902]}'
curl --noproxy '*' -fsS http://localhost:8085/annotations/submissions/902/annotated.pdf > /tmp/trainmark-annotated-902.pdf
head -c 8 /tmp/trainmark-annotated-902.pdf | grep -q '%PDF-1.'
grep -a 'Score:' /tmp/trainmark-annotated-902.pdf
grep -a 'Items:' /tmp/trainmark-annotated-902.pdf
pnpm verify:mvp
```

文档预处理 Provider 和 OCR 后端接入已通过 CLI、模块编译和单服务接口验证：

```bash
pnpm verify:ai
mvn -f backend/pom.xml -pl ocr-service -am package -DskipTests
curl --noproxy '*' --fail --silent --show-error -H 'Content-Type: application/json' \
  -d '{"submissionId":77,"objectKey":"assignments/1/students/2/database-report.docx","mode":"STRUCTURE"}' \
  http://localhost:8086/api/ocr/jobs
curl --noproxy '*' --fail --silent --show-error http://localhost:8086/api/ocr/jobs/2/result
```

文档预处理命令 Provider 已通过 AI 契约验证、OCR 模块编译和 command 模式单服务接口验证：

```bash
pnpm verify:ai
mvn -f backend/pom.xml -pl ocr-service -am package -DskipTests
DOCUMENT_PREPROCESSOR_PROVIDER=command DOCUMENT_PREPROCESSOR_COMMAND="python3 ai/document/local_converter.py --submission-id {submissionId} --object-key {objectKey}" bash scripts/dev-service.sh ocr-service
curl --noproxy '*' -fsS -X POST http://localhost:8086/api/ocr/jobs -H 'Content-Type: application/json' -d '{"submissionId":1,"objectKey":"assignments/1/students/2/database-report.docx","mode":"STRUCTURE"}'
curl --noproxy '*' -fsS http://localhost:8086/api/ocr/jobs/2/result
pnpm verify:mvp
```

MVP 主验证已覆盖 AI Provider 验证：

```bash
pnpm verify:mvp
```

OCR 后端 Provider 切换已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl ocr-service -am package -DskipTests
```

评分后端 Provider 切换已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

上传格式与完成校验已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl file-service -am package -DskipTests
```

上传错误统一响应已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl file-service -am package -DskipTests
```

AI Provider 错误统一响应已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl ocr-service,grading-service -am package -DskipTests
```

MVP 冒烟端点覆盖已通过脚本语法检查和 dry-run：

```bash
bash -n scripts/smoke-api.sh
bash -n scripts/verify-mvp.sh
SMOKE_DRY_RUN=1 pnpm smoke:api
```

批注后端 Provider 切换已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

批注 PDF 查看入口已通过前端静态检查和构建：

```bash
pnpm lint:web
pnpm build:web
```

HTTP 资源链接解析已通过前端静态检查和构建：

```bash
pnpm lint:web
pnpm build:web
```

成绩导出下载入口已通过前端静态检查和构建：

```bash
pnpm lint:web
pnpm build:web
```

批注与导出资源下载已通过后端模块编译和 API 冒烟 dry-run：

```bash
mvn -f backend/pom.xml -pl grading-service,gateway-service -am package -DskipTests
SMOKE_DRY_RUN=1 pnpm smoke:api
```

API 冒烟等待重试已通过脚本语法检查和 dry-run：

```bash
bash -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 SMOKE_RETRIES=2 SMOKE_RETRY_DELAY_SECONDS=1 pnpm smoke:api
```

MVP 一键联调脚本已通过脚本语法检查：

```bash
bash -n scripts/dev-mvp.sh
```

写接口冒烟检查已通过脚本语法检查和 dry-run：

```bash
bash -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
```

后端开发启动脚本已通过脚本语法检查和单服务启动验证：

```bash
bash -n scripts/dev-backend.sh
bash -n scripts/dev-service.sh
timeout 25s bash scripts/dev-service.sh auth-service
```

本地冒烟代理旁路已通过脚本语法检查：

```bash
bash -n scripts/smoke-api.sh
```

Spring MVC 参数名保留已通过后端全量编译：

```bash
mvn -f backend/pom.xml clean package -DskipTests
```

后端服务重启后，包含写接口的 live smoke 已通过：

```bash
SMOKE_INCLUDE_WRITES=1 SMOKE_RETRIES=90 SMOKE_RETRY_DELAY_SECONDS=2 pnpm smoke:api
```

扩展后的写接口 smoke 已通过脚本语法检查、dry-run、MVP 主验证和真实 gateway 联调：

```bash
bash -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
SMOKE_RETRIES=60 SMOKE_RETRY_DELAY_SECONDS=2 pnpm smoke:api
SMOKE_INCLUDE_WRITES=1 SMOKE_RETRIES=30 SMOKE_RETRY_DELAY_SECONDS=2 pnpm smoke:api
```

MVP 主验证已自动覆盖写接口 smoke dry-run：

```bash
pnpm verify:mvp
```

API smoke 的读取端点响应体校验已通过主验证和真实 gateway 写入联调：

```bash
pnpm verify:mvp
SMOKE_INCLUDE_WRITES=1 SMOKE_RETRIES=60 SMOKE_RETRY_DELAY_SECONDS=2 pnpm smoke:api
```

写接口 smoke 已覆盖 OCR 任务创建和 OCR 结果读取，并通过脚本语法检查、dry-run、MVP 主验证和真实 gateway 联调：

```bash
bash -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
SMOKE_INCLUDE_WRITES=1 SMOKE_RETRIES=60 SMOKE_RETRY_DELAY_SECONDS=2 pnpm smoke:api
```

用户与组织 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl user-service -am package -DskipTests
```

用户服务默认内存模式已通过单服务启动和目录接口验证：

```bash
timeout 45s bash scripts/dev-service.sh user-service
curl --noproxy '*' http://localhost:8082/api/organizations
curl --noproxy '*' http://localhost:8082/api/users
```

PostgreSQL 迁移挂载已通过 Docker Compose 配置展开：

```bash
docker compose -f infra/docker-compose.yml config
```

课程与任务 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl course-service -am package -DskipTests
```

课程服务默认内存模式已通过单服务启动和课程/班级/任务接口验证：

```bash
timeout 75s bash scripts/dev-service.sh course-service
curl --noproxy '*' http://localhost:8083/api/courses
curl --noproxy '*' http://localhost:8083/api/courses/1/classes
curl --noproxy '*' http://localhost:8083/api/assignments
```

上传与提交 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl file-service -am package -DskipTests
```

文件服务默认内存模式已通过单服务启动和上传/提交接口验证：

```bash
timeout 75s bash scripts/dev-service.sh file-service
curl --noproxy '*' http://localhost:8084/api/submissions
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8084/api/submissions/upload/init
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8084/api/submissions/upload/complete
```

数据库迁移版本号已检查为唯一，Docker Compose 配置可展开：

```bash
ls -1 backend/db/migration
docker compose -f infra/docker-compose.yml config
```

催交通知 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl notification-service -am package -DskipTests
```

通知服务默认内存模式已通过单服务启动和收集/未交/催交接口验证：

```bash
timeout 75s bash scripts/dev-service.sh notification-service
curl --noproxy '*' http://localhost:8089/api/notifications/assignments/1/collection
curl --noproxy '*' http://localhost:8089/api/notifications/assignments/1/unsubmitted
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8089/api/notifications/remind-unsubmitted
```

全部后端模块已通过编译：

```bash
mvn -f backend/pom.xml package -DskipTests
```

Docker Compose 已完成配置展开校验，暂未拉起 PostgreSQL、Redis、RabbitMQ、MinIO 和 Nginx 容器做完整本地联调。

查重任务 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl similarity-service -am package -DskipTests
```

查重服务默认内存模式已通过单服务启动和列表/创建/详情接口验证：

```bash
timeout 75s bash scripts/dev-service.sh similarity-service
curl --noproxy '*' http://localhost:8087/api/similarity/jobs
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8087/api/similarity/jobs
curl --noproxy '*' http://localhost:8087/api/similarity/jobs/2
```

统计分析 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl analytics-service -am package -DskipTests
```

统计分析服务默认内存模式已通过单服务启动和成绩统计/失分点/课程目标接口验证：

```bash
timeout 90s bash scripts/dev-service.sh analytics-service
curl --noproxy '*' 'http://localhost:8091/api/analytics/grade-statistics?assignmentId=1'
curl --noproxy '*' 'http://localhost:8091/api/analytics/loss-points?assignmentId=1'
curl --noproxy '*' 'http://localhost:8091/api/analytics/course-outcomes?assignmentId=1'
```

管理端 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl admin-service -am package -DskipTests
```

管理端默认内存模式已通过单服务启动和审计日志/筛选/系统配置接口验证：

```bash
timeout 90s bash scripts/dev-service.sh admin-service
curl --noproxy '*' 'http://localhost:8090/api/admin/audit-logs'
curl --noproxy '*' 'http://localhost:8090/api/admin/audit-logs?action=GRADE_EXPORT'
curl --noproxy '*' 'http://localhost:8090/api/admin/settings?category=AI'
```

OCR 任务 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl ocr-service -am package -DskipTests
```

OCR 服务默认内存模式已通过单服务启动和任务列表/创建/结果接口验证：

```bash
timeout 90s bash scripts/dev-service.sh ocr-service
curl --noproxy '*' http://localhost:8086/api/ocr/jobs
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8086/api/ocr/jobs
curl --noproxy '*' http://localhost:8086/api/ocr/jobs/2/result
```

评分标准 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

评分服务默认内存模式已通过单服务启动、评分标准读写和批改结果读取验证：

```bash
timeout 90s bash scripts/dev-service.sh grading-service
curl --noproxy '*' 'http://localhost:8085/api/rubrics?assignmentId=1'
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/rubrics
curl --noproxy '*' 'http://localhost:8085/api/grading/results/1'
```

成绩导出 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

评分服务默认内存模式已通过单服务启动、导出列表/创建和评分标准读取验证：

```bash
timeout 90s bash scripts/dev-service.sh grading-service
curl --noproxy '*' 'http://localhost:8085/api/grading/exports?assignmentId=1'
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/exports
curl --noproxy '*' 'http://localhost:8085/api/rubrics?assignmentId=1'
```

成绩发布审计 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

评分服务默认内存模式已通过单服务启动、发布审计列表、撤回写入审计、复核后重新发布写入审计验证：

```bash
timeout 90s bash scripts/dev-service.sh grading-service
curl --noproxy '*' 'http://localhost:8085/api/grading/results/1/publication-audits'
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/1/withdraw
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/1/approve
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/1/publish
```

成绩申诉 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

评分服务默认内存模式已通过单服务启动、申诉列表/筛选、创建申诉、处理申诉和已处理状态筛选验证：

```bash
timeout 90s bash scripts/dev-service.sh grading-service
curl --noproxy '*' 'http://localhost:8085/api/grading/results/appeals'
curl --noproxy '*' 'http://localhost:8085/api/grading/results/appeals?resultId=1&status=SUBMITTED'
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/appeals
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/appeals/2/resolve
curl --noproxy '*' 'http://localhost:8085/api/grading/results/appeals?status=ACCEPTED'
```

批改任务 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

评分服务默认内存模式已通过单服务启动、批改任务列表/创建和任务创建后批改结果读取验证：

```bash
timeout 90s bash scripts/dev-service.sh grading-service
curl --noproxy '*' 'http://localhost:8085/api/grading/jobs?assignmentId=1'
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/jobs
curl --noproxy '*' 'http://localhost:8085/api/grading/results?assignmentId=1'
```

批改结果 PostgreSQL 存储已通过后端模块编译：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
```

评分服务默认内存模式已通过单服务启动、批改结果列表/详情、分项复核、批准、发布、成绩导出行数和批改任务生成新结果验证：

```bash
timeout 90s bash scripts/dev-service.sh grading-service
curl --noproxy '*' 'http://localhost:8085/api/grading/results?assignmentId=1'
curl --noproxy '*' 'http://localhost:8085/api/grading/results/1'
curl --noproxy '*' -X PATCH -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/1/items
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/1/approve
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/1/publish
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/exports
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/jobs
```

评分服务 JDBC 模式已通过临时 PostgreSQL 初始化和真实数据库接口验证：

```bash
docker run --name trainmark-postgres-init-check -p 55432:5432 ...
docker exec trainmark-postgres-init-check psql -U trainmark -d trainmark_ai -Atc '...'
TRAINMARK_GRADING_RUBRIC_STORE=jdbc \
TRAINMARK_GRADING_EXPORT_STORE=jdbc \
TRAINMARK_GRADING_PUBLICATION_AUDIT_STORE=jdbc \
TRAINMARK_GRADING_APPEAL_STORE=jdbc \
TRAINMARK_GRADING_JOB_STORE=jdbc \
TRAINMARK_GRADING_RESULT_STORE=jdbc \
TRAINMARK_GRADING_JDBC_URL=jdbc:postgresql://localhost:55432/trainmark_ai \
TRAINMARK_GRADING_JDBC_USERNAME=trainmark \
TRAINMARK_GRADING_JDBC_PASSWORD=trainmark_dev \
timeout 120s bash scripts/dev-service.sh grading-service
curl --noproxy '*' 'http://localhost:8085/api/rubrics?assignmentId=1'
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/rubrics
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/jobs
curl --noproxy '*' 'http://localhost:8085/api/grading/results?assignmentId=1'
curl --noproxy '*' -X PATCH -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/3/items
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/3/approve
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/3/publish
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/exports
curl --noproxy '*' 'http://localhost:8085/api/grading/results/3/publication-audits'
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8085/api/grading/results/appeals
```

项目级 MVP 验证脚本已通过：

```bash
pnpm verify:mvp
```

教师端 HTTP 工作区异步数据同步后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端作业维度 HTTP 数据同步后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端发布审计 HTTP 首屏同步后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端批改链路作业维度收敛后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

Mock 工作区作业维度与空态兜底后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

HTTP 局部失败作业维度兜底后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

学生端 HTTP 跨课程任务加载后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

HTTP 空课程首屏兜底后已通过静态检查、构建和 MVP 验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

PaddleOCR Provider 适配器已通过 AI provider 验证、后端打包和 MVP 验证：

```bash
pnpm verify:ai
mvn -f backend/pom.xml package -DskipTests
pnpm verify:mvp
```

语义评分 Provider 适配器已通过 AI provider 验证、后端打包和 MVP 验证：

```bash
pnpm verify:ai
mvn -f backend/pom.xml package -DskipTests
pnpm verify:mvp
```

批注 PDF ZIP 导出包已通过后端打包、smoke dry-run 和 MVP 验证：

```bash
mvn -f backend/pom.xml package -DskipTests
SMOKE_DRY_RUN=1 pnpm smoke:api
pnpm verify:mvp
```

学生上传文件内容本地存储已通过前端静态检查、构建、后端打包、smoke dry-run、MVP 主验证和 file-service 真实上传写入验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
mvn -f backend/pom.xml package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
UPLOAD_OBJECT_ROOT=.data/test-uploads pnpm dev:backend:file
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8084/api/submissions/upload/init
curl --noproxy '*' -X PUT -F 'uploadId=...' -F 'objectKey=...' -F 'file=@...;type=application/pdf' http://localhost:8084/api/submissions/upload/content
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8084/api/submissions/upload/complete
curl --noproxy '*' 'http://localhost:8084/api/submissions?assignmentId=1&studentId=2'
```

学生提交原文件下载入口已通过前端静态检查、构建、后端打包、smoke dry-run、MVP 主验证和 file-service 真实上传下载验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
mvn -f backend/pom.xml package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
UPLOAD_OBJECT_ROOT=.data/test-uploads pnpm dev:backend:file
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8084/api/submissions/upload/init
curl --noproxy '*' -X PUT -F 'uploadId=...' -F 'objectKey=...' -F 'file=@...;type=application/pdf' http://localhost:8084/api/submissions/upload/content
curl --noproxy '*' -H 'Content-Type: application/json' -d '{...}' http://localhost:8084/api/submissions/upload/complete
curl --noproxy '*' http://localhost:8084/api/submissions/{submissionId}/file -o downloaded.pdf
cmp -s uploaded.pdf downloaded.pdf
```

教师已交报告列表与原文件下载已通过前端静态检查、构建和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端真实提交 OCR 启动已通过前端静态检查、构建、后端打包、写接口 smoke dry-run 和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
mvn -f backend/pom.xml package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
```

教师端真实工作区指标已通过前端静态检查、构建和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

学生端写操作后工作区刷新已通过前端静态检查、构建和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端写操作后工作区刷新已通过前端静态检查、构建和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

教师端批改队列刷新去重已通过前端静态检查、构建和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
pnpm verify:mvp
```

管理端组织与账号创建已通过前端静态检查、构建、写接口 smoke dry-run 和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
```

管理端系统配置写入已通过前端静态检查、构建、admin-service 打包、写接口 smoke dry-run 和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
mvn -f backend/pom.xml -pl admin-service -am package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
```

教师端学生名单导入写入已通过前端静态检查、构建、写接口 smoke dry-run 和 MVP 主验证：

```bash
pnpm --filter trainmark-ai-web lint
pnpm --filter trainmark-ai-web build
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
```

MVP 服务统一错误响应补齐已通过多服务后端编译、写接口 smoke dry-run 和 MVP 主验证：

```bash
mvn -f backend/pom.xml -pl user-service,course-service,notification-service,similarity-service,analytics-service -am package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm verify:mvp
```

JDBC 模式一键 MVP 联调入口已通过脚本语法检查、`package.json` 解析校验和 MVP 主验证：

```bash
bash -n scripts/dev-mvp-jdbc.sh
bash -n scripts/verify-mvp.sh
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"
pnpm verify:mvp
```

JDBC live smoke 落库断言已补齐，`pnpm smoke:mvp:jdbc` 默认启用 `TRAINMARK_JDBC_ASSERTIONS=1`，并在 JDBC 启动脚本中补齐与 Docker Compose 一致的 RabbitMQ 默认账号，同时让通知服务默认关闭 mail health，写接口 smoke 会在字段校验后继续用 `psql` 查询 PostgreSQL：

```bash
bash -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
TRAINMARK_SKIP_INFRA=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:mvp:jdbc
pnpm verify:mvp
```

覆盖数据库断言：

- 组织、学生角色、学生名单导入和管理端系统配置落库。
- 上传会话、提交记录和提交文件元数据落库。
- 任务、评分标准、批改任务、OCR 任务和成绩发布状态落库。
- 申诉处理、成绩导出、催交通知和查重任务/匹配结果落库。
- 批注 PDF 生成已改为优先加载中文 TrueType 字体，避免 PDFBox 标准字体无法写入中文导致 live smoke 下载入口失败。
- 已修复 analytics-service JDBC 实时统计兜底方法的错误 `@Override`，避免 JDBC smoke 读统计端点触发运行期编译错误。
- 已修复同步批改路径的 JDBC job 生命周期，创建批改任务后会进入 `SCORING`、按提交递增进度并最终落为 `COMPLETED`。
- 已修复 JDBC auth 下缺失 Bearer 与无效 Bearer token 的错误语义，strict auth smoke 可区分 `Authentication is required` 和 `Invalid access token`。

> 本地验证时使用 `TRAINMARK_SKIP_INFRA=1`，因为当前 Windows/WSL 环境已有其他 Redis 容器占用 `127.0.0.1:6379`；TrainMark 的 Postgres、RabbitMQ、MinIO 和 Nginx 容器已在运行。

前端通知面板工程质量收敛已完成：

- 已将通知加载函数改为稳定回调，消除 `react-hooks/exhaustive-deps` warning。
- 已修复点击已读通知仍递减未读数的问题，只有未读通知成功标记后才更新 badge。

验证命令：

```bash
pnpm lint:web
pnpm build:web
pnpm verify:mvp
```

教师端工作台组件拆分继续推进：

- 已从 `TeacherDashboard.tsx` 抽出纯展示组件 `TeacherSectionTabs`，让主工作台文件保留业务编排与写操作状态。
- 拆分保持导航 key、文案、样式 class 和 section 切换行为不变，为后续继续拆分概览/空态/动作处理留出更清晰边界。

验证命令：

```bash
pnpm lint:web
pnpm build:web
pnpm verify:mvp
```

Gateway MVP 权限边界已补齐：

- 已新增 gateway 全局认证过滤器，除 `/actuator/**` 与 `/api/auth/**` 外，业务 API、批注 PDF 和导出资源都需要 Bearer token。
- gateway 会调用 auth-service `/api/auth/me` 校验 token，并把 `X-TrainMark-User-Id`、`X-TrainMark-Username`、`X-TrainMark-Roles` 转发给下游服务，为后续数据权限收敛提供统一入口。
- API smoke 已增加 gateway 无 token 访问组织接口的 401 负向断言，并在后续 gateway 读写路径统一携带 teacher token。

验证命令：

```bash
bash -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
mvn -f backend/pom.xml -pl gateway-service -am package -DskipTests
pnpm verify:mvp
```

覆盖内容：

- 前端 `pnpm lint:web`
- 前端 `pnpm build:web`
- 后端 `mvn -f backend/pom.xml package -DskipTests`
- AI provider 语法和本地 OCR/评分/批注 provider 验证
- API smoke dry-run 端点清单和后端路由面检查

真实 AI Provider 验收边界已补齐：

- 已为 `scripts/verify-ai.sh` 增加 `TRAINMARK_REQUIRE_REAL_AI=1` 严格模式。
- 默认 `pnpm verify:ai` 继续允许离线 fallback，保证无模型环境能验证 provider JSON 契约。
- 严格模式会检查 PaddleOCR 与语义评分输出，一旦仍包含 fallback 来源就失败，避免把本地确定性 fallback 误判为真实 AI 接入完成。

验证命令：

```bash
pnpm verify:ai
TRAINMARK_REQUIRE_REAL_AI=1 pnpm verify:ai
```

对象存储上传边界已收敛：

- 已将 `UploadObjectStore.put(...)` 改为接收上传对象的真实 size 与 content type，MinIO/S3 写入不再依赖 `InputStream.available()` 推断对象长度。
- 已让 MinIO 默认连接参数与 `.env.example` / Docker Compose 对齐：`trainmark`、`trainmark_dev_password`、`trainmark-reports`。
- JDBC MVP 启动脚本默认启用 `UPLOAD_REQUIRE_OBJECT_CONTENT=true`，完成提交前必须能在对象存储中查到报告内容。
- 已新增 `pnpm smoke:mvp:minio`，用于在 JDBC live smoke 中切换 `UPLOAD_OBJECT_STORE=minio` 并覆盖上传、下载与落库断言。

验证命令：

```bash
bash -n scripts/dev-mvp-jdbc.sh
mvn -f backend/pom.xml -pl file-service -am package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
pnpm smoke:mvp:minio
```

Gateway 管理端 RBAC 边界已补齐：

- 已在 gateway 认证过滤器中为 `/api/admin/**` 增加 ADMIN 角色校验，非管理员访问会返回 403 和统一 `ApiResponse` 失败结构。
- gateway 仍会对非公开业务路径统一校验 Bearer token，并继续向下游转发 `X-TrainMark-User-Id`、`X-TrainMark-Username`、`X-TrainMark-Roles`。
- API smoke 已增加 teacher 访问管理端审计接口的 403 负向断言，并在管理端审计和系统配置读写路径使用 admin token。

验证命令：

```bash
bash -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
mvn -f backend/pom.xml -pl gateway-service -am package -DskipTests
pnpm verify:mvp
```

审计日志 JDBC 写入边界已补齐：

- 已新增迁移 `V13__audit_log_actor_name_detail.sql`，为 `audit_logs` 补充 `actor_name`，并将 `detail` 统一为文本字段，匹配现有 `CreateAuditLogRequest` 和 JDBC 写入逻辑。
- 已让 Docker 初始化脚本和本地迁移脚本应用 V12/V13 增量迁移，避免旧库缺列导致 grading-service 的 best-effort 审计写入静默失败。
- 已修正 admin-service JDBC 审计读取，优先显示用户表姓名，其次显示审计事件自带 actorName。
- API smoke 已增加审计落库断言，覆盖 `GRADING_START`、`REVIEW_UPDATE`、`REVIEW_APPROVE`、`GRADE_PUBLISH`、`APPEAL_SUBMIT`、`APPEAL_RESOLVE` 和 `GRADE_EXPORT`。

验证命令：

```bash
bash -n scripts/apply-db-migrations.sh
bash -n scripts/smoke-api.sh
mvn -f backend/pom.xml -pl admin-service,grading-service -am package -DskipTests
TRAINMARK_SKIP_INFRA=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:mvp:minio
pnpm verify:mvp
```

异步批改队列边界已补齐：

- 已为 grading-service 的 RabbitMQ 批改队列配置 JSON 消息转换器，避免异步模式下 `GradingJobMessage` 依赖默认 Java 序列化。
- 已新增 `pnpm smoke:mvp:async`，在 JDBC MVP smoke 基础上启用 `GRADING_ASYNC_ENABLED=true`。
- 写接口 smoke 已适配异步批改创建响应，允许任务先返回 `PENDING` / `SCORING`，并通过 PostgreSQL 轮询确认任务最终进入 `COMPLETED`。
- 已修正 `V13__audit_log_actor_name_detail.sql`，只在 `audit_logs.detail` 仍为 `jsonb` 时执行类型转换，避免重复迁移旧库时失败。

验证命令：

```bash
bash -n scripts/smoke-api.sh
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api
TRAINMARK_SKIP_INFRA=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:mvp:async
pnpm verify:mvp
```

真实 AI Provider 严格运行边界已补齐：

- PaddleOCR 适配器新增 `--require-real`，生产/验收模式下 PaddleOCR 依赖不可用、输入文件缺失或识别结果为空会直接失败，不再回退确定性 OCR 结果。
- 语义评分适配器新增 `--require-real`，生产/验收模式下 SentenceTransformers 或模型加载失败会直接失败，不再回退词项相似度。
- ocr-service 新增 `OCR_REQUIRE_REAL` 配置，内置 `OCR_PROVIDER=paddleocr` 命令会自动追加 `--require-real`。
- grading-service 新增 `SCORING_REQUIRE_REAL` 配置，内置 `SCORING_PROVIDER=semantic` 命令会自动追加 `--require-real`。
- 已更新 `.env.example`、README 和 AI provider 文档，明确本地 fallback MVP 与真实 AI 验收边界。

前端交互与 UI 问题已修复：

- 侧边栏导航项（工作台、课程与班级、实训任务、报告收集、AI 批改中心、人工复核、失分分析、系统管理）全部可点击，点击后正确切换内容区域。
- 侧边栏导航项与二级 Section Tabs 双向同步，点击 Section Tab 时侧边栏高亮对应父级导航项。
- 补齐缺失的 CSS 变量（`--border`、`--text-primary`、`--text-secondary`、`--bg-elevated`、`--brand-blue`、`--brand-teal`），Section Tabs 现在正确渲染高亮状态。
- 侧边栏品牌图标替换为与网站 favicon 一致的 SVG 图标（`/icons/icon.svg`）。
- 所有操作按钮（一键催交、新建标准、启动批改、启动查重、发布成绩、导出成绩、采纳/驳回申诉、导入名单、创建任务等）均可正常点击并触发对应操作。
- 学生端"查看批注"按钮改为点击后滚动到成绩与批注区域，并新增内联批注预览模态框，支持放大/缩小、Esc 键关闭、无障碍访问。

验证命令：

```bash
python3 -m py_compile ai/ocr/paddleocr_provider.py ai/scoring/semantic_provider.py
pnpm verify:ai
TRAINMARK_REQUIRE_REAL_AI=1 pnpm verify:ai # 当前无 PaddleOCR/SentenceTransformers 环境时应失败
mvn -f backend/pom.xml -pl ocr-service,grading-service -am package -DskipTests
pnpm verify:mvp
pnpm lint:web
```

UI 修复验证已通过：

- 侧边栏所有导航项（工作台、课程与班级、实训任务、报告收集、AI 批改中心、人工复核、失分分析、系统管理）点击后正确切换内容区域。
- 所有操作按钮（一键催交、新建标准、启动批改、启动查重、发布成绩、导出成绩、采纳/驳回申诉、导入名单、创建任务）均可正常点击。
- 学生端"查看批注"按钮滚动到成绩区域并打开内联批注预览模态框，支持 Esc 键关闭。
- 侧边栏品牌图标与网站 favicon 保持一致（SVG 图标）。

RabbitMQ 异步 OCR 任务消费者已补齐：

- ocr-service 新增 `OCR_ASYNC_ENABLED` 开关，默认保持同步本地路径；开启后 `POST /api/ocr/jobs` 会先创建 `PENDING` 任务并发布到 RabbitMQ。
- 已新增 OCR 队列、交换机、JSON 消息转换、任务 Publisher 与 Consumer，消费端复用现有 OCR Provider / DocumentPreprocessor 完成识别并写回内存或 JDBC 存储。
- OCR 存储接口已拆分为“创建待处理任务 / 完成任务 / 标记失败”，同步模式继续走原有即时完成语义，异步发布失败会把任务标记为 `FAILED`，避免长期悬挂。
- `pnpm smoke:mvp:async` 现在同时启用 `GRADING_ASYNC_ENABLED=true` 与 `OCR_ASYNC_ENABLED=true`，写接口 smoke 在 OCR 异步模式下会轮询 JDBC 状态直到 `COMPLETED`。

验证命令：

```bash
mvn -f backend/pom.xml -pl ocr-service -am package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 OCR_ASYNC_ENABLED=true pnpm smoke:api
pnpm verify:mvp
```

RabbitMQ 异步成绩导出消费者已补齐：

- grading-service 新增 `GRADE_EXPORT_ASYNC_ENABLED` 开关，默认保持同步导出记录创建；开启后 `POST /api/grading/exports` 会先返回 `PROCESSING` 导出任务并发布到 RabbitMQ。
- 已新增成绩导出队列、交换机、任务 Publisher 与 Consumer，消费端统计当前作业已发布成绩行数并将导出任务标记为 `READY`。
- 成绩导出存储接口已补齐 `PROCESSING` / `READY` / `FAILED` 生命周期更新，内存与 JDBC 存储均支持异步状态流转。
- `pnpm smoke:mvp:async` 现在同时启用批改、OCR 与成绩导出异步开关；写接口 smoke 会在导出异步模式下轮询 JDBC 状态直到 `READY`。

验证命令：

```bash
mvn -f backend/pom.xml -pl grading-service -am package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 GRADING_ASYNC_ENABLED=true GRADE_EXPORT_ASYNC_ENABLED=true pnpm smoke:api
pnpm verify:mvp
```

RabbitMQ 异步通知任务消费者已补齐：

- notification-service 新增 `NOTIFICATION_ASYNC_ENABLED` 开关，默认保持同步催交发送；开启后 `POST /api/notifications/remind-unsubmitted` 会先创建 `PENDING` 通知事件并发布到 RabbitMQ。
- 已新增通知队列、交换机、JSON 消息、任务 Publisher 与 Consumer，消费端复用现有邮件发送逻辑，并将内存/JDBC 通知事件流转为 `SENT`。
- JDBC 通知存储新增 `PENDING` / `SENT` / `FAILED` 状态更新能力，异步发布或消费失败会标记失败，避免通知事件长期停留在待处理状态。
- `pnpm smoke:mvp:async` 现在同时启用批改、OCR、成绩导出与通知异步开关；写接口 smoke 会在通知异步模式下轮询 JDBC 事件直到 `SENT`。

验证命令：

```bash
mvn -f backend/pom.xml -pl notification-service -am package -DskipTests
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 NOTIFICATION_ASYNC_ENABLED=true pnpm smoke:api
pnpm verify:mvp
```

教师端概览工作台边界已继续收敛：

- 已新增 `TeacherOverviewDashboard`，集中承载教师端工作台首页的收集、AI 流水线、查重、复核、分析、申诉、名单、运维和课程任务组合视图。
- `TeacherDashboard` 现在保留数据同步、写操作处理和分区路由职责；概览页组合逻辑下沉到独立组件，后续继续拆分教师端时不再需要反复改动主调度组件。
- 单分区页面继续复用同一组 panel props，保持侧边栏和 Section Tabs 切换行为不变。

验证命令：

```bash
pnpm lint:web
pnpm build:web
```

学生端上传面板边界已继续收敛：

- 已新增 `StudentUploadPanel`，集中承载学生端文件拖拽、任务选择、文件名编辑、进度条、提交按钮和提交回执展示。
- `StudentDashboard` 保留任务/成绩/申诉状态协调和上传动作处理，上传 UI 从学生工作台主组件中下沉，后续拆分成绩批注与批注预览时改动面更小。
- 上传面板继续复用当前 HTTP/mock 提交链路、原文件查看入口和任务提交后的本地即时状态反馈。

验证命令：

```bash
pnpm lint:web
pnpm build:web
```

学生端成绩批注面板边界已继续收敛：

- 已新增 `StudentResultsPanel`，集中承载学生端已发布成绩、分项扣分、申诉列表、批注 PDF 下载和内联批注预览模态框。
- 批注预览的缩放、Esc 关闭和预览结果状态已从 `StudentDashboard` 下沉，学生工作台主组件只保留任务滚动锚点和申诉提交动作。
- 成绩批注面板继续复用当前已发布成绩数据、申诉写入链路和网关资源 URL 解析逻辑。

验证命令：

```bash
pnpm lint:web
pnpm build:web
```

学生数据隔离与资源访问控制已补齐：

- 已新增共享 `AuthenticatedUser` 与 `TrainMarkAccessDeniedException`，统一解析 gateway 转发的 `X-TrainMark-User-Id`、`X-TrainMark-Username` 和 `X-TrainMark-Roles`。
- file-service 已限制学生上传初始化、上传内容写入、上传完成、提交列表和原文件下载只能访问当前学生自己的数据；教师、课程负责人、督导和管理员保留工作台查看能力。
- grading-service 已限制学生只能查看自己的已发布成绩、已发布批注和自己的申诉；复核、发布、撤回、发布审计、成绩导出和导出资源下载仅允许教职工角色访问。
- API smoke dry-run 已新增学生越权负向清单，覆盖学生访问成绩导出、导出文件、替他人初始化上传、访问他人提交文件和显式查询他人提交列表。

验证命令：

```bash
E:/Git/bin/bash.exe -n scripts/smoke-api.sh
SMOKE_DRY_RUN=1 E:/Git/bin/bash.exe scripts/smoke-api.sh
```

当前本机 PATH 只有 Java 11，项目要求 Java 21，且未安装 Maven；因此本轮未在当前 shell 复跑后端 Maven 打包。

Windows Bash 脚本入口已修复：

- 已新增 `scripts/run-bash-script.mjs`，优先使用 PATH 中的 `bash`，找不到时自动尝试 Git Bash 常见安装路径，并支持 `TRAINMARK_BASH` 显式指定。
- 已将根目录 `package.json` 中的 `verify:*`、`smoke:*`、`dev:*`、备份恢复、迁移和本地部署脚本统一切换到该启动器，避免 Windows PowerShell 下 `bash` 不在 PATH 时直接失败。
- `pnpm smoke:api` 已能在当前 PowerShell 会话中通过 Git Bash 执行 dry-run。

验证命令：

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"
SMOKE_DRY_RUN=1 pnpm smoke:api
```

前端学生申诉数据源已与权限边界对齐：

- 学生端加载申诉列表时显式请求 `/api/grading/results/appeals?studentId={userId}`，mock fallback 同步过滤当前学生，减少 HTTP/mock 行为差异。
- 学生端工作区加载已跳过教师导出、统计、查重、管理端和批改队列等受限接口，严格 HTTP 模式下不再因为学生身份访问教师接口触发 403。
- 已清理 `AppChrome` 中遗留的未使用变量，恢复前端 lint 通过。

验证命令：

```bash
pnpm lint:web
pnpm build:web
```

前端导航与 mock 提交反馈已修复：

- 教师端初始导航现在会根据 URL `section` 参数同步高亮与内容区，左侧导航点击也会同步写回 `section`，避免地址栏显示 `assignments` 但页面停在“人工复核”。
- 前端 mock 模式新增共享提交列表；学生端提交报告后会写入 `mockApi.listSubmissions()`，教师端“报告收集”可立即看到对应报告。
- mock 收集概览会根据共享提交列表同步已交/未交数量，学生任务状态也会在提交后更新为“已提交”。

验证命令：

```bash
pnpm lint:web
pnpm build:web
```

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
- `feat: add grade publishing`
- `feat: add analytics`
- `feat: add appeals`
- `docs: update mvp runbook`
- `feat: add similarity checks`
- `feat: add frontend http api`
- `feat: extend assessment schema`
- `chore: add frontend lint config`
- `docs: add api reference`
- `refactor: split app chrome`
- `feat: connect frontend actions`
- `feat: add gateway cors`
- `feat: add grade exports`
- `chore: add mvp verifier`
- `feat: add local ocr provider`
- `feat: add local scoring provider`
- `feat: add admin audit logs`
- `feat: add admin settings`
- `feat: add pwa shell`
- `feat: add role deep links`
- `chore: add backup script`
- `chore: add restore script`
- `chore: add api smoke script`
- `chore: add local deploy bundle`
- `feat: add ocr provider cli`
- `feat: add scoring provider cli`
- `feat: add annotation provider cli`
- `chore: add ai verifier`
- `chore: verify ai in mvp`
- `feat: add ocr provider switch`
- `feat: add scoring provider switch`
- `feat: validate uploads`
- `feat: add upload error responses`
- `feat: add ai error responses`
- `chore: expand smoke coverage`
- `feat: add annotation provider switch`
- `feat: link annotation pdfs`
- `fix: resolve api asset urls`
- `feat: link grade exports`
- `feat: serve grading assets`
- `chore: add smoke retries`
- `chore: add mvp dev launcher`
- `chore: smoke write apis`
- `fix: start backend services`
- `fix: bypass proxy in smoke`
- `fix: retain spring parameter names`
- `feat: add user jdbc store`
- `feat: add course jdbc store`
- `feat: add file jdbc store`
- `fix: renumber db migrations`
- `feat: add notification jdbc store`
- `feat: add similarity jdbc store`
- `feat: add analytics jdbc store`
- `feat: add admin jdbc store`
- `feat: add ocr jdbc store`
- `feat: add rubric jdbc store`
- `feat: add grade export jdbc store`
- `feat: add publication audit jdbc store`
- `feat: add appeal jdbc store`
- `feat: add grading job jdbc store`
- `feat: add grading result jdbc store`
- `fix: verify jdbc mvp launcher`
- `feat: add strict http mode`
- `feat: seed jdbc demo roles`
- `fix: reject unknown jdbc auth`
- `fix: refresh current auth user`
- `fix: validate auth logout`
- `feat: connect frontend auth session`
- `chore: add strict auth smoke`
- `chore: verify strict auth smoke`
- `docs: refresh remaining work`
- `feat: add async ocr queue`
- `feat: add async grade exports`
- `feat: add async notifications`
- `refactor: split teacher overview`
- `refactor: split student upload panel`
- `refactor: split student results panel`

## 接下来需要做

### 1. 真实 AI Provider 替换

- 用生产部署的 PaddleOCR 服务替换当前离线 fallback，并保留现有 provider JSON 契约。
- 用真实语义相似度模型（SentenceTransformer/BGE）替换当前关键词评分 fallback。
- 已升级 LocalScoringProvider 支持使用真实文件内容文本进行关键词匹配评分，而非仅依赖文件名。

### 2. 前端通知面板

- 已完成通知中心后端 API（列表、单条已读、全部已读）。
- 已完成内存和 JDBC 存储实现。
- 已完成前端通知面板 UI：Bell 图标点击弹出侧边通知面板，未读计数标记，逐条已读和全部已读操作。

### 3. Strict HTTP/JDBC Live Smoke

- 已新增可重复运行的 `pnpm smoke:mvp:jdbc` 入口，覆盖 strict HTTP/JDBC API smoke 与严格认证 token 正负路径。
- 已用 `SMOKE_INCLUDE_WRITES=1 pnpm smoke:mvp:jdbc` 跑通上传、批改、发布、导出、申诉、催交、查重和管理配置写入。
- 已将写路径 live smoke 从"接口成功"增强为关键字段校验，并补充 PostgreSQL 落库断言。

### 4. 工程质量

- 继续拆分学生端任务列表和教师端剩余复杂交互组件。
- 在不破坏现有无依赖开发路径的前提下补充单元测试和接口测试依赖。
- 持续补充自动化测试覆盖，并收敛前后端组件边界。

### 近期收敛（认证、HTTP 严格、教师流程引导）

- 已补齐真实登录/注册入口（`AuthPage`），未登录默认进入认证页，不再直接可用业务页面。
- 已收紧角色切换：仅允许已分配角色；URL `role/section` 均做角色与页面白名单约束。
- 已将 HTTP 关键读写改为严格失败路径，并移除 `httpApi.ts` 中可降级 `getOr/mutateOr` 调用口子。
- 已新增并接入以下守卫脚本，阻止回归：
  - `verify:httpapi:strict-writes`
  - `verify:httpapi:no-degradable-calls`
  - `verify:http:auth-ui-guards`
  - `verify:role-section-guards`
  - `verify:teacher-workflow-guides`
- 已将教师端核心流程页收敛为“当前阻塞 + 下一步动作”，并提供“前往下一步”快捷入口：
  - 报告收集：`TeacherCollectionPanel`
  - AI 批改：`TeacherAiPipeline`
  - 人工复核：`TeacherReviewWorkspace`
  - 流程总览导航：`TeacherDashboard`
- 已完善错误恢复体验：
  - HTTP 错误区提供“重试加载”与“返回登录页”双路径
  - 通知中心补齐加载/错误互斥状态与关闭后的状态清理
- 已更新自动验收基线为 4 步并通过复验：
  - 严格写链路
  - 认证与会话守卫
  - 教师流程引导守卫
  - 前端构建
