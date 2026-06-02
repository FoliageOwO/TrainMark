# HTTP 模式教师端验收清单

目标：验证系统在 `VITE_API_MODE=http` 下不依赖 mock 回退，且教师关键流程可用、可理解。

## 一、启动前提

1. 启动后端与前端（HTTP 模式）。
2. 使用本地联调账号登录：`teacher`（密码 `trainmark`）。
3. 确认页面先进入登录页，未登录不可访问业务页。
4. 运行 `pnpm verify:http:manual:init` 生成当日人工验收记录文件。
5. 如需自动写入验收环境与验收人，可执行：
   `HTTP_ACCEPTANCE_ENV='本地HTTP联调' HTTP_ACCEPTANCE_REVIEWER='你的名字' pnpm verify:http:manual:init`
6. 如需覆盖重建当日记录，可执行：
   `pnpm verify:http:manual:init -- --force`
7. 若本地 RabbitMQ 未配置可用账号，`start:stack:http` 默认关闭 Rabbit health 阻塞（`MANAGEMENT_HEALTH_RABBIT_ENABLED=false`），以保证 HTTP 主链路可联调。
8. 若需要强校验批注导出链路，可在 smoke 时显式打开：
   `SMOKE_CHECK_ANNOTATION_EXPORT=1 SMOKE_CHECK_ANNOTATED_EXPORT_BUNDLE=1 pnpm smoke:api`

## 二、鉴权与会话

1. 错误密码登录应失败，并显示错误提示。
2. 登录成功后刷新页面，会话应保持。
3. 退出登录后应回到登录页，且不能直接通过 URL 访问业务页。
4. 运行 `pnpm smoke:auth:strict:local` 必须通过。
5. HTTP 接口临时失败时，错误区应提示“已保留最近一次成功加载的数据”，页面不应被强制清空。
6. 登录/注册切换账号时，应先清空旧工作区快照，再加载新账号数据，避免跨账号串视。

## 三、HTTP 严格写链路

1. 运行 `pnpm verify:httpapi:strict-writes` 必须通过。
2. 在后端停掉某个关键服务时，关键写操作应报错，不应出现“假成功”。
3. 恢复服务后重试，操作应恢复成功。

## 四、教师主流程

1. 工作台显示“下一步动作”和“开课检查清单”。
2. 任务发布：创建任务并发布后，工作台状态变化正确。
3. 报告收集：可看到提交/未提交信息，催交失败时有明确错误提示。
4. AI 批改：可启动批改；失败时不崩溃且提示可操作错误。
5. 人工复核：可完成复核、发布、撤回；申诉在该页统一处理。
6. 结果分析：导出/统计失败时应明确提示，不应静默成功。

## 五、入口一致性

1. 教师导航不再出现“成绩发布与申诉”独立入口。
2. 旧链接 `section=appeals` 应自动归并到 `review`。
3. 通知里的 `/appeals/*` 跳转应进入 `review`。

## 六、登录/注册输入约束

1. 用户名必须符合 3-32 位规则（字母/数字/下划线/短横线）。
2. 密码至少 6 位。
3. mock 模式下注册入口应明确标识为演示用途。

## 七、回归命令

```bash
pnpm verify:httpapi:strict-writes
pnpm verify:httpapi:no-relaxed-read
pnpm verify:student-results:no-mock-copy
pnpm verify:http:workspace-error-no-clear
pnpm smoke:auth:strict:local
pnpm --filter trainmark-ai-web build
```

补充（可选）：
- 学生 smoke 登录账号可覆盖：`SMOKE_STUDENT_USERNAME=2024010101 SMOKE_STUDENT_PASSWORD=trainmark pnpm smoke:api`

## 八、学生链路人工验收（浏览器）

1. 学生登录后应默认进入“我的课程”，且能看到“当前阻塞 + 下一步”提示。
2. 切换到“提交报告”后，上传面板应显示“当前阻塞 + 下一步”提示。
3. 未选择任务时不可误导提交；选择任务后可正常上传并看到回执。
4. 学生成绩页“成绩与批注”应显示“当前阻塞 + 下一步”提示。
5. 无 `annotationPdfUrl` 时，只显示明确空态提示，不应出现硬编码示例批注正文。
6. 提交申诉后，“我的申诉”应出现待处理记录，状态文案正确。
