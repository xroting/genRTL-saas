# Mobile App 订阅支付逻辑优化方案

## 📋 项目信息
- **目标目录**: `D:\xroting\monna\monna-saas\mobile-app`
- **技术栈**: React Native (Expo) + RevenueCat + Supabase
- **优化日期**: 2025-12-10

---

## 一、当前实现分析

### 1.1 现有订阅架构
```
mobile-app/
├── lib/
│   ├── contexts/
│   │   └── SubscriptionContext.tsx      # 订阅状态管理
│   └── purchases/
│       ├── config.ts                    # RevenueCat 配置
│       └── service.ts                   # 订阅服务封装
├── app/(tabs)/
│   ├── subscription.tsx                 # 订阅页面
│   ├── image-generation.tsx             # 图片生成
│   └── video-generation.tsx             # 视频生成
```

### 1.2 当前流程

**图片/视频生成流程**:
```
用户点击模板
  → 检查登录 (user存在?)
  → 检查 credits (remainingCredits === 0?)
  → 如果 credits = 0 → Alert 提示 + 跳转到 /subscription 页面
  → 如果通过 → 打开上传对话框
```

**订阅页面流程** (`subscription.tsx`):
```
显示所有订阅套餐
  → 用户点击"订阅"按钮
  → 调用 RevenueCat purchase()
  → 应用商店处理支付 (Apple Pay / Google Pay)
  → RevenueCat 验证收据
  → 同步到后端 Supabase
  → 后端分配 credits
```

### 1.3 存在的问题

❌ **问题 1**: 仅检查 `credits === 0` 不够准确
- 用户可能有免费 credits 但没有订阅
- 免费用户应该被引导订阅，而不是等积分用完

❌ **问题 2**: 用户体验不流畅
- 使用 `Alert` 弹窗 → 跳转新页面
- 增加了用户操作步骤和流失风险
- 主流 App 都是原地弹出订阅 Modal

❌ **问题 3**: 缺少订阅状态检查
- 当前不检查 RevenueCat 订阅状态
- 仅依赖后端的 credits 数据

---

## 二、主流应用订阅模式调研

### 2.1 Apple App Store 标准流程
```
用户尝试使用付费功能
  ↓
检查 StoreKit 订阅状态
  ↓ (未订阅)
弹出订阅 Modal (原地显示，不跳转)
  - 展示订阅套餐
  - 突出推荐套餐
  - Face ID / Touch ID 验证
  ↓
Apple 处理支付
  ↓
返回购买凭证
  ↓
App 验证 → 激活功能 → 继续用户操作
```

### 2.2 Google Play 标准流程
```
用户尝试使用付费功能
  ↓
检查 Play Billing 订阅状态
  ↓ (未订阅)
弹出订阅 Modal
  - 展示订阅套餐
  - Google 账户自动验证
  ↓
Google Play 处理支付
  ↓
返回 purchaseToken
  ↓
App 验证 → acknowledgePurchase() → 激活功能
```

### 2.3 关键设计原则

✅ **无缝体验**: 
- 在当前页面弹出 Modal，不跳转
- 订阅成功后自动继续用户操作

✅ **清晰引导**:
- 明确告诉用户为什么需要订阅
- 展示订阅价值（功能、积分、特权）

✅ **快速支付**:
- 2-3 步完成支付
- Face ID / Google 账户自动验证

✅ **状态同步**:
- RevenueCat 自动验证收据
- Webhook 同步到后端数据库
- 跨设备订阅状态一致

---

## 三、优化方案

### 3.1 新的检查逻辑

```typescript
// 优先级排序
点击生成按钮
  ↓
1. 检查登录状态
   ❌ 未登录 → 弹出登录 Modal
   ↓
2. 检查订阅状态 (RevenueCat)
   ❌ 无订阅 → 弹出订阅 Modal
   ↓
3. 检查 credits 余额
   ❌ credits < 所需 → 提示升级套餐
   ↓
4. ✅ 所有检查通过 → 打开上传对话框
```

### 3.2 组件设计

#### A. 创建 `SubscriptionModal` 组件

基于现有的 `subscription.tsx`，改造为 Modal 形式：

**特点**:
- ✅ 模态窗口（不跳转页面）
- ✅ 展示所有订阅套餐
- ✅ 集成 RevenueCat 购买流程
- ✅ 订阅成功后回调，自动继续操作
- ✅ 提供"恢复购买"功能

**Props**:
```typescript
interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribed: () => void;  // 订阅成功回调
  reason?: string;           // 订阅原因（如"图片生成"）
}
```

#### B. 扩展 `SubscriptionContext`

添加 `checkSubscriptionStatus()` 方法：

```typescript
interface SubscriptionContextType {
  // ...existing methods...
  
  checkSubscriptionStatus: () => Promise<{
    hasActiveSubscription: boolean;
    planName: string;
    source: 'revenuecat' | 'web' | 'none';
  }>;
}
```

**实现逻辑**:
1. 先检查 RevenueCat 本地状态（移动端订阅）
2. 再查询后端 API（可能是 Web 端订阅）
3. 任一渠道有订阅即为有效

#### C. 修改生成页面

**图片生成** (`image-generation.tsx`):
```typescript
const handleTemplateClick = async (template) => {
  // 1. 检查登录
  if (!user) {
    setShowLoginModal(true);
    return;
  }
  
  // 2. 检查订阅
  const { hasActiveSubscription } = await checkSubscriptionStatus();
  if (!hasActiveSubscription) {
    setShowSubscriptionModal(true);
    return;
  }
  
  // 3. 检查 credits
  const { remainingCredits } = await checkUserCredits();
  if (remainingCredits < 10) {
    Alert.alert('积分不足', '升级套餐获取更多积分');
    return;
  }
  
  // 4. 继续生成
  setShowUploadDialog(true);
};

// 订阅成功回调
const handleSubscribed = () => {
  // 自动打开上传对话框
  setShowUploadDialog(true);
};
```

**视频生成** (`video-generation.tsx`):
- 同样的逻辑

### 3.3 用户流程对比

#### 旧流程 (7 步)
```
1. 点击模板
2. credits = 0 → Alert 弹窗
3. 点击"View Plans"
4. 跳转到 /subscription 页面
5. 选择套餐订阅
6. 手动返回生成页面
7. 再次点击模板 → 开始生成
```

#### 新流程 (4 步)
```
1. 点击模板
2. 无订阅 → 弹出订阅 Modal
3. 选择套餐订阅
4. 订阅成功 → 自动开始生成
```

**改进**: 
- ✅ 减少 43% 操作步骤
- ✅ 0 次页面跳转
- ✅ 自动继续用户操作

---

## 四、实施计划

### 4.1 开发任务

#### Task 1: 创建 SubscriptionModal 组件
**文件**: `mobile-app/components/SubscriptionModal.tsx`

- [ ] 基于 `subscription.tsx` 改造为 Modal
- [ ] 保留所有订阅购买逻辑
- [ ] 添加 `onSubscribed` 回调
- [ ] 优化 UI（紧凑版布局）

**预计时间**: 2 小时

#### Task 2: 扩展 SubscriptionContext
**文件**: `mobile-app/lib/contexts/SubscriptionContext.tsx`

- [ ] 添加 `checkSubscriptionStatus()` 方法
- [ ] 结合 RevenueCat 和后端 API
- [ ] 实现订阅状态缓存

**预计时间**: 1 小时

#### Task 3: 修改生成页面
**文件**: 
- `mobile-app/app/(tabs)/image-generation.tsx`
- `mobile-app/app/(tabs)/video-generation.tsx`

- [ ] 修改 `handleTemplateClick` 逻辑
- [ ] 集成 SubscriptionModal
- [ ] 添加订阅成功回调

**预计时间**: 1.5 小时

#### Task 4: 测试
- [ ] iOS 测试（Sandbox 环境）
- [ ] Android 测试
- [ ] 跨设备订阅同步测试
- [ ] Web ↔ Mobile 订阅同步测试

**预计时间**: 2 小时

#### Task 5: 文档更新
- [ ] 更新 `CHANGELOG.md`
- [ ] 更新 `mobile-app/README.md`

**预计时间**: 0.5 小时

**总计**: ~7 小时

### 4.2 测试场景

- [ ] **场景 1**: 未登录用户点击生成 → 显示登录窗口
- [ ] **场景 2**: 已登录但无订阅用户点击生成 → 显示订阅 Modal
- [ ] **场景 3**: 用户在 Modal 中完成订阅 → 自动开始生成
- [ ] **场景 4**: 用户点击"恢复购买" → 成功恢复订阅
- [ ] **场景 5**: 用户在 Web 端订阅 → Mobile 端自动同步
- [ ] **场景 6**: 用户在 iOS 订阅 → Android 端同步（通过后端）
- [ ] **场景 7**: 用户取消订阅 → 订阅到期后降级
- [ ] **场景 8**: 用户 credits 不足 → 提示升级套餐

---

## 五、关键代码示例

### 5.1 SubscriptionModal 组件骨架

```typescript
// mobile-app/components/SubscriptionModal.tsx
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubscribed: () => void;
  reason?: string;
}

export function SubscriptionModal({ visible, onClose, onSubscribed, reason }: Props) {
  const { purchase, offerings } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (planId: string) => {
    setPurchasing(true);
    try {
      const success = await purchase(planId);
      if (success) {
        Alert.alert('订阅成功', '感谢您的订阅！', [
          { text: '好的', onPress: () => {
              onSubscribed(); // 调用回调
              onClose();
            }}
        ]);
      }
    } catch (error) {
      Alert.alert('订阅失败', error.message);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>解锁完整功能</Text>
          <Text style={styles.subtitle}>订阅后可{reason}</Text>
          
          <ScrollView>
            {SUBSCRIPTION_PLANS.map(plan => (
              <TouchableOpacity key={plan.id} onPress={() => handlePurchase(plan.id)}>
                {/* 套餐卡片 */}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity onPress={onClose}>
            <Text>稍后再说</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
```

### 5.2 SubscriptionContext 扩展

```typescript
// mobile-app/lib/contexts/SubscriptionContext.tsx
async function checkSubscriptionStatus() {
  try {
    // 1. 检查 RevenueCat (移动端订阅)
    let hasRevenueCatSubscription = false;
    try {
      const customerInfo = await getCustomerInfo();
      const activeEntitlements = Object.keys(customerInfo?.entitlements.active || {});
      hasRevenueCatSubscription = activeEntitlements.length > 0;
    } catch (error) {
      console.log('RevenueCat check failed (expected in Expo Go)');
    }

    // 2. 检查后端 API (可能是 Web 端订阅)
    let hasWebSubscription = false;
    let planName = 'free';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch(`${API_URL}/api/user/stats`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await response.json();
        planName = data.planName || 'free';
        hasWebSubscription = planName !== 'free';
      }
    } catch (error) {
      console.error('Backend check failed:', error);
    }

    // 3. 任一渠道有订阅即为有效
    return {
      hasActiveSubscription: hasRevenueCatSubscription || hasWebSubscription,
      planName,
      source: hasRevenueCatSubscription ? 'revenuecat' : hasWebSubscription ? 'web' : 'none',
    };
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return { hasActiveSubscription: false, planName: 'free', source: 'none' };
  }
}
```

### 5.3 生成页面修改

```typescript
// mobile-app/app/(tabs)/image-generation.tsx
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

export default function ImageGenerationScreen() {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { checkSubscriptionStatus } = useSubscription();

  const handleTemplateClick = async (template) => {
    // 1. 检查登录
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // 2. 检查订阅
    const { hasActiveSubscription } = await checkSubscriptionStatus();
    if (!hasActiveSubscription) {
      setSelectedTemplate(template);
      setShowSubscriptionModal(true);
      return;
    }
    
    // 3. 继续生成
    setSelectedTemplate(template);
    setShowUploadDialog(true);
  };

  const handleSubscribed = () => {
    // 订阅成功，自动打开上传对话框
    setShowUploadDialog(true);
  };

  return (
    <View>
      {/* ...existing code... */}
      
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribed={handleSubscribed}
        reason="图片生成"
      />
    </View>
  );
}
```

---

## 六、预期效果

### 6.1 用户体验改善

| 指标 | 旧流程 | 新流程 | 改善 |
|------|--------|--------|------|
| 操作步骤 | 7 步 | 4 步 | -43% |
| 页面跳转 | 2 次 | 0 次 | -100% |
| 完成时间 | ~30秒 | ~10秒 | -67% |

### 6.2 商业价值

- **订阅转化率**: 预计提升 30-50%
- **用户流失率**: 预计降低 20-30%
- **ARPU**: 平均客单价可能提升（更容易触发高档位订阅）

---

## 七、风险与缓解

### 风险 1: RevenueCat 在 Expo Go 中不可用
**缓解**: 
- 添加 `isRunningInExpoGo()` 检查
- 提供友好提示："需要 Development Build 才能测试订阅"

### 风险 2: 订阅状态同步延迟
**缓解**:
- 使用 RevenueCat Webhook
- 客户端轮询刷新订阅状态

### 风险 3: 跨平台订阅冲突
**缓解**:
- 后端检查用户是否已有其他渠道订阅
- 提示用户避免重复购买

---

## 八、总结

### 核心改进
1. ✅ 从仅检查 credits → 检查订阅状态 + credits
2. ✅ 从 Alert + 跳转页面 → 原地 Modal 弹窗
3. ✅ 从 7 步流程 → 4 步流程
4. ✅ 订阅成功后自动继续用户操作

### 技术要点
- 使用 RevenueCat 统一管理应用商店订阅
- 结合后端 API 实现跨渠道订阅同步
- Modal 形式提供无缝订阅体验

### 符合主流标准
- ✅ Apple App Store 订阅最佳实践
- ✅ Google Play Billing 标准流程
- ✅ 参考 Midjourney、DALL-E 等主流应用

---

**文档编写**: AI Assistant  
**优化方向**: Mobile App (React Native)  
**状态**: 待实施  
**优先级**: 🔴 高

