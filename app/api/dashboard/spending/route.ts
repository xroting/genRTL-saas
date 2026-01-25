// Dashboard Spending API - 获取 On-Demand 消费数据
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';

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
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // 获取用户的 USD Pool 状态
    const { data: pool } = await serviceSupabase
      .from('usd_pools')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 获取当前计费周期的开始日期
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 从 usage_ledger 获取 on_demand 使用记录
    const { data: usageData, error: usageError } = await serviceSupabase
      .from('usage_ledger')
      .select('*')
      .eq('user_id', user.id)
      .eq('bucket', 'on_demand')
      .gte('timestamp', startOfMonth.toISOString())
      .lte('timestamp', now.toISOString());

    if (usageError) {
      console.error('Failed to fetch on-demand usage:', usageError);
    }

    // 计算 on-demand 总消费
    const onDemandTotal = (usageData || []).reduce((sum, record) => sum + (record.usd_cost || 0), 0);

    // 按模型分类消费
    const breakdown: { category: string; tokens: number; cost: number }[] = [];
    const modelMap = new Map<string, { tokens: number; cost: number }>();

    for (const record of usageData || []) {
      const model = record.model || 'Unknown';
      const existing = modelMap.get(model) || { tokens: 0, cost: 0 };
      existing.tokens += (record.input_tokens || 0) + (record.output_tokens || 0);
      existing.cost += record.usd_cost || 0;
      modelMap.set(model, existing);
    }

    for (const [category, data] of modelMap) {
      breakdown.push({
        category,
        tokens: data.tokens,
        cost: data.cost
      });
    }

    // 按消费金额排序
    breakdown.sort((a, b) => b.cost - a.cost);

    return NextResponse.json({
      success: true,
      on_demand_total: onDemandTotal,
      spending_limit: pool?.on_demand_limit || null,
      billing_cycle_end: endOfMonth.toISOString(),
      breakdown
    });
  } catch (error) {
    console.error('[Spending API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

