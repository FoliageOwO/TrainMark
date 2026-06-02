# HTTP 模式人工验收记录模板

验收日期：2026-06-02
验收环境：本地开发环境（HTTP 模式）
验收人：Codex（自动项）

## 教师链路（B1-B14）

| 编号 | 验收项 | 结果(通过/失败/阻塞) | 证据（截图/日志路径） | 备注 |
| --- | --- | --- | --- | --- |
| B1 | 未登录访问业务页应被拦截到登录页 | 通过（自动） | `smoke:auth:strict` + `AuthPage` 门禁守卫通过 | 待补浏览器截图 |
| B2 | 错误密码登录失败提示清晰 | 通过（自动） | `smoke-api` 登录失败分支已覆盖并返回明确错误 | 待补前端提示截图 |
| B3 | 正确登录后刷新页面会话保持 | 通过（自动） | `smoke-api` teacher/student refresh 均通过 | 待补浏览器刷新截图 |
| B4 | 登出后无法通过 URL 直接访问业务页 | 通过（自动） | `smoke:auth:strict` logout+unauthorized 分支通过 | 待补 URL 直达截图 |
| B5 | 教师首页“下一步动作”符合当前状态 |  |  |  |
| B6 | 工作台“开课检查清单”可点击并正确跳转 |  |  |  |
| B7 | 任务发布创建+发布流程可用 |  |  |  |
| B8 | 报告收集催交失败时提示可操作 |  |  |  |
| B9 | AI 批改启动失败时不崩溃并有错误提示 |  |  |  |
| B10 | 人工复核/发布/撤回流程可用 |  |  |  |
| B11 | 申诉仅在人工复核流程处理（无重复入口） | 通过（代码） | `App.tsx` 将 `appeals` 归并到 `review`；教师导航无独立 appeals 分区 | 待补页面截图 |
| B12 | 通知里 appeals 链接跳到 review | 通过（代码） | `NotificationPanel` 映射 `/appeals` 到 `review` | 待补点击截图 |
| B13 | HTTP 接口临时失败时保留最近成功数据，不强制清空页面 | 通过（自动） | `verify:http:workspace-error-no-clear` 通过 | 待补断链截图 |
| B14 | 登录/注册切换账号时先清空旧工作区快照，避免跨账号串视 | 通过（自动） | `verify:http:auth-ui-guards` 顺序校验通过 | 待补双账号切换截图 |

## 学生链路（S1-S6）

| 编号 | 验收项 | 结果(通过/失败/阻塞) | 证据（截图/日志路径） | 备注 |
| --- | --- | --- | --- | --- |
| S1 | 学生登录后默认进入“我的课程”，并显示“当前阻塞 + 下一步” | 通过（代码） | `App.tsx` 学生默认 `student-courses`；`StudentDashboard.tsx` 含 blocker/nextAction | 待补登录后截图 |
| S2 | 切换到“提交报告”后，上传面板显示“当前阻塞 + 下一步” | 通过（代码） | `StudentUploadPanel.tsx` 含 blocker/nextAction 提示条 | 待补切页截图 |
| S3 | 选择任务后可上传并出现回执；未选任务不应误导可提交 |  |  |  |
| S4 | “成绩与批注”显示“当前阻塞 + 下一步” | 通过（代码） | `StudentResultsPanel.tsx` 含 blocker/nextAction 提示条 | 待补页面截图 |
| S5 | 无 `annotationPdfUrl` 时仅显示空态提示，无硬编码示例批注正文 | 通过（自动） | `verify:student-results:no-mock-copy` 通过 | 待补页面截图 |
| S6 | 提交申诉后“我的申诉”出现待处理记录且状态文案正确 | 通过（代码+自动） | `StudentResultsPanel.tsx` 显示 appealStatusText；`StudentDashboard` 提交后合并到列表 | 待补提交流程截图 |

## 结论

- 自动项是否通过：通过（`pnpm verify:http:teacher:auto` 与 `pnpm start:stack:http` 核心 smoke 链路通过）
- 人工项是否通过：进行中（部分项已由自动证据覆盖，其余待浏览器截图）
- 阻塞项：无自动化阻塞；待补齐 B1-B14 与 S1-S6 人工证据

## 剩余项最短补证路径（B5-B10 / S3）

1. 登录 `teacher/trainmark`，停留工作台，截图“当前阻塞 + 下一步 + 开课检查清单”（B5/B6）。
2. 进入“任务发布”，新建任务并发布，截图发布前后状态变化（B7）。
3. 进入“报告收集”，触发催交（可在服务暂时断开时重试），截图失败提示文案（B8）。
4. 进入“AI 批改”，启动一次任务；在不可用场景下截图失败提示且页面不崩溃（B9）。
5. 进入“人工复核”，执行通过复核/发布/撤回任一闭环并截图（B10）。
6. 切到学生账号，进入“提交报告”，先不选任务截图不可提交提示，再选任务并提交，截图回执（S3）。

## 截图证据命名规范

- 建议目录：`docs/evidence/http-acceptance/2026-06-02/`
- 命名格式：`<项号>-<步骤>-<结果>.png`
- 示例：
  - `B5-01-dashboard-next-action-pass.png`
  - `B8-01-reminder-fail-message-pass.png`
  - `S3-01-no-task-blocked-pass.png`
  - `S3-02-upload-receipt-pass.png`
