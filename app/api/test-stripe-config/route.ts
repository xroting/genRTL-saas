import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { verifyDebugAccess } from '@/lib/security/webhook-verification';

/**
 * 诊断 Stripe 配置和支付方式可用性
 * 访问: /api/test-stripe-config
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
    console.warn('⚠️ [Test Stripe Config] Access denied:', accessCheck.reason);
    return NextResponse.json(
      { error: 'Access denied', reason: accessCheck.reason },
      { status: 403 }
    );
  }
  try {
    console.log('[test-stripe-config] Starting Stripe configuration test...');

    // 1. 获取账户信息
    const account = await stripe.accounts.retrieve();
    console.log('[test-stripe-config] Account country:', account.country);
    console.log('[test-stripe-config] Account capabilities:', account.capabilities);

    // 2. 列出支持的支付方式
    const paymentMethodConfigs = await stripe.paymentMethodConfigurations.list({
      limit: 1
    });
    console.log('[test-stripe-config] Payment method configs:', paymentMethodConfigs.data[0]?.id);

    // 3. 尝试创建多种测试 session
    const testResults: any = {
      account: {
        country: account.country,
        capabilities: account.capabilities
      },
      tests: []
    };

    // 测试 1: Card + Alipay (USD)
    try {
      const session1 = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'alipay'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'Test Product' },
            unit_amount: 10000,
            recurring: { interval: 'month' }
          },
          quantity: 1
        }],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      });

      testResults.tests.push({
        name: 'Card + Alipay (USD) Subscription',
        success: true,
        sessionId: session1.id,
        paymentMethodTypes: session1.payment_method_types,
        url: session1.url
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'Card + Alipay (USD) Subscription',
        success: false,
        error: error.message,
        code: error.code,
        type: error.type
      });
    }

    // 测试 2: Card + Alipay (CNY)
    try {
      const session2 = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'alipay'],
        line_items: [{
          price_data: {
            currency: 'cny',
            product_data: { name: 'Test Product' },
            unit_amount: 10000,
            recurring: { interval: 'month' }
          },
          quantity: 1
        }],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      });

      testResults.tests.push({
        name: 'Card + Alipay (CNY) Subscription',
        success: true,
        sessionId: session2.id,
        paymentMethodTypes: session2.payment_method_types,
        url: session2.url
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'Card + Alipay (CNY) Subscription',
        success: false,
        error: error.message,
        code: error.code,
        type: error.type
      });
    }

    // 测试 3: 只用 Alipay (USD)
    try {
      const session3 = await stripe.checkout.sessions.create({
        payment_method_types: ['alipay'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'Test Product' },
            unit_amount: 10000,
            recurring: { interval: 'month' }
          },
          quantity: 1
        }],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      });

      testResults.tests.push({
        name: 'Alipay only (USD) Subscription',
        success: true,
        sessionId: session3.id,
        paymentMethodTypes: session3.payment_method_types,
        url: session3.url
      });
    } catch (error: any) {
      testResults.tests.push({
        name: 'Alipay only (USD) Subscription',
        success: false,
        error: error.message,
        code: error.code,
        type: error.type
      });
    }

    return NextResponse.json(testResults, { status: 200 });

  } catch (error: any) {
    console.error('[test-stripe-config] Fatal error:', error);
    return NextResponse.json({
      error: error.message,
      type: error.type,
      code: error.code
    }, { status: 500 });
  }
}
