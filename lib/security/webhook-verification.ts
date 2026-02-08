/**
 * Webhook 安全验证工具
 * 用于验证来自 Apple、Google 的 webhook 签名
 */

import { jwtVerify, createRemoteJWKSet, decodeProtectedHeader } from 'jose';

// Apple App Store Server Notification JWKS URL
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

// Google Pub/Sub JWT 验证配置
const GOOGLE_PUB_SUB_ISSUER = 'accounts.google.com';
const GOOGLE_PUB_SUB_EMAIL = 'google-play-developer-notifications@system.gserviceaccount.com';

/**
 * 验证 Apple JWT 签名
 * 使用 Apple 的 JWKS 公钥验证 signedPayload/signedTransactionInfo/signedRenewalInfo
 */
export async function verifyAppleJWT(signedToken: string): Promise<any> {
  try {
    console.log('🔐 [Apple JWT] Verifying signature...');

    // 获取 Apple 的公钥集
    const JWKS = createRemoteJWKSet(new URL(APPLE_JWKS_URL));

    // 验证 JWT 签名
    const { payload } = await jwtVerify(signedToken, JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_BUNDLE_ID || 'com.monna.ai',
    });

    console.log('✅ [Apple JWT] Signature verified successfully');
    return payload;

  } catch (error: any) {
    console.error('❌ [Apple JWT] Signature verification failed:', error.message);
    throw new Error(`Apple JWT verification failed: ${error.message}`);
  }
}

/**
 * 验证 Google Pub/Sub Push 请求
 * 验证 Authorization Bearer token 的签名和字段
 */
export async function verifyGooglePubSubToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ [Google Pub/Sub] Missing or invalid Authorization header');
    return false;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    console.log('🔐 [Google Pub/Sub] Verifying JWT token...');

    // 解码 header 获取 kid (Key ID)
    const header = decodeProtectedHeader(token);
    
    // 获取 Google 的公钥
    const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

    // 验证 JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: [GOOGLE_PUB_SUB_ISSUER, `https://${GOOGLE_PUB_SUB_ISSUER}`],
    });

    // 验证 email 字段 (Pub/Sub service account)
    if (payload.email !== GOOGLE_PUB_SUB_EMAIL) {
      console.error(`❌ [Google Pub/Sub] Invalid email: ${payload.email}`);
      return false;
    }

    // 验证 audience (应该是订阅的 push endpoint URL)
    // Note: 生产环境应该验证 aud 是否匹配您的端点 URL
    console.log(`   Audience: ${payload.aud}`);
    console.log(`   Email: ${payload.email}`);

    console.log('✅ [Google Pub/Sub] Token verified successfully');
    return true;

  } catch (error: any) {
    console.error('❌ [Google Pub/Sub] Token verification failed:', error.message);
    return false;
  }
}

/**
 * 验证是否为管理员用户
 * 用于保护调试和测试端点
 */
export async function verifyAdminAccess(request: Request): Promise<boolean> {
  try {
    // 检查环境变量开关
    if (process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
      console.log('⚠️ [Admin] Debug endpoints disabled via environment variable');
      return false;
    }

    // 在生产环境强制禁用
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      console.log('⚠️ [Admin] Debug endpoints disabled in production');
      return false;
    }

    // 获取用户会话
    const { createSupabaseServer } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('⚠️ [Admin] User not authenticated');
      return false;
    }

    // 检查用户是否有管理员权限
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      console.log(`⚠️ [Admin] User ${user.id} does not have admin role`);
      return false;
    }

    console.log(`✅ [Admin] Admin access granted for user ${user.id}`);
    return true;

  } catch (error: any) {
    console.error('❌ [Admin] Verification error:', error.message);
    return false;
  }
}

/**
 * 验证调试端点访问权限
 * 包含环境检查和管理员验证
 */
export async function verifyDebugAccess(request: Request): Promise<{ allowed: boolean; reason?: string }> {
  // 1. 检查环境变量开关
  if (process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return { allowed: false, reason: 'Debug endpoints are disabled' };
  }

  // 2. 在生产环境强制禁用
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return { allowed: false, reason: 'Debug endpoints are not available in production' };
  }

  // 3. 验证管理员权限
  const isAdmin = await verifyAdminAccess(request);
  if (!isAdmin) {
    return { allowed: false, reason: 'Admin access required' };
  }

  return { allowed: true };
}
