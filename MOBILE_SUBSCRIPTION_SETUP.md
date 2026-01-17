# 📱 移动应用订阅支付配置指南

本指南将帮助您为 iOS 和 Android 移动应用配置订阅支付功能。

## 🎯 概览

移动应用使用 **RevenueCat** 作为统一的订阅管理平台，支持：
- ✅ iOS App Store In-App Purchase (IAP)
- ✅ Google Play Billing
- ✅ 跨平台订阅状态同步
- ✅ 自动处理订阅续订和退款

## 📋 前置条件

- [x] 已有 Apple Developer Account（iOS）
- [x] 已有 Google Play Developer Account（Android）
- [x] 移动应用 Bundle ID/Package Name 已确定
  - iOS: `com.anonymous.Natively`
  - Android: `com.anonymous.Natively`

---

## 第一步：创建 RevenueCat 项目

### 1.1 注册 RevenueCat

1. 访问 [RevenueCat Dashboard](https://app.revenuecat.com)
2. 创建账号并登录
3. 点击 **Create a project**

### 1.2 配置项目

- **Project Name**: `Monna-SaaS`
- **App Name**: `AIGen`
- **Bundle ID (iOS)**: `com.anonymous.Natively`
- **Package Name (Android)**: `com.anonymous.Natively`

### 1.3 获取 API Keys

创建项目后，前往 **Settings** → **API Keys**：

1. **Apple App Store API Key**
   - 复制 `Apple App Store` 下的 Public SDK Key
   - 保存为 `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY`

2. **Google Play API Key**
   - 复制 `Google Play Store` 下的 Public SDK Key
   - 保存为 `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY`

---

## 第二步：配置 iOS App Store

### 2.1 创建 App Store Connect 应用

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 前往 **My Apps** → **点击 +** → **New App**
3. 填写信息：
   - **Name**: `AIGen`
   - **Primary Language**: `简体中文`
   - **Bundle ID**: `com.anonymous.Natively`
   - **SKU**: `natively-ios-001`

### 2.2 配置订阅产品

1. 在 App Store Connect，选择您的应用
2. 前往 **Features** → **In-App Purchases** → **Manage**
3. 点击 **+** → **Auto-Renewable Subscription**

#### 订阅组
创建订阅组：`subscription_group_001`

#### 产品 1: 基础档
- **Product ID**: `com.anonymous.natively.basic.monthly`
- **Reference Name**: `基础档 - 月订阅`
- **Duration**: `1 Month`
- **Price**: `¥28`（或 $3.99 USD）
- **Subscription Group**: `subscription_group_001`

#### 产品 2: 专业档
- **Product ID**: `com.anonymous.natively.pro.monthly`
- **Reference Name**: `专业档 - 月订阅`
- **Duration**: `1 Month`
- **Price**: `¥58`（或 $7.99 USD）
- **Subscription Group**: `subscription_group_001`

#### 产品 3: 至尊档
- **Product ID**: `com.anonymous.natively.enterprise.monthly`
- **Reference Name**: `至尊档 - 月订阅`
- **Duration**: `1 Month`
- **Price**: `¥138`（或 $19.99 USD）
- **Subscription Group**: `subscription_group_001`

### 2.3 连接 RevenueCat 与 App Store Connect

1. 在 RevenueCat Dashboard，前往 **Project Settings** → **Apple App Store**
2. 点击 **Service Credentials** → **Add New Credentials**
3. 上传 App Store Connect API Key:
   - 在 App Store Connect → **Users and Access** → **Keys** → **App Store Connect API**
   - 创建新 Key，下载 `.p8` 文件
   - 在 RevenueCat 上传该文件并填写 **Issuer ID** 和 **Key ID**

---

## 第三步：配置 Google Play Store

### 3.1 创建 Google Play Console 应用

1. 登录 [Google Play Console](https://play.google.com/console)
2. 点击 **Create app**
3. 填写信息：
   - **App name**: `AIGen`
   - **Default language**: `中文(简体)`
   - **App or game**: `App`
   - **Free or paid**: `Free`
   - **Package name**: `com.anonymous.Natively`

### 3.2 配置订阅产品

1. 前往 **Monetization** → **Products** → **Subscriptions**
2. 点击 **Create subscription**

#### 产品 1: 基础档
- **Product ID**: `com.anonymous.natively.basic.monthly`
- **Name**: `基础档`
- **Description**: `2000 信用点/月 - 图片生成`
- **Billing period**: `1 month`
- **Price**: `¥28` 或等值本地货币

#### 产品 2: 专业档
- **Product ID**: `com.anonymous.natively.pro.monthly`
- **Name**: `专业档`
- **Description**: `4000 信用点/月 - 图片 + 短视频`
- **Billing period**: `1 month`
- **Price**: `¥58`

#### 产品 3: 至尊档
- **Product ID**: `com.anonymous.natively.enterprise.monthly`
- **Name**: `至尊档`
- **Description**: `10000 信用点/月 - 全功能访问`
- **Billing period**: `1 month`
- **Price**: `¥138`

### 3.3 连接 RevenueCat 与 Google Play

1. 在 Google Play Console → **Setup** → **API access**
2. 点击 **Create new service account**
3. 在 Google Cloud Console 创建 Service Account
4. 下载 JSON Key 文件
5. 在 RevenueCat Dashboard → **Project Settings** → **Google Play**
6. 上传 JSON Key 文件

---

## 第四步：配置 RevenueCat Offerings

### 4.1 创建 Entitlements

在 RevenueCat Dashboard → **Entitlements**:

1. **Entitlement ID**: `pro`
   - **Display Name**: `专业功能`
   - **Description**: `解锁专业功能和额外信用点`

2. **Entitlement ID**: `enterprise`
   - **Display Name**: `企业功能`
   - **Description**: `解锁全部功能和最高信用点`

### 4.2 创建 Offerings

在 RevenueCat Dashboard → **Offerings**:

#### Current Offering
- **Identifier**: `default_offering`
- **Description**: `Default subscription offering`

#### Packages

1. **基础档 Package**
   - **Identifier**: `basic`
   - **iOS Product**: `com.anonymous.natively.basic.monthly`
   - **Android Product**: `com.anonymous.natively.basic.monthly`
   - **Entitlements**: _(无，免费功能)_

2. **专业档 Package**
   - **Identifier**: `pro`
   - **iOS Product**: `com.anonymous.natively.pro.monthly`
   - **Android Product**: `com.anonymous.natively.pro.monthly`
   - **Entitlements**: `pro`

3. **至尊档 Package**
   - **Identifier**: `enterprise`
   - **iOS Product**: `com.anonymous.natively.enterprise.monthly`
   - **Android Product**: `com.anonymous.natively.enterprise.monthly`
   - **Entitlements**: `pro`, `enterprise`

---

## 第五步：配置环境变量

### 5.1 移动端环境变量

编辑 `mobile-app/.env`:

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=goog_xxxxxxxxxxxxx

# Backend API URL (用于订阅同步)
EXPO_PUBLIC_API_URL=https://www.monna.us
```

### 5.2 后端环境变量

无需额外配置，后端 API 使用现有的 Supabase 连接。

---

## 第六步：更新 app.json

编辑 `mobile-app/app.json`，确保 Bundle ID 正确：

```json
{
  "expo": {
    "name": "AIGen",
    "slug": "AIGen",
    "ios": {
      "bundleIdentifier": "com.anonymous.Natively",
      ...
    },
    "android": {
      "package": "com.anonymous.Natively",
      ...
    }
  }
}
```

---

## 第七步：测试订阅

### 7.1 iOS 测试

1. 在 App Store Connect 创建 **Sandbox Tester** 账号
   - 前往 **Users and Access** → **Sandbox Testers**
   - 点击 **+** 创建测试账号
   - 邮箱格式: `test@sandbox.com`

2. 在 iOS 设备/模拟器测试：
   ```bash
   cd mobile-app
   npm run ios
   ```

3. 登录 Sandbox Tester 账号
4. 导航到订阅页面并购买

### 7.2 Android 测试

1. 在 Google Play Console 添加测试用户
   - 前往 **Setup** → **License testing**
   - 添加测试邮箱账号

2. 构建测试版本：
   ```bash
   cd mobile-app
   eas build --profile development --platform android
   ```

3. 安装并测试订阅功能

---

## 第八步：集成 Webhook (可选)

RevenueCat 可以通过 Webhook 通知订阅事件。

### 8.1 创建 Webhook Endpoint

在后端创建 `app/api/webhooks/revenuecat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const event = await req.json();

  // 处理订阅事件
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
      // 订阅成功
      break;
    case 'CANCELLATION':
    case 'EXPIRATION':
      // 订阅取消
      break;
  }

  return NextResponse.json({ received: true });
}
```

### 8.2 配置 RevenueCat Webhook

1. 在 RevenueCat Dashboard → **Integrations** → **Webhooks**
2. 点击 **Add Webhook**
3. 填写 URL: `https://www.monna.us/api/webhooks/revenuecat`
4. 选择要接收的事件
5. 保存并测试

---

## 🧪 测试清单

完成配置后，测试以下流程：

- [ ] iOS 订阅购买流程
- [ ] Android 订阅购买流程
- [ ] 订阅状态同步到后端
- [ ] 信用点正确分配
- [ ] Profile 页面显示当前订阅
- [ ] 恢复购买功能
- [ ] 订阅管理（取消/恢复）
- [ ] 跨设备订阅同步

---

## 📝 常见问题

### Q: 为什么移动端价格与 Web 端不同？

A: 苹果和谷歌各自有定价规则，需要按照他们的定价层级设置。建议价格接近但不必完全一致。

### Q: 用户在移动端订阅后，Web 端能看到吗？

A: 可以！订阅状态会通过 `/api/subscriptions/sync` API 同步到 Supabase，Web 和移动端共享订阅状态。

### Q: 如何处理退款？

A: RevenueCat 会自动处理退款，并通过 Webhook 通知后端。后端应当撤销相应的信用点。

### Q: 测试时如何加速订阅周期？

A:
- **iOS**: Sandbox 环境会自动加速（1月 = 5分钟）
- **Android**: License testing 也会加速订阅周期

---

## 🔗 参考链接

- [RevenueCat Documentation](https://docs.revenuecat.com)
- [Apple In-App Purchase](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [react-native-purchases](https://github.com/RevenueCat/react-native-purchases)

---

## 📞 下一步

配置完成后：

1. **提交 App 审核**
   - iOS: 提交到 App Store Review
   - Android: 提交到 Google Play Console

2. **监控订阅数据**
   - 使用 RevenueCat Dashboard 查看订阅统计
   - 定期检查同步日志

3. **优化定价**
   - 根据用户反馈调整价格
   - A/B 测试不同的订阅套餐

---

**提示**: 应用首次提交时，Apple 和 Google 都会审核订阅功能。确保：
- 订阅条款清晰
- 提供隐私政策和用户协议
- 正确处理订阅取消和退款流程
