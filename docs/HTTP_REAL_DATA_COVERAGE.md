# HTTP 真实数据覆盖清单

目标：在 `VITE_API_MODE=http` 下，教师与学生关键视图不依赖 mock 数据路径。

## A. 已硬化（代码守卫）

- 认证与会话：`verify:http:auth-ui-guards`
- 关键写接口 strict：`verify:httpapi:strict-writes`
- 禁止可降级调用：`verify:httpapi:no-degradable-calls`
- 角色/section 越权拦截：`verify:role-section-guards`
- 教师流程引导守卫：`verify:teacher-workflow-guides`
- 学生流程引导守卫：`verify:student-workflow-guides`
- 学生成绩反 mock 文案守卫：`verify:student-results:no-mock-copy`
- 工作区严格读守卫：`verify:http:workspace-strict-reads`
- 工作区错误不清空守卫：`verify:http:workspace-error-no-clear`

## B. 关键读模型（HTTP 分支）

在 `apps/web/src/pages/App.tsx` 中，HTTP 模式下应仅来自 `workspaceData` 或安全空态，不应直接调用 `mockApi.*` 作为 HTTP 回退数据源。

- 课程、班级、任务
- 学生任务、组织、用户、学生
- 收集概览、未交名单
- Rubric、批改任务、OCR 任务、批改结果
- 发布审计、已发布结果、导出、统计
- 失分点、达成度、申诉、查重
- 管理端审计日志、系统设置

## C. 联调验收命令

```bash
pnpm verify:http:teacher:auto
pnpm verify:http:workspace-http-branch
pnpm verify:student-workflow-guides
```

## D. 最近收敛（2026-06-01）

- `httpApi.ts`：工作区关键读链路统一为 `mustGetStrict(...)`，并移除未使用的宽松 `mustGet(...)`，降低 HTTP 模式误回退风险。
- OCR 读取链路（`/api/ocr/jobs`、`/api/ocr/jobs/{id}/result`）改为严格读取，接口异常不再静默伪装为空队列。
- 学生成绩预览：移除“无批注 PDF 时展示硬编码批注内容”的伪数据块，改为明确空态提示。
