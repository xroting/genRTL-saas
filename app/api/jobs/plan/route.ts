// Plan API - RTL 设计规划（使用 GPT-5.1/GPT-4o）
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServer } from '@/lib/supabase/server';
import { rtlJobService } from '@/lib/rtl';
import { USDPoolManager } from '@/lib/cbb';
import { getTeamForUser } from '@/lib/db/queries';

// 请求体验证 Schema
const PlanRequestSchema = z.object({
  workspace_id: z.string().min(1, 'workspace_id 不能为空'),
  spec: z.string().min(10, '规格说明至少需要 10 个字符'),
  constraints: z.record(z.any()).optional(),
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
    const parseResult = PlanRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: '请求参数无效', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    // 3. 获取用户团队和订阅信息
    const team = await getTeamForUser(user);
    if (!team) {
      return NextResponse.json(
        { error: '用户未加入任何团队' },
        { status: 403 }
      );
    }

    // 4. 检查功能权限
    const planName = team.plan_name || team.planName || 'free';
    // Plan 功能在所有计划中都可用

    // 5. 检查余额
    const estimatedCost = 0.10; // 预估费用 $0.10
    const hasBalance = await USDPoolManager.hasEnoughBalance(
      user.id,
      estimatedCost,
      planName !== 'free'
    );

    if (!hasBalance) {
      return NextResponse.json(
        { error: '余额不足，请充值后重试' },
        { status: 402 }
      );
    }

    console.log(`[Plan API] User ${user.id} creating plan job`);

    // 6. 执行 Plan 任务
    const { job, result, error } = await rtlJobService.executePlanJob({
      userId: user.id,
      workspaceId: parseResult.data.workspace_id,
      spec: parseResult.data.spec,
      constraints: parseResult.data.constraints,
    });

    // 7. 返回结果
    if (error) {
      return NextResponse.json(
        { error: error, job_id: job.id },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job_id: job.id,
      status: job.status,
      result,
    });
  } catch (error) {
    console.error('[Plan API] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 获取 Plan Job 状态
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
    const jobId = searchParams.get('job_id');

    if (jobId) {
      // 获取单个 Job
      const job = await rtlJobService.getJob(jobId);
      if (!job) {
        return NextResponse.json(
          { error: 'Job 不存在' },
          { status: 404 }
        );
      }

      // 验证所有权
      if (job.user_id !== user.id) {
        return NextResponse.json(
          { error: '无权访问此 Job' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        job,
      });
    }

    // 获取用户的所有 Plan Jobs
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const jobs = await rtlJobService.getUserJobs({
      userId: user.id,
      type: 'plan',
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      jobs,
      total: jobs.length,
    });
  } catch (error) {
    console.error('[Plan API GET] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
