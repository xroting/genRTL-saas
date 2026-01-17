# API 认证修复检查清单

## 修复优先级和具体建议

### 第一阶段：高优先级修复（影响图片/视频生成核心功能）

#### 1. app/api/upload/video/route.ts
**优先级**：⭐⭐⭐ 高
**当前状态**：仅支持 Cookie
**需要修改**：第 29-36 行

#### 2. app/api/jobs/long-video/route.ts
**优先级**：⭐⭐⭐ 高
**当前状态**：仅支持 Cookie
**需要修改**：第 24-28、302-306、118 行

#### 3. app/api/user/delete/route.ts
**优先级**：⭐⭐⭐ 高
**当前状态**：仅支持 Cookie
**需要修改**：第 4-10 行

### 第二阶段：中优先级修复（数据查询相关）

#### 4. app/api/credits/history/route.ts
**优先级**：⭐⭐ 中
**当前状态**：仅支持 Cookie
**需要修改**：第 7-12 行

#### 5. app/api/jobs/cleanup/route.ts
**优先级**：⭐⭐ 中
**当前状态**：仅支持 Cookie
**需要修改**：第 6-10 行

#### 6. app/api/team/route.ts
**优先级**：⭐⭐ 中
**当前状态**：仅支持 Cookie
**需要修改**：第 4-6 行

#### 7. app/api/auth/status/route.ts
**优先级**：⭐⭐ 中
**当前状态**：仅支持 Cookie
**需要修改**：第 7-9 行

#### 8. app/api/auth/ensure-profile/route.ts
**优先级**：⭐⭐ 中
**当前状态**：仅支持 Cookie
**需要修改**：第 8-10 行

### 第三阶段：低优先级修复（社区功能）

#### 9. app/api/community/likes/route.ts
**优先级**：⭐ 低
**当前状态**：使用 getUser()
**需要修改**：第 10-11 行

#### 10. app/api/community/shares/route.ts
**优先级**：⭐ 低
**当前状态**：使用 getUser()
**需要修改**：第 13 行、第 217 行

## 修复模板

所有需要添加 Bearer Token 支持的端点都应采用以下标准模式：

```typescript
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

## 完成标志

- [ ] 所有 10 个文件都已修改
- [ ] 所有修改都支持 Bearer Token 和 Cookie 双认证
- [ ] 所有修改都通过测试
- [ ] 已更新 CHANGELOG.md
- [ ] 已提交 git commit

## 总体影响

修复完成后，所有图片生成相关的 API 端点都将完全支持：
- Web 端（Cookie 认证）
- 移动端（Bearer Token 认证）
- 跨平台无缝集成

