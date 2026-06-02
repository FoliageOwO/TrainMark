# HTTP 模式教师端验收记录

- 验收日期：2026-06-02（自动项最近复验通过）
- 验收环境：本地开发环境（HTTP 模式基线）
- 前端版本/分支：当前工作区未提交状态
- 后端版本/分支：当前工作区未提交状态
- 验收人：Codex（自动项）

## A. 自动验收结果

| 项目 | 命令 | 结果 | 证据 |
| --- | --- | --- | --- |
| 严格写链路守卫 | `pnpm verify:httpapi:strict-writes` | 通过 | 控制台输出：`[check-httpapi-strict-writes] passed`（已覆盖 `deleteTeachingClass` 等关键写链路） |
| 禁止可降级调用 | `pnpm verify:httpapi:no-degradable-calls` | 通过 | 控制台输出：`[check-httpapi-no-degradable-calls] passed` |
| 禁止宽松读取回退 | `pnpm verify:httpapi:no-relaxed-read` | 通过 | 控制台输出：`[check-httpapi-no-relaxed-read] passed` |
| 严格鉴权 smoke | `pnpm smoke:auth:strict:local` | 通过 | 控制台输出：`[auth-strict-local] smoke passed` |
| 鉴权 UI 守卫 | `pnpm verify:http:auth-ui-guards` | 通过 | 控制台输出：`[auth-ui-guards] passed` |
| HTTP 失败保留最近数据守卫 | `pnpm verify:http:auth-ui-guards` | 通过 | 控制台输出：`[auth-ui-guards] ok: http error keeps last successful workspace snapshot` |
| 角色-Section 守卫 | `pnpm verify:role-section-guards` | 通过 | 控制台输出：`[check-role-section-guards] passed` |
| 教师流程引导守卫 | `pnpm verify:teacher-workflow-guides` | 通过 | 控制台输出：`[check-teacher-workflow-guides] passed` |
| 学生流程引导守卫 | `pnpm verify:student-workflow-guides` | 通过 | 控制台输出：`[check-student-workflow-guides] passed` |
| 学生成绩反 mock 守卫 | `pnpm verify:student-results:no-mock-copy` | 通过 | 控制台输出：`[check-student-results-no-mock-copy] passed` |
| 工作区 HTTP 分支守卫 | `pnpm verify:http:workspace-http-branch` | 通过 | 控制台输出：`[check-workspace-http-branch] passed` |
| 工作区严格读守卫 | `pnpm verify:http:workspace-strict-reads` | 通过 | 控制台输出：`[check-workspace-strict-reads] passed` |
| 工作区错误不清空守卫 | `pnpm verify:http:workspace-error-no-clear` | 通过 | 控制台输出：`[check-workspace-error-no-clear] passed`（并校验有快照时使用 `reminder-result error` 轻量错误条） |
| 前端构建 | `pnpm --filter trainmark-ai-web build` | 通过 | 控制台输出：`✓ built in ...` |
| 自动验收基线 | `pnpm verify:http:teacher:auto` | 通过 | 2026-06-02 复验：`[acceptance:auto] passed` |

## B. 人工链路验收结果

| 编号 | 验收项 | 结果(通过/失败/阻塞) | 证据（截图/日志/说明） | 备注 |
| --- | --- | --- | --- | --- |
| B1 | 未登录访问业务页应被拦截到登录页 | 通过 | 代码证据：`apps/web/src/pages/App.tsx` 中 `user` 未登录时直接渲染 `AuthPage`；业务区仅在登录成功后可见。 | 待人工浏览器复验 |
| B2 | 错误密码登录失败提示清晰 | 通过 | 命令证据：`pnpm smoke:auth:strict:local` 通过，`smoke-auth-strict.sh` 已覆盖鉴权失败路径并返回失败语义；前端登录错误由 `handleLogin` 捕获并展示“登录失败：...”。 | 待人工确认文案体验 |
| B3 | 正确登录后刷新页面会话保持 | 通过 | 代码证据：`apps/web/src/api/httpApi.ts` 持久化 token（`persistTokens`），`App.tsx` 初始化时恢复会话并拉取 profile。 | 待人工刷新复验 |
| B4 | 登出后无法通过 URL 直接访问业务页 | 通过 | 代码+命令证据：`App.tsx` 登出后清空 session 并清理 URL role/section 参数；`pnpm smoke:auth:strict:local` 验证未授权 refresh/logout 均失败。 | 待人工 URL 直达复验 |
| B5 | 教师首页“下一步动作”符合当前状态 | 通过 | 代码证据：`apps/web/src/components/TeacherOverviewDashboard.tsx` 中 `nextAction` 按“未发布任务→未启动批改→待复核→未交学生”顺序动态计算，并绑定按钮跳转。 | 待人工点检状态切换场景 |
| B6 | 工作台“开课检查清单”可点击并正确跳转 | 通过 | 代码证据：`apps/web/src/components/TeacherOverviewDashboard.tsx` 中 `checklist` 每项包含 `section`，按钮统一调用 `onSectionChange(item.section)`。 | 待人工逐项点击复验 |
| B7 | 任务发布创建+发布流程可用 | 通过 | 代码证据：`apps/web/src/components/TeacherDashboard.tsx` 的 `handleCreateAssignment` / `handlePublishAssignment` 走 HTTP API，成功后更新本地状态并 `onWorkspaceRefresh()`，失败经 `runAction` 输出可读错误。 | 待人工实际创建/发布链路复验 |
| B8 | 报告收集催交失败时提示可操作 | 通过 | 代码证据：`apps/web/src/components/TeacherDashboard.tsx` 的 `handleRemindUnsubmitted` 在失败分支设置 `setReminderError(催交发送失败...)`；`TeacherCollectionPanel.tsx` 显示错误提示区域。 | 待人工断后端复验失败提示文案 |
| B9 | AI 批改启动失败时不崩溃并有错误提示 | 通过 | 代码证据：`apps/web/src/components/TeacherDashboard.tsx` 的 `handleStartGrading`/`handleStartOcr` 均有 `catch`，会设置失败状态与 `setActionNotice(批改失败/识别失败...)`。 | 待人工模拟失败场景复验 |
| B10 | 人工复核/发布/撤回流程可用 | 通过 | 代码证据：`apps/web/src/components/TeacherDashboard.tsx` 的 `handleReviewItemSubmit` / `handleApproveResult` / `handlePublishResult` / `handleWithdrawResult` 走真实 API 并刷新审计记录。 | 待人工操作链路复验 |
| B11 | 申诉仅在人工复核流程处理（无重复入口） | 通过 | 代码证据：`apps/web/src/pages/App.tsx` 将 `appeals` 统一归并到 `review`；`apps/web/src/components/TeacherDashboard.tsx` 无独立 appeals section 渲染分支。 | 待人工点检 UI 文案一致性 |
| B12 | 通知里 appeals 链接跳到 review | 通过 | 代码证据：`apps/web/src/components/NotificationPanel.tsx` 中 `/appeals` 与 `/review` 都映射到 `section=review`。 | 待人工点击链路复验 |
| B13 | HTTP 接口临时失败时保留最近成功数据，不强制清空页面 | 通过 | 代码+守卫证据：`apps/web/src/pages/App.tsx` 在加载失败分支不再清空 `workspaceData`，并显示“已保留最近一次成功加载的数据”；`pnpm verify:http:auth-ui-guards` 已校验该文案。 | 待人工断网/停服务复验 |
| B14 | 登录/注册切换账号时先清空旧工作区快照，避免跨账号串视 | 通过 | 代码+守卫证据：`apps/web/src/pages/App.tsx` 在 `handleCredentialLogin` 和 `handleRegister` 中先执行 `setWorkspaceData(null)` 与 `setWorkspaceLoaded(false)`；`pnpm verify:http:auth-ui-guards` 已校验该顺序。 | 待人工双账号切换复验 |

## C. 问题清单（失败项）

| 编号 | 问题描述 | 严重级别 | 复现步骤 | 建议修复 |
| --- | --- | --- | --- | --- |
| 暂无 |  |  |  |  |

## D. 学生链路人工验收记录（进行中）

| 编号 | 验收项 | 结果(通过/失败/阻塞) | 证据（截图/日志/说明） | 备注 |
| --- | --- | --- | --- | --- |
| S1 | 学生登录后默认进入“我的课程”，并显示“当前阻塞 + 下一步” | 通过（代码） | `App.tsx` 默认 `student-courses`；`StudentDashboard.tsx` 存在 blocker/nextAction | 待补登录后截图 |
| S2 | 切换到“提交报告”后，上传面板显示“当前阻塞 + 下一步” | 通过（代码） | `StudentUploadPanel.tsx` 存在 blocker/nextAction 提示条 | 待补切页截图 |
| S3 | 选择任务后可上传并出现回执；未选任务不应误导可提交 | 待执行 |  | 按最短补证路径执行 |
| S4 | “成绩与批注”显示“当前阻塞 + 下一步” | 通过（代码） | `StudentResultsPanel.tsx` 存在 blocker/nextAction 提示条 | 待补页面截图 |
| S5 | 无 `annotationPdfUrl` 时仅显示空态提示，无硬编码示例批注正文 | 通过（自动） | `pnpm verify:student-results:no-mock-copy` 通过 | 待补页面截图 |
| S6 | 提交申诉后“我的申诉”出现待处理记录且状态文案正确 | 通过（代码+自动） | `StudentResultsPanel.tsx` 状态文案映射 + 列表回流逻辑 | 待补提交流程截图 |

## E. 结论（三段式）

### 1) 自动通过项

- HTTP 严格写链路、禁止降级调用、严格鉴权 smoke、鉴权 UI 守卫、角色-Section 守卫、教师/学生流程守卫、工作区 HTTP 分支守卫、工作区严格读守卫、工作区错误不清空守卫已通过。
- 前端生产构建通过，当前代码基线可进入“人工浏览器链路验收”阶段。

### 2) 人工待执行项

- 教师链路：B1-B14（见上文 B 节）需在浏览器完成逐项点检并补证据（截图/日志）。
- 学生链路：S1-S6（见上文 D 节）需在浏览器完成逐项点检并补证据（截图/日志）。
- 建议先执行 `pnpm verify:http:manual:init` 生成当日记录文件，再开始人工验收。
- 如需自动写入验收环境与验收人，可执行：
  `HTTP_ACCEPTANCE_ENV='本地HTTP联调' HTTP_ACCEPTANCE_REVIEWER='你的名字' pnpm verify:http:manual:init`
- 建议直接使用模板：`docs/HTTP_MANUAL_ACCEPTANCE_TEMPLATE.md` 统一记录，避免证据分散。

### 3) 阻塞项

- 当前无自动化阻塞项。
- 当前阻塞转移到“人工浏览器证据尚未补齐”，在 B1-B14 与 S1-S6 完成前，不建议宣称完整验收完成。
