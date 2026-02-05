# 安全配置指南

本文档描述了 genRTL-SaaS 项目的安全配置要点和最佳实践。

## 目录

- [Webhook 签名验证](#webhook-签名验证)
- [调试端点保护](#调试端点保护)
- [环境变量配置](#环境变量配置)
- [部署检查清单](#部署检查清单)
- [安全监控](#安全监控)

---

## Webhook 签名验证

### Apple App Store Server Notifications

#### 配置要求

```bash
# .env
APPLE_KEY_ID=ABC1234567
APPLE_ISSUER_ID=12345678-1234-1234-1234-123456789012
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APPLE_BUNDLE_ID=com.monna.ai
APPLE_SHARED_SECRET=1234567890abcdef1234567890abcdef
```

#### 签名验证流程

1. **接收 Webhook 通知**
   - Apple 发送包含 `signedPayload` 的 POST 请求到 `/api/webhooks/apple`

2. **验证 JWT 签名**
   ```typescript
   // 使用 Apple JWKS 公钥验证签名
   const payload = await verifyAppleJWT(notification.signedPayload);
   ```

3. **验证交易信息**
   ```typescript
   // 验证 signedTransactionInfo
   const transactionInfo = await verifyAppleJWT(payload.data.signedTransactionInfo);
   
   // 验证 signedRenewalInfo (如果存在)
   const renewalInfo = await verifyAppleJWT(payload.data.signedRenewalInfo);
   ```

4. **签名验证失败处理**
   - 记录错误日志
   - 拒绝处理请求
   - 返回 200 (避免 Apple 重试)

#### Apple JWKS 端点

- 生产环境: `https://appleid.apple.com/auth/keys`
- JWT Issuer: `https://appleid.apple.com`
- JWT Audience: 您的 `APPLE_BUNDLE_ID`

#### 测试验证

```bash
# 使用 Apple Sandbox 环境测试
# 1. 在 App Store Connect 配置 Server Notification URL
# 2. 使用 TestFlight 购买测试订阅
# 3. 检查 webhook 日志确认签名验证成功
```

---

### Google Play Real-time Developer Notifications

#### 配置要求

```bash
# .env
GOOGLE_PLAY_PACKAGE_NAME=com.monna.ai
GOOGLE_PLAY_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"..."}'
```

#### 签名验证流程

1. **验证 Pub/Sub JWT Token**
   ```typescript
   // 验证 Authorization Bearer token
   const authHeader = request.headers.get('Authorization');
   const isValid = await verifyGooglePubSubToken(authHeader);
   
   if (!isValid) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

2. **验证 Token 字段**
   - `iss` (issuer): `accounts.google.com` 或 `https://accounts.google.com`
   - `email`: `google-play-developer-notifications@system.gserviceaccount.com`
   - `aud` (audience): 您的 webhook 端点 URL

3. **解析通知内容**
   ```typescript
   // Pub/Sub message.data 是 Base64 编码的 JSON
   const decodedData = Buffer.from(pubsubMessage.message.data, 'base64').toString('utf-8');
   const notification = JSON.parse(decodedData);
   ```

#### Google OAuth2 JWKS 端点

- JWKS URL: `https://www.googleapis.com/oauth2/v3/certs`
- Issuer: `accounts.google.com`
- Service Account Email: `google-play-developer-notifications@system.gserviceaccount.com`

#### 配置 Pub/Sub 推送订阅

```bash
# 1. 在 Google Cloud Console 创建 Pub/Sub Topic
gcloud pubsub topics create android.publisher.rtdn

# 2. 在 Google Play Console 配置 RTDN
# 设置 → 开发者帐号 → API 访问权限 → 实时开发者通知

# 3. 创建 Push Subscription
gcloud pubsub subscriptions create rtdn-webhook \
  --topic=android.publisher.rtdn \
  --push-endpoint=https://your-domain.com/api/webhooks/google-play \
  --push-auth-service-account=google-play-developer-notifications@system.gserviceaccount.com
```

#### 测试验证

```bash
# 使用 Google Play Test Track 测试
# 1. 在 Google Play Console 配置测试订阅
# 2. 使用测试账号购买订阅
# 3. 检查 webhook 日志确认 JWT 验证成功
```

---

## 调试端点保护

### 三层保护机制

#### 1. 环境变量开关

```bash
# .env.local (开发环境)
ENABLE_DEBUG_ENDPOINTS=true

# .env (生产环境)
ENABLE_DEBUG_ENDPOINTS=false  # 或完全不设置
```

**作用**: 总开关，未启用时所有调试端点返回 403

#### 2. 生产环境强制禁用

```typescript
// 在生产环境自动禁用，即使设置了 ENABLE_DEBUG_ENDPOINTS=true
if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
  return { allowed: false, reason: 'Not available in production' };
}
```

**作用**: 防止意外在生产环境启用调试端点

#### 3. 管理员权限验证

```typescript
// 验证用户是否有管理员权限
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
  return { allowed: false, reason: 'Admin access required' };
}
```

**作用**: 确保只有管理员可以访问调试端点

### 受保护的端点

| 端点 | 用途 | 保护级别 |
|------|------|---------|
| `/api/community/debug` | 查询社区分享数据（绕过 RLS） | 三层保护 |
| `/api/inngest-debug` | 检查 Inngest 环境变量 | 三层保护 |
| `/api/inngest-test` | Inngest 无签名测试端点 | 完全禁用 |
| `/api/test-stripe-config` | 测试 Stripe 配置 | 三层保护 |
| `/api/test-alipay` | 测试支付宝支付 | 三层保护 |

### 访问被拒绝响应示例

```json
{
  "error": "Access denied",
  "reason": "Debug endpoints are disabled"
}
```

```json
{
  "error": "Access denied",
  "reason": "Admin access required"
}
```

---

## 环境变量配置

### 必需的安全配置

```bash
# ============================================
# 移动端订阅配置
# ============================================

# Apple App Store
APPLE_KEY_ID=                    # App Store Connect API Key ID
APPLE_ISSUER_ID=                 # App Store Connect Issuer ID
APPLE_PRIVATE_KEY=               # PKCS8 私钥（替换 \n 为实际换行）
APPLE_BUNDLE_ID=com.monna.ai     # iOS App Bundle ID
APPLE_SHARED_SECRET=             # 收据验证共享密钥（旧版 API）

# Google Play
GOOGLE_PLAY_PACKAGE_NAME=com.monna.ai
GOOGLE_PLAY_SERVICE_ACCOUNT=     # Service Account JSON（完整 JSON 字符串）

# ============================================
# 安全与调试配置
# ============================================

# 调试端点开关（⚠️ 生产环境必须设为 false 或不设置）
ENABLE_DEBUG_ENDPOINTS=false

# Supabase Service Role Key（仅服务端使用，严格保密）
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Webhook Secret（签名验证）
STRIPE_WEBHOOK_SECRET=whsec_***

# Inngest Signing Key（签名验证）
INNGEST_SIGNING_KEY=signkey-***
```

### 环境变量验证

```bash
# 检查必需的环境变量
node scripts/check-env.js
```

---

## 部署检查清单

### 生产部署前

- [ ] 确认 `ENABLE_DEBUG_ENDPOINTS` 设为 `false` 或未设置
- [ ] 确认所有 webhook 密钥已正确配置
- [ ] 确认 Supabase Service Role Key 已设置
- [ ] 确认 Stripe Webhook Secret 已设置
- [ ] 确认 Inngest Signing Key 已设置（如使用 Inngest）
- [ ] 运行安全验证脚本: `node scripts/verify-security-fixes.js`
- [ ] 在预览环境测试 webhook 签名验证
- [ ] 验证调试端点在生产环境不可访问

### Apple App Store 配置

- [ ] 在 App Store Connect 生成 API Key
- [ ] 配置 Server Notification URL (v2): `https://your-domain.com/api/webhooks/apple`
- [ ] 测试 Sandbox 环境订阅流程
- [ ] 验证签名验证在日志中显示成功

### Google Play 配置

- [ ] 在 Google Cloud Console 创建 Service Account
- [ ] 授予 Service Account 必要权限
- [ ] 在 Google Play Console 启用 RTDN
- [ ] 配置 Pub/Sub Push Subscription
- [ ] 测试 Pub/Sub 推送和 JWT 验证

### Vercel 部署配置

```bash
# 设置环境变量
vercel env add APPLE_KEY_ID production
vercel env add APPLE_ISSUER_ID production
vercel env add APPLE_PRIVATE_KEY production
# ... 其他环境变量

# 部署
vercel --prod

# 验证部署
curl -X POST https://your-domain.com/api/webhooks/apple \
  -H "Content-Type: application/json" \
  -d '{"signedPayload":"invalid"}' \
  # 应该返回 200 但在日志中显示签名验证失败
```

---

## 安全监控

### 日志监控要点

#### 1. Webhook 签名验证失败

```typescript
// 关键日志关键词
"❌ [Apple JWT] Signature verification failed"
"❌ [Google Pub/Sub] Token verification failed"
```

**告警条件**: 超过每小时 10 次签名验证失败

**可能原因**:
- 攻击者尝试伪造 webhook 请求
- 环境变量配置错误
- Apple/Google 更新了 JWKS 密钥

#### 2. 未授权的调试端点访问

```typescript
// 关键日志关键词
"⚠️ [Admin] User does not have admin role"
"⚠️ [Admin] Debug endpoints disabled in production"
```

**告警条件**: 任何生产环境的访问尝试

**可能原因**:
- 攻击者扫描端点
- 开发人员误操作
- 环境配置错误

#### 3. 订阅状态异常变更

```typescript
// 关键日志关键词
"❌ [Apple Webhook] No subscription found"
"❌ [Google Play Webhook] No subscription found"
```

**告警条件**: 超过每小时 5 次找不到订阅记录

**可能原因**:
- 数据库同步问题
- 攻击者伪造的事件（已被签名验证拦截）
- 用户在多设备上操作

### Vercel 日志分析

```bash
# 查看最近的 webhook 日志
vercel logs --filter="/api/webhooks" --since=1h

# 查看调试端点访问尝试
vercel logs --filter="Access denied" --since=24h

# 查看签名验证失败
vercel logs --filter="verification failed" --since=1h
```

### 安全指标监控

建议使用 Vercel Analytics 或第三方服务监控:

1. **Webhook 成功率**
   - 目标: > 99%
   - 告警阈值: < 95%

2. **签名验证失败率**
   - 目标: < 0.1%
   - 告警阈值: > 1%

3. **401/403 错误率**
   - 调试端点: 预期 100% (生产环境)
   - Webhook 端点: < 0.1%

4. **响应时间**
   - Webhook 处理: < 1s
   - 签名验证: < 200ms

---

## 安全最佳实践

### 1. 定期轮换密钥

```bash
# 建议每 90 天轮换一次:
# - Apple API Keys
# - Google Service Account Keys
# - Stripe Webhook Secrets
# - Inngest Signing Keys
```

### 2. 最小权限原则

- Service Role Key 仅在必要的服务端代码中使用
- 调试端点仅授权给必要的管理员
- Google Service Account 仅授予必要的权限

### 3. 代码审计

```bash
# 定期检查敏感配置
grep -r "SUPABASE_SERVICE_ROLE_KEY" app/
grep -r "createSupabaseServiceRole" app/

# 确认没有硬编码密钥
grep -r "sk_live_" app/
grep -r "whsec_" app/
```

### 4. 依赖更新

```bash
# 定期更新安全相关依赖
npm update jose
npm update @supabase/ssr
npm update stripe
npm audit fix
```

---

## 故障排查

### Webhook 签名验证失败

#### 症状
```
❌ [Apple JWT] Signature verification failed: JWSSignatureVerificationFailed
```

#### 排查步骤

1. **验证环境变量**
   ```bash
   # 检查 APPLE_BUNDLE_ID 是否正确
   echo $APPLE_BUNDLE_ID
   ```

2. **检查 JWKS 可访问性**
   ```bash
   curl https://appleid.apple.com/auth/keys
   ```

3. **验证 JWT 格式**
   ```javascript
   const jwt = require('jsonwebtoken');
   const decoded = jwt.decode(signedPayload, { complete: true });
   console.log(decoded.header);  // 检查 alg 和 kid
   ```

4. **查看详细错误日志**
   ```typescript
   // 临时添加详细日志
   try {
     const payload = await verifyAppleJWT(signedToken);
   } catch (error) {
     console.error('Verification error:', {
       message: error.message,
       code: error.code,
       token: signedToken.substring(0, 50) + '...'
     });
   }
   ```

### Google Pub/Sub JWT 验证失败

#### 症状
```
❌ [Google Pub/Sub] Token verification failed
```

#### 排查步骤

1. **检查 Authorization Header**
   ```typescript
   console.log('Auth header:', request.headers.get('Authorization'));
   ```

2. **验证 Service Account Email**
   ```typescript
   const { payload } = await jwtVerify(token, JWKS);
   console.log('Email:', payload.email);
   console.log('Expected:', 'google-play-developer-notifications@system.gserviceaccount.com');
   ```

3. **检查 Pub/Sub 配置**
   ```bash
   # 验证 Push Subscription 配置
   gcloud pubsub subscriptions describe rtdn-webhook
   ```

### 调试端点访问被拒绝

#### 症状
```json
{ "error": "Access denied", "reason": "Debug endpoints are disabled" }
```

#### 排查步骤

1. **检查环境变量**
   ```bash
   echo $ENABLE_DEBUG_ENDPOINTS
   # 应该返回 "true" (开发环境) 或空 (生产环境)
   ```

2. **检查用户权限**
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
   ```

3. **检查环境类型**
   ```typescript
   console.log('NODE_ENV:', process.env.NODE_ENV);
   console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
   ```

---

## 参考链接

- [Apple App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Apple Server Notifications v2](https://developer.apple.com/documentation/appstoreservernotifications)
- [Google Play Developer API](https://developers.google.com/android-publisher)
- [Google Play RTDN](https://developer.android.com/google/play/billing/rtdn-reference)
- [JOSE (JWT/JWS/JWE)](https://github.com/panva/jose)
- [Stripe Webhook 签名验证](https://stripe.com/docs/webhooks/signatures)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 联系与支持

如果您发现安全问题或需要帮助，请联系:

- **安全问题**: security@monna.us
- **技术支持**: support@monna.us
- **文档更新**: 提交 PR 到本仓库

---

**最后更新**: 2026-02-04
