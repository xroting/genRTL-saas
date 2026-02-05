import { NextRequest, NextResponse } from "next/server";
import { verifyDebugAccess } from "@/lib/security/webhook-verification";

/**
 * Inngest 测试端点
 * 
 * ⚠️ 安全警告: 此端点已被禁用
 * 
 * 原因: 禁用签名验证会导致安全风险,允许未授权的外部请求触发任务。
 * 
 * 替代方案:
 * 1. 使用 /api/inngest 端点 (带签名验证)
 * 2. 使用 Inngest Dev Server (本地开发)
 * 3. 使用 Inngest Cloud Dashboard (手动触发)
 */

async function handleRequest(request: NextRequest) {
  // 验证访问权限
  const accessCheck = await verifyDebugAccess(request);
  if (!accessCheck.allowed) {
    return NextResponse.json(
      { 
        error: 'Access denied', 
        reason: accessCheck.reason,
        message: 'This test endpoint is disabled. Please use /api/inngest with proper signing key.'
      },
      { status: 403 }
    );
  }

  // 即使有访问权限,也提示使用正式端点
  return NextResponse.json({
    warning: 'This endpoint is deprecated for security reasons.',
    message: 'Please use /api/inngest endpoint with proper Inngest signing key.',
    alternatives: [
      'Use Inngest Dev Server for local development',
      'Use Inngest Cloud Dashboard to manually trigger functions',
      'Configure INNGEST_SIGNING_KEY and use /api/inngest'
    ]
  }, { status: 410 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
