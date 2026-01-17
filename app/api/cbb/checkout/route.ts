// CBB Checkout API - 扣费并生成收据（幂等）
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServer } from '@/lib/supabase/server';
import { CBBCommerce } from '@/lib/cbb';
import type { CBBCheckoutRequest, CBBCheckoutItem } from '@/lib/cbb/types';

// 请求体验证 Schema
const CheckoutRequestSchema = z.object({
  workspace_id: z.string().min(1, 'workspace_id 不能为空'),
  job_id: z.string().min(1, 'job_id 不能为空'),
  items: z.array(
    z.object({
      cbb_id: z.string().min(1, 'cbb_id 不能为空'),
      version: z.string().min(1, 'version 不能为空'),
    })
  ).min(1, '购买项目不能为空'),
  idempotency_key: z.string().min(1, 'idempotency_key 不能为空'),
});

export async function POST(request: NextRequest) {
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

    // 2. 解析并验证请求体
    const body = await request.json();
    const parseResult = CheckoutRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: '请求参数无效', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    // 3. 构建 Checkout 请求
    const checkoutRequest: CBBCheckoutRequest = {
      user_id: user.id,
      workspace_id: parseResult.data.workspace_id,
      job_id: parseResult.data.job_id,
      items: parseResult.data.items as CBBCheckoutItem[],
      idempotency_key: parseResult.data.idempotency_key,
    };

    console.log(`[CBB Checkout] User ${user.id} checking out ${checkoutRequest.items.length} items`);

    // 4. 执行 Checkout
    const result = await CBBCommerce.checkout(checkoutRequest);

    // 5. 返回结果
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '结账失败' },
        { status: 402 } // Payment Required
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CBB Checkout] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 获取购买历史
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
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 3. 获取购买历史
    const history = await CBBCommerce.getPurchaseHistory({
      userId: user.id,
      limit,
      offset,
    });

    // 4. 返回结果
    return NextResponse.json({
      success: true,
      items: history,
      total: history.length,
    });
  } catch (error) {
    console.error('[CBB Checkout GET] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
