# 🔧 Supabase 密码重置配置指南

## 🎯 问题描述

点击密码重置邮件链接后，页面跳转到首页而不是重置密码页面。

## ✅ 解决方案

### 步骤 1: 配置 Supabase Redirect URLs

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 前往 **Authentication** → **URL Configuration**
4. 在 **Redirect URLs** 部分添加：

   **开发环境**:
   ```
   http://localhost:3005/auth/callback
   ```

   **生产环境**:
   ```
   https://www.monna.us/auth/callback
   ```

5. 点击 **Save** 保存配置

### 步骤 2: 验证 Site URL

确保 **Site URL** 设置正确：

**开发环境**:
```
http://localhost:3005
```

**生产环境**:
```
https://www.monna.us
```

### 步骤 3: 测试密码重置

1. 访问 http://localhost:3005/forgot-password
2. 输入您的邮箱
3. 检查邮箱收到重置邮件
4. 点击邮件中的 "Reset Password" 链接
5. 应该会跳转到重置密码页面（而不是首页）

---

## 🔍 技术细节

### 为什么不能直接重定向到 /reset-password？

Supabase 的密码重置流程需要两步：

1. **Code Exchange**: 将邮件中的 `code` 换取 session
2. **Redirect**: 在已登录状态下重定向到重置页面

如果直接重定向到 `/reset-password`，会缺少第一步，导致用户未登录，无法更新密码。

### 正确的流程

```
用户点击邮件链接
  ↓
https://www.monna.us/auth/callback?code=xxx&type=recovery
  ↓
auth/callback 检测 type=recovery
  ↓
exchangeCodeForSession(code) - 创建 session
  ↓
redirect to /reset-password (用户已登录)
  ↓
用户可以安全地更新密码
```

### 错误的流程（直接重定向）

```
用户点击邮件链接
  ↓
https://www.monna.us/reset-password?code=xxx
  ↓
reset-password 页面尝试验证令牌
  ↓
getSession() 返回 null（用户未登录）
  ↓
显示错误或重定向到首页 ❌
```

---

## 📋 代码改动说明

### 1. auth/callback/route.ts

添加了密码重置检测逻辑：

```typescript
// 检测密码重置类型
const type = searchParams.get('type')

// 处理密码重置回调
if (type === 'recovery' && code) {
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (!error) {
    return NextResponse.redirect(`${baseUrl}/reset-password`)
  }
}
```

### 2. forgot-password/page.tsx

修改了 `redirectTo` 参数：

```typescript
// ❌ 错误（之前）
redirectTo: `${baseUrl}/reset-password`

// ✅ 正确（现在）
redirectTo: `${baseUrl}/auth/callback`
```

---

## 🧪 验证清单

配置完成后，请验证以下几点：

- [ ] Supabase Redirect URLs 包含 `/auth/callback`
- [ ] Site URL 配置正确
- [ ] 忘记密码功能可以发送邮件
- [ ] 点击邮件链接跳转到重置密码页面（不是首页）
- [ ] 可以在重置页面成功修改密码
- [ ] 修改后可以用新密码登录

---

## ⚠️ 常见错误

### 错误 1: Redirect URL 未配置

**现象**: 点击邮件链接后显示错误页面
**解决**: 在 Supabase Dashboard 添加 `/auth/callback` 到 Redirect URLs

### 错误 2: 使用了错误的 redirectTo

**现象**: 跳转到首页或重置页面显示"令牌无效"
**解决**: 确保 `forgot-password/page.tsx` 中使用 `/auth/callback`

### 错误 3: 本地开发使用了生产 URL

**现象**: 本地测试时跳转到生产环境
**解决**: 确保 `.env.local` 中设置了正确的 `NEXT_PUBLIC_SITE_URL`

---

## 📞 需要帮助？

如果配置后仍然有问题：

1. 检查浏览器控制台的错误信息
2. 查看 Supabase Dashboard → Logs → Auth Logs
3. 确认邮件链接的 URL 参数是否包含 `code` 和 `type=recovery`
4. 验证 `/auth/callback` 路由是否正常工作

---

**配置时间**: 约 5 分钟
**生效**: 立即生效，无需重启应用
