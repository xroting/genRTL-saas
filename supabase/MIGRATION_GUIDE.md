# Dashboard 数据库迁移执行指南

## 问题说明

在执行 `003_dashboard_tables.sql` 时遇到错误：`relation "usage_ledger" does not exist`

**原因**: `001_genrtl_tables.sql` 迁移文件之前存放在 `lib/db/migrations/` 目录，从未在 Supabase 数据库中执行过，导致 `usage_ledger` 等核心表不存在。

## 解决方案

按以下顺序执行迁移文件：

### 步骤 1: 执行 001_genrtl_tables.sql

该文件创建以下表：
- `cbb_registry` - CBB 资产包元数据
- `cbb_receipts` - CBB 购买收据
- `usage_ledger` - 统一记账（LLM + CBB）⭐ 重要
- `usd_pools` - 用户美元池状态
- `usd_pool_transactions` - 美元池交易记录
- `rtl_jobs` - Plan/Implement/Repair 任务

**执行位置**: Supabase Dashboard → SQL Editor

**文件路径**: `supabase/migrations/001_genrtl_tables.sql`

### 步骤 2: 执行 003_dashboard_tables.sql

该文件添加 Dashboard 相关功能：
- 向 `teams` 表添加 `on_demand_enabled` 字段
- 创建 `user_settings` 表
- 创建 `user_sessions` 表
- 添加 RLS 策略和索引

**依赖**: 需要 `001_genrtl_tables.sql` 先执行（依赖 `usage_ledger` 表）

**执行位置**: Supabase Dashboard → SQL Editor

**文件路径**: `supabase/migrations/003_dashboard_tables.sql`

### 步骤 3: 执行 004_fix_free_to_hobby_plan.sql

该文件修复计划名称不匹配问题：
- 将所有 `plan_name = 'free'` 的 team 更新为 `'hobby'`
- **原因**: `USDPoolManager.SUBSCRIPTION_PLANS` 没有定义 'free' 计划，只有 'hobby'
- **影响**: 修复 Chat API usage tracking 崩溃问题
- **注意**: 此迁移已被 005 取代，可以跳过

**依赖**: 需要 `001_genrtl_tables.sql` 先执行（依赖 `teams` 表）

**执行位置**: Supabase Dashboard → SQL Editor

**文件路径**: `supabase/migrations/004_fix_free_to_hobby_plan.sql`

### 步骤 4: 执行 005_update_subscription_plans.sql（最新）

该文件重构订阅计划架构：
- 更新计划名称：`hobby` → `free`, `professional` → `plus`, `enterprise` → `ultra_plus`
- 调整 USD Pool 额度按 1.5:1 映射（Free: $0.5, Basic: $30, Plus: $150, Ultra Plus: $300）
- 为 Free 档禁用 on_demand
- **这是最重要的迁移，必须执行！**

**依赖**: 需要 `001_genrtl_tables.sql` 和 `003_dashboard_tables.sql` 先执行

**执行位置**: Supabase Dashboard → SQL Editor

**文件路径**: `supabase/migrations/005_update_subscription_plans.sql`
- 创建 `user_settings` 表（用户偏好设置）
- 创建 `user_sessions` 表（会话管理）
- 为 `usage_ledger` 添加优化索引

**执行位置**: Supabase Dashboard → SQL Editor

**文件路径**: `supabase/migrations/003_dashboard_tables.sql`

## 迁移文件顺序

```
supabase/migrations/
├── 001_genrtl_tables.sql          ← 先执行这个 ⭐
├── 003_dashboard_tables.sql       ← 再执行这个
├── 20251128_add_deletion_requests.sql
├── 20251129_add_mobile_subscriptions.sql
├── ...
```

## 验证

执行完成后，在 Supabase SQL Editor 中运行以下查询验证：

```sql
-- 验证 usage_ledger 表存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'usage_ledger'
);

-- 验证新表存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_settings', 'user_sessions', 'usd_pools', 'cbb_registry');

-- 验证 teams 表有 on_demand_enabled 字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND column_name = 'on_demand_enabled';
```

## 注意事项

1. **执行顺序很重要**: 必须先执行 `001_genrtl_tables.sql`，再执行 `003_dashboard_tables.sql`
2. **使用 IF NOT EXISTS**: 所有 CREATE TABLE 语句都使用了 `IF NOT EXISTS`，因此多次执行是安全的
3. **RLS 策略**: 迁移会自动创建 Row Level Security 策略
4. **Storage Bucket**: 需要手动在 Supabase Dashboard 中创建名为 `cbb-packages` 的私有存储桶（用于 CBB 文件存储）

## 可选：清理旧位置的文件

执行完迁移后，可以删除或重命名 `lib/db/migrations/001_genrtl_tables.sql`，避免混淆：

```
lib/db/migrations/001_genrtl_tables.sql  ← 可以删除或重命名
```

## 遇到问题？

如果执行 `001_genrtl_tables.sql` 时遇到错误：
- 检查 `teams` 表是否存在（其他迁移应该已经创建）
- 检查 `auth.users` 表是否可访问
- 确保在正确的数据库实例上执行（Production 数据库）

