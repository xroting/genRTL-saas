import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { verifyDebugAccess } from '@/lib/security/webhook-verification';

/**
 * 测试支付宝支付方式是否可用
 * 访问: /api/test-alipay
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
    console.warn('⚠️ [Test Alipay] Access denied:', accessCheck.reason);
    return NextResponse.json(
      { error: 'Access denied', reason: accessCheck.reason },
      { status: 403 }
    );
  }
  try {
    console.log('[test-alipay] Testing Alipay payment method availability...');

    // 测试1: 列出所有可用的支付方式
    const paymentMethods = await stripe.paymentMethods.list({
      type: 'alipay',
      limit: 1
    });

    console.log('[test-alipay] Payment methods query result:', paymentMethods);

    // 测试2: 尝试创建一个测试 checkout session
    const testSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'alipay'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
            },
            unit_amount: 1000,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });

    console.log('[test-alipay] ✅ Test session created successfully!');
    console.log('[test-alipay] Session ID:', testSession.id);
    console.log('[test-alipay] Payment method types:', testSession.payment_method_types);

    return NextResponse.json({
      success: true,
      message: 'Alipay is supported!',
      sessionId: testSession.id,
      paymentMethodTypes: testSession.payment_method_types,
      sessionUrl: testSession.url
    });

  } catch (error: any) {
    console.error('[test-alipay] ❌ Error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
      details: error.raw?.message || error.message
    }, { status: 400 });
  }
}
