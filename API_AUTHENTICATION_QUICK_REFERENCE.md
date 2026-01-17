# API 认证实现 - 快速参考指南

## 现状速览

### 已完全支持 Bearer Token (✅ 7 个端点)
```
✅ POST /api/jobs                    - 创建生成任务
✅ GET /api/jobs                     - 查询任务状态
✅ POST /api/upload/image            - 上传参考图片
✅ GET /api/user/stats               - 获取用户统计
✅ GET /api/credits                  - 查询信用点
✅ GET /api/user                     - 获取用户信息
✅ GET /api/user/generations         - 获取生成历史
✅ DELETE /api/user/generations      - 清理生成历史
```

### 需要修改 (⚠️ 10 个端点)

**高优先级** (3 个 - 影响核心功能):
```
⚠️ POST /api/upload/video           - 上传参考视频
⚠️ POST /api/jobs/long-video        - 长视频生成（3 处需要修改）
⚠️ DELETE /api/user                 - 删除账户
```

**中优先级** (5 个 - 数据查询):
```
⚠️ GET /api/credits/history         - 信用点历史
⚠️ POST /api/jobs/cleanup           - 任务清理
⚠️ GET /api/team                    - 团队信息
⚠️ GET /api/auth/status             - 认证状态
⚠️ POST /api/auth/ensure-profile    - 确保 profile
```

**低优先级** (2 个 - 社区功能):
```
⚠️ POST /api/community/likes        - 社区点赞
⚠️ POST /api/community/shares       - 社区分享
```

---

## 修改指南

### 选项 A: 标准双认证模式 (推荐)

适用于：大多数需要修改的端点

```typescript
// 第 1 步：添加必要的 import
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// 第 2 步：替换认证逻辑
// 旧代码:
const supa = await createSupabaseServer();
const { data: { user } } = await supa.auth.getUser();

// 新代码:
const authHeader = req.headers.get('authorization');
let user = null;
let supa;

if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.substring(7);
  const { createClient } = await import('@supabase/supabase-js');
  supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user: tokenUser } } = await supa.auth.getUser(token);
  user = tokenUser;
} else {
  supa = await createSupabaseServer();
  const { data: { user: cookieUser } } = await supa.auth.getUser();
  user = cookieUser;
}

if (!user) {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
```

**参考实现**：`app/api/jobs/route.ts` (第 45-66 行)

---

### 选项 B: 新认证函数模式 (简化)

适用于：可以使用新的认证函数的端点

```typescript
// 第 1 步：导入函数
import { getAuthenticatedUser, createAuthenticatedSupabaseFromRequest } 
  from "@/lib/supabase/auth-helper";

// 第 2 步：替换认证逻辑
const user = await getAuthenticatedUser(req);
if (!user) {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

const supa = await createAuthenticatedSupabaseFromRequest(req);
```

**参考实现**：`app/api/user/stats/route.ts` (第 14-25 行)

---

## 文件修改清单

### 第一步：高优先级 (30-40 分钟)

- [ ] **app/api/upload/video/route.ts**
  - 修改位置：第 29-36 行
  - 参考文件：`app/api/upload/image/route.ts` (第 7-26 行)
  - 采用：选项 A (标准双认证模式)

- [ ] **app/api/jobs/long-video/route.ts**
  - 修改位置：第 24-28 行 (POST method)
  - 修改位置：第 302-306 行 (GET method)
  - 修改位置：第 118 行 (getUserTeamSubscriptionInfo 调用)
  - 参考文件：`app/api/jobs/route.ts` (第 45-66 行)
  - 采用：选项 A (标准双认证模式)

- [ ] **app/api/user/delete/route.ts**
  - 修改位置：第 4-10 行
  - 参考文件：`app/api/upload/image/route.ts` (第 7-26 行)
  - 采用：选项 A (标准双认证模式)
  - 注意：修改函数签名为 `(request: NextRequest)`

---

### 第二步：中优先级 (40-50 分钟)

- [ ] **app/api/credits/history/route.ts**
  - 修改位置：第 7-12 行
  - 参考文件：`app/api/user/stats/route.ts` (第 14-25 行)
  - 采用：选项 B (新认证函数)

- [ ] **app/api/jobs/cleanup/route.ts**
  - 修改位置：第 6-10 行
  - 参考文件：`app/api/jobs/route.ts` (第 45-66 行)
  - 采用：选项 A (标准双认证模式)

- [ ] **app/api/team/route.ts**
  - 修改位置：第 4-6 行
  - 参考文件：`app/api/user/stats/route.ts` (第 14-25 行)
  - 采用：选项 B (新认证函数)
  - 注意：需要修改 `getTeamForUser()` 调用

- [ ] **app/api/auth/status/route.ts**
  - 修改位置：第 7-9 行
  - 参考文件：`app/api/user/route.ts` (第 6-7 行)
  - 采用：选项 B (新认证函数)

- [ ] **app/api/auth/ensure-profile/route.ts**
  - 修改位置：第 10 行
  - 参考文件：`app/api/jobs/route.ts` (第 45-66 行)
  - 采用：选项 A 或 B

---

### 第三步：低优先级 (10-15 分钟)

- [ ] **app/api/community/likes/route.ts**
  - 修改位置：第 10-11 行
  - 修改内容：替换 `getUser()` 为 `getAuthenticatedUser(request)`
  - 采用：选项 B

- [ ] **app/api/community/shares/route.ts**
  - 修改位置：第 13 行 (GET method)
  - 修改位置：第 217 行 (POST method)
  - 修改内容：替换 `getUser()` 为 `getAuthenticatedUser(request)`
  - 采用：选项 B

---

## 关键提示

### 修改前后对比

**修改前**（仅支持 Cookie）：
```typescript
const supa = await createSupabaseServer();
const { data: { user } } = await supa.auth.getUser();
if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
```

**修改后**（支持 Bearer + Cookie）：
```typescript
const authHeader = req.headers.get('authorization');
let user = null;
let supa;

if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.substring(7);
  const { createClient } = await import('@supabase/supabase-js');
  supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user: tokenUser } } = await supa.auth.getUser(token);
  user = tokenUser;
} else {
  supa = await createSupabaseServer();
  const { data: { user: cookieUser } } = await supa.auth.getUser();
  user = cookieUser;
}

if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
```

---

## 测试命令

### 1. Bearer Token 测试
```bash
ACCESS_TOKEN="your_supabase_token_here"
curl -X POST http://localhost:3005/api/upload/video \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@test_video.mp4"
```

### 2. Cookie 测试
```bash
curl -X POST http://localhost:3005/api/upload/video \
  --cookie "sb-session=your_session_cookie" \
  -F "file=@test_video.mp4"
```

### 3. 未认证测试（应返回 401）
```bash
curl -X POST http://localhost:3005/api/upload/video \
  -F "file=@test_video.mp4" \
  -v
```

---

## 完成检查清单

修复完成后验证：

- [ ] 所有 10 个文件都已修改
- [ ] 所有修改都支持 Bearer Token 认证
- [ ] 所有修改都保留 Cookie 认证兼容性
- [ ] 未认证请求返回 401 状态码
- [ ] 用户数据隔离正确（不能查看他人数据）
- [ ] 信用点扣费逻辑继续工作
- [ ] 错误消息对用户友好
- [ ] 日志记录完整
- [ ] 已更新 CHANGELOG.md
- [ ] 已提交 git commit

---

## 常见问题

### Q: Bearer Token 的格式是什么？
A: 格式为 `Authorization: Bearer {access_token}`，其中 access_token 是从 Supabase Auth 获取的 JWT 令牌。

### Q: 如何获取 Bearer Token 进行测试？
A: 在移动应用中使用 `supabase.auth.getSession()` 获取，Web 端通过 Cookie 处理。

### Q: 修改过程中需要改变其他代码吗？
A: 不需要。只需修改认证部分，业务逻辑保持不变。

### Q: 如何验证修改是否正确？
A: 使用上面的测试命令验证 Bearer Token、Cookie 和未认证三种情况。

### Q: 需要修改数据库模式吗？
A: 不需要。所有改动都是代码级别的。

---

## 文档位置

完整文档：
- `API_AUTHENTICATION_REVIEW.md` - 详细的审查报告
- `AUTHENTICATION_FIX_CHECKLIST.md` - 详细的修复清单
- `AUTHENTICATION_SUMMARY.txt` - 最终总结
- `API_AUTHENTICATION_QUICK_REFERENCE.md` - 本文件

