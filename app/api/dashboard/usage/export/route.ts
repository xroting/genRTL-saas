// Dashboard Usage Export API - 导出使用记录为 CSV
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

    // 从 usage_ledger 获取使用记录
    const { data: usageData, error: usageError } = await supabase
      .from('usage_ledger')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: false });

    if (usageError) {
      console.error('Failed to fetch usage data:', usageError);
    }

    // 生成 CSV 内容
    const headers = ['Date', 'Type', 'Model', 'Provider', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)'];
    const rows = (usageData || []).map(record => [
      new Date(record.timestamp).toISOString(),
      record.bucket === 'included' ? 'Included' : 'On-Demand',
      record.model || 'Unknown',
      record.provider || 'Unknown',
      record.input_tokens || 0,
      record.output_tokens || 0,
      (record.input_tokens || 0) + (record.output_tokens || 0),
      (record.usd_cost || 0).toFixed(4)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 返回 CSV 文件
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=usage-${range}-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error) {
    console.error('[Usage Export API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

