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

### 23. 前端 HTTP 写操作联调

- 已扩展前端 HTTP API 层，支持在 `VITE_API_MODE=http` 下调用后端写接口。
- 已覆盖启动批改、分项复核保存、复核通过、成绩发布、撤回发布、发布审计刷新、学生申诉、申诉处理、一键催交、启动查重和学生提交回执。
- 写操作失败或未启用 HTTP 模式时仍回退本地 mock，保证单前端演示不受影响。
- 老师端和学生端按钮已接入统一 HTTP/mock 兜底动作，不再只修改本地 mock 状态。

主要代码：

- `apps/web/src/api/httpApi.ts`
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

### 26. MVP 回归验证脚本

- 已新增 `scripts/verify-mvp.sh`，串联当前 MVP 的基础回归验证。
- 验证脚本覆盖前端 ESLint、前端构建、后端全模块打包和 API 路由注解核对。
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

### 40. AI Provider 验证脚本

- 已新增 `pnpm verify:ai` 脚本入口。
- 已新增 `scripts/verify-ai.sh`，统一验证 OCR、评分和批注 provider。
- 验证脚本会执行 Python 编译检查、运行 OCR 样例、运行评分样例、运行批注 PDF 样例，并校验 JSON 输出和 PDF 文件头。
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
- 设置 `SMOKE_INCLUDE_WRITES=1` 时会覆盖上传初始化、上传完成、创建批改任务、创建成绩导出、一键催交和启动查重。
- 上传完成会复用上传初始化返回的 `uploadId` 和 `objectKey`，避免使用伪造会话。
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

前端 HTTP 写操作联调已通过静态检查和构建：

```bash
pnpm lint:web
pnpm build:web
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

## 接下来需要做

### 1. 真实 AI / OCR 接入

- 接入 PaddleOCR。
- 增加 PDF / Word / 图片转换流程。
- 将本地 OCR provider 替换为 PaddleOCR provider，并持久化 OCR 结果。
- 将本地规则评分 provider 替换为真实关键词、语义相似度和规则扣分引擎。
- 实现批注 PDF 生成。

### 2. 持久化与真实联调

- 基于现有 Flyway 迁移补服务层数据库实现。
- 继续将课程、文件、批改、OCR、查重、通知、统计和管理端内存服务替换为数据库实现。
- 安装 Docker 后验证 `infra/docker-compose.yml`。

### 3. 工程质量

- 继续拆分老师端/学生端工作台内部组件。
- 在引入测试依赖后补充单元测试和接口测试。
