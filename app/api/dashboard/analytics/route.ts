// Dashboard Analytics API - 获取用户使用分析数据
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // 计算日期范围
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // 从 usage_ledger 获取每日使用数据
    const { data: usageData, error: usageError } = await supabase
      .from('usage_ledger')
      .select('timestamp, input_tokens, output_tokens, usd_cost')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true });

    if (usageError) {
      console.error('Failed to fetch usage data:', usageError);
    }

    // 聚合每日数据
    const dailyMap = new Map<string, { tokens: number; cost: number; requests: number }>();
    
    // 初始化所有日期
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyMap.set(dateKey, { tokens: 0, cost: 0, requests: 0 });
    }

    // 聚合使用数据
    if (usageData) {
      for (const record of usageData) {
        const dateKey = new Date(record.timestamp).toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || { tokens: 0, cost: 0, requests: 0 };
        existing.tokens += (record.input_tokens || 0) + (record.output_tokens || 0);
        existing.cost += record.usd_cost || 0;
        existing.requests += 1;
        dailyMap.set(dateKey, existing);
      }
    }

    // 转换为数组
    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        tokens: data.tokens,
        cost: data.cost,
        requests: data.requests
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 获取用户订阅的总配额
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single();

    let totalAllowed = 100000; // 默认值
    if (teamMember) {
      const { data: team } = await supabase
        .from('teams')
        .select('plan_name')
        .eq('id', teamMember.team_id)
        .single();

      if (team) {
        // 根据计划设置配额
        const quotas: Record<string, number> = {
          'free': 50000,
          'hobby': 50000,
          'basic': 200000,
          'professional': 1000000,
          'enterprise': 5000000
        };
        totalAllowed = quotas[team.plan_name] || 100000;
      }
    }

    return NextResponse.json({
      success: true,
      dailyUsage,
      totalAllowed,
      range
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

