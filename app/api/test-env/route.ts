import { NextRequest, NextResponse } from 'next/server';
import { verifyDebugAccess } from '@/lib/security/webhook-verification';

/**
 * 环境变量测试端点
 * 
 * ⚠️ 安全限制:
 * - 仅在开发/预览环境可用 (生产环境强制禁用)
 * - 需要设置环境变量 ENABLE_DEBUG_ENDPOINTS=true
 * - 需要管理员权限
 */
export async function GET(request: NextRequest) {
  // 验证访问权限
  const accessCheck = await verifyDebugAccess(request);
  if (!accessCheck.allowed) {
    console.warn('⚠️ [Test Env] Access denied:', accessCheck.reason);
    return NextResponse.json(
      { error: 'Access denied', reason: accessCheck.reason },
      { status: 403 }
    );
  }

  return NextResponse.json({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    // 显示所有 NEXT_PUBLIC_ 开头的环境变量 (已过滤敏感信息)
    allPublicEnvVars: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, key) => {
        // 脱敏处理：隐藏部分值
        const value = process.env[key];
        if (value && value.length > 20) {
          acc[key] = value.substring(0, 10) + '...' + value.substring(value.length - 5);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | undefined>)
  });
}
