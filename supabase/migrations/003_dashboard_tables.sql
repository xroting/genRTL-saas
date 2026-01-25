-- Dashboard 功能相关表结构
-- 创建日期: 2026-01-25
-- 功能: 支持 Dashboard 的 Settings, Sessions, User Settings 等功能

-- ===========================================
-- 1. teams 表新增字段
-- ===========================================

-- 添加 on_demand_enabled 字段到 teams 表
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS on_demand_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN teams.on_demand_enabled IS '是否启用 On-Demand 使用';

-- ===========================================
-- 2. user_settings 表 - 用户偏好设置
-- ===========================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_data BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE user_settings IS '用户偏好设置表';
COMMENT ON COLUMN user_settings.share_data IS '是否允许共享数据用于训练';
COMMENT ON COLUMN user_settings.email_notifications IS '是否接收邮件通知';
COMMENT ON COLUMN user_settings.marketing_emails IS '是否接收营销邮件';

-- user_settings 的 RLS 策略
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- 3. user_sessions 表 - 用户会话管理
-- ===========================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'web', -- 'web', 'desktop', 'mobile'
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);

COMMENT ON TABLE user_sessions IS '用户会话管理表';
COMMENT ON COLUMN user_sessions.type IS '会话类型: web, desktop, mobile';
COMMENT ON COLUMN user_sessions.revoked_at IS '会话撤销时间';

-- user_sessions 的 RLS 策略
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- 4. 索引优化
-- ===========================================

-- usage_ledger 表添加索引以优化 Dashboard 查询
CREATE INDEX IF NOT EXISTS idx_usage_ledger_user_timestamp 
  ON usage_ledger(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_usage_ledger_user_bucket 
  ON usage_ledger(user_id, bucket);

-- ===========================================
-- 5. 更新触发器
-- ===========================================

-- user_settings 更新时间触发器
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- ===========================================
-- 6. 默认数据
-- ===========================================

-- 为现有用户创建默认设置（可选）
-- INSERT INTO user_settings (user_id, share_data, email_notifications, marketing_emails)
-- SELECT id, true, true, false FROM auth.users
-- ON CONFLICT (user_id) DO NOTHING;

