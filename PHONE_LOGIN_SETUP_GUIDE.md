# 📱 手机验证码登录功能 - 配置指南

## 概述

Monna SaaS 现已支持完整的手机验证码登录功能。本指南将帮助您完成 Supabase 的配置，使手机验证码功能正常工作。

---

## ✅ 已完成的功能

1. **✅ 前端界面**
   - 手机号输入（支持13个国家/地区区号）
   - 验证码输入（6位数字）
   - 发送验证码按钮（带60秒倒计时）
   - 友好的错误提示

2. **✅ 后端集成**
   - Supabase OTP 发送 API
   - Supabase OTP 验证 API
   - 自动创建用户 profile
   - 自动创建用户 team
   - 新用户默认名称 "Anonymous"

3. **✅ 用户信息显示**
   - 优先显示用户名
   - 无名称时显示 "Anonymous"
   - 头像显示正确的首字母

---

## ⚙️ 需要配置的内容

### 步骤 1: 访问 Supabase Dashboard

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目

### 步骤 2: 启用 Phone Auth

1. 导航到 **Authentication** → **Providers**
2. 找到 **Phone** 选项
3. 点击 **Enable Phone Provider**

### 步骤 3: 选择并配置 SMS 提供商

Supabase 支持多个 SMS 提供商。推荐使用以下任一服务：

#### 选项 A: Twilio（推荐）

**优点**: 
- 全球覆盖广泛
- 价格合理
- 中文支持
- 稳定可靠

**配置步骤**:

1. 访问 [Twilio Console](https://www.twilio.com/console)
2. 注册/登录账户
3. 获取凭证：
   - Account SID
   - Auth Token
   - Phone Number（购买一个发送号码）

4. 在 Supabase Dashboard 中填写：
   ```
   Provider: Twilio
   Account SID: [你的 Account SID]
   Auth Token: [你的 Auth Token]
   Sender Phone Number: [你的 Twilio 号码]
   ```

5. 保存配置

**费用参考**:
- 中国大陆：约 $0.05/条
- 美国：约 $0.0075/条
- 其他地区：根据 Twilio 定价

#### 选项 B: MessageBird

**优点**:
- 欧洲用户体验好
- 价格竞争力强

**配置步骤**:

1. 访问 [MessageBird Dashboard](https://dashboard.messagebird.com/)
2. 注册/登录账户
3. 获取 API Key
4. 在 Supabase 中配置：
   ```
   Provider: MessageBird
   API Key: [你的 API Key]
   Originator: [发送者名称，如 "genRTL"]
   ```

#### 选项 C: Vonage (原 Nexmo)

**配置步骤**:

1. 访问 [Vonage Dashboard](https://dashboard.nexmo.com/)
2. 注册/登录账户
3. 获取：
   - API Key
   - API Secret
4. 在 Supabase 中配置

### 步骤 4: 配置 SMS 模板（可选）

在 Supabase Dashboard 中自定义 SMS 消息模板：

**默认模板**:
```
Your verification code is: {{ .Token }}
```

**推荐模板**:
```
【genRTL】您的验证码是：{{ .Token }}，有效期60秒。
```

### 步骤 5: 测试配置

1. 点击 Supabase Dashboard 中的 **Send Test SMS** 按钮
2. 输入您的手机号（包含区号，如 +8613812345678）
3. 检查是否收到验证码短信
4. 如果收到，配置成功！✅

---

## 🧪 测试手机登录功能

### 本地测试

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 http://localhost:3005

3. 点击右上角"登录"按钮

4. 选择"使用手机号登录"

5. 输入手机号（如 +86 13812345678）

6. 点击"发送验证码"

7. 查看手机是否收到验证码

8. 输入验证码

9. 点击"登录"

10. 验证成功后应自动跳转到 `/generate` 页面

### 生产环境测试

1. 部署到 Vercel/您的服务器

2. 确保环境变量已正确配置：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. 按照上述测试步骤进行测试

---

## 🔍 故障排查

### 问题 1: 点击"发送验证码"后提示错误

**可能原因**:
- Supabase Phone Auth 未启用
- SMS 提供商未配置
- 手机号格式不正确

**解决方案**:
1. 检查 Supabase Dashboard → Authentication → Providers → Phone 是否已启用
2. 检查 SMS 提供商凭证是否正确
3. 确保手机号包含正确的国家区号（如 +86）

### 问题 2: 收不到验证码短信

**可能原因**:
- SMS 提供商余额不足
- 手机号被运营商拦截
- SMS 发送限制

**解决方案**:
1. 检查 SMS 提供商账户余额
2. 查看 Supabase Dashboard → Logs 中的错误信息
3. 尝试使用不同的手机号
4. 联系 SMS 提供商技术支持

### 问题 3: 验证码输入后提示错误

**可能原因**:
- 验证码已过期（默认60秒）
- 验证码输入错误
- 网络延迟

**解决方案**:
1. 重新发送验证码
2. 确保在60秒内输入验证码
3. 检查浏览器控制台是否有错误信息

### 问题 4: 登录成功但用户名显示为 email 而不是 Anonymous

**可能原因**:
- `ensure-profile` API 未正确执行
- profiles 表中已有旧数据

**解决方案**:
1. 检查浏览器控制台日志
2. 查看 `/api/auth/ensure-profile` 是否返回成功
3. 手动更新 profiles 表：
   ```sql
   UPDATE profiles 
   SET name = 'Anonymous' 
   WHERE id = 'user_id' AND name IS NULL;
   ```

---

## 📊 数据库结构

### profiles 表

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text,
  name text,  -- 手机登录新用户默认 "Anonymous"
  gender text,
  role text DEFAULT 'member',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone
);
```

### teams 表

```sql
CREATE TABLE teams (
  id serial PRIMARY KEY,
  name text NOT NULL,
  plan_name text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  credits integer DEFAULT 100,  -- 新用户赠送 100 credits
  total_credits integer DEFAULT 100,
  credits_consumed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_credit_update timestamp with time zone DEFAULT now()
);
```

### team_members 表

```sql
CREATE TABLE team_members (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  team_id integer REFERENCES teams(id),
  role text DEFAULT 'owner',
  joined_at timestamp with time zone DEFAULT now()
);
```

---

## 💰 费用估算

### SMS 费用（基于 Twilio）

| 地区 | 每条短信费用 | 1000条费用 |
|------|-------------|-----------|
| 中国大陆 | $0.05 | $50 |
| 美国 | $0.0075 | $7.50 |
| 香港 | $0.04 | $40 |
| 日本 | $0.06 | $60 |
| 欧洲 | $0.08 | $80 |

**建议**:
1. 在生产环境启用前先进行充分测试
2. 设置 SMS 发送限制，防止滥用
3. 考虑添加图形验证码作为第一道防护
4. 监控 SMS 发送量和费用

---

## 🔐 安全建议

1. **启用速率限制**
   - 限制同一手机号每天发送验证码次数（建议 5 次/天）
   - 限制同一 IP 地址每小时发送次数（建议 10 次/小时）

2. **添加图形验证码**
   - 在发送 SMS 前要求用户完成图形验证
   - 推荐使用 Google reCAPTCHA

3. **监控异常行为**
   - 监控短时间内大量发送的情况
   - 设置告警阈值

4. **手机号验证**
   - 验证手机号格式
   - 黑名单机制（屏蔽虚拟号码）

---

## 📞 技术支持

如果您在配置过程中遇到问题，请：

1. 检查本文档的故障排查部分
2. 查看 [Supabase 官方文档](https://supabase.com/docs/guides/auth/phone-login)
3. 查看项目的 CHANGELOG.md 了解最新更新
4. 联系技术支持团队

---

## ✅ 配置检查清单

配置完成后，请检查以下项目：

- [ ] Supabase Phone Auth 已启用
- [ ] SMS 提供商已配置并测试通过
- [ ] SMS 模板已自定义（可选）
- [ ] 本地测试发送验证码成功
- [ ] 本地测试验证码登录成功
- [ ] 新用户显示为 "Anonymous"
- [ ] 用户 team 自动创建
- [ ] 新用户获得 100 credits
- [ ] 生产环境部署并测试
- [ ] 监控和告警已设置（推荐）

---

**最后更新**: 2025-11-07  
**版本**: v1.0  
**维护者**: genRTL 开发团队

