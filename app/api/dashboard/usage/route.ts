// Dashboard Usage API - 获取详细使用记录
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

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

    // 从 usage_ledger 获取使用记录
    const { data: usageData, error: usageError, count } = await supabase
      .from('usage_ledger')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (usageError) {
      console.error('Failed to fetch usage data:', usageError);
    }

    // 转换为前端需要的格式
    const records = (usageData || []).map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      type: record.bucket === 'included' ? 'included' : 'on_demand',
      model: record.model || 'Unknown',
      tokens: (record.input_tokens || 0) + (record.output_tokens || 0),
      cost: record.usd_cost || 0
    }));

    return NextResponse.json({
      success: true,
      records,
      total: count || 0,
      page,
      limit,
      range
    });
  } catch (error) {
    console.error('[Usage API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

