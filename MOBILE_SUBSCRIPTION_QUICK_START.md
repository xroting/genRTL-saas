# 移动端订阅优化 - 快速指南

## ✅ 已完成的修改

### 1. 新增组件
- **`mobile-app/components/SubscriptionModal.tsx`** - 订阅弹窗组件
  - 原地弹出，不跳转页面
  - 展示所有订阅套餐
  - 订阅成功后自动继续用户操作

### 2. 扩展功能
- **`mobile-app/lib/contexts/SubscriptionContext.tsx`** - 添加订阅状态检查
  - 新增 `checkSubscriptionStatus()` 方法
  - 结合 RevenueCat 和后端 API
  - 支持跨平台订阅同步

### 3. 修改页面
- **`mobile-app/app/(tabs)/image-generation.tsx`** - 图片生成页面
  - 集成新的订阅检查逻辑
  - 添加订阅 Modal 集成

- **`mobile-app/app/(tabs)/video-generation.tsx`** - 视频生成页面
  - 集成新的订阅检查逻辑
  - 添加订阅 Modal 集成

### 4. 文档更新
- **`MOBILE_APP_SUBSCRIPTION_OPTIMIZATION.md`** - 详细调研报告
- **`CHANGELOG.md`** - 记录本次修改
- **`MOBILE_SUBSCRIPTION_QUICK_START.md`** - 本快速指南

---

## 🔄 新的用户流程

### 图片/视频生成流程

```
用户点击模板
  ↓
检查登录状态
  ├─ 未登录 → 弹出登录 Modal
  └─ 已登录 ↓
  
检查订阅状态 (RevenueCat + 后端 API)
  ├─ 无订阅 → 弹出订阅 Modal ✨
  └─ 已订阅 ↓
  
检查 Credits 余额
  ├─ 不足 → 提示升级套餐
  └─ 充足 ↓
  
打开上传对话框 → 开始生成
```

### 订阅成功后

```
用户订阅成功
  ↓
RevenueCat 处理支付
  ↓
Webhook 通知后端
  ↓
后端分配 Credits
  ↓
自动打开上传对话框 ✨ (无需手动返回)
```

---

## 🎯 核心改进

| 方面 | 旧方案 | 新方案 |
|------|--------|--------|
| **触发时机** | Credits = 0 | 订阅状态检查 |
| **UI 交互** | Alert + 页面跳转 | Modal 弹窗 |
| **操作步骤** | 7 步 | 4 步 (-43%) |
| **页面跳转** | 2 次 | 0 次 |
| **用户体验** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🧪 测试步骤

### 1. 未登录用户测试
```bash
# 步骤
1. 启动应用
2. 点击任意图片/视频模板
3. 预期: 弹出登录窗口
```

### 2. 无订阅用户测试
```bash
# 步骤
1. 登录应用（使用测试账号）
2. 确保无订阅（free 计划）
3. 点击任意模板
4. 预期: 弹出订阅 Modal
5. 选择套餐并订阅（使用 Sandbox/测试账号）
6. 预期: 订阅成功后自动打开上传对话框
```

### 3. Web 端订阅同步测试
```bash
# 步骤
1. 在 Web 端订阅（使用 Stripe）
2. 在移动端登录同一账号
3. 点击模板
4. 预期: 识别到 Web 端订阅，直接进入生成流程
```

### 4. Expo Go 环境测试
```bash
# 步骤
1. 在 Expo Go 中运行应用
2. 点击订阅按钮
3. 预期: 显示友好提示 "需要 Development Build"
```

### 5. Credits 不足测试
```bash
# 步骤
1. 使用已订阅但 credits 不足的账号
2. 点击模板
3. 预期: 提示 "积分不足，请升级套餐"
```

---

## 🔧 开发环境设置

### 安装依赖
```bash
cd mobile-app
npm install
# 或
pnpm install
```

### 运行应用
```bash
# iOS
npm run ios

# Android
npm run android

# Expo Go (仅预览 UI，订阅功能不可用)
npm start
```

### 创建 Development Build（测试订阅功能）
```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

---

## 📱 RevenueCat 配置

### 环境变量
确保在 `mobile-app/.env` 中配置：

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=goog_xxxxxxxxxxxxx

# 后端 API URL
EXPO_PUBLIC_API_BASE_URL=https://www.monna.us
```

### 产品 ID 配置
查看 `mobile-app/lib/purchases/config.ts`：

```typescript
products: {
  basic: {
    ios: 'com.monna.app.basic.monthly',
    android: 'com.monna.app.basic.monthly',
  },
  pro: {
    ios: 'com.monna.app.pro.monthly',
    android: 'com.monna.app.pro.monthly',
  },
  enterprise: {
    ios: 'com.monna.app.enterprise.monthly',
    android: 'com.monna.app.enterprise.monthly',
  },
}
```

---

## 🐛 常见问题

### Q1: 订阅 Modal 不显示
**原因**: 可能已有订阅但未正确识别

**排查**:
```typescript
// 在控制台查看日志
🔍 检查订阅状态...
📱 RevenueCat 订阅状态: { hasSubscription: true/false }
🌐 后端订阅状态: { hasSubscription: true/false }
✅ 订阅状态检查完成: { hasActiveSubscription: true/false }
```

### Q2: 订阅后仍提示无订阅
**原因**: Webhook 同步延迟

**解决**:
1. 等待 5-10 秒
2. 下拉刷新页面
3. 重启应用

### Q3: Expo Go 中无法测试订阅
**原因**: Expo Go 不支持原生模块（RevenueCat）

**解决**:
```bash
# 创建 Development Build
eas build --profile development --platform ios
# 或
eas build --profile development --platform android
```

### Q4: 在真机上测试时购买失败
**原因**: 需要使用 Sandbox/测试账号

**iOS**:
- 在 App Store Connect 创建 Sandbox Tester
- 在设备上登录 Sandbox 账号

**Android**:
- 在 Google Play Console 添加测试账号
- 使用内部测试轨道

---

## 📊 日志输出

### 正常流程日志示例

```
🎨 用户点击模板: 大笑
✅ 用户已登录
🔍 检查订阅状态...
📱 RevenueCat 订阅状态: { hasSubscription: false }
🌐 后端订阅状态: { hasSubscription: false, plan: 'free' }
✅ 订阅状态检查完成: { hasActiveSubscription: false }
❌ 用户无订阅，显示订阅窗口

[用户订阅后]
🛒 开始购买套餐: pro
✅ 购买成功
🔄 Syncing subscription to backend...
✅ Successfully synced to backend
🎉 订阅成功，自动继续操作
📤 打开上传对话框
```

---

## 🔗 相关文档

- **详细调研报告**: [MOBILE_APP_SUBSCRIPTION_OPTIMIZATION.md](./MOBILE_APP_SUBSCRIPTION_OPTIMIZATION.md)
- **变更日志**: [CHANGELOG.md](./CHANGELOG.md)
- **RevenueCat 文档**: [MOBILE_SUBSCRIPTION_SETUP.md](./MOBILE_SUBSCRIPTION_SETUP.md)

---

## ✨ 下一步

1. ✅ **测试功能** - 在 iOS/Android 测试环境中验证
2. ✅ **监控数据** - 在 RevenueCat Dashboard 查看订阅统计
3. ✅ **优化 UI** - 根据用户反馈调整 Modal 样式
4. ✅ **A/B 测试** - 测试不同的订阅引导文案

---

**更新日期**: 2025-12-10  
**状态**: ✅ 已完成  
**版本**: v1.0
