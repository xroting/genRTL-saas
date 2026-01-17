# Stripe 配置指南

## 🎯 目标
配置 Stripe 以支持订阅支付功能

## 📋 前置条件
- ✅ Vercel 已部署
- ✅ 域名已配置 (www.xroting.com)
- ✅ STRIPE_SECRET_KEY 环境变量已设置

## 🔧 配置步骤

### 步骤 1: 登录 Stripe Dashboard

访问: https://dashboard.stripe.com

确保您使用的是 **测试模式** (可以看到页面上有 "Test mode" 开关)

### 步骤 2: 创建产品和价格

#### 产品 1: 基础档

1. 前往: **Products** → **Add product**
2. 填写信息:
   - **Name**: `基础档`
   - **Description**: `2000 信用点/月 - 仅图片生成`
   - **Pricing model**: `Standard pricing`
   - **Price**: `20.00` USD
   - **Billing period**: `Monthly`
   - **Payment type**: `Recurring`
3. 点击 **Save product**
4. 复制 **Price ID** (格式: `price_xxxxx`)

#### 产品 2: 专业档

1. **Products** → **Add product**
2. 填写:
   - **Name**: `专业档`
   - **Description**: `4000 信用点/月 - 图片 + 短视频生成`
   - **Price**: `40.00` USD
   - **Billing period**: `Monthly`
3. 保存并复制 **Price ID**

#### 产品 3: 至尊档

1. **Products** → **Add product**
2. 填写:
   - **Name**: `至尊档`
   - **Description**: `10000 信用点/月 - 全功能访问`
   - **Price**: `100.00` USD
   - **Billing period**: `Monthly`
3. 保存并复制 **Price ID**

### 步骤 3: 更新代码中的 Price IDs (可选)

如果产品名称匹配,系统会自动从 Stripe 获取价格。

或者,您可以在代码中硬编码 Price IDs:

编辑 `app/(dashboard)/pricing/page.tsx`:

```typescript
// 使用您的实际 Price IDs
const basicPriceId = 'price_1ABC...';  // 替换为实际 ID
const proPriceId = 'price_1XYZ...';    // 替换为实际 ID
const enterprisePriceId = 'price_1DEF...';  // 替换为实际 ID
```

### 步骤 4: 配置 Stripe Webhook

1. 前往: **Developers** → **Webhooks** → **Add endpoint**

2. 填写:
   - **Endpoint URL**: `https://www.xroting.com/api/stripe/webhook`
   - **Description**: `Monna SaaS Production Webhook`

3. 选择事件 **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`

4. 点击 **Add endpoint**

5. 复制 **Signing secret** (格式: `whsec_xxxxx`)

### 步骤 5: 更新 Vercel 环境变量

```bash
# 添加或更新 Webhook Secret
vercel env rm STRIPE_WEBHOOK_SECRET production --yes
echo "whsec_your_actual_secret" | vercel env add STRIPE_WEBHOOK_SECRET production

# 重新部署
vercel --prod
```

### 步骤 6: 测试支付流程

#### 测试卡号 (Test mode only):

成功支付:
- **卡号**: `4242 4242 4242 4242`
- **日期**: 任何未来日期 (如 `12/34`)
- **CVC**: 任何3位数 (如 `123`)
- **邮编**: 任何5位数 (如 `12345`)

失败支付 (用于测试错误处理):
- **卡号**: `4000 0000 0000 0002`

需要3D验证:
- **卡号**: `4000 0025 0000 3155`

#### 测试步骤:

1. 访问: https://www.xroting.com/pricing
2. 点击任意付费计划的按钮
3. 如果未登录,会跳转到登录页
4. 登录后,会跳转到 Stripe Checkout 页面
5. 使用测试卡号完成支付
6. 支付成功后,应跳转回您的网站

### 步骤 7: 验证 Webhook

1. 完成一次测试支付
2. 在 Stripe Dashboard → **Developers** → **Webhooks**
3. 点击您的 endpoint
4. 查看 **Event log**,确保事件被成功接收 (状态应为绿色 ✓)

如果看到红色 ✗ 错误:
- 检查 Vercel 部署日志
- 确保 STRIPE_WEBHOOK_SECRET 正确

## 🐛 常见问题

### 问题 1: 点击购买按钮后跳转到登录页

**原因**: 用户未登录

**解决**:
1. 前往: https://www.xroting.com/sign-up
2. 注册账号
3. 返回 pricing 页面

### 问题 2: "配置中..." 按钮禁用

**原因**:
- Stripe 产品名称不匹配
- 或 STRIPE_SECRET_KEY 无效

**解决**:
1. 确保产品名称完全匹配: `基础档`, `专业档`, `企业档`
2. 检查 Stripe Dashboard 中产品是否 Active
3. 验证 API Key 是否正确

### 问题 3: Webhook 返回 401 错误

**原因**: Webhook signature 验证失败

**解决**:
```bash
# 确认 webhook secret 正确
vercel env ls production | grep WEBHOOK

# 重新设置
vercel env rm STRIPE_WEBHOOK_SECRET production --yes
vercel env add STRIPE_WEBHOOK_SECRET production
# 输入 whsec_xxxxx
```

### 问题 4: 支付成功但订阅未激活

**原因**: Webhook 未正确处理

**解决**:
1. 检查 Vercel 函数日志
2. 查看 Stripe Event log
3. 确保 webhook handler 正确更新数据库

## ✅ 验证清单

完成配置后,检查以下项目:

- [ ] Stripe Dashboard 中有3个产品 (基础档、专业档、企业档)
- [ ] 每个产品都有对应的月度价格
- [ ] Webhook endpoint 已添加并选择了正确的事件
- [ ] STRIPE_WEBHOOK_SECRET 已设置在 Vercel
- [ ] 使用测试卡完成一次支付
- [ ] Webhook 在 Stripe Dashboard 显示为成功 ✓
- [ ] 用户订阅状态在数据库中正确更新

## 📞 下一步

配置完成后,您可以:
1. **配置 Supabase 认证** - 允许用户登录
2. **测试完整流程** - 注册 → 登录 → 购买 → 使用
3. **切换到生产模式** - 关闭 Test mode,使用真实支付

## 🔗 有用链接

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe 测试卡: https://stripe.com/docs/testing
- Stripe Webhooks: https://dashboard.stripe.com/webhooks
- Vercel 环境变量: https://vercel.com/xroting-technology-llc/monna-saas/settings/environment-variables
