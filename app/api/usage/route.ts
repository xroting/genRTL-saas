// Usage API - 获取用量统计和 USD Pool 状态
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { UsageLedger, USDPoolManager } from '@/lib/cbb';

export async function GET(request: NextRequest) {
  try {
    // 1. 验证认证
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 2. 获取查询参数
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current'; // current, all
    const type = searchParams.get('type'); // pool, summary, history

    // 3. 根据类型返回不同数据
    if (type === 'pool') {
      // 获取 USD Pool 状态
      const pool = await USDPoolManager.getPoolStatus(user.id);
      if (!pool) {
        return NextResponse.json(
          { error: '未找到美元池信息' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        pool: {
          included_usd_balance: pool.included_usd_balance,
          included_usd_total: pool.included_usd_total,
          on_demand_usd: pool.on_demand_usd,
          on_demand_limit: pool.on_demand_limit,
          last_reset_at: pool.last_reset_at,
          next_reset_at: pool.next_reset_at,
        },
      });
    }

    if (type === 'history') {
      // 获取交易历史
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      const history = await USDPoolManager.getTransactionHistory({
        userId: user.id,
        limit,
        offset,
      });

      return NextResponse.json({
        success: true,
        history,
        total: history.length,
      });
    }

    // 默认返回用量汇总
    let summary;
    if (period === 'current') {
      summary = await UsageLedger.getCurrentPeriodUsage(user.id);
    } else {
      summary = await UsageLedger.getUserSummary({ userId: user.id });
    }

    // 同时获取 Pool 状态
    const pool = await USDPoolManager.getPoolStatus(user.id);

    return NextResponse.json({
      success: true,
      summary,
      pool: pool ? {
        included_usd_balance: pool.included_usd_balance,
        included_usd_total: pool.included_usd_total,
        on_demand_usd: pool.on_demand_usd,
        on_demand_limit: pool.on_demand_limit,
      } : null,
    });
  } catch (error) {
    console.error('[Usage API] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 设置超额限制
export async function PATCH(request: NextRequest) {
  try {
    // 1. 验证认证
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const body = await request.json();
    const { on_demand_limit } = body;

    // 验证限制值
    if (on_demand_limit !== null && (typeof on_demand_limit !== 'number' || on_demand_limit < 0)) {
      return NextResponse.json(
        { error: '超额限制必须是非负数或 null' },
        { status: 400 }
      );
    }

    // 3. 更新限制
    const success = await USDPoolManager.setOnDemandLimit(user.id, on_demand_limit);

    if (!success) {
      return NextResponse.json(
        { error: '更新失败' },
        { status: 500 }
      );
    }

    // 4. 返回更新后的状态
    const pool = await USDPoolManager.getPoolStatus(user.id);

    return NextResponse.json({
      success: true,
      pool: pool ? {
        on_demand_limit: pool.on_demand_limit,
      } : null,
    });
  } catch (error) {
    console.error('[Usage API PATCH] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
