# API 认证实现全面审查报告

## 执行日期
2025-11-26

## 审查范围
图片生成功能及相关的所有 API 端点

---

## 一、审查概述

### 需要认证的 API 端点分类

按照认证状态分为以下三类：
1. **已完全支持** Bearer Token + Cookie 双认证方式
2. **部分支持** 仅支持 Cookie（需要修改）
3. **不需要认证** 公开端点

---

## 二、详细审查结果

### 第一类：已完全支持 Bearer Token + Cookie 认证

#### 1. POST /api/jobs（创建任务）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\jobs\route.ts`
**行数**：45-66（POST 方法）、383-408（GET 方法）
**状态**：✅ 已修复

支持同时支持 Bearer token（移动端）和 Cookie（Web端）双认证方式。

---

#### 2. POST /api/upload/image（图片上传）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\upload\image\route.ts`
**行数**：7-26
**状态**：✅ 已修复

支持 Bearer Token 和 Cookie 双认证方式。

---

#### 3. GET /api/jobs（查询任务）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\jobs\route.ts`
**行数**：383-408
**状态**：✅ 已修复

与 POST /api/jobs 相同的双认证方式。

---

#### 4. GET /api/user/stats（用户统计）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\user\stats\route.ts`
**行数**：14-25
**状态**：✅ 已修复

使用统一的认证函数 `getAuthenticatedUser()`。

---

#### 5. GET /api/credits（信用点查询）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\credits\route.ts`
**行数**：14-25
**状态**：✅ 已修复

使用统一认证函数。

---

#### 6. GET /api/user（用户信息）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\user\route.ts`
**行数**：5-31
**状态**：✅ 已修复

支持 Bearer token。

---

#### 7. GET /api/user/generations（生成历史）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\user\generations\route.ts`
**行数**：12-20（GET）、51-59（DELETE）
**状态**：✅ 已修复

GET 和 DELETE 都支持 Bearer Token 和 Cookie。

---

### 第二类：部分支持（仅 Cookie）需要修改

#### 1. POST /api/upload/video（视频上传）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\upload\video\route.ts`
**行数**：31-36
**状态**：⚠️ 需要修改（高优先级）

---

#### 2. POST /api/jobs/long-video（长视频生成）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\jobs\long-video\route.ts`
**行数**：24-28、302-306、118
**状态**：⚠️ 需要修改（高优先级）

---

#### 3. DELETE /api/user（删除用户账户）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\user\delete\route.ts`
**行数**：4-10
**状态**：⚠️ 需要修改（高优先级）

---

#### 4. GET /api/credits/history（信用点历史）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\credits\history\route.ts`
**行数**：7-12
**状态**：⚠️ 需要修改（中优先级）

---

#### 5. POST /api/jobs/cleanup（任务清理）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\jobs\cleanup\route.ts`
**行数**：6-10
**状态**：⚠️ 需要修改（中优先级）

---

#### 6. GET /api/team（团队信息）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\team\route.ts`
**行数**：4-6
**状态**：⚠️ 需要修改（中优先级）

---

#### 7. GET /api/auth/status（认证状态）
**文件路径**：`d:\xroting\monna\monna-saas\app\api/auth/status/route.ts`
**行数**：7-9
**状态**：⚠️ 需要修改（中优先级）

---

#### 8. POST /api/auth/ensure-profile（确保用户 profile）
**文件路径**：`d:\xroting\monna\monna-saas\app\api/auth/ensure-profile/route.ts`
**行数**：10
**状态**：⚠️ 需要修改（中优先级）

---

#### 9. POST /api/community/likes（点赞社区分享）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\community\likes\route.ts`
**行数**：10-11
**状态**：⚠️ 需要修改（低优先级）

---

#### 10. POST /api/community/shares（创建社区分享）
**文件路径**：`d:\xroting\monna\monna-saas\app\api\community/shares/route.ts`
**行数**：217
**状态**：⚠️ 需要修改（低优先级）

---

### 第三类：不需要认证（公开端点）

#### 1. GET /api/community/shares（列出社区分享）
**文件路径**：`d:\xroting\monna\monna-saas\app\api/community/shares/route.ts`
**行数**：10-13
**状态**：✅ 正确（允许未登录用户浏览）

---

## 三、认证辅助函数

### 1. getAuthenticatedUser(req: NextRequest)
**文件路径**：`d:\xroting\monna\monna-saas\lib\supabase\auth-helper.ts`
**行数**：12-61
**状态**：✅ 完整实现

从请求中获取认证用户（支持 Bearer Token 和 Cookie）。

---

### 2. createAuthenticatedSupabaseFromRequest(req: NextRequest)
**文件路径**：`d:\xroting\monna\monna-saas\lib\supabase\auth-helper.ts`
**行数**：105-130
**状态**：✅ 完整实现

创建带有正确认证上下文的 Supabase 客户端。

---

## 四、需要修改的文件清单

### 高优先级（直接影响图片生成流程）

1. **app/api/upload/video/route.ts** - 第 29-36 行
   - 添加 Bearer Token 支持
   - 预期工作量：10 分钟

2. **app/api/jobs/long-video/route.ts** - 第 24-28、302-306、118 行
   - 添加 Bearer Token 支持（两处）
   - 更新 getUserTeamSubscriptionInfo 调用
   - 预期工作量：15 分钟

3. **app/api/user/delete/route.ts** - 第 4-10 行
   - 添加 Bearer Token 支持
   - 预期工作量：10 分钟

### 中优先级（数据查询相关）

4. **app/api/credits/history/route.ts** - 第 7-12 行
   - 使用新的认证函数
   - 预期工作量：5 分钟

5. **app/api/jobs/cleanup/route.ts** - 第 6-10 行
   - 添加 Bearer Token 支持
   - 预期工作量：10 分钟

6. **app/api/team/route.ts** - 第 4-6 行
   - 添加 Bearer Token 支持
   - 预期工作量：10 分钟

7. **app/api/auth/status/route.ts** - 第 7-9 行
   - 使用新的认证函数
   - 预期工作量：5 分钟

8. **app/api/auth/ensure-profile/route.ts** - 第 10 行
   - 添加 Bearer Token 支持
   - 预期工作量：10 分钟

### 低优先级（社区功能相关）

9. **app/api/community/likes/route.ts** - 第 10-11 行
   - 使用新的认证函数
   - 预期工作量：5 分钟

10. **app/api/community/shares/route.ts** - 第 12-13、217 行
    - 使用新的认证函数
    - 预期工作量：5 分钟

---

## 五、总结

### 认证支持现状：
- **完全支持（Bearer + Cookie）**：7 个端点
- **仅支持 Cookie，需要修改**：10+ 个端点
- **不需要认证**：1 个端点

### 关键文件已修复：
✅ app/api/jobs/route.ts - POST 和 GET 方法
✅ app/api/upload/image/route.ts - 图片上传
✅ app/api/user/stats/route.ts - 用户统计
✅ app/api/credits/route.ts - 信用点查询
✅ app/api/user/generations/route.ts - 生成历史
✅ app/api/user/route.ts - 用户信息

### 核心认证函数完整实现：
✅ getAuthenticatedUser() - 支持 Bearer + Cookie
✅ createAuthenticatedSupabaseFromRequest() - 返回正确的 Supabase 客户端

