-- 更新订阅计划架构
-- 从 hobby/professional/enterprise 迁移到 free/basic/plus/ultra_plus

-- 1. 更新计划名称映射
UPDATE teams SET plan_name = 'free' WHERE plan_name IN ('hobby', 'free');
UPDATE teams SET plan_name = 'basic' WHERE plan_name = 'basic';
UPDATE teams SET plan_name = 'plus' WHERE plan_name IN ('professional', 'pro');
UPDATE teams SET plan_name = 'ultra_plus' WHERE plan_name IN ('enterprise', 'ent');

-- 2. 更新 USD Pools 的 included_usd 额度（按 1.5:1 映射）
UPDATE usd_pools SET 
  included_usd_total = 0.5,
  included_usd_balance = LEAST(included_usd_balance, 0.5)
WHERE user_id IN (
  SELECT tm.user_id FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE t.plan_name = 'free'
);

UPDATE usd_pools SET 
  included_usd_total = 30.0,
  included_usd_balance = LEAST(included_usd_balance + (30.0 - 20.0), 30.0)
WHERE user_id IN (
  SELECT tm.user_id FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE t.plan_name = 'basic'
);

UPDATE usd_pools SET 
  included_usd_total = 150.0,
  included_usd_balance = LEAST(included_usd_balance + (150.0 - 100.0), 150.0)
WHERE user_id IN (
  SELECT tm.user_id FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE t.plan_name = 'plus'
);

UPDATE usd_pools SET 
  included_usd_total = 300.0,
  included_usd_balance = LEAST(included_usd_balance + (300.0 - 200.0), 300.0)
WHERE user_id IN (
  SELECT tm.user_id FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE t.plan_name = 'ultra_plus'
);

-- 3. 为 Free 档禁用 on_demand
UPDATE teams SET on_demand_enabled = false WHERE plan_name = 'free';

COMMENT ON TABLE teams IS 'Teams table with subscription plans: free ($0, $0.5 included), basic ($20, $30 included), plus ($100, $150 included), ultra_plus ($200, $300 included). Mapping ratio: 1:1.5';

