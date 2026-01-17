# Supabase 邮件验证配置指南

## 问题：验证码邮件收不到？

如果您在测试验证码登录时收不到邮件，可能是以下原因：

### 1. Supabase 免费版邮件限制

- **每小时限制**：4 封邮件
- **建议**：生产环境配置自定义 SMTP

### 2. 邮件在垃圾邮件箱

- 检查垃圾邮件/垃圾箱
- Supabase 默认发件人可能被标记为垃圾邮件

### 3. 邮件模板配置

Supabase 默认使用"Magic Link"模板发送 OTP。

## 配置步骤

### 方案 A：使用 Supabase 内置邮件服务（开发/测试）

1. **确认邮件已启用**
   - 登录 Supabase Dashboard
   - 进入 Project Settings → Auth
   - 确认 "Enable email provider" 已勾选

2. **检查邮件模板**
   - 进入 Authentication → Email Templates
   - 找到 "Magic Link" 模板
   - 确认模板已启用

3. **测试发送**
   - 使用真实邮箱测试
   - 注意频率限制（每小时 4 封）

### 方案 B：配置自定义 SMTP（推荐生产环境）

#### 使用 Resend（推荐，免费额度充足）

1. **注册 Resend**
   - 访问 https://resend.com
   - 注册账号（每月 3000 封免费）
   - 验证域名（可选，使用 onboarding.resend.dev 测试）

2. **获取 API Key**
   - Dashboard → API Keys
   - 创建新的 API Key
   - 复制 Key

3. **配置 Supabase**
   - Supabase Dashboard → Project Settings → Auth → SMTP Settings
   - 启用 "Enable Custom SMTP"
   - 配置：
     ```
     Host: smtp.resend.com
     Port: 587
     Username: resend
     Password: [你的 Resend API Key]
     Sender email: onboarding@resend.dev (或你验证的域名)
     Sender name: genRTL
     ```

#### 使用 SendGrid

1. **注册 SendGrid**
   - 访问 https://sendgrid.com
   - 注册账号（每天 100 封免费）

2. **创建 API Key**
   - Settings → API Keys → Create API Key
   - 选择 "Restricted Access"
   - 只开启 "Mail Send" 权限

3. **配置 Supabase**
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [你的 SendGrid API Key]
   Sender email: [你验证的发件人邮箱]
   Sender name: genRTL
   ```

#### 使用 AWS SES

1. **在 AWS Console 创建 SES**
   - 进入 AWS SES 控制台
   - 验证发件人邮箱或域名
   - 创建 SMTP 凭证

2. **配置 Supabase**
   ```
   Host: email-smtp.[region].amazonaws.com
   Port: 587
   Username: [AWS SMTP Username]
   Password: [AWS SMTP Password]
   Sender email: [验证的邮箱]
   Sender name: genRTL
   ```

### 方案 C：自定义邮件模板（优化用户体验）

1. **进入 Email Templates**
   - Supabase Dashboard → Authentication → Email Templates
   - 选择 "Magic Link" 模板

2. **自定义模板**
   ```html
   <h2>您的 genRTL 登录验证码</h2>
   
   <p>您好，</p>
   
   <p>您的登录验证码是：</p>
   
   <h1 style="font-size: 32px; font-family: monospace; letter-spacing: 8px; color: #4F46E5;">
     {{ .Token }}
   </h1>
   
   <p>此验证码将在 60 秒后过期。</p>
   
   <p>如果您没有请求此验证码，请忽略此邮件。</p>
   
   <hr>
   <p style="color: #666; font-size: 12px;">
     genRTL - AI-Powered RTL Development Assistant
   </p>
   ```

3. **测试邮件**
   - 保存模板
   - 使用登录页面测试发送

## 开发环境快速测试

如果只是开发测试，可以使用以下方式：

### 查看 Supabase 日志

1. Supabase Dashboard → Logs → Auth Logs
2. 查找 OTP 发送记录
3. 可能会在日志中看到生成的 OTP 代码

### 使用测试邮箱

某些测试邮箱服务不需要实际发送：
- Mailinator (mailinator.com)
- TempMail (temp-mail.org)
- 10MinuteMail (10minutemail.com)

**注意**：这些服务是公开的，不要用于生产环境！

## 常见问题

### Q: 为什么验证码总是"无效"？

A: 可能原因：
1. 验证码已过期（通常 60 秒）
2. 输入错误（检查是否有空格）
3. 邮箱大小写不匹配
4. 验证码已被使用（一次性）

### Q: 可以修改验证码有效期吗？

A: Supabase 默认 OTP 有效期为 60 秒，可以在 Dashboard → Authentication → Auth Settings 中调整 "OTP Expiry" 设置。

### Q: 生产环境建议使用哪个 SMTP 服务？

A: 推荐顺序：
1. **Resend** - 免费额度最高（3000/月），专为开发者设计
2. **AWS SES** - 价格最低，可靠性高，适合大规模
3. **SendGrid** - 功能丰富，但免费额度较少

### Q: 如何防止验证码滥用？

A: 实施以下策略：
1. 添加 reCAPTCHA 验证
2. IP 地址频率限制（Supabase 内置）
3. 同一邮箱限制请求间隔（60秒）
4. 监控异常请求模式

## 下一步

配置完成后：
1. 重启后端服务
2. 测试发送验证码
3. 检查邮件送达
4. 验证登录流程

遇到问题请查看：
- Supabase Dashboard → Logs
- genRTL-saas 后端日志
- 浏览器 Console

