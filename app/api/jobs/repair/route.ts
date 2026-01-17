// Repair API - RTL 代码修复（使用 Claude Sonnet）
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServer } from '@/lib/supabase/server';
import { rtlJobService } from '@/lib/rtl';
import { USDPoolManager, SUBSCRIPTION_PLANS } from '@/lib/cbb';
import { getTeamForUser } from '@/lib/db/queries';
import type { EvidenceBundle, WorkspacePolicy } from '@/lib/cbb/types';

// 诊断消息 Schema
const DiagnosticSchema = z.object({
  severity: z.enum(['error', 'warning', 'info']),
  file: z.string(),
  line: z.number(),
  column: z.number().optional(),
  message: z.string(),
  code: z.string().optional(),
});

// 代码片段 Schema
const SnippetSchema = z.object({
  file: z.string(),
  start_line: z.number(),
  end_line: z.number(),
  content: z.string(),
});

// 请求体验证 Schema
const RepairRequestSchema = z.object({
  workspace_id: z.string().min(1, 'workspace_id 不能为空'),
  evidence_bundle: z.object({
    diagnostics: z.array(DiagnosticSchema).min(1, '至少需要一个诊断消息'),
    tool_logs: z.string().optional(),
    snippets: z.array(SnippetSchema),
    lockfile_summary: z
      .object({
        cbb_versions: z.record(z.string()),
        custom_modules: z.array(z.string()),
      })
      .optional(),
  }),
  workspace_policy: z
    .object({
      readonly_paths: z.array(z.string()),
      forbidden_modifications: z.array(z.string()),
    })
    .optional(),
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
    const parseResult = RepairRequestSchema.safeParse(body);

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
    const plan = SUBSCRIPTION_PLANS[planName as keyof typeof SUBSCRIPTION_PLANS];

    if (!plan?.features.repair_enabled) {
      return NextResponse.json(
        { error: '当前订阅计划不支持 Repair 功能，请升级订阅' },
        { status: 403 }
      );
    }

    // 5. 检查余额
    const estimatedCost = 0.15; // 预估费用 $0.15
    const hasBalance = await USDPoolManager.hasEnoughBalance(
      user.id,
      estimatedCost,
      plan.features.on_demand_allowed
    );

    if (!hasBalance) {
      return NextResponse.json(
        { error: '余额不足，请充值后重试' },
        { status: 402 }
      );
    }

    console.log(`[Repair API] User ${user.id} creating repair job with ${parseResult.data.evidence_bundle.diagnostics.length} diagnostics`);

    // 6. 执行 Repair 任务
    const { job, result, error } = await rtlJobService.executeRepairJob({
      userId: user.id,
      workspaceId: parseResult.data.workspace_id,
      evidenceBundle: parseResult.data.evidence_bundle as EvidenceBundle,
      workspacePolicy: parseResult.data.workspace_policy as WorkspacePolicy | undefined,
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
    console.error('[Repair API] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 获取 Repair Job 状态
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

    // 获取用户的所有 Repair Jobs
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const jobs = await rtlJobService.getUserJobs({
      userId: user.id,
      type: 'repair',
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      jobs,
      total: jobs.length,
    });
  } catch (error) {
    console.error('[Repair API GET] Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
