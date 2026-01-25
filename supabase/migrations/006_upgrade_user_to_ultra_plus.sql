-- 将 hhuzhang0517@gmail.com 升级为 Ultra Plus 用户
-- 相当于充值 $200，获得 $300 included USD (1.5x 映射)

-- ============================================================================
-- 第一步：查找用户信息
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_team_id INTEGER;
  v_old_plan VARCHAR(50);
  v_old_balance DECIMAL(10, 2);
BEGIN
  -- 1. 获取用户 ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'hhuzhang0517@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: hhuzhang0517@gmail.com';
  END IF;
  
  RAISE NOTICE 'Found user_id: %', v_user_id;
  
  -- 2. 获取用户的 team
  SELECT tm.team_id, t.plan_name INTO v_team_id, v_old_plan
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.user_id = v_user_id
  LIMIT 1;
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'No team found for user';
  END IF;
  
  RAISE NOTICE 'Found team_id: %, old plan: %', v_team_id, v_old_plan;
  
  -- ============================================================================
  -- 第二步：更新订阅计划
  -- ============================================================================
  
  -- 3. 更新 teams 表为 Ultra Plus
  UPDATE teams
  SET 
    plan_name = 'ultra_plus',
    subscription_status = 'active',
    updated_at = NOW()
  WHERE id = v_team_id;
  
  RAISE NOTICE 'Updated team plan to ultra_plus';
  
  -- ============================================================================
  -- 第三步：更新 USD Pool
  -- ============================================================================
  
  -- 4. 获取当前余额
  SELECT included_usd_balance INTO v_old_balance
  FROM usd_pools
  WHERE user_id = v_user_id;
  
  IF v_old_balance IS NULL THEN
    v_old_balance := 0;
  END IF;
  
  RAISE NOTICE 'Old balance: $%', v_old_balance;
  
  -- 5. 更新 USD Pool（Ultra Plus: $300 included）
  INSERT INTO usd_pools (
    user_id,
    team_id,
    included_usd_balance,
    included_usd_total,
    on_demand_usd,
    on_demand_limit,
    last_reset_at,
    next_reset_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_team_id,
    300.0,  -- 完整的 $300 额度
    300.0,
    0.0,
    NULL,  -- Ultra Plus 无限超额
    NOW(),
    NOW() + INTERVAL '1 month',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    included_usd_balance = 300.0,
    included_usd_total = 300.0,
    on_demand_usd = 0.0,  -- 重置超额使用
    last_reset_at = NOW(),
    next_reset_at = NOW() + INTERVAL '1 month',
    updated_at = NOW();
  
  RAISE NOTICE 'Updated USD Pool: $300 included';
  
  -- ============================================================================
  -- 第四步：记录交易（可选，用于审计）
  -- ============================================================================
  
  -- 6. 记录充值交易到 usd_pool_transactions
  INSERT INTO usd_pool_transactions (
    user_id,
    team_id,
    type,
    amount,
    bucket,
    included_charged,
    on_demand_charged,
    description,
    balance_before,
    balance_after,
    created_at
  ) VALUES (
    v_user_id,
    v_team_id,
    'charge',
    300.0,
    'included',
    300.0,
    0.0,
    'Manual upgrade to Ultra Plus - Admin action',
    jsonb_build_object('included', v_old_balance, 'on_demand', 0),
    jsonb_build_object('included', 300.0, 'on_demand', 0),
    NOW()
  );
  
  RAISE NOTICE 'Recorded transaction';
  
  -- ============================================================================
  -- 第五步：启用 on-demand（Ultra Plus 支持）
  -- ============================================================================
  
  -- 7. 确保 on_demand 启用
  UPDATE teams
  SET on_demand_enabled = true
  WHERE id = v_team_id;
  
  RAISE NOTICE 'Enabled on-demand for Ultra Plus';
  
  -- ============================================================================
  -- 完成
  -- ============================================================================
  
  RAISE NOTICE '✅ Successfully upgraded hhuzhang0517@gmail.com to Ultra Plus';
  RAISE NOTICE '   - Plan: ultra_plus';
  RAISE NOTICE '   - Included USD: $300';
  RAISE NOTICE '   - On-Demand: Enabled (unlimited)';
  RAISE NOTICE '   - Valid until: %', NOW() + INTERVAL '1 month';
  
END $$;

-- ============================================================================
-- 验证结果
-- ============================================================================

-- 查看升级后的状态
SELECT 
  u.email,
  t.id as team_id,
  t.plan_name,
  t.subscription_status,
  t.on_demand_enabled,
  up.included_usd_balance,
  up.included_usd_total,
  up.on_demand_usd,
  up.last_reset_at,
  up.next_reset_at
FROM auth.users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
LEFT JOIN usd_pools up ON up.user_id = u.id
WHERE u.email = 'hhuzhang0517@gmail.com';

