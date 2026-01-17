# 移动端支付配置指南

本指南将帮助你配置 Monna App 的 iOS 和 Android 订阅支付功能。

## 目录

1. [RevenueCat 账户设置](#revenuecat-账户设置)
2. [Google Play Console 配置](#google-play-console-配置)
3. [App Store Connect 配置](#app-store-connect-配置)
4. [RevenueCat 产品配置](#revenuecat-产品配置)
5. [环境变量配置](#环境变量配置)
6. [测试订阅功能](#测试订阅功能)
7. [常见问题](#常见问题)

---

## RevenueCat 账户设置

### 1. 创建 RevenueCat 账户

1. 访问 [RevenueCat](https://app.revenuecat.com)
2. 注册并创建一个新项目
3. 项目名称：`Monna` 或 `AIGen`

### 2. 获取 API Keys

完成账户创建后：

1. 进入项目设置
2. 找到 **API Keys** 部分
3. 复制以下 API Keys：
   - **Google Play API Key** (`goog_...`)
   - **Apple App Store API Key** (`appl_...`)

⚠️ **重要**：将这些 API Keys 保存到 `.env` 文件（下面会说明）

---

## Google Play Console 配置

### 前置条件

- Google Play Developer 账户（需支付 $25 注册费）
- 已上传应用到 Google Play Console

### 步骤 1: 创建订阅产品

1. 登录 [Google Play Console](https://play.google.com/console)
2. 选择你的应用（`Monna`，包名：`com.monna.app`）
3. 导航到：**变现** → **产品** → **订阅**
4. 点击 **创建订阅**

### 步骤 2: 配置基础档订阅

#### 产品详情

- **产品 ID**: `com.monna.app.basic.monthly`
- **名称**: `Monna 基础档`
- **描述**: `每月 2000 积分，适用于基础图片生成需求`

#### 定价

- **基础价格**: `$20.00 USD`
- **订阅周期**: `1 个月`
- **免费试用**: 可选（例如 7 天）
- **优惠期**: 可选

#### 其他设置

- **续订类型**: 自动续订
- **宽限期**: 建议设置 3 天
- **重试期**: 建议设置 7 天

### 步骤 3: 创建专业档订阅

重复步骤 2，使用以下信息：

- **产品 ID**: `com.monna.app.pro.monthly`
- **名称**: `Monna 专业档`
- **描述**: `每月 4000 积分，支持图片和短视频生成`
- **基础价格**: `$40.00 USD`

### 步骤 4: 创建至尊档订阅

重复步骤 2，使用以下信息：

- **产品 ID**: `com.monna.app.enterprise.monthly`
- **名称**: `Monna 至尊档`
- **描述**: `每月 12000 积分，完整功能访问，包含长视频生成`
- **基础价格**: `$100.00 USD`

### 步骤 5: 连接 Google Play 到 RevenueCat

1. 在 Google Play Console 中，导航到：**设置** → **API 访问**
2. 点击 **创建新的服务账号**
3. 按照指示在 Google Cloud Console 中创建服务账号
4. 下载 JSON 密钥文件
5. 在 RevenueCat 中：
   - 进入 **Project Settings** → **Integrations** → **Google Play**
   - 上传 JSON 密钥文件
   - 验证连接

---

## App Store Connect 配置

### 前置条件

- Apple Developer 账户（需支付 $99/年）
- 已在 App Store Connect 创建应用

### 步骤 1: 创建订阅组

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 选择你的应用（`Monna`）
3. 导航到：**功能** → **App 内购买项目和订阅**
4. 点击左侧 **订阅**，然后点击 **+** 创建订阅组
5. **订阅组名称**: `Monna Subscriptions`

### 步骤 2: 创建订阅产品

在刚创建的订阅组中，点击 **+** 创建订阅：

#### 基础档订阅

- **产品 ID**: `com.monna.app.basic.monthly`
- **订阅显示名称**: `Monna 基础档`
- **订阅描述**: `每月 2000 积分，适用于基础图片生成需求`
- **订阅价格**: 选择价格等级（对应 $19.99 USD）
- **订阅持续时间**: `1 个月`

#### 专业档订阅

- **产品 ID**: `com.monna.app.pro.monthly`
- **订阅显示名称**: `Monna 专业档`
- **订阅描述**: `每月 4000 积分，支持图片和短视频生成`
- **订阅价格**: 选择价格等级（对应 $39.99 USD）
- **订阅持续时间**: `1 个月`

#### 至尊档订阅

- **产品 ID**: `com.monna.app.enterprise.monthly`
- **订阅显示名称**: `Monna 至尊档`
- **订阅描述**: `每月 12000 积分，完整功能访问，包含长视频生成`
- **订阅价格**: 选择价格等级（对应 $99.99 USD）
- **订阅持续时间**: `1 个月`

### 步骤 3: 连接 App Store Connect 到 RevenueCat

1. 在 App Store Connect 中，导航到：**用户和访问** → **密钥** → **App Store Connect API**
2. 点击 **生成 API 密钥**
3. **密钥名称**: `RevenueCat API Access`
4. **访问权限**: 选择 **App Manager** 或 **Admin**
5. 下载 `.p8` 密钥文件
6. 记下：
   - **Issuer ID**
   - **Key ID**
7. 在 RevenueCat 中：
   - 进入 **Project Settings** → **Integrations** → **App Store**
   - 上传 `.p8` 文件
   - 输入 Issuer ID 和 Key ID
   - 验证连接

---

## RevenueCat 产品配置

### 步骤 1: 创建 Entitlements

Entitlements 是用户权限的抽象层。

1. 在 RevenueCat Dashboard 中，进入 **Products**
2. 点击 **Entitlements** 标签
3. 创建以下 Entitlements：

#### Basic Entitlement
- **Identifier**: `basic`
- **Name**: `Basic Features`
- **Description**: `基础功能访问`

#### Pro Entitlement
- **Identifier**: `pro`
- **Name**: `Pro Features`
- **Description**: `专业功能访问（包含 Basic）`

#### Enterprise Entitlement
- **Identifier**: `enterprise`
- **Name**: `Enterprise Features`
- **Description**: `企业功能访问（包含 Pro）`

### 步骤 2: 配置 Products

1. 在 **Products** 标签中，点击 **+ New**
2. 对于每个产品（basic, pro, enterprise），配置：

#### Basic Product
- **Identifier**: `basic`
- **iOS Product ID**: `com.monna.app.basic.monthly`
- **Android Product ID**: `com.monna.app.basic.monthly`
- **Entitlements**: 选择 `basic`

#### Pro Product
- **Identifier**: `pro`
- **iOS Product ID**: `com.monna.app.pro.monthly`
- **Android Product ID**: `com.monna.app.pro.monthly`
- **Entitlements**: 选择 `pro`

#### Enterprise Product
- **Identifier**: `enterprise`
- **iOS Product ID**: `com.monna.app.enterprise.monthly`
- **Android Product ID**: `com.monna.app.enterprise.monthly`
- **Entitlements**: 选择 `enterprise`

### 步骤 3: 创建 Offering

Offering 是向用户展示的订阅套餐集合。

1. 进入 **Offerings** 标签
2. 点击 **+ New Offering**
3. **Identifier**: `default`（这是默认套餐）
4. **Description**: `Standard subscription offerings`
5. 添加所有三个产品（basic, pro, enterprise）
6. 设置 `default` 为当前激活的 Offering

---

## 环境变量配置

### 移动端 `.env` 配置

在 `mobile-app/.env` 文件中添加以下环境变量：

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_xxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=goog_xxxxxxxxxx

# API Base URL
EXPO_PUBLIC_API_BASE_URL=https://www.monna.us

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

⚠️ **安全提示**：
- 不要将 `.env` 文件提交到 Git
- `.env` 已经在 `.gitignore` 中

---

## 测试订阅功能

### Android 测试

#### 1. 添加测试账号

1. 在 Google Play Console 中，导航到：**设置** → **许可测试**
2. 添加测试账号的 Gmail 地址
3. 选择 **License Testing** → **测试人员将拥有许可证**

#### 2. 创建内部测试版本

1. 构建 Android APK 或 AAB
2. 上传到 Google Play Console 的 **内部测试** 轨道
3. 添加测试人员
4. 测试人员通过链接下载应用

#### 3. 测试购买流程

1. 在测试设备上登录测试账号
2. 打开应用，进入订阅页面
3. 点击任意订阅计划
4. 完成测试购买（不会实际扣费）
5. 验证订阅状态在应用中正确显示

### iOS 测试

#### 1. 创建沙盒测试账号

1. 在 App Store Connect 中，导航到：**用户和访问** → **沙盒测试员**
2. 点击 **+** 创建新的测试账号
3. 填写测试账号信息（邮箱、密码等）

#### 2. 配置 TestFlight

1. 构建 iOS 应用（使用 EAS Build 或 Xcode）
2. 上传到 App Store Connect
3. 在 **TestFlight** 中添加内部测试人员
4. 等待构建版本通过审核

#### 3. 测试购买流程

1. 在测试设备上安装 TestFlight 版本
2. 进入 **设置** → **App Store** → **沙盒账户**
3. 登录沙盒测试账号
4. 打开应用，进入订阅页面
5. 完成测试购买（不会实际扣费）

---

## 常见问题

### Q1: 点击订阅按钮后弹出"购买未完成"或"产品暂时不可用"？

**原因**：
- 产品 ID 配置错误（与包名不匹配）
- RevenueCat 中未配置相应产品
- Google Play Console 或 App Store Connect 中未创建订阅产品
- 产品还在审核中（iOS）

**解决方案**：
1. 确认产品 ID 格式正确：`com.monna.app.[plan].monthly`
2. 确认 RevenueCat 中已配置并激活产品
3. 确认 Google Play 或 App Store 中的产品已激活
4. 检查 RevenueCat Dashboard 的日志，查看具体错误

### Q2: RevenueCat SDK 初始化失败？

**原因**：
- API Key 未配置或配置错误
- 在 Expo Go 中运行（不支持原生模块）

**解决方案**：
1. 确认 `.env` 文件中配置了正确的 API Keys
2. 重新构建应用（`npm run build:android` 或使用 EAS Build）
3. 不要在 Expo Go 中测试订阅功能

### Q3: 订阅状态不同步？

**原因**：
- 后端 API 未正确配置
- 网络连接问题
- RevenueCat webhook 未配置

**解决方案**：
1. 确认后端 API `/api/subscriptions/sync` 正常工作
2. 检查移动端日志，查看同步请求是否成功
3. 在 RevenueCat 中配置 webhook（可选，用于实时同步）

### Q4: 测试购买后真的会扣费吗？

**答案**：不会。

- **Android**: 使用许可测试账号或内部测试版本，不会真实扣费
- **iOS**: 使用沙盒测试账号，不会真实扣费

只有在正式发布到 Google Play Store 或 App Store 后，真实用户才会被收费。

### Q5: 如何取消测试订阅？

#### Android
1. 打开 Google Play Store
2. 进入 **账号** → **付款和订阅** → **订阅**
3. 找到并取消测试订阅

#### iOS
1. 打开 **设置** → **Apple ID** → **订阅**
2. 找到并取消测试订阅

### Q6: 如何查看订阅收入？

- **RevenueCat Dashboard**: 提供统一的收入分析和报表
- **Google Play Console**: 查看 Android 收入
- **App Store Connect**: 查看 iOS 收入

---

## 额外资源

### 官方文档

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [App Store In-App Purchase Documentation](https://developer.apple.com/in-app-purchase/)

### Monna 项目相关文件

- `mobile-app/lib/purchases/config.ts` - 产品配置
- `mobile-app/lib/purchases/service.ts` - RevenueCat 服务
- `mobile-app/lib/contexts/SubscriptionContext.tsx` - 订阅上下文
- `mobile-app/app/(tabs)/subscription.tsx` - 订阅页面
- `app/api/subscriptions/sync/route.ts` - 后端同步 API

---

## 配置检查清单

完成配置后，请确认以下所有项目都已完成：

### RevenueCat
- [ ] 创建了 RevenueCat 账户和项目
- [ ] 获取了 Apple 和 Google API Keys
- [ ] 配置了 Entitlements（basic, pro, enterprise）
- [ ] 配置了 Products 并关联到正确的平台产品 ID
- [ ] 创建了 default Offering 并添加了所有产品
- [ ] 连接了 Google Play 和 App Store Connect

### Google Play Console
- [ ] 创建了三个订阅产品（basic, pro, enterprise）
- [ ] 产品 ID 格式正确：`com.monna.app.[plan].monthly`
- [ ] 设置了价格和订阅周期
- [ ] 添加了测试账号
- [ ] 创建了服务账号并连接到 RevenueCat

### App Store Connect
- [ ] 创建了订阅组
- [ ] 创建了三个订阅产品（basic, pro, enterprise）
- [ ] 产品 ID 格式正确：`com.monna.app.[plan].monthly`
- [ ] 设置了价格和订阅周期
- [ ] 创建了沙盒测试账号
- [ ] 生成了 API 密钥并连接到 RevenueCat

### 应用配置
- [ ] `.env` 文件中配置了 RevenueCat API Keys
- [ ] 产品配置文件更新为正确的产品 ID
- [ ] 后端订阅同步 API 正常工作
- [ ] 构建了测试版本（非 Expo Go）

### 测试
- [ ] 成功测试了订阅购买流程
- [ ] 订阅状态在应用中正确显示
- [ ] 订阅状态成功同步到后端
- [ ] 测试了取消订阅流程

---

## 后续步骤

配置完成后：

1. **提交应用审核**
   - Google Play: 提交到生产轨道
   - App Store: 提交 App Review

2. **监控订阅数据**
   - 定期查看 RevenueCat Dashboard
   - 分析订阅转化率和流失率

3. **优化订阅策略**
   - 根据数据调整价格
   - 添加免费试用期
   - 创建促销活动

4. **客户支持**
   - 准备订阅相关的 FAQ
   - 设置客服渠道处理订阅问题

---

需要帮助？查看 [RevenueCat 官方文档](https://docs.revenuecat.com/) 或联系技术支持。
