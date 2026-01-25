# 用户升级脚本说明

## 脚本：006_upgrade_user_to_ultra_plus.sql

### 功能
将 `hhuzhang0517@gmail.com` 升级为 **Ultra Plus** 等级用户，相当于充值 **$200**，获得 **$300 included USD**（按 1.5:1 映射）。

### 执行内容

1. **查找用户信息**
   - 通过 email 查找 user_id
   - 查找用户的 team_id 和当前计划

2. **更新订阅计划**
   - 将 `teams.plan_name` 更新为 `'ultra_plus'`
   - 设置 `subscription_status` 为 `'active'`

3. **更新 USD Pool**
   - `included_usd_balance`: $300（完整额度）
   - `included_usd_total`: $300
   - `on_demand_usd`: $0（重置超额使用）
   - 设置下次重置时间为 1 个月后

4. **记录交易**
   - 在 `usd_pool_transactions` 表中记录充值交易
   - 便于审计和历史查询

5. **启用 On-Demand**
   - Ultra Plus 支持无限超额使用
   - 设置 `on_demand_enabled = true`

### Ultra Plus 权益

| 项目 | 值 |
|------|------|
| 月费 | $200 |
| Included USD | $300 (1.5x) |
| 使用模型 | Claude Sonnet 4 |
| 费率 | $0.0075/1K tokens (20% 折扣) |
| On-Demand | ✅ 无限制 |
| CBB Marketplace | ✅ 可用 |
| 优先支持 | ✅ 可用 |
| Tokens 上限 | 无限 |

### 执行步骤

#### 方法 1: Supabase SQL Editor（推荐）

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `006_upgrade_user_to_ultra_plus.sql` 的内容
4. 点击 "Run" 执行
5. 查看输出日志确认成功

#### 方法 2: psql 命令行

```bash
psql "postgresql://postgres.prhyqvlsbqrvifcqhjnr:Gz!071218@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/006_upgrade_user_to_ultra_plus.sql
```

### 预期输出

```
NOTICE:  Found user_id: 23a368f7-a76d-430c-badc-2423b60ece5f
NOTICE:  Found team_id: 1, old plan: free
NOTICE:  Updated team plan to ultra_plus
NOTICE:  Old balance: $0.50
NOTICE:  Updated USD Pool: $300 included
NOTICE:  Recorded transaction
NOTICE:  Enabled on-demand for Ultra Plus
NOTICE:  ✅ Successfully upgraded hhuzhang0517@gmail.com to Ultra Plus
NOTICE:     - Plan: ultra_plus
NOTICE:     - Included USD: $300
NOTICE:     - On-Demand: Enabled (unlimited)
NOTICE:     - Valid until: 2026-02-25 XX:XX:XX
```

### 验证结果

脚本执行后会自动显示升级后的状态：

```sql
email                    | team_id | plan_name  | subscription_status | on_demand_enabled | included_usd_balance | included_usd_total | on_demand_usd
-------------------------|---------|------------|---------------------|-------------------|---------------------|-------------------|---------------
hhuzhang0517@gmail.com   | 1       | ultra_plus | active              | true              | 300.00              | 300.00            | 0.00
```

### 注意事项

1. **幂等性**: 脚本使用 `INSERT ... ON CONFLICT DO UPDATE`，可以重复执行
2. **余额重置**: 会重置 `on_demand_usd` 为 0，清除之前的超额使用
3. **有效期**: 设置为 1 个月后到期，可根据需要调整
4. **审计记录**: 所有操作都有日志和交易记录，便于追溯

### 回滚脚本（如需要）

如果需要回滚，可以执行：

```sql
-- 回滚到 Free 计划
UPDATE teams SET plan_name = 'free', on_demand_enabled = false 
WHERE id IN (
  SELECT tm.team_id FROM team_members tm
  JOIN auth.users u ON u.id = tm.user_id
  WHERE u.email = 'hhuzhang0517@gmail.com'
);

-- 重置 USD Pool
UPDATE usd_pools SET 
  included_usd_balance = 0.5,
  included_usd_total = 0.5,
  on_demand_usd = 0
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'hhuzhang0517@gmail.com'
);
```

### 测试建议

升级后测试以下功能：

1. ✅ 登录 Dashboard，确认显示 "Ultra Plus" 计划
2. ✅ 查看 Usage 页面，确认 $300 额度
3. ✅ 发送 Chat 请求，确认使用 Claude Sonnet 4
4. ✅ 查看费率是否为 $0.0075/1K tokens（20% 折扣）
5. ✅ 确认 on-demand 开关可用且默认启用
6. ✅ 测试超额使用（on-demand）功能

---

**创建时间**: 2026-01-25
**适用用户**: hhuzhang0517@gmail.com
**目标计划**: Ultra Plus
**充值金额**: $200 → $300 included USD (1.5x)

