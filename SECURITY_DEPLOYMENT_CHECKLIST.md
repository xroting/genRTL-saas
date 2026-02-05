# 安全修复部署检查清单

**修复日期**: 2026-02-04  
**修复范围**: 两轮安全审计 (9个安全问题)  
**部署前必读**: 本文档包含所有部署前必须完成的检查项

---

## 📋 部署前检查清单

### 1️⃣ 环境变量配置

#### 必需的新增环境变量

```bash
# Apple App Store 订阅
APPLE_KEY_ID=                    # ✅ 已配置 / ❌ 待配置
APPLE_ISSUER_ID=                 # ✅ 已配置 / ❌ 待配置
APPLE_PRIVATE_KEY=               # ✅ 已配置 / ❌ 待配置
APPLE_BUNDLE_ID=com.monna.ai     # ✅ 已配置 / ❌ 待配置
APPLE_SHARED_SECRET=             # ✅ 已配置 / ❌ 待配置

# Google Play 订阅
GOOGLE_PLAY_PACKAGE_NAME=        # ✅ 已配置 / ❌ 待配置
GOOGLE_PLAY_SERVICE_ACCOUNT=     # ✅ 已配置 / ❌ 待配置
```

#### 安全开关确认

```bash
# ⚠️ 生产环境必须为 false 或不设置
ENABLE_DEBUG_ENDPOINTS=false     # ✅ 已确认 / ❌ 待确认
```

**验证命令**:
```bash
# 在 Vercel 中检查
vercel env ls production

# 确认以下变量:
# 1. ENABLE_DEBUG_ENDPOINTS 不存在或为 false
# 2. Apple 和 Google Play 密钥已配置
# 3. Stripe webhook secret 已配置
```

---

### 2️⃣ 代码部署验证

#### Git提交确认

```bash
# 确认所有修改已提交
git status

# 应该显示:
# On branch main
# nothing to commit, working tree clean
```

#### 修改文件清单

**第一轮修复** (Webhook签名 + 调试端点):
- [x] `lib/security/webhook-verification.ts` - 新建
- [x] `lib/mobile-subscriptions/apple-store.ts` - 修改
- [x] `app/api/webhooks/apple/route.ts` - 修改
- [x] `app/api/webhooks/google-play/route.ts` - 修改
- [x] `app/api/community/debug/route.ts` - 修改
- [x] `app/api/inngest-debug/route.ts` - 修改
- [x] `app/api/inngest-test/route.ts` - 修改
- [x] `app/api/test-stripe-config/route.ts` - 修改
- [x] `app/api/test-alipay/route.ts` - 修改

**第二轮修复** (API费用 + 日志 + CORS):
- [x] `lib/security/cors.ts` - 新建
- [x] `app/api/translate/route.ts` - 删除
- [x] `app/api/test-env/route.ts` - 修改
- [x] `app/api/chat/route.ts` - 修改
- [x] `app/api/auth/signup/route.ts` - 修改
- [x] `app/api/auth/verify-otp/route.ts` - 修改

---

### 3️⃣ 本地测试验证

#### 运行验证脚本

```bash
# 第一轮修复验证
node scripts/verify-security-fixes.js

# 第二轮修复验证
node scripts/verify-security-fixes-round2.js

# 预期结果: 所有测试通过
```

#### 手动测试要点

**调试端点保护** (应返回403):
```bash
curl http://localhost:3005/api/community/debug
curl http://localhost:3005/api/inngest-debug
curl http://localhost:3005/api/test-env
curl http://localhost:3005/api/test-stripe-config
curl http://localhost:3005/api/test-alipay
```

**翻译接口删除** (应返回404):
```bash
curl -X POST http://localhost:3005/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"test","targetLanguage":"zh"}'
```

**CORS配置**:
```bash
# 未授权源 - 不应有CORS header
curl -H "Origin: https://malicious.com" \
     -X OPTIONS http://localhost:3005/api/chat

# 授权源 - 应返回对应的Origin
curl -H "Origin: http://localhost:3000" \
     -X OPTIONS http://localhost:3005/api/chat \
     -v | grep -i "access-control"
```

---

### 4️⃣ 预览环境部署

#### 部署到预览环境

```bash
# 部署到 Vercel 预览环境
vercel

# 获取预览URL
# 例如: https://genrtl-saas-abc123.vercel.app
```

#### 预览环境测试

**设置预览环境变量**:
```bash
# 启用调试端点(仅预览环境)
vercel env add ENABLE_DEBUG_ENDPOINTS preview
# 输入: true

# 配置必要的密钥
vercel env add APPLE_KEY_ID preview
vercel env add APPLE_ISSUER_ID preview
# ... 其他密钥
```

**测试Webhook签名验证**:
```bash
# 使用无效签名测试Apple webhook
curl -X POST https://your-preview.vercel.app/api/webhooks/apple \
  -H "Content-Type: application/json" \
  -d '{"signedPayload":"invalid.jwt.token"}'

# 预期: 返回200但日志显示签名验证失败
```

**测试CORS限制**:
```bash
# 测试预览域名是否在允许列表
curl -H "Origin: https://genrtl-saas-abc123.vercel.app" \
     -X OPTIONS https://genrtl-saas-abc123.vercel.app/api/chat \
     -v

# 应该返回: Access-Control-Allow-Origin: https://genrtl-saas-abc123.vercel.app
```

---

### 5️⃣ 生产环境部署

#### 部署前最终检查

- [ ] 所有本地测试通过
- [ ] 预览环境测试通过
- [ ] 生产环境变量已配置
- [ ] `ENABLE_DEBUG_ENDPOINTS` 未设置或为 false
- [ ] Apple/Google Play 密钥已配置
- [ ] CORS允许列表包含生产域名

#### 部署命令

```bash
# 最终检查
vercel env ls production

# 部署到生产环境
vercel --prod

# 记录部署URL和时间
```

#### 部署后验证

**立即验证**:

1. **调试端点已禁用**:
```bash
curl https://www.monna.us/api/community/debug
# 预期: 403 Access denied

curl https://www.monna.us/api/test-env
# 预期: 403 Access denied

curl https://www.monna.us/api/inngest-test
# 预期: 403 Access denied
```

2. **翻译接口已删除**:
```bash
curl -X POST https://www.monna.us/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}'
# 预期: 404 Not Found
```

3. **CORS配置正确**:
```bash
# 测试生产域名
curl -H "Origin: https://www.monna.us" \
     -X OPTIONS https://www.monna.us/api/chat \
     -v | grep -i "access-control"
# 预期: Access-Control-Allow-Origin: https://www.monna.us

# 测试未授权域名
curl -H "Origin: https://malicious.com" \
     -X OPTIONS https://www.monna.us/api/chat \
     -v | grep -i "access-control"
# 预期: 无 Access-Control-Allow-Origin header
```

4. **Webhook端点可用**:
```bash
# 发送测试webhook (会返回200但记录签名验证失败)
curl -X POST https://www.monna.us/api/webhooks/apple \
  -H "Content-Type: application/json" \
  -d '{"signedPayload":"test"}'
# 预期: 200 {"received":true}
```

---

### 6️⃣ 监控配置

#### Vercel 日志监控

设置以下告警:

1. **签名验证失败** (webhook安全):
```
Search: "Signature verification failed"
Frequency: > 10/hour
Action: Email alert
```

2. **未授权访问尝试** (调试端点):
```
Search: "Access denied"
Frequency: Any in production
Action: Email alert
```

3. **CORS拒绝** (可选):
```
Search: "Origin not allowed"
Frequency: > 20/hour
Action: Email alert
```

#### 日志检查要点

定期检查以下日志:

```bash
# 查看最近的webhook日志
vercel logs --filter="/api/webhooks" --since=1h

# 查看认证失败日志
vercel logs --filter="Authentication failed" --since=1h

# 查看调试端点访问尝试
vercel logs --filter="debug" --since=24h
```

**正常日志示例**:
```
[chat_1234567890_abc] User authenticated: uuid
[chat_1234567890_abc] Message roles: user -> assistant
[chat_1234567890_abc] Tool names: read_file, edit_file
[chat_1234567890_abc] Cost: $0.001234, tokens: 500+800
```

**异常日志示例** (需要关注):
```
❌ [Apple JWT] Signature verification failed
⚠️ [Community Debug] Access denied: Debug endpoints disabled in production
❌ [Google Pub/Sub] Token verification failed
```

---

### 7️⃣ 外部服务配置

#### Apple App Store Connect

- [ ] 配置 Server Notification URL (v2)
  - URL: `https://www.monna.us/api/webhooks/apple`
  - 在 App Store Connect → 应用 → App Information → App Store Server Notifications

- [ ] 测试沙盒环境
  - 使用 TestFlight 购买测试订阅
  - 检查 webhook 日志确认签名验证成功

#### Google Play Console

- [ ] 配置 Real-time Developer Notifications
  - Topic: `projects/your-project/topics/android.publisher.rtdn`
  - 在 Google Play Console → 设置 → 开发者帐号 → API 访问权限

- [ ] 配置 Pub/Sub Push Subscription
```bash
gcloud pubsub subscriptions create rtdn-webhook \
  --topic=android.publisher.rtdn \
  --push-endpoint=https://www.monna.us/api/webhooks/google-play \
  --push-auth-service-account=google-play-developer-notifications@system.gserviceaccount.com
```

- [ ] 测试通知
  - 使用 Test Track 购买测试订阅
  - 检查 webhook 日志确认 JWT 验证成功

---

### 8️⃣ 安全审计清单

部署完成后，执行以下安全检查:

#### Webhook 安全
- [x] Apple webhook 签名验证已启用
- [x] Google Play webhook JWT 验证已启用
- [x] Stripe webhook 签名验证已启用(已存在)
- [ ] Webhook 端点有适当的速率限制(可选)

#### 端点保护
- [x] 所有调试端点已保护或禁用
- [x] 测试端点已保护
- [x] 环境变量枚举已保护
- [x] 翻译接口已删除

#### 日志安全
- [x] 不记录 Bearer token
- [x] 不记录完整消息内容
- [x] 使用 requestId 追踪
- [x] 仅记录必要元数据

#### CORS 安全
- [x] 限制允许的源域名
- [x] 动态设置 Access-Control-Allow-Origin
- [x] 包含 Vary: Origin header
- [x] 生产域名在允许列表

---

## 📊 部署状态跟踪

### 部署信息

- **部署日期**: _________
- **部署人员**: _________
- **部署环境**: Production
- **Git Commit**: _________
- **Vercel URL**: _________

### 验证签名

- [ ] 本地测试通过
- [ ] 预览环境测试通过
- [ ] 生产部署完成
- [ ] 生产验证通过
- [ ] 监控配置完成
- [ ] 外部服务配置完成

### 验证人签名

- **技术负责人**: _________ (签名/日期)
- **安全审计**: _________ (签名/日期)

---

## 🆘 回滚计划

如果部署后发现严重问题:

### 立即回滚步骤

```bash
# 1. 在 Vercel Dashboard 回滚到上一个部署
# 或使用命令行:
vercel rollback

# 2. 检查回滚后状态
curl https://www.monna.us/api/auth/status

# 3. 检查问题日志
vercel logs --since=30m
```

### 已知风险和缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| CORS配置过严 | 合法请求被拒 | 临时添加域名到允许列表 |
| Webhook验证失败 | 订阅状态不更新 | 检查密钥配置,必要时禁用验证 |
| 日志追踪问题 | 难以调试 | 增加临时详细日志 |

---

## 📞 紧急联系方式

- **技术负责人**: _________
- **On-call工程师**: _________
- **安全团队**: security@monna.us

---

**最后更新**: 2026-02-04  
**检查清单版本**: 2.0  
**状态**: ✅ 准备部署 / ⏳ 待完成 / 🚀 已部署
