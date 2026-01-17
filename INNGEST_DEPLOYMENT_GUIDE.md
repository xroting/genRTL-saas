# Inngest 生产环境部署指南

## 📋 概述

本指南将帮助你在生产环境（Vercel）中配置 Inngest，使长视频生成功能能够正常工作。

## 🎯 前提条件

- ✅ 已有 Inngest 账户（https://app.inngest.com）
- ✅ 项目已部署到 Vercel（https://www.monna.us）
- ✅ 代码已包含最新的 Inngest 集成

## 📝 部署步骤

### 1. 获取 Inngest API Keys

1. 访问 [Inngest Dashboard](https://app.inngest.com)
2. 选择你的项目（或创建新项目）
3. 进入 **Settings** → **Keys**
4. 复制以下两个密钥：
   - **Event Key** (用于发送事件)
   - **Signing Key** (用于验证 webhook)

### 2. 配置 Vercel 环境变量

1. 访问 [Vercel Dashboard](https://vercel.com)
2. 选择项目 `monna-saas`
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：

| 变量名 | 值 | 环境 | 格式要求 |
|--------|-----|------|---------|
| `INNGEST_EVENT_KEY` | `evt_xxx...` | Production, Preview, Development | 必须以 `evt_` 开头 |
| `INNGEST_SIGNING_KEY` | `signkey-prod-xxx...` | Production, Preview, Development | 必须以 `signkey-` 开头 |

**重要提示**：
- 确保为所有三个环境（Production, Preview, Development）都配置这些变量
- **不要使用标记为"New"的密钥**，Inngest Dashboard 中显示为"New"状态的密钥需要先激活
- 密钥格式必须正确：`INNGEST_EVENT_KEY` 以 `evt_` 开头，`INNGEST_SIGNING_KEY` 以 `signkey-` 开头
- 配置完成后需要在 Vercel 重新部署才能生效

### 3. 在 Inngest Cloud 配置 Webhook

1. 返回 Inngest Dashboard
2. 进入 **Apps** → **Add App**
3. 选择 **Deploy via URL**
4. 填写以下信息：
   - **App Name**: `monna-saas`
   - **URL**: `https://www.monna.us/api/inngest`
   - **Signing Key**: 选择刚才创建的 Signing Key

5. 点击 **Sync** 验证连接

### 4. 验证 Webhook 连接

成功连接后，你应该看到：
- ✅ 绿色勾选图标
- ✅ 显示 3 个已注册的 functions：
  - `generate-media`
  - `cleanup-jobs`
  - `generate-long-video` ← 新增的长视频生成函数

### 5. 重新部署应用

```bash
# 1. 提交最新代码
git add .
git commit -m "feat: configure Inngest for production"
git push

# 2. Vercel 会自动重新部署
# 或者在 Vercel Dashboard 手动触发重新部署
```

### 6. 测试长视频生成

1. 访问 `https://www.monna.us/generate`
2. 选择"长视频生成"
3. 上传参考图片，填写提示词
4. 点击"生成"

#### 预期行为

**前端**:
- 立即返回（2-3秒）
- 显示 "queued" 状态
- 进度条开始增长
- 最终显示视频播放器

**Vercel 日志**:
```
🎬 Triggering long video generation job via Inngest
📤 Sending Inngest event: {
  eventName: "app/longVideo.generate.requested",
  hasEventKey: true,
  eventKeyPrefix: "evt_xxxx..."
}
✅ Inngest event sent successfully: { ids: [...] }
```

**Inngest Dashboard**:
- **Events** 标签：应该看到新的事件记录
- **Runs** 标签：应该看到 `generate-long-video` 函数执行记录
- 可以实时查看执行进度和日志

## 🔍 故障排查

### 问题 1: 任务卡在 "queued" 状态

**可能原因**:
- Inngest 事件发送失败
- Webhook 未配置或配置错误
- 环境变量未设置

**解决方法**:
1. 检查 Vercel 日志是否有 "❌ Failed to send Inngest event" 错误
2. 验证环境变量是否正确设置
3. 确认 Inngest Dashboard 中 webhook 状态为绿色勾选

### 问题 2: 看不到 Inngest 事件

**可能原因**:
- `INNGEST_EVENT_KEY` 未配置或错误
- 网络问题

**解决方法**:
1. 在 Vercel 日志中查找：
   ```
   📤 Sending Inngest event: { hasEventKey: false }  // ← 错误
   📤 Sending Inngest event: { hasEventKey: true }   // ← 正确
   ```
2. 如果 `hasEventKey: false`，检查环境变量配置

### 问题 3: Webhook 验证失败

**可能原因**:
- `INNGEST_SIGNING_KEY` 错误
- Webhook URL 不正确

**解决方法**:
1. 确认 Webhook URL: `https://www.monna.us/api/inngest`
2. 确认 Signing Key 与 Vercel 环境变量一致
3. 在 Inngest Dashboard 点击 "Re-sync" 重新验证

### 问题 4: Function 执行超时

**可能原因**:
- VEO 3.1 API 响应慢
- 网络问题

**解决方法**:
- 检查 Inngest Dashboard 中的执行日志
- 长视频生成配置了 30分钟超时，足够处理大部分情况
- 如果仍然超时，可能需要优化镜头数量或时长

## 📊 监控和调试

### Vercel 日志

查看实时日志：
```bash
vercel logs --follow
```

关键日志标记：
- `📤 Sending Inngest event` - 事件发送开始
- `✅ Inngest event sent successfully` - 事件发送成功
- `❌ Failed to send Inngest event` - 事件发送失败

### Inngest Dashboard

访问 https://app.inngest.com 查看：
- **Events**: 所有发送的事件记录
- **Runs**: Function 执行记录（包括成功、失败、重试）
- **Logs**: 详细的执行日志

### 数据库查询

查看任务状态：
```sql
SELECT id, status, created_at, updated_at, metadata
FROM jobs
WHERE type = 'longvideo'
ORDER BY created_at DESC
LIMIT 10;
```

## ✅ 成功指标

部署成功后，你应该能够：
- ✅ 创建长视频任务立即返回（< 3秒）
- ✅ 任务在 Inngest 后台异步处理
- ✅ 前端显示实时进度（0% → 100%）
- ✅ 最终生成的视频可以播放和下载
- ✅ 在 Inngest Dashboard 看到执行记录

## 📚 相关文档

- [Inngest 官方文档](https://www.inngest.com/docs)
- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [CHANGELOG.md](CHANGELOG.md) - 查看详细的改进记录

## 🆘 获取帮助

如果遇到问题：
1. 查看 Vercel 日志和 Inngest Dashboard
2. 检查 [CHANGELOG.md](CHANGELOG.md) 中的故障排查部分
3. 联系技术支持并提供：
   - Vercel 日志截图
   - Inngest Dashboard 截图
   - Job ID

---

**最后更新**: 2025-11-14
