# genRTL-SaaS - 开发变更日志

本文档记录了 genRTL-SaaS 项目的所有重要功能开发、修复和优化。

---

## 2026-02-07

### ⚡ Chat API 性能优化 - LM 响应延迟监控与优化

**更新日期**: 2026-02-07

**问题背景**:
前端测试发现 LM 模型在输出工具调用时存在明显延迟问题：模型快速输出工具名称和文件路径后，停顿约 40 秒才开始输出代码内容。经过分析，这主要是 Claude Sonnet 4 在生成大型工具参数（如完整文件内容）时的内在特性。

**分析结果**:
- Claude Sonnet 4 在 `content_block_start` 时快速输出工具名称
- 但在生成完整的 `input_json` 参数时会暂停思考和规划
- 特别是对于 `rewrite_file` 这样需要生成 3000+ tokens 代码的工具
- 日志显示输出 3406 tokens 用时 42 秒，平均每秒约 81 tokens（低于理论吞吐量）

**优化措施**:

#### 1. 添加详细的性能监控日志

**修改文件**: `app/api/chat/route.ts` (line 333-511)

**实现内容**:
- ✅ 记录流开始时间戳
- ✅ 自动检测超过 2 秒的异常延迟
- ✅ 监控工具名称输出和首个 JSON delta 之间的延迟
- ✅ 统计总 chunk 数量和平均延迟
- ✅ 输出完整的性能摘要报告

**日志示例**:
```
🔧 [chat_xxx] Tool call: rewrite_file [+234ms from stream start]
📊 [chat_xxx] First JSON delta for rewrite_file: +38456ms after tool name
⏱️ [chat_xxx] ⚠️ Delay detected: 3542ms since last event
🏁 [chat_xxx] Content block stopped: tool=rewrite_file, chunks=342 [+42134ms]
⏱️ [chat_xxx] Performance: total_time=42134ms, chunks=342, avg=123ms/chunk
```

#### 2. 优化 System Prompt - 引导流式输出

**修改文件**: `app/api/chat/route.ts` (line 27-58)

**新增指导内容**:
```typescript
**IMPORTANT - Streaming Optimization**: 
When using tools that generate large content (like rewrite_file, create_file_or_folder with code):
1. Start streaming the tool arguments IMMEDIATELY after determining the tool name and file path
2. Generate and stream code line by line as you think, without planning the entire file first
3. Think incrementally: write each line/block, then immediately continue to the next
4. Do NOT pause to mentally compose the full file before streaming - start streaming right away
5. Your streaming speed directly impacts user experience - prioritize rapid, continuous output
```

**效果**: 引导模型更快地开始流式输出，减少规划延迟。

#### 3. 代理配置监控与日志增强

**修改文件**: `app/api/chat/route.ts` (line 275-288)

**实现内容**:
- ✅ 显示是否使用代理
- ✅ 警告代理可能导致的额外延迟
- ✅ 区分直连和代理连接

**日志示例**:
```
🌐 [chat_xxx] Using proxy: http://proxy.example.com:8080
⚠️ [chat_xxx] Note: Proxy may introduce additional latency in streaming responses
```

或
```
✅ [chat_xxx] Direct connection to Anthropic API (no proxy)
```

#### 4. 灵活的模型选择 - 支持性能测试

**修改文件**: `app/api/chat/route.ts` (line 12-25)

**实现内容**:
- ✅ 支持通过 `FORCE_CHAT_MODEL` 环境变量强制指定模型
- ✅ 用于性能对比测试和故障排除

**使用方法**:
```bash
# 在 .env.local 中设置
FORCE_CHAT_MODEL=claude-3-5-sonnet-20241022
```

#### 5. 性能测试文档

**新增文件**: `PERFORMANCE_TESTING.md`

**内容包括**:
- 性能监控功能使用说明
- 延迟诊断步骤
- 性能基准参考数据
- 故障排除指南
- 优化建议

**关键指标**:
- Claude Sonnet 4 理论吞吐: ~100-150 tokens/秒
- 简单任务首次输出延迟: 500-2000ms
- 复杂工具参数延迟: 2000-5000ms（已知问题）

**总结**:

此次优化主要解决了以下问题：

1. **可观测性**: 添加了完整的性能监控日志，可以精确定位延迟发生的位置
2. **模型优化**: 通过 system prompt 引导模型优先考虑流式输出速度
3. **网络诊断**: 监控代理使用情况，识别网络导致的延迟
4. **灵活性**: 支持环境变量控制模型选择，方便性能测试和对比

**已知限制**:

Claude Sonnet 4 在生成大型 JSON 参数时的规划延迟是模型的内在特性，system prompt 优化只能有限改善。如果延迟仍然影响用户体验，建议：

1. 在前端添加"AI 正在思考"的进度提示
2. 将大文件生成拆分为多个小任务
3. 考虑使用响应更快的模型（如 Claude 3.5 Sonnet）

**状态**: ✅ 已完成

---

## 2026-02-04

### 🔒 安全审计与修复（第二轮）- API费用保护、日志安全与CORS限制

**更新日期**: 2026-02-04 (下午)

**问题背景**:
第二轮安全审计发现了4个安全问题,涉及API费用滥用、配置泄露、日志安全和CORS配置:

1. **翻译接口未鉴权** - Gemini API费用被刷、配额耗尽
2. **环境变量枚举接口** - 配置信息泄露
3. **聊天接口日志暴露敏感信息** - Token泄露、内容暴露
4. **CORS配置过于宽松** - 允许任意源访问API

**修复详情**:

#### 1. 删除未鉴权的翻译接口

**问题**: `/api/translate` 无鉴权调用 Gemini 进行翻译,任何人可刷量。

**修复**:
- ❌ **删除** `app/api/translate/route.ts` 翻译接口
- 理由: 
  - 无业务需求支撑(镜头翻译已在前端处理)
  - 成本高昂且易被滥用
  - Gemini API有严格的配额限制

**影响**: 防止API费用被恶意刷取,保护Gemini配额。

#### 2. 环境变量枚举接口保护

**问题**: `/api/test-env` 返回所有 `NEXT_PUBLIC_*` 环境变量,包括 Supabase anon key。

**修复**:
- ✅ 添加 `verifyDebugAccess()` 访问控制
- ✅ 脱敏处理: 长字符串显示首尾,隐藏中间部分
- ✅ 三层保护机制(环境开关 + 生产禁用 + 管理员验证)

**修改文件**:
- `app/api/test-env/route.ts` - 添加访问控制和脱敏处理

```typescript
// 脱敏处理
if (value && value.length > 20) {
  acc[key] = value.substring(0, 10) + '...' + value.substring(value.length - 5);
}
```

#### 3. 聊天接口日志安全清理

**问题**: 
- 日志打印 Bearer token 前 50 位
- 日志打印完整消息结构和工具参数
- 可能通过日志系统泄露敏感信息

**修复**:
- ✅ 移除所有 token 打印
- ✅ 使用 `requestId` 替代详细内容追踪
- ✅ 仅记录必要的元数据(角色序列、token数量、成本)
- ✅ 不再打印完整消息内容和工具参数

**修改文件**:
- `app/api/chat/route.ts` - 清理所有敏感日志,添加 requestId 追踪

**修改示例**:
```typescript
// 修改前
console.log(`[Auth Debug] Token received (first 50 chars): ${token.substring(0, 50)}...`);
console.log(`Raw client tool (first):`, JSON.stringify(tools[0], null, 2));

// 修改后
const requestId = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
console.log(`[${requestId}] [Auth] Token authentication attempt, length: ${token.length}`);
console.log(`[${requestId}] Tool names: ${mergedTools.map(t => t.name).join(', ')}`);
```

#### 4. CORS安全配置限制

**问题**: 多个端点使用 `Access-Control-Allow-Origin: *`,允许任意源访问。

**影响端点**:
- `/api/chat`
- `/api/auth/signup`
- `/api/auth/verify-otp`

**修复**:
- ✅ 创建统一的 CORS 安全配置模块
- ✅ 限制允许的源域名列表
- ✅ 动态设置 `Access-Control-Allow-Origin`
- ✅ 添加 `Vary: Origin` header

**新增文件**:
- `lib/security/cors.ts` - CORS 安全配置模块

**允许的源域名**:
```typescript
const ALLOWED_ORIGINS = [
  // 生产域名
  'https://www.monna.us',
  'https://monna.us',
  'https://www.genrtl.com',
  'https://genrtl.com',
  
  // Vercel 预览部署
  /^https:\/\/.*\.vercel\.app$/,
  
  // 本地开发
  'http://localhost:3000',
  'http://localhost:3005',
];
```

**修改文件**:
- `lib/security/cors.ts` - 新建 CORS 配置模块
- `app/api/chat/route.ts` - 使用 `getCorsHeaders()`
- `app/api/auth/signup/route.ts` - 使用 `getCorsHeaders()`
- `app/api/auth/verify-otp/route.ts` - 使用 `getCorsHeaders()`

**技术实现**:
```typescript
// 动态CORS headers
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const isAllowed = isOriginAllowed(requestOrigin);
  
  if (isAllowed && requestOrigin) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    };
  }
  
  return {}; // 不允许的来源
}
```

**安全影响评估**:

| 问题 | 修复前严重程度 | 修复后状态 | 影响 |
|------|--------------|-----------|------|
| 翻译接口未鉴权 | 🟡 中危 | ✅ 已删除 | 完全消除API费用滥用风险 |
| 环境变量枚举 | 🟡 中危 | ✅ 已保护 | 防止配置泄露 |
| 日志暴露敏感信息 | 🟠 高危 | ✅ 已清理 | 防止token和内容泄露 |
| CORS配置宽松 | 🟡 中危 | ✅ 已限制 | 缩小攻击面 |

**部署验证**:

```bash
# 1. 验证翻译接口已删除
curl https://your-domain.com/api/translate
# 应该返回: 404 Not Found

# 2. 验证环境变量接口保护
curl https://your-domain.com/api/test-env
# 应该返回: 403 Access denied

# 3. 检查聊天日志不再包含敏感信息
# 查看 Vercel logs,确认无 token 打印

# 4. 验证CORS限制
curl -H "Origin: https://malicious-site.com" https://your-domain.com/api/chat
# 应该没有 Access-Control-Allow-Origin header
```

**状态**: ✅ 已完成

---

### 🔒 安全审计与修复（第一轮）- Webhook 签名验证与调试端点保护

**更新日期**: 2026-02-04 (上午)

**问题背景**:
代码审计发现了4个严重的安全漏洞，可能导致订阅伪造、积分篡改、数据泄露和未授权访问:

1. **订阅回调缺少签名校验** - 攻击者可伪造 Apple/Google Play 订阅事件
2. **调试接口公开** - 使用 Service Role 无鉴权访问全表数据
3. **Inngest 调试端点暴露** - 暴露密钥配置且禁用签名验证
4. **测试支付接口公开** - 无鉴权创建 Stripe Checkout Session

**修复详情**:

#### 1. Apple App Store Webhook 签名验证

**问题**: 仅使用 `decodeJwt` 解码 JWT，未验证签名，攻击者可伪造订阅续费/退款事件。

**修复**:
- 创建 `lib/security/webhook-verification.ts` 安全验证模块
- 使用 Apple JWKS (https://appleid.apple.com/auth/keys) 验证 JWT 签名
- 验证 `signedPayload`, `signedTransactionInfo`, `signedRenewalInfo` 所有签名字段
- 签名验证失败时拒绝处理并抛出错误

**修改文件**:
- `lib/security/webhook-verification.ts` - 新建签名验证工具
- `lib/mobile-subscriptions/apple-store.ts` - 更新 `decodeSignedTransaction()` 和 `decodeSignedPayload()` 方法使用签名验证
- `app/api/webhooks/apple/route.ts` - 添加 `signedTransactionInfo` 和 `signedRenewalInfo` 签名验证

```typescript
// 验证 Apple JWT 签名示例
export async function verifyAppleJWT(signedToken: string): Promise<any> {
  const JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
  const { payload } = await jwtVerify(signedToken, JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: process.env.APPLE_BUNDLE_ID,
  });
  return payload;
}
```

#### 2. Google Play RTDN Webhook 签名验证

**问题**: 未验证 Pub/Sub Push 请求的 JWT Authorization Bearer token，攻击者可伪造 Google Play 通知。

**修复**:
- 验证 `Authorization: Bearer` header 中的 JWT token
- 使用 Google OAuth2 JWKS 验证签名
- 验证 `iss` (issuer) 和 `email` (service account) 字段
- 签名验证失败时返回 401 Unauthorized

**修改文件**:
- `lib/security/webhook-verification.ts` - 添加 `verifyGooglePubSubToken()` 方法
- `app/api/webhooks/google-play/route.ts` - 添加 Pub/Sub JWT 验证

```typescript
// 验证 Google Pub/Sub token 示例
export async function verifyGooglePubSubToken(authHeader: string): Promise<boolean> {
  const token = authHeader.replace('Bearer ', '');
  const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ['accounts.google.com', 'https://accounts.google.com'],
  });
  return payload.email === 'google-play-developer-notifications@system.gserviceaccount.com';
}
```

#### 3. 调试接口访问控制

**问题**: 
- `app/api/community/debug/route.ts` - 使用 Service Role 无鉴权读取全表
- `app/api/inngest-debug/route.ts` - 暴露环境变量和密钥前缀
- `app/api/inngest-test/route.ts` - 禁用 Inngest 签名验证

**修复**:
- 创建 `verifyDebugAccess()` 统一验证函数
- **三层保护机制**:
  1. 环境变量开关: `ENABLE_DEBUG_ENDPOINTS=true` (默认 false)
  2. 生产环境强制禁用: `NODE_ENV=production && VERCEL_ENV=production`
  3. 管理员权限验证: 检查用户 role 是否为 `admin` 或 `super_admin`
- 所有调试端点添加访问验证，未授权返回 403 Forbidden

**修改文件**:
- `lib/security/webhook-verification.ts` - 添加 `verifyDebugAccess()` 方法
- `app/api/community/debug/route.ts` - 添加访问控制
- `app/api/inngest-debug/route.ts` - 添加访问控制
- `app/api/inngest-test/route.ts` - 完全禁用端点，返回 410 Gone 并提示使用正式端点

```typescript
// 调试端点访问验证示例
export async function verifyDebugAccess(request: Request) {
  // 1. 检查环境变量开关
  if (process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return { allowed: false, reason: 'Debug endpoints are disabled' };
  }
  
  // 2. 生产环境强制禁用
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return { allowed: false, reason: 'Not available in production' };
  }
  
  // 3. 验证管理员权限
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { allowed: false, reason: 'Admin access required' };
  }
  
  return { allowed: true };
}
```

#### 4. 测试支付接口保护

**问题**:
- `app/api/test-stripe-config/route.ts` - 无鉴权创建多个 Stripe Checkout Session
- `app/api/test-alipay/route.ts` - 无鉴权创建 Stripe Checkout Session

**修复**:
- 添加与调试端点相同的访问控制机制
- 需要环境变量开关 + 管理员权限
- 生产环境强制禁用

**修改文件**:
- `app/api/test-stripe-config/route.ts` - 添加 `verifyDebugAccess()` 验证
- `app/api/test-alipay/route.ts` - 添加 `verifyDebugAccess()` 验证

#### 5. 环境变量配置更新

**修改文件**:
- `.env.example` - 添加移动订阅和安全配置说明

```bash
# Mobile Subscriptions
APPLE_KEY_ID=***
APPLE_ISSUER_ID=***
APPLE_PRIVATE_KEY=***
APPLE_BUNDLE_ID=com.monna.ai
APPLE_SHARED_SECRET=***
GOOGLE_PLAY_PACKAGE_NAME=com.monna.ai
GOOGLE_PLAY_SERVICE_ACCOUNT={"type":"service_account",...}

# Security & Debug (Development Only)
# ⚠️ NEVER set to 'true' in production
ENABLE_DEBUG_ENDPOINTS=false
```

**安全影响评估**:

| 漏洞 | 严重程度 | 影响 | 修复状态 |
|------|---------|------|---------|
| Apple Webhook 未验证签名 | 🔴 严重 | 订阅伪造、积分篡改、财务损失 | ✅ 已修复 |
| Google Play Webhook 未验证签名 | 🔴 严重 | 订阅伪造、积分篡改、财务损失 | ✅ 已修复 |
| 调试接口无鉴权 | 🔴 严重 | 数据泄露、RLS 策略暴露 | ✅ 已修复 |
| Inngest 端点暴露 | 🟠 高危 | 配置泄露、未授权任务触发 | ✅ 已修复 |
| 测试支付接口公开 | 🟡 中危 | 资源滥用、日志污染、费用异常 | ✅ 已修复 |

**测试验证**:

```bash
# 1. 验证 Apple Webhook 签名验证
# 使用无效签名的 JWT 应返回错误并拒绝处理

# 2. 验证 Google Play Webhook Pub/Sub 验证
# 缺少或无效的 Authorization header 应返回 401

# 3. 验证调试端点访问控制
# 未设置 ENABLE_DEBUG_ENDPOINTS 应返回 403
# 非管理员用户应返回 403
# 生产环境应强制禁用

# 4. 验证测试支付接口保护
# 与调试端点相同的验证逻辑
```

**部署注意事项**:

1. **环境变量配置**:
   - 确保生产环境 `ENABLE_DEBUG_ENDPOINTS` 未设置或设为 `false`
   - 配置 Apple 和 Google Play 认证密钥

2. **测试流程**:
   - 在预览环境测试所有 webhook 签名验证
   - 验证调试端点在生产环境完全禁用
   - 测试真实的 Apple/Google Play 订阅事件

3. **监控与告警**:
   - 监控 webhook 签名验证失败率
   - 监控未授权的调试端点访问尝试
   - 设置异常订阅事件告警

**依赖更新**:
```json
{
  "jose": "^5.x" // JWT 验证和签名
}
```

**参考文档**:
- [Apple App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)
- [Google Play Real-time Developer Notifications](https://developer.android.com/google/play/billing/rtdn-reference)
- [RFC 8252 - OAuth 2.0 for Native Apps](https://tools.ietf.org/html/rfc8252)

**状态**: ✅ 已完成

---

## 2026-02-01

### 🐛 修复 Vercel 部署 ReferenceError: __dirname is not defined 错误

**更新日期**: 2026-02-01

**问题描述**:
部署到 Vercel 后，访问 www.genrtl.com 出现以下错误：
- `GET 500` 错误
- `HEAD 500` 错误
- `[ReferenceError: __dirname is not defined]`

**根本原因**:
1. **`next-env.d.ts` 引用了本地构建文件** - 第 3 行 `import "./.next/types/routes.d.ts"` 引用了本地构建时生成的类型文件，该文件在 Vercel Edge Runtime 中可能导致 `__dirname` 等 Node.js 全局变量未定义的错误。
2. **TypeScript 类型系统冲突** - 在 Vercel 部署环境中，`.next/types/routes.d.ts` 文件可能包含与 Edge Runtime 不兼容的类型定义。

**解决方案**:

移除 `next-env.d.ts` 中的本地类型引用：

```diff
/// <reference types="next" />
/// <reference types="next/image-types/global" />
- import "./.next/types/routes.d.ts";

// NOTE: This file should not be edited
```

**为什么这样修复有效？**

1. **Edge Runtime 兼容性** - Next.js middleware 默认在 Edge Runtime 中运行，不需要（也不应该）手动指定 `runtime: 'edge'`
2. **类型安全保留** - Next.js 的核心类型定义（`next`, `next/image-types/global`）足以提供所需的类型支持
3. **移除问题源** - `.next/types/routes.d.ts` 是构建时生成的文件，可能包含 Node.js 特定的代码或类型，在 Edge Runtime 中不可用
4. **Next.js 16 最佳实践** - Next.js 16 已经废弃了在 middleware config 中显式声明 `runtime` 的做法

**关键改进**:
- ✅ **完全兼容 Vercel Edge Runtime** - 移除所有可能导致 Node.js API 引用的代码
- ✅ **类型安全** - 保留 Next.js 核心类型定义
- ✅ **构建成功** - 本地构建通过，生成 102 个路由
- ✅ **向下兼容** - 不影响现有功能和 API 路由
- ✅ **遵循 Next.js 16 约定** - Middleware 默认使用 Edge Runtime，无需显式声明

**影响文件**:
- `next-env.d.ts` - 移除 `.next/types/routes.d.ts` 引用

**验证结果**:
```bash
✓ Compiled successfully in 15.8s
✓ Generating static pages using 15 workers (102/102) in 2.0s
```

**部署步骤**:
```bash
# 1. 提交更改
git add next-env.d.ts CHANGELOG.md
git commit -m "修复 Vercel Edge Runtime __dirname 错误"

# 2. 推送到仓库
git push origin main

# 3. Vercel 自动部署或手动部署
vercel --prod
```

**预期结果**:
- ✅ 所有页面正常加载（200 状态码）
- ✅ 无 `ReferenceError: __dirname is not defined` 错误
- ✅ Middleware 正常执行会话刷新
- ✅ 静态资源正常加载

**状态**: ✅ 已完成

---

## 2026-01-30

### 🚀 修复 Vercel 部署 MIDDLEWARE_INVOCATION_FAILED 错误

**更新日期**: 2026-01-30

**问题描述**:
部署到 Vercel 后，访问网页出现 `ReferenceError: __dirname is not defined` 错误，导致 middleware 执行失败。

**根本原因**:
Vercel Edge Runtime 不支持 Node.js 全局变量（如 `__dirname`、`__filename`、`process.cwd()`）。之前的 middleware 实现可能引入了使用这些变量的模块。

**解决方案**:
使用 Supabase 官方推荐的 Edge Runtime 兼容写法，直接在 middleware 中创建 Supabase 客户端：

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // 同时更新 request 和 response 的 cookies
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // 同时移除 request 和 response 的 cookies
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 刷新会话（自动更新过期的 token）
  try {
    await supabase.auth.getUser();
  } catch {
    // 静默失败，不影响用户请求
  }

  return response;
}
```

**关键改进**:
1. ✅ **完全兼容 Edge Runtime** - 不使用任何 Node.js 特定 API
2. ✅ **保持会话刷新功能** - 自动更新过期的 access token
3. ✅ **正确的 cookie 处理** - 同时更新 request 和 response cookies
4. ✅ **静默失败** - 即使认证失败也不阻塞请求
5. ✅ **无外部依赖** - 直接使用 `@supabase/ssr` 核心功能

**为什么需要 middleware？**
- 🔄 **自动刷新 token** - 保持用户长时间登录
- 🍪 **更新 cookies** - 确保会话持久化
- ✨ **提升用户体验** - 用户无需频繁重新登录

**不会影响的功能**:
- ✅ 登录/注册功能正常（在各自的 API 路由中处理）
- ✅ API 认证正常（每个 API 路由有独立的认证检查）
- ✅ 受保护页面正常（在页面组件中验证）

**影响文件**:
- `middleware.ts` - 使用 Edge Runtime 兼容的实现

**验证方法**:
```bash
npm run build
vercel --prod
```

**状态**: ✅ 已完成

---

## 2026-01-28

### 🚀 修复 Vercel 部署 Edge Function 错误

**更新日期**: 2026-01-28

**问题描述**:
部署到 Vercel 时出现错误：
```
Error: The Edge Function "middleware" is referencing unsupported modules:
        - __vc__ns__/0/middleware.js: @/lib/supabase/middleware
```

**根本原因**:
Vercel Edge Runtime 对模块导入有限制，middleware 通过 `@/lib/supabase/middleware` 导入外部模块可能导致打包问题。

**解决方案**:
将 Supabase middleware 逻辑直接内联到 `middleware.ts` 文件中，避免外部模块导入。

**状态**: ✅ 已完成

---

### 🐛 修复隐私政策页面运行时错误

**更新日期**: 2026-01-28

**问题描述**:
隐私政策页面 (`app/privacy/page.tsx`) 出现运行时错误：`ReferenceError: index is not defined`

**根本原因**:
文件中包含了 11 处 AI 生成内容时遗留的引用标记，格式如：`:contentReference[oaicite:X]{index=X}`

这些标记不是有效的 JSX 语法，导致 JavaScript 运行时错误。

**修复内容**:
清除了所有 11 处无效的引用标记：
1. 第 54 行：企业版数据角色说明
2. 第 70 行：隐私模式控制逻辑
3. 第 83 行：个人信息处理说明
4. 第 123 行：服务端数据保存
5. 第 144 行：推理供应商数据处理
6. 第 158 行：账号删除处理
7. 第 226 行：企业协议优先级（英文版）
8. 第 242 行：隐私设置行为（英文版）
9. 第 255 行：个人数据处理（英文版）
10. 第 296 行：服务端存储（英文版）
11. 第 318 行：供应商选择（英文版）
12. 第 332 行：删除流程（英文版）

**影响范围**:
- `app/privacy/page.tsx` - 移除所有无效引用标记
- 中文和英文隐私政策内容均已修复

**验证结果**:
- ✅ TypeScript 编译通过
- ✅ 无 linter 错误
- ✅ 页面可以正常访问
- ✅ 所有文本内容完整显示

**状态**: ✅ 已完成

---

### 🌐 语言切换器优化 - 仅支持中英文

**更新日期**: 2026-01-28

**说明**:
简化语言切换器，仅保留中文和英文两个选项，优化用户体验。

**修改内容**:

1. **精简支持的语言**:
   - **之前**：支持 7 种语言（英文、中文、日语、韩语、法语、西班牙语、德语）
   - **现在**：仅支持 2 种语言（英文 🇺🇸、中文 🇨🇳）
   - 移除了日语、韩语、法语、西班牙语、德语选项

2. **优化默认语言**:
   - **之前**：默认英文
   - **现在**：默认中文
   - 自动检测浏览器语言：中文浏览器显示中文，其他显示英文

3. **更新语言检测逻辑**:
   - 简化 `detectBrowserLanguage()` 函数
   - 只检测中文，其他语言默认英文
   - 提升检测性能

4. **更新本地存储验证**:
   - `getStoredLanguage()` 函数只验证 'en' 和 'zh'
   - 如果存储了不支持的语言代码，自动使用默认语言

**用户体验**:
- 语言切换器下拉列表更简洁
- 只显示 2 个选项，减少用户选择负担
- 中国用户默认看到中文界面
- 国际用户默认看到英文界面

**技术细节**:
- 修改 `SUPPORTED_LANGUAGES` 数组
- 更新 `detectBrowserLanguage()` 函数
- 更新 `getStoredLanguage()` 函数
- 修改默认语言为 'zh'

**影响文件**:
- `lib/contexts/language-context.tsx` - 语言上下文配置

**状态**: ✅ 已完成

---

### 🌍 首页多语言支持 + 按钮高度优化

**更新日期**: 2026-01-28

**说明**:
优化首页用户体验，减小按钮高度，并为首页添加完整的中英文多语言支持。

**修改内容**:

1. **优化按钮高度**:
   - **之前**：`py-6`（padding-y: 1.5rem）
   - **现在**：`py-3`（padding-y: 0.75rem）
   - 按钮高度减半，视觉更精致，符合现代 UI 设计
   - 影响所有 Hero 区域和 CTA 区域的大按钮

2. **首页多语言翻译**（完整支持）:
   添加 50+ 条翻译键值，覆盖首页所有文本内容：
   
   **导航栏**:
   - 功能特性、定价、文档、更新日志
   
   **Hero 区域**:
   - 主标题、副标题、CTA 按钮
   - 代码编辑器预览区域的提示文字
   
   **功能特性区域**:
   - 智能代码生成、CBB 组件复用、企业级安全
   - 每个特性的标题、描述和链接文字
   
   **用户评价区域**:
   - 4 条完整的用户评价（包括姓名和职位）
   - 支持中英文自动切换
   
   **更新日志区域**:
   - 4 个版本的更新标题和描述
   - "查看更多"链接文字
   
   **底部 CTA**:
   - 标题、副标题、按钮文字
   
   **页脚**:
   - 4 列导航（产品、资源、公司、法律信息）
   - 所有链接文字的中英文翻译

3. **翻译文件更新** (`lib/i18n/translations.ts`):
   - 添加 `en` 部分：50+ 条英文翻译
   - 添加 `zh` 部分：50+ 条中文翻译
   - 新增翻译键前缀 `home*`，便于管理

4. **组件更新** (`app/page.tsx`):
   - 导入 `useTranslation` Hook
   - 替换所有硬编码文本为 `t('translationKey')`
   - 支持实时语言切换（通过 LanguageSwitcher 组件）

**翻译覆盖率**:
- ✅ 导航栏：100%
- ✅ Hero 区域：100%
- ✅ 功能特性：100%
- ✅ 用户评价：100%
- ✅ 更新日志：100%
- ✅ 页脚：100%
- ✅ CTA 按钮：100%

**技术细节**:
- 使用现有的 `useTranslation` Hook
- 通过 LanguageSwitcher 组件切换语言
- 翻译文件结构清晰，易于维护
- 支持参数化翻译（为未来扩展预留）

**用户体验**:
- 点击 LanguageSwitcher 即时切换语言
- 所有文本自动更新为目标语言
- 支持中文、英文（未来可扩展更多语言）

**影响文件**:
- `app/page.tsx` - 首页组件，添加 50+ 处翻译调用
- `lib/i18n/translations.ts` - 翻译文件，添加 100+ 条翻译

**状态**: ✅ 已完成

---

### 🔧 登录成功后自动跳转 Dashboard

**更新日期**: 2026-01-28

**说明**:
优化登录流程，登录成功后自动跳转到 Dashboard 页面，提升用户体验。

**修改内容**:

1. **修改默认跳转目标**:
   - **之前**：`returnTo` 参数默认值为 `/`（首页）
   - **现在**：`returnTo` 参数默认值为 `/dashboard`（Dashboard 页面）
   - 支持通过 URL 参数自定义跳转目标：`/auth/login?returnTo=/generate`

2. **登录成功后的行为**:
   - **之前**：
     - 显示成功提示弹窗
     - 尝试关闭窗口（适用于 VS Code 插件场景）
   - **现在**：
     - 使用 `router.push()` 自动跳转到目标页面
     - 默认跳转到 `/dashboard`
     - 支持自定义 `returnTo` 参数

3. **用户体验改进**:
   - 登录成功后无需手动导航，自动进入工作区
   - 流畅的页面过渡，符合 Web 应用习惯
   - 保留会话追踪功能（sessionId）

**技术细节**:
- 使用 Next.js `useRouter()` 进行客户端路由跳转
- 保留 localStorage 和 postMessage 通信（用于 VS Code 插件集成）
- 500ms 延迟确保状态更新完成

**URL 参数说明**:
```
# 默认跳转到 Dashboard
/auth/login?sessionId=xxx

# 自定义跳转目标
/auth/login?sessionId=xxx&returnTo=/generate
/auth/login?sessionId=xxx&returnTo=/pricing
```

**影响文件**:
- `app/auth/login/page.tsx` - 修改登录成功后的跳转逻辑

**状态**: ✅ 已完成

---

### 🔧 优化首页导航按钮逻辑 + 登录会话追踪

**更新日期**: 2026-01-28

**说明**:
简化首页导航栏的按钮逻辑，统一用户体验，并添加登录会话追踪功能。

**修改内容**:

1. **导航按钮简化**:
   - **未登录状态**：显示单个"登录"按钮，点击跳转到 `/auth/login?sessionId=xxx` 登录页面
   - **已登录状态**：显示单个"Dashboard"按钮，点击跳转到 `/dashboard` 页面
   - 移除了多余的"开始使用"按钮，减少用户决策成本

2. **登录会话追踪**:
   - 使用 `useMemo` 生成唯一的 sessionId（格式：`session_时间戳_随机字符串`）
   - 所有未登录的 CTA 按钮都带有 sessionId 参数
   - 示例：`/auth/login?sessionId=session_1769603516081_qmnn7op21`
   - sessionId 在页面加载时生成一次，保持一致性
   - 用于后续的用户行为分析和转化率追踪

3. **按钮样式统一**:
   - 两种状态下的按钮都使用白色背景 + 黑色文字（`bg-white text-black`）
   - 悬停效果统一为灰色背景（`hover:bg-gray-200`）
   - 保持一致的视觉反馈

4. **用户体验改进**:
   - 未登录用户：一键直达登录页面，清晰的行动号召
   - 已登录用户：一键进入 Dashboard，快速访问核心功能
   - 加载状态：显示灰色占位符动画，避免布局闪烁

**技术细节**:
- 使用 Next.js Link 组件实现页面跳转
- 使用 `useMemo` Hook 确保 sessionId 在组件渲染期间保持不变
- sessionId 格式：`session_${Date.now()}_${随机字符串}`
- 移除登录弹窗（LoginModal），改为页面跳转，符合传统 Web 应用习惯
- 保持语言切换器和其他导航元素不变

**会话追踪用途**:
- 追踪用户从首页到登录的转化路径
- 分析不同 CTA 按钮的点击效率
- 支持 A/B 测试和用户行为分析
- 登录页面已支持读取 sessionId 参数

**影响文件**:
- `app/page.tsx` - 简化导航按钮逻辑 + 添加 sessionId 生成

**状态**: ✅ 已完成

---

### 🎨 首页全面重构 - Cursor 风格设计

**更新日期**: 2026-01-28

**说明**:
参考 Cursor 官网设计风格，全面重构 genRTL 首页，打造现代化、专业的硬件设计工具首页体验。

**设计特点**:

1. **现代化深色主题**:
   - 主背景色：`#0a0a0a`（纯黑）
   - 卡片背景：`#1a1a1a`（深灰）
   - 边框颜色：`#1f1f1f`（灰色边框）
   - 渐变色彩：蓝色到紫色渐变突出重点文字

2. **固定导航栏**:
   - 半透明背景 + 毛玻璃效果
   - genRTL Logo + 导航链接（功能特性、定价、文档、更新日志）
   - 语言切换器 + 登录/开始使用按钮
   - 响应式设计，移动端自适应

3. **Hero 区域**:
   - 大标题：强调 "让硬件设计效率达到非凡水平"
   - 副标题：简洁说明产品定位
   - 醒目的 CTA 按钮（白色按钮 + 黑色文字）
   - 交互式代码编辑器预览：
     * 模拟 VS Code 风格的编辑器界面
     * 实时显示 Verilog/SystemVerilog 代码生成过程
     * 语法高亮（紫色关键字、蓝色类型、橙色数字）
     * "正在生成..." 动画效果
     * 浮动特性卡片（语法检查、AI 优化建议）

4. **功能特性区域**:
   - 3 列网格布局展示核心功能：
     * 智能代码生成（GPT-5.2 + Claude Sonnet 4.5）
     * CBB 组件复用（预构建 IP 核库）
     * 企业级安全（SOC 2 认证）
   - 每个功能卡片包含图标、标题、描述和 CTA 链接
   - 悬停效果：边框高亮

5. **用户评价区域**:
   - 2x2 网格布局展示 4 条用户评价
   - 包含用户头像（渐变色圆形）、姓名、职位和评价内容
   - 真实的硬件工程师使用场景描述

6. **更新日志区域**:
   - 4 列网格展示最新版本更新
   - 版本号 + 日期 + 更新标题 + 简要描述
   - 悬停效果 + 链接到完整更新日志

7. **CTA 区域**:
   - 再次强调核心价值主张
   - 大号 CTA 按钮引导注册/使用

8. **页脚**:
   - 4 列布局：产品、资源、公司、法律信息
   - SOC 2 认证徽章
   - 语言切换器
   - 版权信息

**技术实现**:

- ✅ 使用 Tailwind CSS 实现深色主题
- ✅ 响应式布局（移动端、平板、桌面端）
- ✅ 渐变文字效果 `bg-gradient-to-r bg-clip-text`
- ✅ 悬停动画和过渡效果
- ✅ Lucide React 图标库
- ✅ Next.js Image 组件优化图片加载
- ✅ 客户端状态管理（登录状态、Modal）

**文件修改**:
- `app/page.tsx` - 完全重写，从视频背景改为 Cursor 风格布局

**SEO 优化**:
- 清晰的标题层级（h1, h2, h3）
- 语义化 HTML 结构
- 优化的内链结构
- 明确的 CTA 引导

**对比原版本**:
- **之前**：全屏视频背景 + 简单的 "开始使用" 按钮
- **现在**：多区域内容展示 + 功能介绍 + 用户评价 + 更新日志，信息丰富且专业

**状态**: ✅ 已完成

---

### 🎨 品牌重塑：Monna AI → genRTL

**更新日期**: 2026-01-28

**说明**:
将整个后端的品牌从 "Monna AI" 全面更换为 "genRTL"，以符合硬件设计代码生成平台的定位。

**修改内容**:

1. **更新 Dashboard Logo**:
   - 将 genRTL.png 复制到 `public/` 目录
   - 更新 `app/(dashboard)/layout.tsx` 引用新的 logo 图片
   - 更新 logo alt 文字为 "genRTL Logo"
   - 更新商标文字显示为 "genRTL"

2. **全局品牌名称替换**:
   - `lib/seo/config.ts` - 更新 SEO 配置，包括标题、描述和关键词
   - `app/layout.tsx` - 更新元数据中的品牌名称
   - `app/page.tsx` - 更新首页 logo 和演示视频标题
   - `app/generate/page.tsx` - 更新生成页面的品牌展示
   - `components/seo/seo-head.tsx` - 更新 og:site_name
   - `components/auth/login-modal.tsx` - 更新登录弹窗 logo alt
   - `app/(login)/login.tsx` - 更新登录页面 logo alt
   - `components/generation-modal.tsx` - 更新生成内容的标题
   - `components/monna-community.tsx` - 更新社区标题为 "genRTL Community"

3. **多语言翻译更新**:
   - `lib/i18n/translations.ts` - 更新所有语言的欢迎消息：
     - 英文: "Welcome to genRTL"
     - 中文: "欢迎来到 genRTL"
     - 日语: "genRTL へようこそ"
     - 韩语: "genRTL에 오신 것을 환영합니다"
     - 法语: "Bienvenue sur genRTL"
     - 西班牙语: "Bienvenido a genRTL"
     - 德语: "Willkommen bei genRTL"

4. **邮件模板和账号管理**:
   - `app/privacy/page.tsx` - 更新隐私政策标题
   - `app/delete-account/page.tsx` - 更新账号删除页面的品牌引用
   - `app/api/account-deletion/request/route.ts` - 更新删除请求邮件
   - `app/api/account-deletion/confirm/route.ts` - 更新删除确认页面
   - `inngest/functions/delete-account.ts` - 更新账号删除邮件通知
   - 邮件发件人更新为: `genRTL <noreply@xroting.com>`

5. **SEO 优化**:
   - 更新中文 SEO:
     - 标题: "genRTL - 智能Verilog/SystemVerilog代码生成平台"
     - 关键词: Verilog生成, SystemVerilog, RTL设计, 硬件描述语言, AI代码生成等
   - 更新英文 SEO:
     - 标题: "genRTL - Intelligent Verilog/SystemVerilog Code Generator"
     - 关键词: Verilog generator, SystemVerilog, RTL design, HDL等

6. **其他文件**:
   - `app/robots.ts` - 更新注释
   - `app/sitemap.ts` - 更新注释
   - `supabase/add-community-feature.sql` - 更新社区功能注释

**影响范围**:
- 前端所有页面显示的品牌名称
- SEO 元数据和搜索引擎优化
- 邮件通知内容
- 多语言界面显示
- Dashboard 界面

**验证方法**:
1. 访问 http://localhost:3005/dashboard 查看 logo 和商标
2. 检查首页、登录页、生成页等是否正确显示 "genRTL"
3. 检查浏览器标签页标题是否为 "genRTL"
4. 测试账号删除流程，确认邮件中的品牌名称

**状态**: ✅ 已完成

---

## 2026-01-25

### 🐛 修复 TypeScript 编译错误

**更新日期**: 2026-01-25 深夜

**问题描述**:
执行 `npm run build` 时遇到多个 TypeScript 编译错误：
1. `genrtl-pricing-client.tsx` - `plan.badge` 和 `plan.icon` 属性缺失
2. `billing/route.ts` - Stripe API 类型问题（`current_period_end`, `deleted`, `upcoming` 方法）
3. `login/page.tsx` - OTP 输入框的 ref 回调类型不兼容

**修复内容**:

1. **修复 Pricing 组件类型定义** (`app/(dashboard)/pricing/genrtl-pricing-client.tsx`):
   - 添加 `PlanConfig` 接口，明确定义所有可选属性（`badge?`, `icon?`, `popular?`）
   - 为每个计划添加 `icon` 属性（Cpu, Zap, Crown, Building2）
   - 为 `professional` 计划添加 `badge: '最受欢迎'`

2. **修复 Billing API Stripe 类型** (`app/api/dashboard/billing/route.ts`):
   - 导入 `import type Stripe from 'stripe'`
   - 使用 `const subscription: any` 避免 `Response<Subscription>` 类型问题
   - 移除不存在的 `stripe.invoices.upcoming()` 方法调用
   - 改为从 `subscription.items.data[0].price.unit_amount` 获取下次账单金额
   - 添加 `subscription.status !== 'canceled'` 检查

3. **修复登录页面 ref 类型** (`app/auth/login/page.tsx`):
   - 将 `ref={(el) => (otpInputs.current[index] = el)}` 改为合法的 void 返回类型
   - 使用 `if (el) otpInputs.current[index] = el;` 语句块

**技术细节**:
- Stripe SDK 的 `subscriptions.retrieve()` 返回类型可能包含 `DeletedSubscription`，需要类型断言
- React ref 回调必须返回 `void` 或清理函数，不能返回值
- TypeScript 接口中的可选属性需要明确声明（`property?: Type`）

**验证结果**:
- ✅ `npm run build` 成功编译
- ✅ 所有 TypeScript 错误已解决
- ✅ 生成 99 个静态路由和动态路由

---

### 🐛 修复前端计划名称显示问题

**更新日期**: 2026-01-25 晚上

**问题描述**:
执行 SQL 升级脚本后，数据库中的 `plan_name` 已成功更新为 `ultra_plus`，但前端仍显示 "Free Plan"。

**根本原因**:
前端代码中的计划名称映射表没有包含新的计划名称（`plus`, `ultra_plus`），导致：
1. `getPlanDisplayName()` - Dashboard layout 侧边栏显示
2. `getPlanInfo()` - Usage 页面计划信息
3. `getPlanName()` - Activity 页面订阅卡片

当遇到未知计划名时，这些函数都默认返回 "Free"。

**修复内容**:

1. **更新 Dashboard Layout** (`app/(dashboard)/dashboard/layout.tsx`):
   ```typescript
   const planMap = {
     'free': 'Free',
     'basic': 'Basic',
     'plus': 'Plus',           // 新增
     'ultra_plus': 'Ultra Plus', // 新增
     // ... 向后兼容旧计划
   };
   ```

2. **更新 Usage 页面** (`app/(dashboard)/dashboard/usage/page.tsx`):
   ```typescript
   const plans = {
     'plus': { name: 'Plus', price: '$100', ... },
     'ultra_plus': { name: 'Ultra Plus', price: '$200', ... },
   };
   ```

3. **更新 Activity 页面** (`app/(dashboard)/dashboard/activity/page.tsx`):
   ```typescript
   const planMap = {
     'plus': 'Plus',
     'ultra_plus': 'Ultra Plus',
   };
   ```

**影响范围**:
- Dashboard 左侧边栏显示正确的计划名称
- Usage 页面显示正确的计划信息和价格
- Activity 页面订阅卡片显示正确的计划名称
- 所有页面支持新的订阅计划架构

**验证方法**:
1. 刷新浏览器（清除前端缓存）
2. 查看 Dashboard 左侧边栏：应显示 "Ultra Plus Plan"
3. 进入 Usage 页面：应显示 "Ultra Plus - $200"
4. 进入 Activity 页面：应显示 "Ultra Plus" 订阅卡片

---

### 🎉 订阅计划全面重构（1:1.5 映射）

**更新日期**: 2026-01-25 晚上

**新订阅计划架构**:

| 计划 | 月费 | Included USD (1.5:1) | Tokens 上限 | On-Demand | 模型 |
|------|------|---------------------|------------|-----------|------|
| **Free** | $0 | $0.5 | 1M | ❌ | Claude Haiku 3 |
| **Basic** | $20 | $30 | 无限 | ✅ | Claude Sonnet 4 |
| **Plus** | $100 | $150 | 无限 | ✅ | Claude Sonnet 4 |
| **Ultra Plus** | $200 | $300 | 无限 | ✅ | Claude Sonnet 4 |

**变更内容**:

1. **订阅计划重命名**:
   - `hobby` → `free`（保留 hobby 用于向后兼容）
   - `professional` → `plus`
   - `enterprise` → `ultra_plus`
   - 移除 `basic` 的变更（保持不变）

2. **Included USD 按 1.5:1 映射**:
   - Free: $0 月费 → $0.5 included USD
   - Basic: $20 月费 → $30 included USD
   - Plus: $100 月费 → $150 included USD
   - Ultra Plus: $200 月费 → $300 included USD

3. **模型分层策略**:
   - **Free 档**：使用 `Claude Haiku 3`（低成本模型，$0.00025/1K tokens）
   - **付费档**：使用 `Claude Sonnet 4`（高性能模型）
   - 自动根据用户订阅计划选择对应模型

4. **费率优化**:
   - Free: $0.00025/1K tokens（Haiku 成本）
   - Basic: $0.009/1K tokens（标准费率，3x 成本）
   - Plus: $0.0081/1K tokens（优惠费率，10% 折扣）
   - Ultra Plus: $0.0075/1K tokens（最优惠费率，20% 折扣）

5. **Free 档限制**:
   - Tokens 上限：1M
   - On-Demand：❌ 禁用（余额不足时拒绝请求）
   - 只能使用 Claude Haiku 3

6. **数据库迁移**:
   - 创建 `005_update_subscription_plans.sql`
   - 自动迁移现有计划名称
   - 自动调整 USD Pool 额度
   - 为 Free 档禁用 on_demand

**影响范围**:
- `lib/cbb/usd-pool.ts` - 更新订阅计划配置
- `app/api/chat/route.ts` - 添加模型选择逻辑，根据计划使用不同模型
- `lib/db/queries.ts` - 更新默认计划为 'free'
- `supabase/migrations/005_update_subscription_plans.sql` - 迁移脚本

**升级步骤**:
1. 执行数据库迁移：`005_update_subscription_plans.sql`
2. 重启后端服务
3. Free 档用户自动使用 Haiku 3，付费档用户使用 Sonnet 4
4. 现有用户的 USD Pool 额度自动调整

---

### 🐛 修复 On-Demand 开关无效问题

**更新日期**: 2026-01-25 晚上

**问题描述**:
用户在 Dashboard 关闭了 on-demand 开关（on-demand usage is off），但消耗的 type 仍然显示为 on_demand。

**根本原因**:
1. `USDPoolManager.charge()` 的判断逻辑有误：`if (!plan.features.on_demand_allowed && !params.allowOnDemand)`
   - 这是逻辑 AND，意味着只有当**计划不允许** AND **参数不允许**时才拒绝
   - 但 `hobby` 计划的 `on_demand_allowed = true`，所以即使用户关闭了 `on_demand_enabled`，还是会使用 on_demand
2. 检查顺序错误：应该**先检查用户设置**，再检查计划配置
3. Hobby 计划的 `included_usd` 只有 $2，很容易用完，导致大部分请求都使用 on_demand

**修复内容**:

1. **重新设计 `USDPoolManager.charge()` 的判断逻辑**:
   - **第一优先级**：检查 `params.allowOnDemand`（用户设置），如果为 false 直接拒绝
   - **第二优先级**：检查 `plan.features.on_demand_allowed`（计划配置）
   - **第三优先级**：检查 `pool.on_demand_limit`（限额）

2. **更新错误消息**:
   - 用户禁用时：`'订阅额度不足，您已禁用超额使用（on-demand）'`
   - 计划不支持时：`'订阅额度不足，当前计划不支持超额使用'`

**影响范围**:
- `lib/cbb/usd-pool.ts` - 修复 on-demand 判断逻辑
- Chat API 现在会正确尊重用户的 on-demand 设置
- 当 on-demand 关闭且 included 余额不足时，会返回错误而不是继续扣费

**行为变化**:
- **之前**：on-demand 关闭时，如果计划支持，仍然会使用 on_demand
- **现在**：on-demand 关闭时，如果 included 余额不足，会直接返回错误，**不会**使用 on_demand

**测试验证**:
1. 确保 on-demand 开关为 OFF
2. 发送 Chat 请求，耗尽 included 余额
3. 继续发送请求，应该收到错误：`订阅额度不足，您已禁用超额使用（on-demand）`
4. 打开 on-demand 开关为 ON
5. 再次发送请求，应该成功并使用 on_demand bucket

---

### 🐛 修复 Chat API Usage Tracking 缺失（完整修复）

**更新日期**: 2026-01-25 下午

**问题描述**:
用户在前端输入提示词调用 Chat API 后，后端虽然正常响应并调用了 Claude 模型，但 Dashboard 没有显示 tokens 统计，显示为 0/10.0万。

**根本原因**:
1. `/api/chat` 路由在调用 Claude API 并获取 `usage` 数据（input_tokens, output_tokens）后，完全没有调用 `UsageLedger.recordLLMUsage()` 来记录这些 tokens 到 `usage_ledger` 表，也没有调用 `USDPoolManager.charge()` 进行扣费。
2. 用户没有 team，导致 `USDPoolManager.getPoolStatus()` 失败，返回 "无法获取美元池状态"，扣费失败，因此也没有记录 usage。虽然 `getTeamForUser` 日志说 "will create one"，但该函数只返回 null，不会自动创建 team。
3. **最关键的问题**：`createUserTeam()` 创建 team 时使用了 `plan_name: 'free'`，但 `USDPoolManager.SUBSCRIPTION_PLANS` 中**没有定义 'free' 计划**，只有 `hobby`, `basic`, `professional`, `enterprise`。当 `calculateLLMCost()` 尝试访问 `SUBSCRIPTION_PLANS['free'].llm_rates` 时返回 `undefined`，导致崩溃：`TypeError: Cannot read properties of undefined (reading 'llm_rates')`

**修复内容**:

1. **在 `/api/chat` 路由中集成 Usage Tracking**:
   - 导入 `UsageLedger`, `USDPoolManager`, `getTeamForUser`, `createUserTeam`
   - 在流式响应的 `message_stop` 事件后，添加 usage 记录逻辑
   - 在非流式响应返回前，添加 usage 记录逻辑

2. **自动创建 Team 和初始化 USD Pool**:
   - 调用 `getTeamForUser()` 获取用户的 team
   - **如果没有 team，自动调用 `createUserTeam()` 创建**
   - **自动调用 `USDPoolManager.initializePool()` 初始化美元池**
   - 确保新用户首次使用时能正常记录 usage

3. **修复计划名称不匹配问题**:
   - 修改 `lib/db/queries.ts` 中 `createUserTeam()` 函数，将默认计划从 `'free'` 改为 `'hobby'`
   - 创建迁移文件 `supabase/migrations/004_fix_free_to_hobby_plan.sql`，将现有的 `'free'` 计划更新为 `'hobby'`

4. **Usage Tracking 流程**:
   - 从 `finalMessage.usage` 或 `completion.usage` 获取 tokens 数据
   - 使用 `USDPoolManager.calculateLLMCost()` 计算 USD 成本（按 `implement` 任务类型计费）
   - 调用 `USDPoolManager.charge()` 进行扣费（优先 included，不足时进入 on_demand）
   - 调用 `UsageLedger.recordLLMUsage()` 记录详细的 tokens 使用到 `usage_ledger` 表
   - 使用 `idempotencyKey: chat_${messageId}` 确保幂等性

5. **日志增强**:
   - 在 `message_stop` 事件日志中添加 usage 信息
   - 添加 team 创建的日志：`🏗️ User has no team, creating one...`
   - 添加 USD Pool 初始化日志：`✅ USD Pool initialized`
   - 添加扣费成功/失败的详细日志
   - 记录 tokens、成本、bucket 等关键信息

**影响范围**:
- `app/api/chat/route.ts` - 添加 usage tracking 和自动创建 team 逻辑
- `lib/db/queries.ts` - 修复默认计划名称从 'free' 到 'hobby'
- `supabase/migrations/004_fix_free_to_hobby_plan.sql` - 数据库迁移脚本
- Dashboard Overview 页面现在可以正确显示 Chat API 的 tokens 消耗
- Dashboard Usage 页面现在可以显示 Chat API 的详细使用记录
- USD Pool 和 Usage Ledger 正确记录 Chat API 的费用和 tokens
- 新用户首次使用时自动创建 team 和初始化 USD Pool

**测试验证**:
1. 执行数据库迁移：`004_fix_free_to_hobby_plan.sql`
2. 用户在前端输入提示词并发送
3. 后端自动创建 team（如果不存在）使用 'hobby' 计划
4. 后端初始化 USD Pool
5. 后端调用 Claude API 并正常响应
6. Dashboard 应显示非零的 tokens 使用量
7. Usage 页面应显示对应的记录
8. USD Pool 应正确扣费（included 或 on_demand）

---

### 🎨 Dashboard UI 全面升级 (Cursor 风格)

**更新日期**: 2026-01-25

**说明**:
根据 Cursor Dashboard 设计，全面升级后端 SaaS Dashboard，采用深色主题设计，新增多个功能页面。

#### 新增页面

1. **Overview 页面** (`/dashboard`)
   - 每日 tokens 使用量折线图
   - 总 tokens 和请求统计卡片
   - 支持 1d/7d/30d 日期范围切换
   - 实时数据刷新

2. **Settings 页面** (`/dashboard/settings`)
   - 数据共享设置（Share Data）- 控制是否允许数据用于训练
   - 学生验证状态显示
   - 活跃会话管理（支持查看和撤销会话）
   - 账号删除功能（带确认弹窗）

3. **Usage 页面** (`/dashboard/usage`)
   - 当前订阅计划展示
   - On-Demand 使能开关
   - 详细使用记录表格
   - 支持导出 CSV
   - 按日期/类型/模型筛选

4. **Spending 页面** (`/dashboard/spending`)
   - On-Demand 消费总览
   - 消费限额设置
   - 按模型分类的消费明细
   - 消费预警提示

5. **Billing & Invoices 页面** (`/dashboard/billing`)
   - 下次账单日期和金额
   - 支付方式管理
   - 发票列表（支持查看和下载）
   - Stripe Customer Portal 集成

#### 新增 API Endpoints

| API 路径 | 方法 | 功能 |
|----------|------|------|
| `/api/dashboard/analytics` | GET | 获取使用分析数据 |
| `/api/dashboard/settings` | GET/PATCH | 获取/更新用户设置 |
| `/api/dashboard/sessions` | GET | 获取活跃会话列表 |
| `/api/dashboard/sessions/[id]` | DELETE | 撤销指定会话 |
| `/api/dashboard/usage` | GET | 获取详细使用记录 |
| `/api/dashboard/usage/export` | GET | 导出使用记录为 CSV |
| `/api/dashboard/on-demand` | PATCH | 更新 On-Demand 设置 |
| `/api/dashboard/spending` | GET | 获取 On-Demand 消费数据 |
| `/api/dashboard/billing` | GET | 获取账单和发票信息 |

#### 数据库变更

新增迁移文件 `supabase/migrations/003_dashboard_tables.sql`:

- `teams` 表新增 `on_demand_enabled` 字段
- 新增 `user_settings` 表（用户偏好设置）
- 新增 `user_sessions` 表（会话管理）
- 添加相关 RLS 策略和索引

#### UI/UX 设计特点

- 深色主题设计 (#0a0a0a 背景)
- 侧边栏导航（用户信息 + 菜单）
- 响应式布局（支持移动端）
- 卡片式组件设计
- 数据可视化图表
- 加载状态和空状态处理

#### 修改文件清单

**新增文件:**
- `app/(dashboard)/dashboard/layout.tsx` - Dashboard 布局
- `app/(dashboard)/dashboard/page.tsx` - Overview 页面
- `app/(dashboard)/dashboard/settings/page.tsx` - Settings 页面
- `app/(dashboard)/dashboard/usage/page.tsx` - Usage 页面
- `app/(dashboard)/dashboard/spending/page.tsx` - Spending 页面
- `app/(dashboard)/dashboard/billing/page.tsx` - Billing 页面
- `app/api/dashboard/analytics/route.ts`
- `app/api/dashboard/settings/route.ts`
- `app/api/dashboard/sessions/route.ts`
- `app/api/dashboard/sessions/[id]/route.ts`
- `app/api/dashboard/usage/route.ts`
- `app/api/dashboard/usage/export/route.ts`
- `app/api/dashboard/on-demand/route.ts`
- `app/api/dashboard/spending/route.ts`
- `app/api/dashboard/billing/route.ts`
- `supabase/migrations/003_dashboard_tables.sql`

**修改文件:**
- `lib/db/queries.ts` - 添加 `on_demand_enabled` 字段支持

**部署步骤:**

1. 执行数据库迁移（**按顺序执行**）：

   a. 首先执行 `supabase/migrations/001_genrtl_tables.sql`
      - 创建 `usage_ledger`, `usd_pools`, `cbb_registry` 等核心表
   
   b. 然后执行 `supabase/migrations/003_dashboard_tables.sql`
      - 添加 Dashboard 相关表和字段

   **重要**: 详细步骤请参阅 `supabase/MIGRATION_GUIDE.md`

2. 确保 Stripe 配置正确（用于 Billing 页面）

3. 部署代码到 Vercel

**已知问题修复:**

- 修复了迁移文件位置问题：将 `001_genrtl_tables.sql` 从 `lib/db/migrations/` 复制到 `supabase/migrations/`
- `003_dashboard_tables.sql` 依赖 `001_genrtl_tables.sql` 中创建的 `usage_ledger` 表
- **修复了按钮文字不可见问题**：
  - 根本原因：Dashboard 页面使用深色背景，但浏览器处于浅色模式
  - 按钮的 `bg-background` 在浅色模式下解析为白色
  - 同时设置了 `text-white`，导致白色背景+白色文字
  - 解决方案：在所有 outline 按钮上显式设置黑色文字（`text-gray-900`）和白色背景（`bg-white`）

**状态**: ✅ 已完成

---

## 2025-12-20

### 💰 订阅计划配置更新

**更新日期**: 2025-12-20

**说明**:
根据产品定价策略，将订阅计划从 Free/Basic/Pro/Enterprise 调整为 Hobby/Basic/Pro/Enterprise，并更新美元池额度。

#### 订阅计划调整

| 计划 | 月费 | 美元池 | 变更说明 |
|------|------|--------|----------|
| **Hobby** | $0 | $10 | 新增免费档，取代原 Free ($5 → $10) |
| **Basic** | $20 | $60 | 美元池从 $50 提升到 $60 |
| **Pro** | $100 | $350 | 价格从 $50 提升到 $100，美元池从 $150 提升到 $350 |
| **Enterprise** | $200 | $800 | 美元池从 $1000 降低到 $800 |

#### 新增文件
- `app/(dashboard)/pricing/genrtl-pricing-client.tsx` - genRTL 专用定价页面组件
  - 新的 UI 设计，展示 USD Pool 概念
  - 功能对比表格
  - On-Demand 说明

#### 修改文件
- `lib/cbb/usd-pool.ts` - 更新 SUBSCRIPTION_PLANS 配置
  - `free` → `hobby` (id 变更)
  - 调整各档位美元池额度和 LLM 费率
- `app/(dashboard)/pricing/page.tsx` - 切换到 GenRTLPricingClient

**Stripe 配置要求**:

在 Stripe Dashboard 创建以下产品，metadata 必须包含：
- `plan_key`: hobby | basic | professional | enterprise
- `included_usd`: 10 | 60 | 350 | 800
- `product_type`: genrtl

详细配置步骤参见文档。

**状态**: ✅ 已完成

---

## 2025-12-19

### 🔧 genRTL-SaaS 后端功能完善

**更新日期**: 2025-12-19

**说明**:
进一步完善 genRTL-SaaS 后端功能，包括依赖安装、Stripe 集成、定时任务和管理员 API。

#### 1. 依赖管理
- 添加 `@anthropic-ai/sdk` 依赖，用于调用 Claude 模型

#### 2. Stripe Webhook 集成 USD Pool
- 修改 `lib/payments/stripe.ts`
  - 订阅激活时自动初始化用户的 USD Pool
  - 订阅取消时自动将 USD Pool 降级为免费档
  - 支持订阅升级/降级时 USD Pool 的自动调整

#### 3. Inngest 定时任务
- 新增 `inngest/functions/usd-pool-reset.ts`
  - `usdPoolMonthlyReset`: 每月1日 UTC 00:00 自动重置所有活跃订阅用户的美元池
  - `usdPoolThresholdCheck`: 每天 UTC 12:00 检查超额使用情况，发送告警
- 更新 `app/api/inngest/route.ts` 注册新的定时任务

#### 4. CBB Admin API
- 新增 `app/api/admin/cbb/route.ts`
  - `GET /api/admin/cbb` - 获取 CBB 列表（管理员视图，包含非公开的）
  - `POST /api/admin/cbb` - 创建新的 CBB 包
  - `PATCH /api/admin/cbb` - 更新 CBB 包（价格、描述、标签等）
  - `DELETE /api/admin/cbb` - 停用 CBB 包（软删除）
- 新增 `app/api/admin/cbb/upload/route.ts`
  - `POST /api/admin/cbb/upload` - 上传 CBB 包文件到 Storage
  - 支持 .zip, .tar.gz, .tgz 格式
  - 自动计算 SHA256 校验和
  - 最大支持 100MB 文件

**环境变量新增**:
```bash
# 管理员邮箱白名单（逗号分隔）
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

**修改文件清单**:
- `package.json` - 添加 @anthropic-ai/sdk 依赖
- `lib/payments/stripe.ts` - 集成 USD Pool 初始化逻辑
- `inngest/functions/usd-pool-reset.ts` - 新建
- `app/api/inngest/route.ts` - 注册 USD Pool 定时任务
- `app/api/admin/cbb/route.ts` - 新建
- `app/api/admin/cbb/upload/route.ts` - 新建
- `CHANGELOG.md` - 更新

**状态**: ✅ 已完成

---

### 🚀 genRTL-SaaS 后端核心功能实现

**更新日期**: 2025-12-19

**说明**:
根据 README.md 中的架构设计，完整实现了 genRTL-SaaS 的后端核心功能，包括 CBB Registry、Usage Ledger、USD Pool Manager 和 RTL Job APIs。

**新增模块**:

#### 1. CBB (Configurable Building Block) 模块
- `lib/cbb/types.ts` - 完整的类型定义
  - CBB Manifest 结构
  - Resolve/Checkout/Deliver 请求响应类型
  - Usage Ledger 记录类型
  - Plan/Implement/Repair Job 类型
- `lib/cbb/registry.ts` - CBB Registry 管理器
  - 注册、查询、搜索 CBB 包
  - 版本管理和比较
  - 下载计数跟踪
- `lib/cbb/commerce.ts` - CBB 商业交易
  - Checkout 扣费（幂等操作）
  - Deliver 下载凭证发放
  - 退款处理
- `lib/cbb/usage-ledger.ts` - 统一记账系统
  - 支持 LLM 和 CBB 两种类型
  - 用量汇总和按 Job 归因
- `lib/cbb/usd-pool.ts` - 美元池管理器
  - Included（订阅内）+ On-Demand（超额按量）
  - 扣费优先级：先扣 included，再进 on_demand
  - 超额限制设置

#### 2. LLM 模块
- `lib/llm/model-router.ts` - 智能模型路由
  - Plan 任务使用 GPT-4o（未来切换 GPT-5.1）
  - Implement/Repair 使用 Claude Sonnet 4
  - 统一的调用接口和结果格式
- `lib/llm/prompts.ts` - Prompt 模板
  - Plan 系统提示词和用户提示词生成
  - Implement 系统提示词和用户提示词生成
  - Repair 系统提示词和用户提示词生成

#### 3. RTL 模块
- `lib/rtl/job-service.ts` - RTL Job 服务
  - Plan/Implement/Repair 任务执行
  - LLM 调用和结果解析
  - 用量记录和扣费

#### 4. API 路由

**CBB APIs**:
- `POST /api/cbb/resolve` - 解析 CBB 需求，返回候选项（不扣费）
- `GET /api/cbb/resolve` - 搜索/获取热门 CBB
- `POST /api/cbb/checkout` - 扣费并生成收据（幂等）
- `GET /api/cbb/checkout` - 获取购买历史
- `POST /api/cbb/deliver` - 发放下载凭证
- `GET /api/cbb/deliver` - 获取收据详情

**Job APIs**:
- `POST /api/jobs/plan` - 创建 Plan 任务（GPT-4o）
- `GET /api/jobs/plan` - 获取 Plan Job 状态
- `POST /api/jobs/implement` - 创建 Implement 任务（Claude Sonnet）
- `GET /api/jobs/implement` - 获取 Implement Job 状态
- `POST /api/jobs/repair` - 创建 Repair 任务（Claude Sonnet）
- `GET /api/jobs/repair` - 获取 Repair Job 状态

**Usage API**:
- `GET /api/usage` - 获取用量统计和 USD Pool 状态
- `PATCH /api/usage` - 设置超额限制

#### 5. 数据库迁移
- `lib/db/migrations/001_genrtl_tables.sql`
  - `cbb_registry` - CBB 资产包元数据
  - `cbb_receipts` - 购买收据
  - `usage_ledger` - 统一记账
  - `usd_pools` - 用户美元池状态
  - `usd_pool_transactions` - 美元池交易记录
  - `rtl_jobs` - Plan/Implement/Repair 任务
  - RLS 策略配置

**订阅计划配置**:

| 计划 | 月费 | 美元池 | Plan | Implement | Repair | CBB | On-Demand |
|------|------|--------|------|-----------|--------|-----|-----------|
| Free | $0 | $5 | ✅ | ❌ | ❌ | ❌ | ❌ |
| Basic | $20 | $50 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Professional | $50 | $150 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enterprise | $200 | $1000 | ✅ | ✅ | ✅ | ✅ | ✅ |

**环境变量新增**:
```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=             # Claude API 密钥
```

**修改文件清单**:
- `lib/cbb/types.ts` - 新建
- `lib/cbb/registry.ts` - 新建
- `lib/cbb/commerce.ts` - 新建
- `lib/cbb/usage-ledger.ts` - 新建
- `lib/cbb/usd-pool.ts` - 新建
- `lib/cbb/index.ts` - 新建
- `lib/llm/model-router.ts` - 新建
- `lib/llm/prompts.ts` - 新建
- `lib/llm/index.ts` - 新建
- `lib/rtl/job-service.ts` - 新建
- `lib/rtl/index.ts` - 新建
- `app/api/cbb/resolve/route.ts` - 新建
- `app/api/cbb/checkout/route.ts` - 新建
- `app/api/cbb/deliver/route.ts` - 新建
- `app/api/jobs/plan/route.ts` - 新建
- `app/api/jobs/implement/route.ts` - 新建
- `app/api/jobs/repair/route.ts` - 新建
- `app/api/usage/route.ts` - 新建
- `lib/db/migrations/001_genrtl_tables.sql` - 新建

**下一步**:
1. 在 Supabase Dashboard 执行迁移脚本
2. 创建 `cbb-packages` Storage Bucket
3. 配置 Anthropic API Key
4. 测试 Plan/Implement/Repair 工作流

**状态**: ✅ 已完成

---