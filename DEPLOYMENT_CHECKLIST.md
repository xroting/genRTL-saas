# 🚀 部署检查清单 - Vercel + Supabase 优化

本清单列出了部署和优化应用所需的手动配置步骤。

---

## ✅ 已完成（代码层面）

- [x] Vercel 区域配置为新加坡 (sin1) - `vercel.json`
- [x] 环境变量示例更新 - `.env.example`
- [x] 定价页面客户端渲染优化 - `app/(dashboard)/pricing/page.tsx`
- [x] 创建定价数据 API 端点 - `app/api/pricing/route.ts`
- [x] 配置文档编写 - `VERCEL_SUPABASE_OPTIMIZATION.md`

---

## ⚠️ 待执行（需要手动操作）

### 1. 配置 Supabase Transaction Pooler

**时间**：5 分钟
**优先级**：🔴 高

#### 步骤：
1. 登录 Supabase Dashboard
   - 访问：https://supabase.com/dashboard/project/YOUR_PROJECT_REF

2. 获取 Transaction Pooler 连接串
   - 导航：**Settings** → **Database** → **Connection Pooling**
   - 选择：**Transaction** 模式
   - 复制连接字符串（格式如下）：
   ```
   postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

3. 验证参数
   - ✅ 端口是 `6543`（不是 5432）
   - ✅ 包含 `?pgbouncer=true`
   - ✅ 主机名包含 `pooler.supabase.com`

**完成后**：✅ 勾选此项

---

### 2. 配置 Vercel 环境变量

**时间**：3 分钟
**优先级**：🔴 高

#### 步骤：
1. 登录 Vercel Dashboard
   - 访问：https://vercel.com/YOUR_TEAM/monna-saas

2. 更新环境变量
   - 导航：**Settings** → **Environment Variables**
   - 找到或添加 `POSTGRES_URL`
   - 粘贴步骤 1 中复制的 Transaction Pooler 连接串
   - 选择环境：**Production**, **Preview**, **Development** 全选

3. 验证其他必需变量
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   SUPABASE_ANON_KEY=eyJhbG...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

   # Stripe
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Other
   NEXT_PUBLIC_SITE_URL=https://www.monna.us
   INNGEST_EVENT_KEY=...
   INNGEST_SIGNING_KEY=...
   ```

**完成后**：✅ 勾选此项

---

### 3. 触发 Vercel 重新部署

**时间**：2 分钟
**优先级**：🔴 高

#### 方式 1：Git Push（推荐）
```bash
git add .
git commit -m "chore: configure Vercel region and Supabase pooler"
git push origin main
```

#### 方式 2：Vercel Dashboard
- 导航：**Deployments** → 最新部署 → **Redeploy**
- 选择：**Redeploy with existing Build Cache**

**完成后**：✅ 勾选此项

---

### 4. 验证部署配置

**时间**：3 分钟
**优先级**：🟡 中

#### 检查清单：

1. **Vercel 区域验证**
   - 查看部署日志
   - 确认：`Region: sin1 (Singapore)`

2. **数据库连接验证**
   - 访问任意需要数据库的页面（如 `/pricing`）
   - 检查是否正常加载
   - 查看 Vercel 日志，确认无连接错误

3. **性能测试**
   - 访问 `/pricing` 页面
   - 预期：点击后 <100ms 跳转
   - 预期：加载动画显示，然后 <2秒显示内容

4. **错误监控**
   - 检查 Vercel Dashboard → **Runtime Logs**
   - 确认无 "too many connections" 错误
   - 确认无 Supabase 连接超时错误

**完成后**：✅ 勾选此项

---

### 5. 数据库索引优化（可选）

**时间**：10 分钟
**优先级**：🟢 低（可延后）

在 Supabase SQL Editor 中执行：

```sql
-- 用户查询优化
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- 任务查询优化
CREATE INDEX IF NOT EXISTS idx_jobs_user_id_status ON jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- 团队查询优化
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- 社区分享查询优化
CREATE INDEX IF NOT EXISTS idx_community_shares_is_active ON community_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_community_shares_created_at ON community_shares(created_at DESC);
```

**完成后**：✅ 勾选此项

---

### 6. 启用 Vercel Analytics（可选）

**时间**：2 分钟
**优先级**：🟢 低（可延后）

#### 步骤：
1. Vercel Dashboard → **Analytics**
2. 点击 **Enable Analytics**
3. 选择计划（免费或付费）

**监控指标**：
- Web Vitals（LCP, FID, CLS）
- 页面性能
- 区域分布

**完成后**：✅ 勾选此项

---

## 📊 性能基准测试

完成上述配置后，使用以下工具验证性能：

### 工具列表：
1. **Chrome DevTools**
   - Network 面板：查看请求时间
   - Performance 面板：分析加载瓶颈

2. **Lighthouse**（Chrome 内置）
   - 运行审计
   - 关注 Performance 分数

3. **WebPageTest**
   - 访问：https://www.webpagetest.org
   - 测试地点：Singapore 或 Hong Kong
   - 对比优化前后

### 预期指标：

| 指标 | 目标值 | 优化前 | 优化后 |
|------|-------|-------|-------|
| 首次内容绘制 (FCP) | <1.8s | ~3-5s | <1.5s |
| 最大内容绘制 (LCP) | <2.5s | ~5-8s | <2s |
| 首次输入延迟 (FID) | <100ms | ~200ms | <50ms |
| 定价页面响应 | <100ms | ~10s | <100ms |
| API 响应时间 | <200ms | ~300-500ms | <100ms |

---

## 🆘 故障排查

### 问题 1: 部署后仍然使用旧区域
**解决**：
- 检查 `vercel.json` 是否包含 `"regions": ["sin1"]`
- 清除 Build Cache 后重新部署
- 等待 5-10 分钟让配置生效

### 问题 2: "too many connections" 错误
**解决**：
- 确认 `POSTGRES_URL` 端口是 `6543`（不是 5432）
- 确认 URL 包含 `?pgbouncer=true`
- 在 Supabase Dashboard 查看活跃连接数

### 问题 3: 定价页面仍然很慢
**解决**：
- 检查浏览器控制台是否有 `/api/pricing` 错误
- 检查 Stripe API 密钥是否正确
- 验证环境变量是否在 Vercel 中正确设置

### 问题 4: 数据库查询失败
**解决**：
- 检查 Transaction Pooler 连接串格式
- 确认数据库密码正确
- 验证 Supabase 实例未暂停（免费版可能暂停）

---

## 📞 获取帮助

如遇到问题，可以查阅：

1. **本地文档**
   - [VERCEL_SUPABASE_OPTIMIZATION.md](VERCEL_SUPABASE_OPTIMIZATION.md) - 详细配置指南
   - [CHANGELOG.md](CHANGELOG.md) - 变更历史

2. **官方文档**
   - Vercel: https://vercel.com/docs
   - Supabase: https://supabase.com/docs

3. **社区支持**
   - Vercel Discord: https://vercel.com/discord
   - Supabase Discord: https://discord.supabase.com

---

## ✅ 完成确认

所有步骤完成后，应该达到以下效果：

- ✅ 定价页面点击后立即响应（<100ms）
- ✅ 无数据库连接错误
- ✅ 亚洲用户访问速度显著提升
- ✅ Vercel 日志显示区域为 sin1
- ✅ API 响应时间 <200ms

**预计总时间**：15-30 分钟
**建议执行时间**：低峰期（避免影响用户）
**回滚方案**：保留旧的环境变量副本，如有问题可快速恢复
