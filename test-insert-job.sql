-- 测试脚本：在Supabase SQL Editor中运行此脚本
-- 用于手动插入一条测试任务

-- 1. 先查看你的user_id
SELECT id, email FROM auth.users WHERE email = 'xiaohuaeric@163.com';

-- 2. 手动插入一条测试任务（将USER_ID替换为上面查询到的id）
INSERT INTO public.jobs (
  id,
  user_id,
  provider,
  type,
  prompt,
  status,
  result_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '18e3af94-4dbe-41d6-8d98-d1aec220df10',  -- 替换为你的user_id
  'gemini',
  'image',
  '测试任务',
  'done',
  'https://example.com/test-image.jpg',
  NOW(),
  NOW()
);

-- 3. 验证插入
SELECT * FROM public.jobs 
WHERE user_id = '18e3af94-4dbe-41d6-8d98-d1aec220df10'
ORDER BY created_at DESC
LIMIT 5;

-- 4. 检查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'jobs';

