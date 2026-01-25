# genRTL-SaaS - 开发变更日志

本文档记录了 genRTL-SaaS 项目的所有重要功能开发、修复和优化。

---

## 2026-01-25

### 🐛 修复 TypeScript 编译错误

**更新日期**: 2026-01-25 深夜

**问题描述**:
执行 `npm run build` 时遇到多个 TypeScript 编译错误：
1. `genrtl-pricing-client.tsx` - `plan.badge` 和 `plan.icon` 属性缺失
2. `billing/route.ts` - Stripe API 类型问题（`current_period_end`, `deleted`, `upcoming` 方法）
3. `login/page.tsx` - OTP 输入框的 ref 回调类型不兼容

**修复内容**:

1. **修复 Pricing 组件类型定义** (`app/(dashboard)/pricing/genrtl-pricing-client.tsx`):
   - 添加 `PlanConfig` 接口，明确定义所有可选属性（`badge?`, `icon?`, `popular?`）
   - 为每个计划添加 `icon` 属性（Cpu, Zap, Crown, Building2）
   - 为 `professional` 计划添加 `badge: '最受欢迎'`

2. **修复 Billing API Stripe 类型** (`app/api/dashboard/billing/route.ts`):
   - 导入 `import type Stripe from 'stripe'`
   - 使用 `const subscription: any` 避免 `Response<Subscription>` 类型问题
   - 移除不存在的 `stripe.invoices.upcoming()` 方法调用
   - 改为从 `subscription.items.data[0].price.unit_amount` 获取下次账单金额
   - 添加 `subscription.status !== 'canceled'` 检查

3. **修复登录页面 ref 类型** (`app/auth/login/page.tsx`):
   - 将 `ref={(el) => (otpInputs.current[index] = el)}` 改为合法的 void 返回类型
   - 使用 `if (el) otpInputs.current[index] = el;` 语句块

**技术细节**:
- Stripe SDK 的 `subscriptions.retrieve()` 返回类型可能包含 `DeletedSubscription`，需要类型断言
- React ref 回调必须返回 `void` 或清理函数，不能返回值
- TypeScript 接口中的可选属性需要明确声明（`property?: Type`）

**验证结果**:
- ✅ `npm run build` 成功编译
- ✅ 所有 TypeScript 错误已解决
- ✅ 生成 99 个静态路由和动态路由

---

### 🐛 修复前端计划名称显示问题

**更新日期**: 2026-01-25 晚上

**问题描述**:
执行 SQL 升级脚本后，数据库中的 `plan_name` 已成功更新为 `ultra_plus`，但前端仍显示 "Free Plan"。

**根本原因**:
前端代码中的计划名称映射表没有包含新的计划名称（`plus`, `ultra_plus`），导致：
1. `getPlanDisplayName()` - Dashboard layout 侧边栏显示
2. `getPlanInfo()` - Usage 页面计划信息
3. `getPlanName()` - Activity 页面订阅卡片

当遇到未知计划名时，这些函数都默认返回 "Free"。

**修复内容**:

1. **更新 Dashboard Layout** (`app/(dashboard)/dashboard/layout.tsx`):
   ```typescript
   const planMap = {
     'free': 'Free',
     'basic': 'Basic',
     'plus': 'Plus',           // 新增
     'ultra_plus': 'Ultra Plus', // 新增
     // ... 向后兼容旧计划
   };
   ```

2. **更新 Usage 页面** (`app/(dashboard)/dashboard/usage/page.tsx`):
   ```typescript
   const plans = {
     'plus': { name: 'Plus', price: '$100', ... },
     'ultra_plus': { name: 'Ultra Plus', price: '$200', ... },
   };
   ```

3. **更新 Activity 页面** (`app/(dashboard)/dashboard/activity/page.tsx`):
   ```typescript
   const planMap = {
     'plus': 'Plus',
     'ultra_plus': 'Ultra Plus',
   };
   ```

**影响范围**:
- Dashboard 左侧边栏显示正确的计划名称
- Usage 页面显示正确的计划信息和价格
- Activity 页面订阅卡片显示正确的计划名称
- 所有页面支持新的订阅计划架构

**验证方法**:
1. 刷新浏览器（清除前端缓存）
2. 查看 Dashboard 左侧边栏：应显示 "Ultra Plus Plan"
3. 进入 Usage 页面：应显示 "Ultra Plus - $200"
4. 进入 Activity 页面：应显示 "Ultra Plus" 订阅卡片

---

### 🎉 订阅计划全面重构（1:1.5 映射）

**更新日期**: 2026-01-25 晚上

**新订阅计划架构**:

| 计划 | 月费 | Included USD (1.5:1) | Tokens 上限 | On-Demand | 模型 |
|------|------|---------------------|------------|-----------|------|
| **Free** | $0 | $0.5 | 1M | ❌ | Claude Haiku 3 |
| **Basic** | $20 | $30 | 无限 | ✅ | Claude Sonnet 4 |
| **Plus** | $100 | $150 | 无限 | ✅ | Claude Sonnet 4 |
| **Ultra Plus** | $200 | $300 | 无限 | ✅ | Claude Sonnet 4 |

**变更内容**:

1. **订阅计划重命名**:
   - `hobby` → `free`（保留 hobby 用于向后兼容）
   - `professional` → `plus`
   - `enterprise` → `ultra_plus`
   - 移除 `basic` 的变更（保持不变）

2. **Included USD 按 1.5:1 映射**:
   - Free: $0 月费 → $0.5 included USD
   - Basic: $20 月费 → $30 included USD
   - Plus: $100 月费 → $150 included USD
   - Ultra Plus: $200 月费 → $300 included USD

3. **模型分层策略**:
   - **Free 档**：使用 `Claude Haiku 3`（低成本模型，$0.00025/1K tokens）
   - **付费档**：使用 `Claude Sonnet 4`（高性能模型）
   - 自动根据用户订阅计划选择对应模型

4. **费率优化**:
   - Free: $0.00025/1K tokens（Haiku 成本）
   - Basic: $0.009/1K tokens（标准费率，3x 成本）
   - Plus: $0.0081/1K tokens（优惠费率，10% 折扣）
   - Ultra Plus: $0.0075/1K tokens（最优惠费率，20% 折扣）

5. **Free 档限制**:
   - Tokens 上限：1M
   - On-Demand：❌ 禁用（余额不足时拒绝请求）
   - 只能使用 Claude Haiku 3

6. **数据库迁移**:
   - 创建 `005_update_subscription_plans.sql`
   - 自动迁移现有计划名称
   - 自动调整 USD Pool 额度
   - 为 Free 档禁用 on_demand

**影响范围**:
- `lib/cbb/usd-pool.ts` - 更新订阅计划配置
- `app/api/chat/route.ts` - 添加模型选择逻辑，根据计划使用不同模型
- `lib/db/queries.ts` - 更新默认计划为 'free'
- `supabase/migrations/005_update_subscription_plans.sql` - 迁移脚本

**升级步骤**:
1. 执行数据库迁移：`005_update_subscription_plans.sql`
2. 重启后端服务
3. Free 档用户自动使用 Haiku 3，付费档用户使用 Sonnet 4
4. 现有用户的 USD Pool 额度自动调整

---

### 🐛 修复 On-Demand 开关无效问题

**更新日期**: 2026-01-25 晚上

**问题描述**:
用户在 Dashboard 关闭了 on-demand 开关（on-demand usage is off），但消耗的 type 仍然显示为 on_demand。

**根本原因**:
1. `USDPoolManager.charge()` 的判断逻辑有误：`if (!plan.features.on_demand_allowed && !params.allowOnDemand)`
   - 这是逻辑 AND，意味着只有当**计划不允许** AND **参数不允许**时才拒绝
   - 但 `hobby` 计划的 `on_demand_allowed = true`，所以即使用户关闭了 `on_demand_enabled`，还是会使用 on_demand
2. 检查顺序错误：应该**先检查用户设置**，再检查计划配置
3. Hobby 计划的 `included_usd` 只有 $2，很容易用完，导致大部分请求都使用 on_demand

**修复内容**:

1. **重新设计 `USDPoolManager.charge()` 的判断逻辑**:
   - **第一优先级**：检查 `params.allowOnDemand`（用户设置），如果为 false 直接拒绝
   - **第二优先级**：检查 `plan.features.on_demand_allowed`（计划配置）
   - **第三优先级**：检查 `pool.on_demand_limit`（限额）

2. **更新错误消息**:
   - 用户禁用时：`'订阅额度不足，您已禁用超额使用（on-demand）'`
   - 计划不支持时：`'订阅额度不足，当前计划不支持超额使用'`

**影响范围**:
- `lib/cbb/usd-pool.ts` - 修复 on-demand 判断逻辑
- Chat API 现在会正确尊重用户的 on-demand 设置
- 当 on-demand 关闭且 included 余额不足时，会返回错误而不是继续扣费

**行为变化**:
- **之前**：on-demand 关闭时，如果计划支持，仍然会使用 on_demand
- **现在**：on-demand 关闭时，如果 included 余额不足，会直接返回错误，**不会**使用 on_demand

**测试验证**:
1. 确保 on-demand 开关为 OFF
2. 发送 Chat 请求，耗尽 included 余额
3. 继续发送请求，应该收到错误：`订阅额度不足，您已禁用超额使用（on-demand）`
4. 打开 on-demand 开关为 ON
5. 再次发送请求，应该成功并使用 on_demand bucket

---

### 🐛 修复 Chat API Usage Tracking 缺失（完整修复）

**更新日期**: 2026-01-25 下午

**问题描述**:
用户在前端输入提示词调用 Chat API 后，后端虽然正常响应并调用了 Claude 模型，但 Dashboard 没有显示 tokens 统计，显示为 0/10.0万。

**根本原因**:
1. `/api/chat` 路由在调用 Claude API 并获取 `usage` 数据（input_tokens, output_tokens）后，完全没有调用 `UsageLedger.recordLLMUsage()` 来记录这些 tokens 到 `usage_ledger` 表，也没有调用 `USDPoolManager.charge()` 进行扣费。
2. 用户没有 team，导致 `USDPoolManager.getPoolStatus()` 失败，返回 "无法获取美元池状态"，扣费失败，因此也没有记录 usage。虽然 `getTeamForUser` 日志说 "will create one"，但该函数只返回 null，不会自动创建 team。
3. **最关键的问题**：`createUserTeam()` 创建 team 时使用了 `plan_name: 'free'`，但 `USDPoolManager.SUBSCRIPTION_PLANS` 中**没有定义 'free' 计划**，只有 `hobby`, `basic`, `professional`, `enterprise`。当 `calculateLLMCost()` 尝试访问 `SUBSCRIPTION_PLANS['free'].llm_rates` 时返回 `undefined`，导致崩溃：`TypeError: Cannot read properties of undefined (reading 'llm_rates')`

**修复内容**:

1. **在 `/api/chat` 路由中集成 Usage Tracking**:
   - 导入 `UsageLedger`, `USDPoolManager`, `getTeamForUser`, `createUserTeam`
   - 在流式响应的 `message_stop` 事件后，添加 usage 记录逻辑
   - 在非流式响应返回前，添加 usage 记录逻辑

2. **自动创建 Team 和初始化 USD Pool**:
   - 调用 `getTeamForUser()` 获取用户的 team
   - **如果没有 team，自动调用 `createUserTeam()` 创建**
   - **自动调用 `USDPoolManager.initializePool()` 初始化美元池**
   - 确保新用户首次使用时能正常记录 usage

3. **修复计划名称不匹配问题**:
   - 修改 `lib/db/queries.ts` 中 `createUserTeam()` 函数，将默认计划从 `'free'` 改为 `'hobby'`
   - 创建迁移文件 `supabase/migrations/004_fix_free_to_hobby_plan.sql`，将现有的 `'free'` 计划更新为 `'hobby'`

4. **Usage Tracking 流程**:
   - 从 `finalMessage.usage` 或 `completion.usage` 获取 tokens 数据
   - 使用 `USDPoolManager.calculateLLMCost()` 计算 USD 成本（按 `implement` 任务类型计费）
   - 调用 `USDPoolManager.charge()` 进行扣费（优先 included，不足时进入 on_demand）
   - 调用 `UsageLedger.recordLLMUsage()` 记录详细的 tokens 使用到 `usage_ledger` 表
   - 使用 `idempotencyKey: chat_${messageId}` 确保幂等性

5. **日志增强**:
   - 在 `message_stop` 事件日志中添加 usage 信息
   - 添加 team 创建的日志：`🏗️ User has no team, creating one...`
   - 添加 USD Pool 初始化日志：`✅ USD Pool initialized`
   - 添加扣费成功/失败的详细日志
   - 记录 tokens、成本、bucket 等关键信息

**影响范围**:
- `app/api/chat/route.ts` - 添加 usage tracking 和自动创建 team 逻辑
- `lib/db/queries.ts` - 修复默认计划名称从 'free' 到 'hobby'
- `supabase/migrations/004_fix_free_to_hobby_plan.sql` - 数据库迁移脚本
- Dashboard Overview 页面现在可以正确显示 Chat API 的 tokens 消耗
- Dashboard Usage 页面现在可以显示 Chat API 的详细使用记录
- USD Pool 和 Usage Ledger 正确记录 Chat API 的费用和 tokens
- 新用户首次使用时自动创建 team 和初始化 USD Pool

**测试验证**:
1. 执行数据库迁移：`004_fix_free_to_hobby_plan.sql`
2. 用户在前端输入提示词并发送
3. 后端自动创建 team（如果不存在）使用 'hobby' 计划
4. 后端初始化 USD Pool
5. 后端调用 Claude API 并正常响应
6. Dashboard 应显示非零的 tokens 使用量
7. Usage 页面应显示对应的记录
8. USD Pool 应正确扣费（included 或 on_demand）

---

### 🎨 Dashboard UI 全面升级 (Cursor 风格)

**更新日期**: 2026-01-25

**说明**:
根据 Cursor Dashboard 设计，全面升级后端 SaaS Dashboard，采用深色主题设计，新增多个功能页面。

#### 新增页面

1. **Overview 页面** (`/dashboard`)
   - 每日 tokens 使用量折线图
   - 总 tokens 和请求统计卡片
   - 支持 1d/7d/30d 日期范围切换
   - 实时数据刷新

2. **Settings 页面** (`/dashboard/settings`)
   - 数据共享设置（Share Data）- 控制是否允许数据用于训练
   - 学生验证状态显示
   - 活跃会话管理（支持查看和撤销会话）
   - 账号删除功能（带确认弹窗）

3. **Usage 页面** (`/dashboard/usage`)
   - 当前订阅计划展示
   - On-Demand 使能开关
   - 详细使用记录表格
   - 支持导出 CSV
   - 按日期/类型/模型筛选

4. **Spending 页面** (`/dashboard/spending`)
   - On-Demand 消费总览
   - 消费限额设置
   - 按模型分类的消费明细
   - 消费预警提示

5. **Billing & Invoices 页面** (`/dashboard/billing`)
   - 下次账单日期和金额
   - 支付方式管理
   - 发票列表（支持查看和下载）
   - Stripe Customer Portal 集成

#### 新增 API Endpoints

| API 路径 | 方法 | 功能 |
|----------|------|------|
| `/api/dashboard/analytics` | GET | 获取使用分析数据 |
| `/api/dashboard/settings` | GET/PATCH | 获取/更新用户设置 |
| `/api/dashboard/sessions` | GET | 获取活跃会话列表 |
| `/api/dashboard/sessions/[id]` | DELETE | 撤销指定会话 |
| `/api/dashboard/usage` | GET | 获取详细使用记录 |
| `/api/dashboard/usage/export` | GET | 导出使用记录为 CSV |
| `/api/dashboard/on-demand` | PATCH | 更新 On-Demand 设置 |
| `/api/dashboard/spending` | GET | 获取 On-Demand 消费数据 |
| `/api/dashboard/billing` | GET | 获取账单和发票信息 |

#### 数据库变更

新增迁移文件 `supabase/migrations/003_dashboard_tables.sql`:

- `teams` 表新增 `on_demand_enabled` 字段
- 新增 `user_settings` 表（用户偏好设置）
- 新增 `user_sessions` 表（会话管理）
- 添加相关 RLS 策略和索引

#### UI/UX 设计特点

- 深色主题设计 (#0a0a0a 背景)
- 侧边栏导航（用户信息 + 菜单）
- 响应式布局（支持移动端）
- 卡片式组件设计
- 数据可视化图表
- 加载状态和空状态处理

#### 修改文件清单

**新增文件:**
- `app/(dashboard)/dashboard/layout.tsx` - Dashboard 布局
- `app/(dashboard)/dashboard/page.tsx` - Overview 页面
- `app/(dashboard)/dashboard/settings/page.tsx` - Settings 页面
- `app/(dashboard)/dashboard/usage/page.tsx` - Usage 页面
- `app/(dashboard)/dashboard/spending/page.tsx` - Spending 页面
- `app/(dashboard)/dashboard/billing/page.tsx` - Billing 页面
- `app/api/dashboard/analytics/route.ts`
- `app/api/dashboard/settings/route.ts`
- `app/api/dashboard/sessions/route.ts`
- `app/api/dashboard/sessions/[id]/route.ts`
- `app/api/dashboard/usage/route.ts`
- `app/api/dashboard/usage/export/route.ts`
- `app/api/dashboard/on-demand/route.ts`
- `app/api/dashboard/spending/route.ts`
- `app/api/dashboard/billing/route.ts`
- `supabase/migrations/003_dashboard_tables.sql`

**修改文件:**
- `lib/db/queries.ts` - 添加 `on_demand_enabled` 字段支持

**部署步骤:**

1. 执行数据库迁移（**按顺序执行**）：

   a. 首先执行 `supabase/migrations/001_genrtl_tables.sql`
      - 创建 `usage_ledger`, `usd_pools`, `cbb_registry` 等核心表
   
   b. 然后执行 `supabase/migrations/003_dashboard_tables.sql`
      - 添加 Dashboard 相关表和字段

   **重要**: 详细步骤请参阅 `supabase/MIGRATION_GUIDE.md`

2. 确保 Stripe 配置正确（用于 Billing 页面）

3. 部署代码到 Vercel

**已知问题修复:**

- 修复了迁移文件位置问题：将 `001_genrtl_tables.sql` 从 `lib/db/migrations/` 复制到 `supabase/migrations/`
- `003_dashboard_tables.sql` 依赖 `001_genrtl_tables.sql` 中创建的 `usage_ledger` 表
- **修复了按钮文字不可见问题**：
  - 根本原因：Dashboard 页面使用深色背景，但浏览器处于浅色模式
  - 按钮的 `bg-background` 在浅色模式下解析为白色
  - 同时设置了 `text-white`，导致白色背景+白色文字
  - 解决方案：在所有 outline 按钮上显式设置黑色文字（`text-gray-900`）和白色背景（`bg-white`）

**状态**: ✅ 已完成

---

## 2025-12-20

### 💰 订阅计划配置更新

**更新日期**: 2025-12-20

**说明**:
根据产品定价策略，将订阅计划从 Free/Basic/Pro/Enterprise 调整为 Hobby/Basic/Pro/Enterprise，并更新美元池额度。

#### 订阅计划调整

| 计划 | 月费 | 美元池 | 变更说明 |
|------|------|--------|----------|
| **Hobby** | $0 | $10 | 新增免费档，取代原 Free ($5 → $10) |
| **Basic** | $20 | $60 | 美元池从 $50 提升到 $60 |
| **Pro** | $100 | $350 | 价格从 $50 提升到 $100，美元池从 $150 提升到 $350 |
| **Enterprise** | $200 | $800 | 美元池从 $1000 降低到 $800 |

#### 新增文件
- `app/(dashboard)/pricing/genrtl-pricing-client.tsx` - genRTL 专用定价页面组件
  - 新的 UI 设计，展示 USD Pool 概念
  - 功能对比表格
  - On-Demand 说明

#### 修改文件
- `lib/cbb/usd-pool.ts` - 更新 SUBSCRIPTION_PLANS 配置
  - `free` → `hobby` (id 变更)
  - 调整各档位美元池额度和 LLM 费率
- `app/(dashboard)/pricing/page.tsx` - 切换到 GenRTLPricingClient

**Stripe 配置要求**:

在 Stripe Dashboard 创建以下产品，metadata 必须包含：
- `plan_key`: hobby | basic | professional | enterprise
- `included_usd`: 10 | 60 | 350 | 800
- `product_type`: genrtl

详细配置步骤参见文档。

**状态**: ✅ 已完成

---

## 2025-12-19

### 🔧 genRTL-SaaS 后端功能完善

**更新日期**: 2025-12-19

**说明**:
进一步完善 genRTL-SaaS 后端功能，包括依赖安装、Stripe 集成、定时任务和管理员 API。

#### 1. 依赖管理
- 添加 `@anthropic-ai/sdk` 依赖，用于调用 Claude 模型

#### 2. Stripe Webhook 集成 USD Pool
- 修改 `lib/payments/stripe.ts`
  - 订阅激活时自动初始化用户的 USD Pool
  - 订阅取消时自动将 USD Pool 降级为免费档
  - 支持订阅升级/降级时 USD Pool 的自动调整

#### 3. Inngest 定时任务
- 新增 `inngest/functions/usd-pool-reset.ts`
  - `usdPoolMonthlyReset`: 每月1日 UTC 00:00 自动重置所有活跃订阅用户的美元池
  - `usdPoolThresholdCheck`: 每天 UTC 12:00 检查超额使用情况，发送告警
- 更新 `app/api/inngest/route.ts` 注册新的定时任务

#### 4. CBB Admin API
- 新增 `app/api/admin/cbb/route.ts`
  - `GET /api/admin/cbb` - 获取 CBB 列表（管理员视图，包含非公开的）
  - `POST /api/admin/cbb` - 创建新的 CBB 包
  - `PATCH /api/admin/cbb` - 更新 CBB 包（价格、描述、标签等）
  - `DELETE /api/admin/cbb` - 停用 CBB 包（软删除）
- 新增 `app/api/admin/cbb/upload/route.ts`
  - `POST /api/admin/cbb/upload` - 上传 CBB 包文件到 Storage
  - 支持 .zip, .tar.gz, .tgz 格式
  - 自动计算 SHA256 校验和
  - 最大支持 100MB 文件

**环境变量新增**:
```bash
# 管理员邮箱白名单（逗号分隔）
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

**修改文件清单**:
- `package.json` - 添加 @anthropic-ai/sdk 依赖
- `lib/payments/stripe.ts` - 集成 USD Pool 初始化逻辑
- `inngest/functions/usd-pool-reset.ts` - 新建
- `app/api/inngest/route.ts` - 注册 USD Pool 定时任务
- `app/api/admin/cbb/route.ts` - 新建
- `app/api/admin/cbb/upload/route.ts` - 新建
- `CHANGELOG.md` - 更新

**状态**: ✅ 已完成

---

### 🚀 genRTL-SaaS 后端核心功能实现

**更新日期**: 2025-12-19

**说明**:
根据 README.md 中的架构设计，完整实现了 genRTL-SaaS 的后端核心功能，包括 CBB Registry、Usage Ledger、USD Pool Manager 和 RTL Job APIs。

**新增模块**:

#### 1. CBB (Configurable Building Block) 模块
- `lib/cbb/types.ts` - 完整的类型定义
  - CBB Manifest 结构
  - Resolve/Checkout/Deliver 请求响应类型
  - Usage Ledger 记录类型
  - Plan/Implement/Repair Job 类型
- `lib/cbb/registry.ts` - CBB Registry 管理器
  - 注册、查询、搜索 CBB 包
  - 版本管理和比较
  - 下载计数跟踪
- `lib/cbb/commerce.ts` - CBB 商业交易
  - Checkout 扣费（幂等操作）
  - Deliver 下载凭证发放
  - 退款处理
- `lib/cbb/usage-ledger.ts` - 统一记账系统
  - 支持 LLM 和 CBB 两种类型
  - 用量汇总和按 Job 归因
- `lib/cbb/usd-pool.ts` - 美元池管理器
  - Included（订阅内）+ On-Demand（超额按量）
  - 扣费优先级：先扣 included，再进 on_demand
  - 超额限制设置

#### 2. LLM 模块
- `lib/llm/model-router.ts` - 智能模型路由
  - Plan 任务使用 GPT-4o（未来切换 GPT-5.1）
  - Implement/Repair 使用 Claude Sonnet 4
  - 统一的调用接口和结果格式
- `lib/llm/prompts.ts` - Prompt 模板
  - Plan 系统提示词和用户提示词生成
  - Implement 系统提示词和用户提示词生成
  - Repair 系统提示词和用户提示词生成

#### 3. RTL 模块
- `lib/rtl/job-service.ts` - RTL Job 服务
  - Plan/Implement/Repair 任务执行
  - LLM 调用和结果解析
  - 用量记录和扣费

#### 4. API 路由

**CBB APIs**:
- `POST /api/cbb/resolve` - 解析 CBB 需求，返回候选项（不扣费）
- `GET /api/cbb/resolve` - 搜索/获取热门 CBB
- `POST /api/cbb/checkout` - 扣费并生成收据（幂等）
- `GET /api/cbb/checkout` - 获取购买历史
- `POST /api/cbb/deliver` - 发放下载凭证
- `GET /api/cbb/deliver` - 获取收据详情

**Job APIs**:
- `POST /api/jobs/plan` - 创建 Plan 任务（GPT-4o）
- `GET /api/jobs/plan` - 获取 Plan Job 状态
- `POST /api/jobs/implement` - 创建 Implement 任务（Claude Sonnet）
- `GET /api/jobs/implement` - 获取 Implement Job 状态
- `POST /api/jobs/repair` - 创建 Repair 任务（Claude Sonnet）
- `GET /api/jobs/repair` - 获取 Repair Job 状态

**Usage API**:
- `GET /api/usage` - 获取用量统计和 USD Pool 状态
- `PATCH /api/usage` - 设置超额限制

#### 5. 数据库迁移
- `lib/db/migrations/001_genrtl_tables.sql`
  - `cbb_registry` - CBB 资产包元数据
  - `cbb_receipts` - 购买收据
  - `usage_ledger` - 统一记账
  - `usd_pools` - 用户美元池状态
  - `usd_pool_transactions` - 美元池交易记录
  - `rtl_jobs` - Plan/Implement/Repair 任务
  - RLS 策略配置

**订阅计划配置**:

| 计划 | 月费 | 美元池 | Plan | Implement | Repair | CBB | On-Demand |
|------|------|--------|------|-----------|--------|-----|-----------|
| Free | $0 | $5 | ✅ | ❌ | ❌ | ❌ | ❌ |
| Basic | $20 | $50 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Professional | $50 | $150 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enterprise | $200 | $1000 | ✅ | ✅ | ✅ | ✅ | ✅ |

**环境变量新增**:
```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=             # Claude API 密钥
```

**修改文件清单**:
- `lib/cbb/types.ts` - 新建
- `lib/cbb/registry.ts` - 新建
- `lib/cbb/commerce.ts` - 新建
- `lib/cbb/usage-ledger.ts` - 新建
- `lib/cbb/usd-pool.ts` - 新建
- `lib/cbb/index.ts` - 新建
- `lib/llm/model-router.ts` - 新建
- `lib/llm/prompts.ts` - 新建
- `lib/llm/index.ts` - 新建
- `lib/rtl/job-service.ts` - 新建
- `lib/rtl/index.ts` - 新建
- `app/api/cbb/resolve/route.ts` - 新建
- `app/api/cbb/checkout/route.ts` - 新建
- `app/api/cbb/deliver/route.ts` - 新建
- `app/api/jobs/plan/route.ts` - 新建
- `app/api/jobs/implement/route.ts` - 新建
- `app/api/jobs/repair/route.ts` - 新建
- `app/api/usage/route.ts` - 新建
- `lib/db/migrations/001_genrtl_tables.sql` - 新建

**下一步**:
1. 在 Supabase Dashboard 执行迁移脚本
2. 创建 `cbb-packages` Storage Bucket
3. 配置 Anthropic API Key
4. 测试 Plan/Implement/Repair 工作流

**状态**: ✅ 已完成

---