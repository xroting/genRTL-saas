// Dashboard Billing API - 获取账单和发票信息
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';
import { stripe } from '@/lib/payments/stripe';
import type Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户的团队信息
    const serviceSupabase = createSupabaseServiceRole();
    const { data: teamMember, error: memberError } = await serviceSupabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !teamMember) {
      return NextResponse.json({
        success: true,
        invoices: [],
        payment_methods: [],
        next_billing_date: null,
        next_billing_amount: null
      });
    }

    // 获取团队的 Stripe customer ID
    const { data: team } = await serviceSupabase
      .from('teams')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', teamMember.team_id)
      .single();

    if (!team?.stripe_customer_id) {
      return NextResponse.json({
        success: true,
        invoices: [],
        payment_methods: [],
        next_billing_date: null,
        next_billing_amount: null
      });
    }

    // 从 Stripe 获取发票
    let invoices: any[] = [];
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: team.stripe_customer_id,
        limit: 20
      });

      invoices = stripeInvoices.data.map(inv => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amount_due,
        currency: inv.currency,
        status: inv.status === 'paid' ? 'paid' : inv.status === 'open' ? 'pending' : inv.status,
        created_at: new Date(inv.created * 1000).toISOString(),
        due_date: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
        pdf_url: inv.invoice_pdf,
        hosted_invoice_url: inv.hosted_invoice_url
      }));
    } catch (e) {
      console.error('Failed to fetch invoices from Stripe:', e);
    }

    // 从 Stripe 获取支付方式
    let paymentMethods: any[] = [];
    try {
      const stripePMs = await stripe.paymentMethods.list({
        customer: team.stripe_customer_id,
        type: 'card'
      });

      paymentMethods = stripePMs.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
        is_default: false // TODO: 检查默认支付方式
      }));
    } catch (e) {
      console.error('Failed to fetch payment methods from Stripe:', e);
    }

    // 获取下次账单日期和金额
    let nextBillingDate = null;
    let nextBillingAmount = null;

    if (team.stripe_subscription_id) {
      try {
        const subscription: any = await stripe.subscriptions.retrieve(team.stripe_subscription_id);
        // 检查订阅状态是否有效
        if (subscription.status && subscription.status !== 'canceled' && subscription.current_period_end) {
          nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
          // 从订阅中获取金额（如果有 price 信息）
          if (subscription.items && subscription.items.data && subscription.items.data[0]) {
            const priceData = subscription.items.data[0].price;
            if (priceData && priceData.unit_amount) {
              nextBillingAmount = priceData.unit_amount;
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch subscription info:', e);
      }
    }

    return NextResponse.json({
      success: true,
      invoices,
      payment_methods: paymentMethods,
      next_billing_date: nextBillingDate,
      next_billing_amount: nextBillingAmount
    });
  } catch (error) {
    console.error('[Billing API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

