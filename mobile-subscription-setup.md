# 移动端应用内购买（IAP）配置指南

## 🎯 概述

本指南详细说明如何为Monna SaaS移动应用配置Google Play和App Store的应用内订阅功能。

## 📋 订阅计划

与Web端保持一致的4个订阅档位：

| 计划 | 价格 | 积分 | 功能 |
|------|------|------|------|
| 免费档 | $0/月 | 20积分 | 仅图片生成,每张图片10积分,基础支持 |
| 基础档 | $20/月 | 2000积分 | 仅图片生成,每张图片10积分,邮件支持 |
| 专业档 | $40/月 | 4000积分 | 图片+短视频,每张图片8积分,每秒短视频15积分,优先支持 |
| 至尊档 | $100/月 | 12000积分 | 完整功能,每张图片8积分,短视频15积分/秒,长视频80积分/秒,专属支持+API访问 |

## 🍎 App Store Connect 配置步骤

### 步骤 1: 创建App Store Connect记录

1. 登录 [App Store Connect](https://appstoreconnect.apple.com/)
2. 点击 "My Apps" → "+" → "New App"
3. 填写应用信息:
   - **Platform**: iOS
   - **Name**: genRTL
   - **Primary Language**: 简体中文 或 英语
   - **Bundle ID**: 选择你的应用 Bundle ID (例如: com.monna.ai)
   - **SKU**: 唯一标识符 (例如: monna-ai-001)

### 步骤 2: 创建订阅组 (Subscription Group)

1. 在App详情页,选择 **Features** → **Subscriptions**
2. 点击 **Create Subscription Group**
3. 填写信息:
   - **Reference Name**: Monna Subscriptions
   - **App Name**: genRTL (用户看到的名称)

### 步骤 3: 创建订阅产品

为每个计划创建订阅:

#### 基础档订阅

1. 在Subscription Group中,点击 "+" 创建新订阅
2. 填写:
   - **Product ID**: `com.monna.ai.subscription.basic` (重要:记录此ID)
   - **Reference Name**: Basic Plan
3. 点击 "Create"
4. 设置定价:
   - **Subscription Duration**: 1 Month
   - **Price**: $19.99 (选择价格等级)
5. 设置本地化信息:
   - **Subscription Display Name**: 基础档
   - **Description**: 每月2000积分,仅图片生成,邮件支持
6. 添加审核信息截图

#### 专业档订阅

重复上述步骤:
- **Product ID**: `com.monna.ai.subscription.professional`
- **Price**: $39.99
- **Subscription Display Name**: 专业档
- **Description**: 每月4000积分,图片+短视频生成,优先支持

#### 至尊档订阅

- **Product ID**: `com.monna.ai.subscription.enterprise`
- **Price**: $99.99
- **Subscription Display Name**: 至尊档
- **Description**: 每月12000积分,完整功能访问,专属支持+API

### 步骤 4: 配置订阅选项

对每个订阅:
1. 设置 **Free Trial**: 7天免费试用 (可选)
2. 设置 **Introductory Offer**: 首月优惠 (可选)
3. 配置 **Family Sharing**: 根据需求启用

### 步骤 5: 服务器配置

1. 在 **App Information** 中找到 **Shared Secret**
2. 复制 Shared Secret 并保存 (将用于服务器验证)
3. 在 **User and Access** → **Keys** 中创建 **App Store Connect API Key**:
   - 权限: App Manager 或 Developer
   - 下载 `.p8` 私钥文件
   - 记录 **Key ID** 和 **Issuer ID**

### 步骤 6: 服务器通知配置

1. 在 App 详情页,选择 **App Store Server Notifications**
2. 设置 **Production Server URL**:
   ```
   https://www.monna.us/api/webhooks/apple
   ```
3. 设置 **Sandbox Server URL**:
   ```
   https://www.monna.us/api/webhooks/apple?sandbox=true
   ```
4. 选择 **Notification Version**: Version 2

## 🤖 Google Play Console 配置步骤

### 步骤 1: 创建应用

1. 登录 [Google Play Console](https://play.google.com/console)
2. 点击 "创建应用"
3. 填写:
   - **应用名称**: genRTL
   - **默认语言**: 简体中文
   - **应用类型**: 应用
   - **免费或付费**: 免费

### 步骤 2: 设置应用内商品

1. 在侧边栏选择 **商品化** → **商品** → **订阅**
2. 点击 **创建订阅**

#### 基础档订阅

3. 填写订阅详情:
   - **Product ID**: `basic_monthly` (重要:记录此ID)
   - **Name**: 基础档
   - **Description**: 每月2000积分,仅图片生成,邮件支持
4. 设置定价:
   - **Base Plan**:
     - **Billing Period**: 1个月
     - **Price**:
       - 美国: $19.99
       - 中国: ¥138
5. 点击 **Activate** 激活订阅

#### 专业档订阅

- **Product ID**: `professional_monthly`
- **Name**: 专业档
- **Price**: $39.99 / ¥278

#### 至尊档订阅

- **Product ID**: `enterprise_monthly`
- **Name**: 至尊档
- **Price**: $99.99 / ¥688

### 步骤 3: 配置许可测试

1. 在 **设置** → **许可测试** 中添加测试账号
2. 添加你的测试Gmail账号,用于测试订阅

### 步骤 4: 配置服务账号

1. 在 **设置** → **API访问** 中点击 **启用API访问**
2. 如果没有,创建新的服务账号:
   - 在Google Cloud Console中创建服务账号
   - 授予 **Service Account User** 角色
   - 创建JSON密钥并下载
3. 在Play Console中,将服务账号链接到应用
4. 授予权限: **查看财务数据**, **管理订单和订阅**

### 步骤 5: 配置实时开发者通知 (RTDN)

1. 在Google Cloud Console中启用 **Cloud Pub/Sub API**
2. 创建Pub/Sub主题:
   ```
   monna-play-subscriptions
   ```
3. 将Play Console服务账号添加为主题的 **Pub/Sub Publisher**
4. 在Play Console **商品化设置** 中,设置主题名称
5. 创建Push订阅,endpoint设置为:
   ```
   https://www.monna.us/api/webhooks/google-play
   ```

## 🔐 环境变量配置

在Vercel或你的部署平台添加以下环境变量:

### App Store 相关

```bash
# App Store Connect API
APPLE_KEY_ID=YOUR_KEY_ID                          # 在App Store Connect Keys页面获取
APPLE_ISSUER_ID=YOUR_ISSUER_ID                    # 在App Store Connect Keys页面获取
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n... # .p8文件内容,换行用\n

# App Store Shared Secret (用于收据验证)
APPLE_SHARED_SECRET=your_shared_secret            # 在App信息页面获取

# Bundle ID
APPLE_BUNDLE_ID=com.monna.ai                      # 你的应用Bundle ID
```

### Google Play 相关

```bash
# Google Play Service Account
GOOGLE_PLAY_SERVICE_ACCOUNT='{...}'               # 服务账号JSON文件的完整内容

# Google Play Package Name
GOOGLE_PLAY_PACKAGE_NAME=com.monna.ai             # 你的应用包名
```

## 📱 移动端集成

### iOS (React Native)

安装依赖:
```bash
npm install react-native-iap
cd ios && pod install
```

### Android

在 `android/app/build.gradle` 中添加:
```gradle
dependencies {
    implementation 'com.android.billingclient:billing:6.0.1'
}
```

## 🔄 API 端点说明

后端已实现以下API端点:

### 1. 验证Apple购买

```http
POST /api/mobile/subscriptions/apple/verify
Content-Type: application/json

{
  "transactionId": "2000000123456789",
  "receiptData": "base64_encoded_receipt"
}
```

### 2. 验证Google Play购买

```http
POST /api/mobile/subscriptions/google/verify
Content-Type: application/json

{
  "purchaseToken": "google_purchase_token",
  "productId": "basic_monthly"
}
```

### 3. 获取订阅状态

```http
GET /api/mobile/subscriptions/status
Authorization: Bearer {supabase_token}
```

### 4. Apple Webhook (服务器通知)

```http
POST /api/webhooks/apple
```

### 5. Google Play Webhook (实时通知)

```http
POST /api/webhooks/google-play
```

## 🧪 测试流程

### iOS测试

1. 在Xcode中使用Sandbox账号登录
2. 在设备上安装应用
3. 尝试购买订阅
4. 在 App Store Connect → **TestFlight** 中查看测试信息

### Android测试

1. 在Play Console中添加测试账号
2. 使用内部测试轨道上传APK
3. 测试账号登录设备
4. 尝试购买订阅(测试账号免费)

## 📊 Product ID 映射表

### Apple Product IDs
```
com.monna.ai.subscription.basic        → basic (plan_name)
com.monna.ai.subscription.professional → professional (plan_name)
com.monna.ai.subscription.enterprise   → enterprise (plan_name)
```

### Google Play Product IDs
```
basic_monthly        → basic (plan_name)
professional_monthly → professional (plan_name)
enterprise_monthly   → enterprise (plan_name)
```

## 🔍 故障排查

### Apple常见问题

**Q: 收据验证失败?**
A: 检查 APPLE_SHARED_SECRET 是否正确,确保使用正确的验证URL (沙盒/生产)

**Q: 无法创建订阅?**
A: 确保至少有一个协议已批准 (Paid Applications Agreement)

### Google Play常见问题

**Q: 服务账号无权限?**
A: 在Play Console中重新授予服务账号权限

**Q: 实时通知未收到?**
A: 检查Pub/Sub订阅的endpoint是否正确,查看Cloud Logging

## 📝 下一步

1. ✅ 在App Store Connect创建订阅
2. ✅ 在Google Play Console创建订阅
3. ✅ 配置服务账号和API密钥
4. ✅ 添加环境变量到Vercel
5. ✅ 移动端集成IAP SDK
6. ✅ 测试订阅流程
7. ✅ 提交审核

## 🔗 相关链接

- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console)
- [Apple订阅文档](https://developer.apple.com/app-store/subscriptions/)
- [Google Play订阅文档](https://developer.android.com/google/play/billing/subscriptions)
- [react-native-iap文档](https://github.com/dooboolab-community/react-native-iap)
