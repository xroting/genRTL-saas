# Inngest Cron 定时任务配置说明

## 当前状态

✅ **Inngest 代码已保留** - 所有 Inngest 函数和代码都完整保存
⏸️ **Vercel Cron 已禁用** - 从 `vercel.json` 中移除，避免免费账户限制

## 为什么移除 Vercel Cron？

1. **Vercel 免费账户限制**：Hobby 账户只支持每天运行一次的 cron jobs
2. **Inngest 自带调度**：Inngest 有自己强大的调度系统，无需 Vercel Cron
3. **成本优化**：避免升级 Vercel Pro 的额外费用

## Inngest 定时任务的三种启用方式

### 方式 1：使用 Inngest 内置调度系统（推荐）✨

Inngest 支持在函数定义中直接配置 cron，无需 Vercel：

```typescript
// inngest/functions/scheduled-task.ts
import { inngest } from "../client";

export const scheduledCleanup = inngest.createFunction(
  { id: "scheduled-cleanup" },
  { cron: "0 * * * *" }, // 每小时运行一次
  async ({ step }) => {
    await step.run("cleanup-expired-sessions", async () => {
      // 你的定时任务逻辑
    });
  }
);
```

**优点**：
- ✅ 支持任意频率（不受 Vercel 限制）
- ✅ 免费
- ✅ 更强大的错误重试和监控
- ✅ 可视化任务执行历史

**如何启用**：
1. 在 `inngest/functions/` 目录下创建你的定时任务函数
2. 在函数定义中添加 `cron` 配置
3. 重新部署即可生效

### 方式 2：通过 Vercel Cron 触发 Inngest（需要 Pro 账户）

如果你升级到 Vercel Pro，可以重新启用 Vercel Cron：

**步骤**：
1. 在 `vercel.json` 的 `crons` 数组中添加：
```json
{
  "path": "/api/inngest",
  "schedule": "0 * * * *"
}
```

2. 完整配置示例：
```json
{
  "regions": ["sin1"],
  "crons": [
    { "path": "/api/inngest", "schedule": "0 * * * *" },
    { "path": "/api/subscriptions/check-expiry", "schedule": "0 9 * * *" }
  ],
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --no-frozen-lockfile"
}
```

3. 重新部署：`vercel --prod`

**Cron 表达式参考**：
- `0 * * * *` - 每小时运行（整点）
- `*/30 * * * *` - 每 30 分钟运行
- `0 0 * * *` - 每天凌晨 00:00
- `0 9 * * *` - 每天上午 09:00
- `0 0 * * 1` - 每周一凌晨 00:00

### 方式 3：使用外部 Cron 服务（免费选项）

使用第三方 cron 服务定时调用 Inngest API：

**推荐服务**：
- [cron-job.org](https://cron-job.org) - 免费，支持高频率
- [EasyCron](https://www.easycron.com) - 免费版支持基础功能
- [Render Cron Jobs](https://render.com/docs/cronjobs) - 免费，如果使用 Render

**配置示例**（cron-job.org）：
1. URL: `https://your-domain.com/api/inngest`
2. Schedule: `0 * * * *`
3. HTTP Method: `POST`
4. 添加认证 Header（如果需要）

## 现有 Inngest 函数列表

当前项目中的 Inngest 函数：

```bash
inngest/
├── client.ts                          # Inngest 客户端配置
└── functions/
    ├── video-generation.ts            # 视频生成异步任务
    ├── image-generation.ts            # 图片生成异步任务
    ├── cleanup-expired-jobs.ts        # 清理过期任务
    └── subscription-credits-sync.ts   # 订阅积分同步
```

这些函数都已经完整保留，可以随时启用定时调度。

## 快速启用指南

### 如果你想启用定时清理任务（推荐方式 1）

1. 编辑 `inngest/functions/cleanup-expired-jobs.ts`：
```typescript
import { inngest } from "../client";

export const cleanupExpiredJobs = inngest.createFunction(
  { id: "cleanup-expired-jobs" },
  { cron: "0 2 * * *" }, // 每天凌晨 2:00 运行
  async ({ step }) => {
    await step.run("delete-old-jobs", async () => {
      // 清理 30 天前的过期任务
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // 你的清理逻辑
    });
  }
);
```

2. 重新部署：
```bash
vercel --prod
```

3. 在 Inngest Dashboard 中查看任务执行状态

## 注意事项

1. **Inngest 内置 cron 完全免费**，不受 Vercel 账户限制
2. **所有代码已保留**，无需重新编写
3. **建议使用方式 1**（Inngest 内置调度），除非有特殊需求
4. **Vercel Pro 费用**：$20/月，如果只为 cron 升级不划算

## 相关文档

- [Inngest Cron 官方文档](https://www.inngest.com/docs/features/scheduled-functions)
- [Vercel Cron Jobs 文档](https://vercel.com/docs/cron-jobs)
- [Cron 表达式生成器](https://crontab.guru/)

---

**总结**：建议使用 Inngest 内置的 cron 调度功能，完全免费且更强大。所有代码已保留，启用只需添加几行配置即可。

