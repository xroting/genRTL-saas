-- genRTL-SaaS 数据库迁移脚本
-- 创建 CBB Registry、Usage Ledger、USD Pool 等表

-- ============================================================
-- 1. CBB Registry 表 - 存储 CBB 资产包元数据
-- ============================================================
CREATE TABLE IF NOT EXISTS cbb_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cbb_id VARCHAR(255) NOT NULL,           -- CBB 标识符，如 "cbb_uart_16550"
  version VARCHAR(50) NOT NULL,            -- 语义化版本，如 "1.2.0"
  manifest JSONB NOT NULL,                 -- 完整的 manifest.json 数据
  storage_path VARCHAR(500) NOT NULL,      -- 存储路径（S3/Supabase Storage）
  file_size BIGINT NOT NULL DEFAULT 0,     -- 文件大小（字节）
  sha256 VARCHAR(64) NOT NULL,             -- SHA256 校验和
  is_active BOOLEAN NOT NULL DEFAULT true, -- 是否激活
  is_public BOOLEAN NOT NULL DEFAULT true, -- 是否公开可用
  download_count INTEGER NOT NULL DEFAULT 0, -- 下载次数
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 唯一约束：同一 CBB 的同一版本只能有一条记录
  UNIQUE(cbb_id, version)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cbb_registry_cbb_id ON cbb_registry(cbb_id);
CREATE INDEX IF NOT EXISTS idx_cbb_registry_version ON cbb_registry(version);
CREATE INDEX IF NOT EXISTS idx_cbb_registry_is_active ON cbb_registry(is_active);
CREATE INDEX IF NOT EXISTS idx_cbb_registry_download_count ON cbb_registry(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_cbb_registry_manifest_tags ON cbb_registry USING gin ((manifest->'tags'));

-- ============================================================
-- 2. CBB Receipts 表 - 存储 CBB 购买收据
-- ============================================================
CREATE TABLE IF NOT EXISTS cbb_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id VARCHAR(255) NOT NULL,
  job_id VARCHAR(255),
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  items JSONB NOT NULL,                    -- CBBChargedItem[]
  total_usd DECIMAL(10, 4) NOT NULL,       -- 总金额
  included_charged DECIMAL(10, 4) NOT NULL DEFAULT 0, -- 从 included 池扣除
  on_demand_charged DECIMAL(10, 4) NOT NULL DEFAULT 0, -- 从 on_demand 池扣除
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cbb_receipts_user_id ON cbb_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_cbb_receipts_status ON cbb_receipts(status);
CREATE INDEX IF NOT EXISTS idx_cbb_receipts_created_at ON cbb_receipts(created_at DESC);

-- ============================================================
-- 3. Usage Ledger 表 - 统一记账（LLM + CBB）
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind VARCHAR(20) NOT NULL,               -- 'llm' | 'cbb'
  bucket VARCHAR(20) NOT NULL,             -- 'included' | 'on_demand'
  job_id VARCHAR(255),
  step_id VARCHAR(255),
  workspace_id VARCHAR(255),
  usd_cost DECIMAL(10, 6) NOT NULL,        -- 美元成本

  -- LLM 特有字段
  provider VARCHAR(50),                    -- openai, anthropic, google
  model VARCHAR(100),                      -- gpt-4o, claude-sonnet, etc.
  input_tokens INTEGER,
  output_tokens INTEGER,
  cached_input_tokens INTEGER,

  -- CBB 特有字段
  cbb_id VARCHAR(255),
  cbb_version VARCHAR(50),
  cbb_price_usd DECIMAL(10, 4),
  receipt_id UUID REFERENCES cbb_receipts(id),

  idempotency_key VARCHAR(255) UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_usage_ledger_user_id ON usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_kind ON usage_ledger(kind);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_bucket ON usage_ledger(bucket);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_timestamp ON usage_ledger(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_job_id ON usage_ledger(job_id);

-- ============================================================
-- 4. USD Pools 表 - 用户美元池状态
-- ============================================================
CREATE TABLE IF NOT EXISTS usd_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  included_usd_balance DECIMAL(10, 4) NOT NULL DEFAULT 0, -- 订阅内剩余美元
  included_usd_total DECIMAL(10, 4) NOT NULL DEFAULT 0,   -- 订阅内总美元
  on_demand_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,        -- 超额按量累计
  on_demand_limit DECIMAL(10, 4),                          -- 超额限制（可选）
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),       -- 上次重置时间
  next_reset_at TIMESTAMPTZ NOT NULL,                     -- 下次重置时间
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_usd_pools_user_id ON usd_pools(user_id);
CREATE INDEX IF NOT EXISTS idx_usd_pools_team_id ON usd_pools(team_id);

-- ============================================================
-- 5. USD Pool Transactions 表 - 美元池交易记录
-- ============================================================
CREATE TABLE IF NOT EXISTS usd_pool_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,               -- 'charge' | 'refund' | 'reset'
  amount DECIMAL(10, 4) NOT NULL,
  bucket VARCHAR(20) NOT NULL,             -- 'included' | 'on_demand'
  included_charged DECIMAL(10, 4) NOT NULL DEFAULT 0,
  on_demand_charged DECIMAL(10, 4) NOT NULL DEFAULT 0,
  job_id VARCHAR(255),
  description TEXT,
  idempotency_key VARCHAR(255) UNIQUE,
  balance_before JSONB,
  balance_after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_usd_pool_transactions_user_id ON usd_pool_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_usd_pool_transactions_type ON usd_pool_transactions(type);
CREATE INDEX IF NOT EXISTS idx_usd_pool_transactions_created_at ON usd_pool_transactions(created_at DESC);

-- ============================================================
-- 6. RTL Jobs 表 - Plan/Implement/Repair 任务
-- ============================================================
CREATE TABLE IF NOT EXISTS rtl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,               -- 'plan' | 'implement' | 'repair'
  status VARCHAR(20) NOT NULL DEFAULT 'queued', -- 'queued' | 'processing' | 'done' | 'failed'

  -- Plan 任务字段
  spec TEXT,                               -- 用户输入的规格说明
  constraints JSONB,                       -- 工程约束

  -- Implement 任务字段
  plan_json JSONB,                         -- 输入的 Plan JSON
  resolved_cbbs JSONB,                     -- 已解析的 CBB manifests

  -- Repair 任务字段
  evidence_bundle JSONB,                   -- 修复证据包

  -- 通用字段
  workspace_policy JSONB,                  -- 工作区策略
  result JSONB,                            -- 任务结果
  error TEXT,                              -- 错误信息

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_rtl_jobs_user_id ON rtl_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_rtl_jobs_type ON rtl_jobs(type);
CREATE INDEX IF NOT EXISTS idx_rtl_jobs_status ON rtl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_rtl_jobs_workspace_id ON rtl_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rtl_jobs_created_at ON rtl_jobs(created_at DESC);

-- ============================================================
-- 7. 辅助函数：增加 CBB 下载计数
-- ============================================================
CREATE OR REPLACE FUNCTION increment_cbb_download_count(
  p_cbb_id VARCHAR(255),
  p_version VARCHAR(50)
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE cbb_registry
  SET download_count = download_count + 1,
      updated_at = now()
  WHERE cbb_id = p_cbb_id AND version = p_version;
END;
$$;

-- ============================================================
-- 8. RLS 策略
-- ============================================================

-- 启用 RLS
ALTER TABLE cbb_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbb_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE usd_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE usd_pool_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rtl_jobs ENABLE ROW LEVEL SECURITY;

-- CBB Registry: 公开可读
CREATE POLICY "cbb_registry_select" ON cbb_registry
  FOR SELECT USING (is_active = true AND is_public = true);

-- CBB Receipts: 用户只能访问自己的收据
CREATE POLICY "cbb_receipts_select" ON cbb_receipts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cbb_receipts_insert" ON cbb_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage Ledger: 用户只能访问自己的记录
CREATE POLICY "usage_ledger_select" ON usage_ledger
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_ledger_insert" ON usage_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USD Pools: 用户只能访问自己的池
CREATE POLICY "usd_pools_select" ON usd_pools
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usd_pools_update" ON usd_pools
  FOR UPDATE USING (auth.uid() = user_id);

-- USD Pool Transactions: 用户只能访问自己的交易
CREATE POLICY "usd_pool_transactions_select" ON usd_pool_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- RTL Jobs: 用户只能访问自己的任务
CREATE POLICY "rtl_jobs_select" ON rtl_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rtl_jobs_insert" ON rtl_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rtl_jobs_update" ON rtl_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 9. 创建 CBB 包存储桶
-- ============================================================
-- 注意：需要在 Supabase Dashboard 中手动创建 Storage Bucket
-- 名称: cbb-packages
-- 设置: 私有（需要签名 URL 访问）

-- ============================================================
-- 完成
-- ============================================================
