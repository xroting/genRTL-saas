# 流量包 Stripe 配置指南

本指南将帮助您在 Stripe 中配置流量包产品，使用户能够通过一次性支付购买额外的积分。

## 📋 需要创建的产品

您需要在 Stripe 中创建 4 个一次性支付产品：

| 积分数量 | 价格 | Price ID (需要替换) |
|---------|------|-------------------|
| 500     | $5   | `price_credits_pack_500` |
| 2,000   | $20  | `price_credits_pack_2000` |
| 5,000   | $50  | `price_credits_pack_5000` |
| 10,000  | $100 | `price_credits_pack_10000` |

## 🔧 配置步骤

### 1. 登录 Stripe Dashboard

访问 [Stripe Dashboard](https://dashboard.stripe.com/)

### 2. 创建流量包产品

对于每个流量包，按以下步骤操作：

#### 步骤 A：创建产品

1. 在 Stripe Dashboard 左侧菜单点击 **"产品目录"** (Product catalog)
2. 点击右上角 **"添加产品"** (Add product) 按钮
3. 填写产品信息：

**产品 1: 500积分流量包**
- **名称**: `流量包 - 500积分` 或 `Credits Pack - 500`
- **描述**: `一次性购买500积分，适用于免费用户和订阅用户`
- **图片**: (可选) 上传流量包图片

**产品 2: 2000积分流量包**
- **名称**: `流量包 - 2000积分` 或 `Credits Pack - 2000`
- **描述**: `一次性购买2000积分，仅限订阅用户`

**产品 3: 5000积分流量包**
- **名称**: `流量包 - 5000积分` 或 `Credits Pack - 5000`
- **描述**: `一次性购买5000积分，仅限订阅用户`

**产品 4: 10000积分流量包**
- **名称**: `流量包 - 10000积分` 或 `Credits Pack - 10000`
- **描述**: `一次性购买10000积分，仅限订阅用户`

#### 步骤 B：配置价格

在同一个产品创建页面：

1. **定价模式**: 选择 **"一次性"** (One-time)
2. **价格**: 输入对应的美元金额：
   - 产品1: `5.00` USD
   - 产品2: `20.00` USD
   - 产品3: `50.00` USD
   - 产品4: `100.00` USD
3. **计费周期**: 无需设置（因为是一次性支付）
4. 点击 **"保存产品"**

### 3. 获取 Price ID

创建每个产品后：

1. 在产品列表中点击刚创建的产品
2. 在价格部分，您会看到类似 `price_1xxxxxxxxxxxxx` 的 ID
3. 点击复制按钮复制这个 Price ID

### 4. 更新代码中的 Price ID

打开文件 `app/(dashboard)/pricing/pricing-client.tsx`，找到流量包部分，替换 priceId：

```typescript
{/* $5 流量包 - 免费用户可购买 */}
<CreditsPackCard
  credits={500}
  price={5}
  priceId="price_1xxxxxxxxxxxxx"  // ← 替换为您的实际 Price ID
  availableForFree={true}
  currentPlan={currentPlan}
/>

{/* $20 流量包 */}
<CreditsPackCard
  credits={2000}
  price={20}
  priceId="price_1xxxxxxxxxxxxx"  // ← 替换为您的实际 Price ID
  availableForFree={false}
  currentPlan={currentPlan}
/>

{/* $50 流量包 */}
<CreditsPackCard
  credits={5000}
  price={50}
  priceId="price_1xxxxxxxxxxxxx"  // ← 替换为您的实际 Price ID
  availableForFree={false}
  currentPlan={currentPlan}
/>

{/* $100 流量包 */}
<CreditsPackCard
  credits={10000}
  price={100}
  priceId="price_1xxxxxxxxxxxxx"  // ← 替换为您的实际 Price ID
  availableForFree={false}
  currentPlan={currentPlan}
/>
```

### 5. 配置 Webhook 处理

确保您的 Stripe Webhook 能够处理流量包的支付成功事件。

在 `lib/payments/stripe.ts` 或相关的 webhook 处理文件中，添加对一次性支付的处理逻辑：

```typescript
case 'checkout.session.completed':
  // 检查是否是一次性支付（流量包）
  if (event.data.object.mode === 'payment') {
    // 获取购买的流量包信息
    const priceId = event.data.object.line_items?.data[0]?.price?.id;
    
    // 根据 priceId 确定积分数量
    const creditsMap = {
      'price_credits_pack_500': 500,
      'price_credits_pack_2000': 2000,
      'price_credits_pack_5000': 5000,
      'price_credits_pack_10000': 10000,
    };
    
    const credits = creditsMap[priceId];
    
    if (credits) {
      // 增加用户积分
      await addCreditsToTeam(teamId, credits);
    }
  }
  break;
```

## 📝 注意事项

1. **测试模式 vs 生产模式**
   - 在测试环境中，使用测试模式的 Price ID (以 `price_test_` 开头)
   - 在生产环境中，使用生产模式的 Price ID (以 `price_` 开头)

2. **Price ID 的存储**
   - 建议将 Price ID 存储在环境变量中，而不是硬编码
   - 例如：`NEXT_PUBLIC_STRIPE_CREDITS_PACK_500_PRICE_ID`

3. **积分发放逻辑**
   - 确保在 webhook 中正确处理 `checkout.session.completed` 事件
   - 添加积分时需要记录交易历史

4. **退款处理**
   - 如果需要支持退款，需要处理 `charge.refunded` 事件
   - 退款时应从用户账户中扣除相应的积分

## ✅ 验证配置

完成配置后，进行以下测试：

1. 使用 Stripe 的测试卡号 `4242 4242 4242 4242` 测试购买流程
2. 检查用户积分是否正确增加
3. 验证交易记录是否正确保存
4. 确认免费用户只能购买 $5 流量包
5. 确认订阅用户可以购买所有流量包

## 🔗 相关链接

- [Stripe 产品文档](https://stripe.com/docs/products-prices/overview)
- [Stripe 一次性支付](https://stripe.com/docs/billing/subscriptions/one-time-payments)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

完成以上步骤后，您的流量包购买功能就可以正常使用了！🎉

