-- 检查 hhuzhang0517@gmail.com 的 USD Pool 状态

SELECT 
  u.email,
  t.plan_name,
  t.subscription_status,
  t.on_demand_enabled,
  up.included_usd_balance,
  up.included_usd_total,
  up.on_demand_usd,
  up.on_demand_limit,
  up.last_reset_at,
  up.next_reset_at
FROM auth.users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
LEFT JOIN usd_pools up ON up.user_id = u.id
WHERE u.email = 'hhuzhang0517@gmail.com';

-- 查看最近的 USD Pool 交易记录
SELECT 
  type,
  amount,
  bucket,
  included_charged,
  on_demand_charged,
  description,
  balance_before,
  balance_after,
  created_at
FROM usd_pool_transactions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hhuzhang0517@gmail.com')
ORDER BY created_at DESC
LIMIT 10;

-- 查看最近的 usage_ledger 记录
SELECT 
  timestamp,
  kind,
  bucket,
  model,
  input_tokens,
  output_tokens,
  usd_cost
FROM usage_ledger
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hhuzhang0517@gmail.com')
ORDER BY timestamp DESC
LIMIT 5;

