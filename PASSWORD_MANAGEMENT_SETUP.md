# 密码管理功能配置文档

## 📋 功能概览

本项目已实现完整的密码管理功能，包括：
- ✅ 忘记密码
- ✅ 重置密码
- ✅ 修改密码（用户设置）
- ✅ 密码强度指示器
- ✅ 实时密码验证

---

## 🗂️ 文件结构

```
app/
├── sign-in/
│   └── page.tsx                          # 登录页面入口
├── sign-up/
│   └── page.tsx                          # 注册页面入口
├── forgot-password/
│   └── page.tsx                          # 忘记密码页面
├── reset-password/
│   └── page.tsx                          # 重置密码页面（邮件链接跳转）
├── (dashboard)/
│   └── settings/
│       └── change-password/
│           └── page.tsx                  # 修改密码页面（已登录用户）
└── (login)/
    ├── login.tsx                          # 登录/注册组件
    └── actions.ts                         # 认证相关 Server Actions
```

---

## 🔄 功能流程

### 1. 忘记密码流程

```
用户访问登录页面
  ↓
点击"忘记密码？"链接
  ↓
跳转到 /forgot-password
  ↓
输入邮箱地址
  ↓
Supabase 发送重置邮件
  ↓
用户收到邮件并点击链接
  ↓
跳转到 /reset-password（带令牌）
  ↓
验证令牌有效性
  ↓
输入新密码（带强度指示）
  ↓
确认新密码
  ↓
更新密码成功
  ↓
自动跳转到 /sign-in
```

### 2. 修改密码流程（已登录用户）

```
用户登录后访问设置页面
  ↓
点击"修改密码"选项
  ↓
跳转到 /dashboard/settings/change-password
  ↓
输入当前密码（验证身份）
  ↓
输入新密码（带强度指示）
  ↓
确认新密码
  ↓
验证通过后更新密码
  ↓
自动返回设置页面
```

---

## 🎨 UI 特性

### 密码强度指示器

所有密码输入页面都包含实时密码强度检测：

| 强度 | 条件 | 颜色 |
|------|------|------|
| 太弱 | < 8 字符 | 🔴 红色 |
| 弱 | 8+ 字符 | 🔴 红色 |
| 中等 | 8+ 字符 + 部分复杂性 | 🟡 黄色 |
| 强 | 12+ 字符 + 大小写 + 数字 | 🔵 蓝色 |
| 很强 | 12+ 字符 + 大小写 + 数字 + 特殊字符 | 🟢 绿色 |

### 密码要求提示

- ✅ 至少 8 个字符（必需）
- 📝 包含大小写字母（推荐）
- 📝 包含数字（推荐）
- 📝 包含特殊字符（推荐）

---

## 🔐 安全特性

### 1. 令牌验证
- 重置密码链接有效期：1 小时
- 自动检测过期令牌
- 防止重复使用令牌

### 2. 密码验证
- 客户端实时验证
- 服务端二次验证
- 新旧密码不能相同
- 两次密码必须匹配

### 3. 身份验证
- 修改密码需验证当前密码
- 重置密码需邮箱验证
- 所有操作记录日志

---

## ⚙️ Supabase 配置

### 必需配置

1. **Email Templates**
   在 Supabase Dashboard → Authentication → Email Templates 中配置：

   - **Reset Password Template**:
     确保包含 `{{ .ConfirmationURL }}` 变量

2. **Redirect URLs**
   在 Supabase Dashboard → Authentication → URL Configuration 中添加：

   **⚠️ 重要**：必须使用 `/auth/callback` 而不是直接跳转到 `/reset-password`

   ```
   开发环境:
   http://localhost:3005/auth/callback

   生产环境:
   https://www.monna.us/auth/callback
   ```

   系统会自动检测密码重置类型（`type=recovery`）并重定向到正确的页面。

3. **Site URL**
   设置为您的应用主域名：
   ```
   https://www.monna.us
   ```

### 工作原理

密码重置流程：
```
用户点击邮件链接
  ↓
Supabase 生成带有 code 和 type=recovery 的链接
  ↓
链接指向 /auth/callback?code=xxx&type=recovery
  ↓
callback 检测 type=recovery 参数
  ↓
交换 code 获取 session
  ↓
自动重定向到 /reset-password
  ↓
用户在已登录状态下设置新密码
```

---

## 📝 环境变量

确保以下环境变量已配置：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://www.monna.us
```

---

## 🧪 测试步骤

### 测试忘记密码

1. 访问 http://localhost:3005/sign-in
2. 点击"忘记密码？"
3. 输入注册邮箱
4. 检查邮箱收到重置邮件
5. 点击邮件中的链接
6. 在重置页面输入新密码
7. 验证能用新密码登录

### 测试修改密码

1. 登录账户
2. 访问 /dashboard/settings
3. 点击"修改密码"（需添加入口）
4. 或直接访问 /dashboard/settings/change-password
5. 输入当前密码
6. 设置新密码
7. 确认修改
8. 登出并用新密码重新登录

### 测试密码强度

1. 在任意密码输入页面
2. 输入弱密码（如 "12345678"）
3. 观察强度显示为"弱"（红色）
4. 输入强密码（如 "Test@Pass123"）
5. 观察强度显示为"强"（蓝色/绿色）

---

## ⚠️ 常见问题

### Q: 为什么重置密码后跳转到 404？

A: 确保已创建 `/sign-in/page.tsx` 文件：

```tsx
import { Login } from '../(login)/login';

export default function SignInPage() {
  return <Login mode="signin" />;
}
```

### Q: 点击邮件链接后跳转到首页，没有显示重置密码页面？

A: 这是 Redirect URL 配置错误导致的。请确保：
1. 在 Supabase Dashboard → Authentication → URL Configuration 中
2. Redirect URLs 设置为 `http://localhost:3005/auth/callback`（开发）或 `https://www.monna.us/auth/callback`（生产）
3. **不要**直接设置为 `/reset-password`
4. 系统会自动检测 `type=recovery` 参数并重定向

### Q: 收不到重置密码邮件？

A: 检查以下几点：
1. Supabase Email Templates 是否正确配置
2. SMTP 设置是否正确（生产环境需要自定义 SMTP）
3. 检查垃圾邮件文件夹
4. 确认邮箱地址正确

### Q: 重置链接提示已过期？

A: 重置链接有效期为 1 小时。如果过期：
1. 返回 /forgot-password
2. 重新申请密码重置
3. 在 1 小时内完成重置

### Q: 如何自定义密码强度规则？

A: 编辑 `getPasswordStrength` 函数：

```typescript
// 在 reset-password/page.tsx 或 change-password/page.tsx 中
const getPasswordStrength = (pwd: string) => {
  // 自定义规则...
};
```

---

## 🔗 相关文件

| 功能 | 文件路径 | 说明 |
|------|---------|------|
| 登录页面 | `app/sign-in/page.tsx` | 登录入口 |
| 注册页面 | `app/sign-up/page.tsx` | 注册入口 |
| 忘记密码 | `app/forgot-password/page.tsx` | 发送重置邮件 |
| 重置密码 | `app/reset-password/page.tsx` | 设置新密码 |
| 修改密码 | `app/(dashboard)/settings/change-password/page.tsx` | 已登录用户修改密码 |
| 登录组件 | `app/(login)/login.tsx` | 共享的登录/注册组件 |
| 认证逻辑 | `app/(login)/actions.ts` | Server Actions |

---

## 📞 技术支持

如遇到问题：
1. 检查浏览器控制台错误
2. 查看 Supabase Dashboard 日志
3. 确认环境变量配置正确
4. 参考本文档的常见问题部分

---

**最后更新**: 2025-11-27
**版本**: 1.0.0
