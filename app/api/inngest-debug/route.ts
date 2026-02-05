import { NextRequest, NextResponse } from "next/server";
import { verifyDebugAccess } from "@/lib/security/webhook-verification";

/**
 * Inngest 调试端点
 * 用于检查环境变量配置
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
    console.warn('⚠️ [Inngest Debug] Access denied:', accessCheck.reason);
    return NextResponse.json(
      { error: 'Access denied', reason: accessCheck.reason },
      { status: 403 }
    );
  }
  const eventKey = process.env.INNGEST_EVENT_KEY;
  const signingKey = process.env.INNGEST_SIGNING_KEY;

  // 检查所有可能的 Inngest 环境变量
  const allInngestEnvs: Record<string, string | undefined> = {};
  for (const key in process.env) {
    if (key.toUpperCase().includes('INNGEST')) {
      const value = process.env[key];
      allInngestEnvs[key] = value ? value.substring(0, 15) + "..." : undefined;
    }
  }

  return NextResponse.json({
    debug: {
      hasEventKey: !!eventKey,
      eventKeyPrefix: eventKey ? eventKey.substring(0, 10) + "..." : "NOT_SET",
      eventKeyLength: eventKey?.length || 0,

      hasSigningKey: !!signingKey,
      signingKeyPrefix: signingKey ? signingKey.substring(0, 15) + "..." : "NOT_SET",
      signingKeyLength: signingKey?.length || 0,
      signingKeyFormat: signingKey?.startsWith("signkey-") ? "CORRECT" : "INCORRECT",

      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,

      allInngestEnvVars: allInngestEnvs,
    },
    warning: "⚠️ This endpoint exposes sensitive configuration. Delete after debugging!"
  });
}
