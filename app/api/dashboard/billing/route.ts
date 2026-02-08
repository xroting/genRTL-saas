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
        next_billing_amount: null,
        included_usage: null,
        on_demand_usage: null
      });
    }

    // 获取团队的 Stripe customer ID
    const { data: team } = await serviceSupabase
      .from('teams')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', teamMember.team_id)
      .single();

    if (!team?.stripe_customer_id) {
      // 即使没有Stripe订阅，也查询usage数据
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const currentPeriodStart = thirtyDaysAgo.toISOString();
      const currentPeriodEnd = now.toISOString();
      
      // 查询usage数据
      let includedUsage = null;
      let onDemandUsage = null;
      
      try {
        const { data: includedData } = await serviceSupabase
          .from('usage_ledger')
          .select('input_tokens, output_tokens, model, usd_cost')
          .eq('user_id', user.id)
          .eq('bucket', 'included')
          .gte('timestamp', currentPeriodStart)
          .lte('timestamp', currentPeriodEnd);

        if (includedData && includedData.length > 0) {
          const totalTokens = includedData.reduce((sum, record) => 
            sum + (record.input_tokens || 0) + (record.output_tokens || 0), 0);
          const totalCost = includedData.reduce((sum, record) => 
            sum + (record.usd_cost || 0), 0);
          
          const byModel: Record<string, { tokens: number; cost: number }> = {};
          includedData.forEach(record => {
            const model = record.model || 'unknown';
            if (!byModel[model]) {
              byModel[model] = { tokens: 0, cost: 0 };
            }
            byModel[model].tokens += (record.input_tokens || 0) + (record.output_tokens || 0);
            byModel[model].cost += record.usd_cost || 0;
          });

          includedUsage = {
            total_tokens: totalTokens,
            total_cost: totalCost,
            by_model: byModel,
            period_start: currentPeriodStart,
            period_end: currentPeriodEnd
          };
        }

        // 查询on-demand usage
        const { data: onDemandData } = await serviceSupabase
          .from('usage_ledger')
          .select('input_tokens, output_tokens, model, usd_cost, kind')
          .eq('user_id', user.id)
          .eq('bucket', 'on_demand')
          .gte('timestamp', currentPeriodStart)
          .lte('timestamp', currentPeriodEnd);

        if (onDemandData && onDemandData.length > 0) {
          const totalCost = onDemandData.reduce((sum, record) => 
            sum + (record.usd_cost || 0), 0);
          
          const byType: Record<string, { count: number; cost: number }> = {};
          onDemandData.forEach(record => {
            const type = record.kind || 'unknown';
            if (!byType[type]) {
              byType[type] = { count: 0, cost: 0 };
            }
            byType[type].count += 1;
            byType[type].cost += record.usd_cost || 0;
          });

          onDemandUsage = {
            total_cost: totalCost,
            by_type: byType,
            period_start: currentPeriodStart,
            period_end: currentPeriodEnd
          };
        }
      } catch (e) {
        console.error('[Billing API] Failed to fetch usage:', e);
      }
      
      return NextResponse.json({
        success: true,
        invoices: [],
        payment_methods: [],
        next_billing_date: null,
        next_billing_amount: null,
        included_usage: includedUsage,
        on_demand_usage: onDemandUsage,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd
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
    let currentPeriodStart = null;
    let currentPeriodEnd = null;

    if (team.stripe_subscription_id) {
      try {
        const subscription: any = await stripe.subscriptions.retrieve(team.stripe_subscription_id);
        // 检查订阅状态是否有效
        if (subscription.status && subscription.status !== 'canceled' && subscription.current_period_end) {
          currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
          currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          nextBillingDate = currentPeriodEnd;
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

    // 获取当前周期的用量统计（从 usage_ledger）
    let includedUsage = null;
    let onDemandUsage = null;

    // 如果没有订阅周期，使用最近30天作为统计周期
    if (!currentPeriodStart || !currentPeriodEnd) {
      const now = new Date();
      currentPeriodEnd = now.toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      currentPeriodStart = thirtyDaysAgo.toISOString();
    }

    try {
      // 查询当前周期的 included 用量
      const { data: includedData } = await serviceSupabase
        .from('usage_ledger')
        .select('input_tokens, output_tokens, model, usd_cost')
        .eq('user_id', user.id)
        .eq('bucket', 'included')
        .gte('timestamp', currentPeriodStart)
        .lte('timestamp', currentPeriodEnd);

      if (includedData && includedData.length > 0) {
        const totalTokens = includedData.reduce((sum, record) => 
          sum + (record.input_tokens || 0) + (record.output_tokens || 0), 0);
        const totalCost = includedData.reduce((sum, record) => 
          sum + (record.usd_cost || 0), 0);
        
        // 按模型分组统计
        const byModel: Record<string, { tokens: number; cost: number }> = {};
        includedData.forEach(record => {
          const model = record.model || 'unknown';
          if (!byModel[model]) {
            byModel[model] = { tokens: 0, cost: 0 };
          }
          byModel[model].tokens += (record.input_tokens || 0) + (record.output_tokens || 0);
          byModel[model].cost += record.usd_cost || 0;
        });

        includedUsage = {
          total_tokens: totalTokens,
          total_cost: totalCost,
          by_model: byModel,
          period_start: currentPeriodStart,
          period_end: currentPeriodEnd
        };
      }

      // 查询当前周期的 on-demand 用量
      const { data: onDemandData, error: onDemandError } = await serviceSupabase
        .from('usage_ledger')
        .select('input_tokens, output_tokens, model, usd_cost, kind')
        .eq('user_id', user.id)
        .eq('bucket', 'on_demand')
        .gte('timestamp', currentPeriodStart)
        .lte('timestamp', currentPeriodEnd);

      if (onDemandData && onDemandData.length > 0) {
        const totalCost = onDemandData.reduce((sum, record) => 
          sum + (record.usd_cost || 0), 0);
        
        // 按类型分组统计
        const byType: Record<string, { count: number; cost: number }> = {};
        onDemandData.forEach(record => {
          const type = record.kind || 'unknown';
          if (!byType[type]) {
            byType[type] = { count: 0, cost: 0 };
          }
          byType[type].count += 1;
          byType[type].cost += record.usd_cost || 0;
        });

        onDemandUsage = {
          total_cost: totalCost,
          by_type: byType,
          period_start: currentPeriodStart,
          period_end: currentPeriodEnd
        };
      }
    } catch (e) {
      console.error('Failed to fetch usage data:', e);
    }

    return NextResponse.json({
      success: true,
      invoices,
      payment_methods: paymentMethods,
      next_billing_date: nextBillingDate,
      next_billing_amount: nextBillingAmount,
      included_usage: includedUsage,
      on_demand_usage: onDemandUsage,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd
    });
  } catch (error) {
    console.error('[Billing API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

