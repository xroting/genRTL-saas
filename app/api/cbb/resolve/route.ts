// CBB Resolve API - 解析 CBB 需求，返回候选项（不扣费）
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServer } from '@/lib/supabase/server';
import { CBBRegistry } from '@/lib/cbb';
import type { CBBResolveRequest, CBBRequirement } from '@/lib/cbb/types';

// 请求体验证 Schema
const ResolveRequestSchema = z.object({
  cbb_requirements: z.array(
    z.object({
      cbb_id: z.string().optional(),
      name: z.string().optional(),
      tags: z.array(z.string()).optional(),
      min_version: z.string().optional(),
      max_version: z.string().optional(),
      simulators: z.array(z.string()).optional(),
    })
  ),
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
    const parseResult = ResolveRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: '请求参数无效', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const resolveRequest: CBBResolveRequest = {
      cbb_requirements: parseResult.data.cbb_requirements as CBBRequirement[],
    };

    // 3. 检查是否有需求
    if (resolveRequest.cbb_requirements.length === 0) {
      return NextResponse.json(
        { error: '需求列表不能为空' },
        { status: 400 }
      );
    }

    // 4. 调用 CBB Registry 解析需求
    console.log(`[CBB Resolve] User ${user.id} resolving ${resolveRequest.cbb_requirements.length} requirements`);
    const result = await CBBRegistry.resolve(resolveRequest);

    // 5. 返回结果
    return NextResponse.json(result);
  } catch (error) {
    console.error('[CBB Resolve] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 获取热门 CBB 列表
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
    const query = searchParams.get('q');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const simulators = searchParams.get('simulators')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 3. 搜索或获取热门
    let result;
    if (query || tags || simulators) {
      result = await CBBRegistry.search({
        query: query || undefined,
        tags,
        simulators,
        limit,
      });
    } else {
      result = await CBBRegistry.getPopular(limit);
    }

    // 4. 返回结果
    return NextResponse.json({
      success: true,
      items: result,
      total: result.length,
    });
  } catch (error) {
    console.error('[CBB Resolve GET] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
