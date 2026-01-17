# genRTL-SaaS - 开发变更日志

本文档记录了 genRTL-SaaS 项目的所有重要功能开发、修复和优化。

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