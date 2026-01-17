// CBB Deliver API - 发放下载凭证
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServer } from '@/lib/supabase/server';
import { CBBCommerce } from '@/lib/cbb';

// 请求体验证 Schema
const DeliverRequestSchema = z.object({
  receipt_id: z.string().uuid('receipt_id 必须是有效的 UUID'),
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
    const parseResult = DeliverRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: '请求参数无效', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    // 3. 验证收据所有权
    const receipt = await CBBCommerce.getReceipt(parseResult.data.receipt_id);
    if (!receipt) {
      return NextResponse.json(
        { error: '收据不存在' },
        { status: 404 }
      );
    }

    if (receipt.user_id !== user.id) {
      return NextResponse.json(
        { error: '无权访问此收据' },
        { status: 403 }
      );
    }

    console.log(`[CBB Deliver] User ${user.id} requesting delivery for receipt ${parseResult.data.receipt_id}`);

    // 4. 执行 Deliver
    const result = await CBBCommerce.deliver({
      receipt_id: parseResult.data.receipt_id,
    });

    // 5. 返回结果
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '发放下载凭证失败' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CBB Deliver] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 获取收据详情
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
    const receiptId = searchParams.get('receipt_id');

    if (!receiptId) {
      return NextResponse.json(
        { error: 'receipt_id 参数必填' },
        { status: 400 }
      );
    }

    // 3. 获取收据详情
    const receipt = await CBBCommerce.getReceipt(receiptId);

    if (!receipt) {
      return NextResponse.json(
        { error: '收据不存在' },
        { status: 404 }
      );
    }

    // 验证所有权
    if (receipt.user_id !== user.id) {
      return NextResponse.json(
        { error: '无权访问此收据' },
        { status: 403 }
      );
    }

    // 4. 返回结果
    return NextResponse.json({
      success: true,
      receipt,
    });
  } catch (error) {
    console.error('[CBB Deliver GET] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
