-- 重置 hhuzhang0517@gmail.com 的 USD Pool 到 Ultra Plus 完整额度
-- 如果 included_usd_balance 不足 $300，执行此脚本

DO $$
DECLARE
  v_user_id UUID;
  v_team_id INTEGER;
  v_current_balance DECIMAL(10, 2);
BEGIN
  -- 1. 获取用户 ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'hhuzhang0517@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- 2. 获取 team_id
  SELECT tm.team_id INTO v_team_id
  FROM team_members tm
  WHERE tm.user_id = v_user_id
  LIMIT 1;
  
  -- 3. 获取当前余额
  SELECT included_usd_balance INTO v_current_balance
  FROM usd_pools
  WHERE user_id = v_user_id;
  
  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;
  
  RAISE NOTICE 'Current balance: $%', v_current_balance;
  
  -- 4. 如果余额少于 $300，重置为 $300
  IF v_current_balance < 300.0 THEN
    UPDATE usd_pools
    SET 
      included_usd_balance = 300.0,
      included_usd_total = 300.0,
      on_demand_usd = 0.0,
      updated_at = NOW()
    WHERE user_id = v_user_id;
    
    -- 记录充值交易
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
      300.0 - v_current_balance,
      'included',
      300.0 - v_current_balance,
      0.0,
      'Reset USD Pool to Ultra Plus full amount',
      jsonb_build_object('included', v_current_balance, 'on_demand', 0),
      jsonb_build_object('included', 300.0, 'on_demand', 0),
      NOW()
    );
    
    RAISE NOTICE '✅ Reset included_usd_balance from $% to $300', v_current_balance;
  ELSE
    RAISE NOTICE '✅ Balance is already sufficient: $%', v_current_balance;
  END IF;
  
END $$;

-- 验证结果
SELECT 
  u.email,
  up.included_usd_balance,
  up.included_usd_total,
  up.on_demand_usd
FROM auth.users u
LEFT JOIN usd_pools up ON up.user_id = u.id
WHERE u.email = 'hhuzhang0517@gmail.com';

