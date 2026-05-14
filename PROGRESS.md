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

全部后端模块已通过编译：

```bash
mvn -f backend/pom.xml package -DskipTests
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

## 接下来需要做

### 1. 真实 AI / OCR 接入

- 接入 PaddleOCR。
- 增加 PDF / Word / 图片转换流程。
- 将本地 OCR provider 替换为 PaddleOCR provider，并持久化 OCR 结果。
- 将本地规则评分 provider 替换为真实关键词、语义相似度和规则扣分引擎。
- 实现批注 PDF 生成。

### 2. 持久化与真实联调

- 基于现有 Flyway 迁移补服务层数据库实现。
- 将当前内存服务替换为数据库实现。
- 安装 Docker 后验证 `infra/docker-compose.yml`。

### 3. 工程质量

- 继续拆分老师端/学生端工作台内部组件。
- 在引入测试依赖后补充单元测试和接口测试。
