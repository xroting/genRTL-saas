# OAuth 登录配置指南

本指南将帮助您在 Supabase 中配置 Google 和 Apple OAuth 登录。

## 目录
1. [Google OAuth 配置](#google-oauth-配置)
2. [Apple OAuth 配置](#apple-oauth-配置)
3. [测试 OAuth 登录](#测试-oauth-登录)
4. [常见问题](#常见问题)

---

## Google OAuth 配置

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 在左侧菜单中选择 **APIs & Services** > **Credentials**

### 2. 配置 OAuth 同意屏幕

1. 点击 **OAuth consent screen** 标签
2. 选择 **External**（外部）用户类型
3. 填写必填信息：
   - **应用名称**：Monna AI
   - **用户支持电子邮件**：您的邮箱
   - **开发者联系信息**：您的邮箱
4. 点击 **Save and Continue**
5. 在 **Scopes** 页面，添加以下范围：
   - `email`
   - `profile`
6. 点击 **Save and Continue**
7. 在 **Test users** 页面（可选），添加测试用户
8. 点击 **Save and Continue** 完成设置

### 3. 创建 OAuth 2.0 客户端 ID

1. 返回 **Credentials** 标签
2. 点击 **Create Credentials** > **OAuth 2.0 Client ID**
3. 选择应用类型：**Web application**
4. 填写信息：
   - **名称**：Monna AI Web Client
   - **已获授权的 JavaScript 来源**：
     ```
     https://你的域名.com
     http://localhost:3005 （用于本地开发）
     ```
   - **已获授权的重定向 URI**：
     ```
     https://你的项目ID.supabase.co/auth/v1/callback
     http://localhost:54321/auth/v1/callback （用于本地开发）
     ```
5. 点击 **Create**
6. **重要**：保存 **Client ID** 和 **Client Secret**

### 4. 在 Supabase 中配置 Google OAuth

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择您的项目
3. 在左侧菜单中选择 **Authentication** > **Providers**
4. 找到 **Google** 并点击展开
5. 启用 Google 提供商
6. 填写信息：
   - **Client ID**：粘贴您从 Google Cloud Console 获得的 Client ID
   - **Client Secret**：粘贴您从 Google Cloud Console 获得的 Client Secret
7. 点击 **Save**

### 5. 获取 Supabase 回调 URL

在 Supabase 的 Google Provider 设置页面，您会看到 **Callback URL (for OAuth)**：
```
https://你的项目ID.supabase.co/auth/v1/callback
```

确保这个 URL 已经添加到 Google Cloud Console 的"已获授权的重定向 URI"列表中。

---

## Apple OAuth 配置

### 1. 创建 Apple Developer 账号

1. 访问 [Apple Developer](https://developer.apple.com/)
2. 注册或登录 Apple Developer 账号（需要付费订阅）

### 2. 创建 App ID

1. 登录 [Apple Developer Console](https://developer.apple.com/account/)
2. 选择 **Certificates, Identifiers & Profiles**
3. 点击 **Identifiers** > **+** 按钮
4. 选择 **App IDs** > **Continue**
5. 选择 **App** > **Continue**
6. 填写信息：
   - **Description**：Monna AI
   - **Bundle ID**：选择 **Explicit**，输入：`com.monna.ai`（或您的域名反向）
7. 在 **Capabilities** 中，勾选 **Sign In with Apple**
8. 点击 **Continue** > **Register**

### 3. 创建 Services ID

1. 返回 **Identifiers** 页面
2. 点击 **+** 按钮
3. 选择 **Services IDs** > **Continue**
4. 填写信息：
   - **Description**：Monna AI Web
   - **Identifier**：`com.monna.ai.web`（或类似）
5. 勾选 **Sign In with Apple**
6. 点击 **Configure** 按钮
7. 在弹出窗口中：
   - **Primary App ID**：选择您刚才创建的 App ID
   - **Domains and Subdomains**：添加您的域名和 Supabase 域名
     ```
     你的域名.com
     你的项目ID.supabase.co
     ```
   - **Return URLs**：
     ```
     https://你的项目ID.supabase.co/auth/v1/callback
     ```
8. 点击 **Save** > **Continue** > **Register**

### 4. 创建密钥（Key）

1. 在左侧菜单选择 **Keys**
2. 点击 **+** 按钮
3. 填写信息：
   - **Key Name**：Monna AI Sign In Key
4. 勾选 **Sign In with Apple**
5. 点击 **Configure**
6. 选择您的 **Primary App ID**
7. 点击 **Save** > **Continue** > **Register**
8. **重要**：下载密钥文件（`.p8`），这是唯一机会
9. 记录 **Key ID**

### 5. 在 Supabase 中配置 Apple OAuth

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择您的项目
3. 在左侧菜单中选择 **Authentication** > **Providers**
4. 找到 **Apple** 并点击展开
5. 启用 Apple 提供商
6. 填写信息：
   - **Services ID**：您在步骤 3 中创建的 Services ID（如：`com.monna.ai.web`）
   - **Team ID**：在 Apple Developer 页面右上角可以找到（10 个字符）
   - **Key ID**：您在步骤 4 中获得的 Key ID（10 个字符）
   - **Private Key**：打开下载的 `.p8` 文件，复制其中的内容（包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`）
7. 点击 **Save**

---

## 测试 OAuth 登录

### 本地测试

1. 确保您的 `.env.local` 文件包含正确的 Supabase 配置：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
   NEXT_PUBLIC_SITE_URL=http://localhost:3005
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 访问 `http://localhost:3005/sign-in`

4. **勾选"我已阅读并同意用户协议和隐私政策"复选框**

5. 点击 **Google** 或 **Apple** 登录按钮

6. 完成 OAuth 流程后，您应该被重定向回应用并自动登录

### 生产环境测试

1. 确保您的环境变量正确设置：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
   NEXT_PUBLIC_SITE_URL=https://你的域名.com
   ```

2. 部署到 Vercel 或其他平台

3. 访问您的登录页面

4. **勾选同意协议复选框**

5. 测试 OAuth 登录

---

## 常见问题

### Q1: 按钮显示为灰色，无法点击

**A:** 这是正常的！您需要先勾选"我已阅读并同意用户协议和隐私政策"复选框，Google 和 Apple 登录按钮才会启用。这是为了确保用户同意服务条款。

勾选后：
- ✅ 协议框会变成绿色背景
- ✅ OAuth 按钮会变成可点击状态
- ✅ Google 按钮会显示彩色图标
- ✅ Apple 按钮会变成黑色背景

### Q2: 点击登录按钮后报错 "Invalid OAuth Configuration"

**A:** 这通常意味着 Supabase 中的 OAuth 配置不正确。请检查：
- Client ID/Services ID 是否正确
- Client Secret/Private Key 是否正确
- 回调 URL 是否匹配

### Q3: Google OAuth 报错 "redirect_uri_mismatch"

**A:** 这意味着回调 URL 不匹配。确保：
1. 在 Google Cloud Console 的"已获授权的重定向 URI"中添加了 Supabase 的回调 URL
2. URL 格式正确（不要有多余的斜杠或空格）
3. 使用的是 HTTPS（生产环境）

### Q4: Apple OAuth 报错 "invalid_client"

**A:** 检查以下内容：
1. Services ID 是否正确
2. Team ID 是否正确（10 个字符）
3. Key ID 是否正确（10 个字符）
4. Private Key 是否完整（包括头尾）
5. 在 Apple Developer Console 中的 Return URLs 是否正确

### Q5: 登录成功但没有创建用户数据

**A:** 检查 Supabase 的回调处理：
1. 查看 `app/auth/callback/route.ts` 的日志
2. 确保 `SUPABASE_SERVICE_ROLE_KEY` 环境变量已设置
3. 检查数据库的 RLS 策略是否正确

### Q6: 本地开发时 OAuth 登录失败

**A:** 确保：
1. 在 Google/Apple 配置中添加了 `localhost` 的回调 URL
2. 使用正确的端口（如 `http://localhost:3005`）
3. `.env.local` 中的 `NEXT_PUBLIC_SITE_URL` 指向本地地址

### Q7: 如何调试 OAuth 问题？

**A:** 查看以下日志：
1. 浏览器控制台（Console）
2. 服务器终端输出
3. Supabase Dashboard > Logs > Auth Logs
4. Network 标签（查看请求和响应）

---

## 环境变量清单

确保以下环境变量已正确设置：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site URL（本地开发）
NEXT_PUBLIC_SITE_URL=http://localhost:3005

# Site URL（生产环境）
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## 测试检查清单

- [ ] Google OAuth Provider 在 Supabase 中已启用
- [ ] Apple OAuth Provider 在 Supabase 中已启用
- [ ] Google Cloud Console 中配置了正确的回调 URL
- [ ] Apple Developer Console 中配置了正确的 Return URL
- [ ] 环境变量已正确设置
- [ ] 协议复选框可以正常勾选
- [ ] 勾选协议后 OAuth 按钮变为可用状态
- [ ] Google 登录流程完整（能跳转、能回调、能创建用户）
- [ ] Apple 登录流程完整（能跳转、能回调、能创建用户）
- [ ] 登录后正确重定向到 `/generate` 页面

---

## 需要帮助？

如果遇到其他问题，请查看：
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In 文档](https://developer.apple.com/sign-in-with-apple/)

或联系技术支持团队。

