# Supabase 配置指南

## 🎯 目标
配置 Supabase 认证以支持用户登录、注册和 OAuth

## 📋 前置条件
- ✅ Vercel 已部署到 www.xroting.com
- ✅ Supabase 项目已创建
- ✅ 环境变量已设置

## 🔧 配置步骤

### 步骤 1: 登录 Supabase Dashboard

访问: https://supabase.com/dashboard

选择您的项目

### 步骤 2: 配置认证 URL

1. 前往: **Authentication** → **URL Configuration**

2. 更新以下 URLs:

#### Site URL
```
https://www.xroting.com
```

#### Redirect URLs (添加所有以下 URLs)
```
https://www.xroting.com/auth/callback
https://www.xroting.com/
https://www.xroting.com/dashboard
https://www.xroting.com/generate
https://monna-saas.vercel.app/auth/callback
https://monna-saas-*-xroting-technology-llc.vercel.app/auth/callback
```

**注意**: 最后一行的通配符 `*` 允许所有 Vercel 预览部署

3. 点击 **Save**

### 步骤 3: 配置邮件认证

1. 前往: **Authentication** → **Providers** → **Email**

2. 确保已启用:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (可选,推荐启用)

3. 自定义邮件模板 (可选):

#### 确认邮件模板
```html
<h2>确认您的注册</h2>
<p>感谢注册 genRTL!</p>
<p>点击下面的链接确认您的邮箱:</p>
<p><a href="{{ .ConfirmationURL }}">确认邮箱</a></p>
```

#### 重置密码模板
```html
<h2>重置密码</h2>
<p>点击下面的链接重置您的密码:</p>
<p><a href="{{ .ConfirmationURL }}">重置密码</a></p>
```

### 步骤 4: 配置 Google OAuth (可选但推荐)

1. 前往: **Authentication** → **Providers** → **Google**

2. 启用 Google provider

3. 获取 Google OAuth 凭证:

   a. 访问: https://console.cloud.google.com/apis/credentials

   b. 创建项目 (如果还没有)

   c. 点击 **CREATE CREDENTIALS** → **OAuth client ID**

   d. 选择 **Application type**: `Web application`

   e. 填写:
      - **Name**: `Monna SaaS`
      - **Authorized redirect URIs**:
        ```
        https://your-project-ref.supabase.co/auth/v1/callback
        ```
        (在 Supabase Dashboard 中可以看到这个 URL)

   f. 点击 **CREATE**

   g. 复制 **Client ID** 和 **Client Secret**

4. 返回 Supabase,填写:
   - **Client ID**: `your-google-client-id`
   - **Client Secret**: `your-google-client-secret`

5. 点击 **Save**

### 步骤 5: 配置 Apple OAuth (可选)

1. 前往: **Authentication** → **Providers** → **Apple**

2. 启用 Apple provider

3. 获取 Apple OAuth 凭证:

   a. 访问: https://developer.apple.com/account/resources/identifiers/list

   b. 创建 App ID 或 Service ID

   c. 配置 Sign in with Apple

   d. 获取必要的凭证

4. 在 Supabase 中配置 Apple provider

### 步骤 6: 配置邮件发送 (重要!)

默认情况下,Supabase 使用内置的邮件服务,但有限制。

#### 使用自定义 SMTP (生产环境推荐)

1. 前往: **Project Settings** → **Auth** → **SMTP Settings**

2. 启用 **Enable Custom SMTP**

3. 填写您的 SMTP 配置:
   ```
   Host: smtp.gmail.com (或其他 SMTP 服务器)
   Port: 587
   Username: your-email@gmail.com
   Password: your-app-password
   Sender email: your-email@gmail.com
   Sender name: genRTL
   ```

4. 点击 **Save**

### 步骤 7: 测试认证流程

#### 测试邮件注册:
1. 访问: https://www.xroting.com/sign-up
2. 输入邮箱和密码
3. 点击注册
4. 检查邮箱确认邮件
5. 点击确认链接
6. 应该跳转回网站并自动登录

#### 测试 Google 登录:
1. 访问: https://www.xroting.com/sign-in
2. 点击 "Sign in with Google"
3. 选择 Google 账号
4. 应该跳转回网站并登录

#### 测试密码重置:
1. 访问: https://www.xroting.com/sign-in
2. 点击 "Forgot password?"
3. 输入邮箱
4. 检查重置邮件
5. 点击重置链接
6. 设置新密码

### 步骤 8: 配置数据库 Row Level Security (RLS)

Supabase 的 RLS 策略已在代码中定义,但需要确保已应用:

1. 前往: **Table Editor**

2. 检查以下表是否有 RLS 策略:
   - `users`
   - `teams`
   - `team_members`
   - `jobs`
   - `credits`

3. 如果没有,运行 SQL 脚本 (通常已自动创建):

```sql
-- 在 SQL Editor 中执行
-- 确保 RLS 已启用
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
```

## 🐛 常见问题

### 问题 1: 确认邮件没有收到

**原因**: SMTP 配置问题或邮件被标记为垃圾邮件

**解决**:
1. 检查垃圾邮件文件夹
2. 在 Supabase Dashboard → **Auth** → **Logs** 查看邮件发送日志
3. 配置自定义 SMTP
4. 在开发时,可以暂时禁用邮箱确认:
   - **Authentication** → **Email** → 取消 **Confirm email**

### 问题 2: OAuth 回调 URL 错误

**错误信息**: "redirect_uri_mismatch" 或 "Invalid redirect URI"

**解决**:
1. 确保 Supabase Redirect URLs 包含您的域名
2. 确保 Google/Apple OAuth 配置中的 redirect URI 与 Supabase 提供的完全匹配
3. 清除浏览器缓存后重试

### 问题 3: 用户注册后立即登出

**原因**: Session 管理问题或 Cookie 设置问题

**解决**:
1. 检查 `middleware.ts` 是否正确配置
2. 确保 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_ANON_KEY 正确
3. 检查浏览器 Cookie 设置是否阻止第三方 Cookie

### 问题 4: "Invalid API key" 错误

**原因**: 环境变量配置错误

**解决**:
```bash
# 验证 Vercel 环境变量
vercel env ls production | grep SUPABASE

# 重新设置
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# 重新部署
vercel --prod
```

## ✅ 验证清单

- [ ] Site URL 设置为 https://www.xroting.com
- [ ] Redirect URLs 包含所有必要的 URL
- [ ] Email provider 已启用
- [ ] (可选) Google OAuth 已配置并测试
- [ ] (可选) Apple OAuth 已配置并测试
- [ ] SMTP 邮件发送已配置 (生产环境)
- [ ] 完成一次完整的注册流程测试
- [ ] 完成一次完整的登录流程测试
- [ ] 完成一次密码重置流程测试

## 🔐 安全建议

1. **启用邮箱确认** - 防止垃圾注册
2. **配置速率限制** - 在 Supabase Auth 设置中
3. **启用 MFA** (多因素认证) - 对于敏感操作
4. **定期审查用户** - 检查异常活动
5. **使用强密码策略** - 在 Auth 设置中配置

## 📧 邮件提供商推荐

### 开发/测试:
- Supabase 内置 (免费,有限制)

### 生产环境:
- **SendGrid** - https://sendgrid.com (免费层: 100邮件/天)
- **Mailgun** - https://www.mailgun.com (免费层: 5000邮件/月)
- **AWS SES** - https://aws.amazon.com/ses/ (按使用付费,便宜)
- **Resend** - https://resend.com (现代化API,推荐)

## 🔗 有用链接

- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Auth 文档: https://supabase.com/docs/guides/auth
- Google Cloud Console: https://console.cloud.google.com
- Apple Developer: https://developer.apple.com

## 📝 下一步

配置完成后:
1. 测试所有认证流程
2. 配置 Stripe 支付
3. 测试完整的用户旅程: 注册 → 登录 → 购买 → 使用服务
