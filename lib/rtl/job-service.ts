// RTL Job Service - 处理 Plan、Implement、Repair 任务
import { createClient } from '@supabase/supabase-js';
import { ModelRouter, modelRouter } from '@/lib/llm';
import {
  PLAN_SYSTEM_PROMPT,
  IMPLEMENT_SYSTEM_PROMPT,
  REPAIR_SYSTEM_PROMPT,
  generatePlanUserPrompt,
  generateImplementUserPrompt,
  generateRepairUserPrompt,
} from '@/lib/llm/prompts';
import { UsageLedger, USDPoolManager } from '@/lib/cbb';
import type {
  PlanJob,
  PlanResult,
  ImplementJob,
  ImplementResult,
  RepairJob,
  RepairResult,
  EvidenceBundle,
  CBBCandidate,
  WorkspacePolicy,
} from '@/lib/cbb/types';

/**
 * 创建 Service Role Supabase 客户端
 */
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Plan Job 创建参数
 */
export interface CreatePlanJobParams {
  userId: string;
  workspaceId: string;
  spec: string;
  constraints?: Record<string, any>;
}

/**
 * Implement Job 创建参数
 */
export interface CreateImplementJobParams {
  userId: string;
  workspaceId: string;
  planJson: PlanResult;
  resolvedCbbs: CBBCandidate[];
  workspacePolicy?: WorkspacePolicy;
}

/**
 * Repair Job 创建参数
 */
export interface CreateRepairJobParams {
  userId: string;
  workspaceId: string;
  evidenceBundle: EvidenceBundle;
  workspacePolicy?: WorkspacePolicy;
}

export class RTLJobService {
  private router: ModelRouter;

  constructor(router?: ModelRouter) {
    this.router = router || modelRouter;
  }

  /**
   * 创建并执行 Plan 任务
   */
  async executePlanJob(params: CreatePlanJobParams): Promise<{
    job: PlanJob;
    result?: PlanResult;
    error?: string;
  }> {
    const supabase = createServiceClient();
    const jobId = crypto.randomUUID();

    // 1. 创建 Job 记录
    const job: Partial<PlanJob> = {
      id: jobId,
      user_id: params.userId,
      workspace_id: params.workspaceId,
      type: 'plan',
      status: 'processing',
      spec: params.spec,
      constraints: params.constraints,
    };

    const { error: insertError } = await supabase.from('rtl_jobs').insert(job);

    if (insertError) {
      console.error('Failed to create Plan job:', insertError);
      return {
        job: { ...job, status: 'failed' } as PlanJob,
        error: '创建任务失败',
      };
    }

    try {
      // 2. 生成提示词
      const userPrompt = generatePlanUserPrompt({
        spec: params.spec,
        constraints: params.constraints,
      });

      // 3. 调用 LLM
      const llmResult = await this.router.executePlan({
        systemPrompt: PLAN_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
      });

      if (!llmResult.success) {
        await this.updateJobStatus(jobId, 'failed', { error: llmResult.error });
        return {
          job: { ...job, status: 'failed', error: llmResult.error } as PlanJob,
          error: llmResult.error,
        };
      }

      // 4. 解析结果
      let planResult: PlanResult;
      try {
        planResult = JSON.parse(llmResult.content);
      } catch (parseError) {
        await this.updateJobStatus(jobId, 'failed', { error: 'JSON 解析失败' });
        return {
          job: { ...job, status: 'failed', error: 'JSON 解析失败' } as PlanJob,
          error: 'JSON 解析失败',
        };
      }

      // 5. 记录 LLM 使用
      const usdCost = USDPoolManager.calculateLLMCost({
        planName: 'professional', // TODO: 从用户订阅获取
        taskType: 'plan',
        inputTokens: llmResult.usage.inputTokens,
        outputTokens: llmResult.usage.outputTokens,
        cachedInputTokens: llmResult.usage.cachedInputTokens,
      });

      // 扣费
      await USDPoolManager.charge({
        userId: params.userId,
        amount: usdCost,
        jobId,
        description: 'Plan 任务 LLM 调用',
      });

      // 记录到 Usage Ledger
      await UsageLedger.recordLLMUsage({
        userId: params.userId,
        jobId,
        workspaceId: params.workspaceId,
        bucket: 'included', // TODO: 根据实际扣费情况确定
        provider: llmResult.provider,
        model: llmResult.model,
        inputTokens: llmResult.usage.inputTokens,
        outputTokens: llmResult.usage.outputTokens,
        cachedInputTokens: llmResult.usage.cachedInputTokens,
        usdCost,
      });

      // 6. 更新 Job 状态
      await this.updateJobStatus(jobId, 'done', { result: planResult });

      return {
        job: { ...job, status: 'done', result: planResult } as PlanJob,
        result: planResult,
      };
    } catch (error: any) {
      console.error('Plan job execution failed:', error);
      await this.updateJobStatus(jobId, 'failed', { error: error.message });
      return {
        job: { ...job, status: 'failed', error: error.message } as PlanJob,
        error: error.message,
      };
    }
  }

  /**
   * 创建并执行 Implement 任务
   */
  async executeImplementJob(params: CreateImplementJobParams): Promise<{
    job: ImplementJob;
    result?: ImplementResult;
    error?: string;
  }> {
    const supabase = createServiceClient();
    const jobId = crypto.randomUUID();

    // 1. 创建 Job 记录
    const job: Partial<ImplementJob> = {
      id: jobId,
      user_id: params.userId,
      workspace_id: params.workspaceId,
      type: 'implement',
      status: 'processing',
      plan_json: params.planJson,
      resolved_cbbs: params.resolvedCbbs,
      workspace_policy: params.workspacePolicy,
    };

    const { error: insertError } = await supabase.from('rtl_jobs').insert(job);

    if (insertError) {
      console.error('Failed to create Implement job:', insertError);
      return {
        job: { ...job, status: 'failed' } as ImplementJob,
        error: '创建任务失败',
      };
    }

    try {
      // 2. 生成提示词
      const userPrompt = generateImplementUserPrompt({
        planJson: params.planJson,
        resolvedCbbs: params.resolvedCbbs,
        workspacePolicy: params.workspacePolicy,
      });

      // 3. 调用 LLM
      const llmResult = await this.router.executeImplement({
        systemPrompt: IMPLEMENT_SYSTEM_PROMPT,
        userPrompt,
      });

      if (!llmResult.success) {
        await this.updateJobStatus(jobId, 'failed', { error: llmResult.error });
        return {
          job: { ...job, status: 'failed', error: llmResult.error } as ImplementJob,
          error: llmResult.error,
        };
      }

      // 4. 解析结果
      let implementResult: ImplementResult;
      try {
        // 尝试从 markdown 代码块中提取 JSON
        let jsonContent = llmResult.content;
        const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
        implementResult = JSON.parse(jsonContent);
      } catch (parseError) {
        await this.updateJobStatus(jobId, 'failed', { error: 'JSON 解析失败' });
        return {
          job: { ...job, status: 'failed', error: 'JSON 解析失败' } as ImplementJob,
          error: 'JSON 解析失败',
        };
      }

      // 5. 记录 LLM 使用
      const usdCost = USDPoolManager.calculateLLMCost({
        planName: 'professional',
        taskType: 'implement',
        inputTokens: llmResult.usage.inputTokens,
        outputTokens: llmResult.usage.outputTokens,
        cachedInputTokens: llmResult.usage.cachedInputTokens,
      });

      await USDPoolManager.charge({
        userId: params.userId,
        amount: usdCost,
        jobId,
        description: 'Implement 任务 LLM 调用',
      });

      await UsageLedger.recordLLMUsage({
        userId: params.userId,
        jobId,
        workspaceId: params.workspaceId,
        bucket: 'included',
        provider: llmResult.provider,
        model: llmResult.model,
        inputTokens: llmResult.usage.inputTokens,
        outputTokens: llmResult.usage.outputTokens,
        cachedInputTokens: llmResult.usage.cachedInputTokens,
        usdCost,
      });

      // 6. 更新 Job 状态
      await this.updateJobStatus(jobId, 'done', { result: implementResult });

      return {
        job: { ...job, status: 'done', result: implementResult } as ImplementJob,
        result: implementResult,
      };
    } catch (error: any) {
      console.error('Implement job execution failed:', error);
      await this.updateJobStatus(jobId, 'failed', { error: error.message });
      return {
        job: { ...job, status: 'failed', error: error.message } as ImplementJob,
        error: error.message,
      };
    }
  }

  /**
   * 创建并执行 Repair 任务
   */
  async executeRepairJob(params: CreateRepairJobParams): Promise<{
    job: RepairJob;
    result?: RepairResult;
    error?: string;
  }> {
    const supabase = createServiceClient();
    const jobId = crypto.randomUUID();

    // 1. 创建 Job 记录
    const job: Partial<RepairJob> = {
      id: jobId,
      user_id: params.userId,
      workspace_id: params.workspaceId,
      type: 'repair',
      status: 'processing',
      evidence_bundle: params.evidenceBundle,
      workspace_policy: params.workspacePolicy,
    };

    const { error: insertError } = await supabase.from('rtl_jobs').insert(job);

    if (insertError) {
      console.error('Failed to create Repair job:', insertError);
      return {
        job: { ...job, status: 'failed' } as RepairJob,
        error: '创建任务失败',
      };
    }

    try {
      // 2. 生成提示词
      const userPrompt = generateRepairUserPrompt({
        evidenceBundle: params.evidenceBundle,
        workspacePolicy: params.workspacePolicy,
      });

      // 3. 调用 LLM
      const llmResult = await this.router.executeRepair({
        systemPrompt: REPAIR_SYSTEM_PROMPT,
        userPrompt,
      });

      if (!llmResult.success) {
        await this.updateJobStatus(jobId, 'failed', { error: llmResult.error });
        return {
          job: { ...job, status: 'failed', error: llmResult.error } as RepairJob,
          error: llmResult.error,
        };
      }

      // 4. 解析结果
      let repairResult: RepairResult;
      try {
        let jsonContent = llmResult.content;
        const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
        repairResult = JSON.parse(jsonContent);
      } catch (parseError) {
        await this.updateJobStatus(jobId, 'failed', { error: 'JSON 解析失败' });
        return {
          job: { ...job, status: 'failed', error: 'JSON 解析失败' } as RepairJob,
          error: 'JSON 解析失败',
        };
      }

      // 5. 记录 LLM 使用
      const usdCost = USDPoolManager.calculateLLMCost({
        planName: 'professional',
        taskType: 'repair',
        inputTokens: llmResult.usage.inputTokens,
        outputTokens: llmResult.usage.outputTokens,
        cachedInputTokens: llmResult.usage.cachedInputTokens,
      });

      await USDPoolManager.charge({
        userId: params.userId,
        amount: usdCost,
        jobId,
        description: 'Repair 任务 LLM 调用',
      });

      await UsageLedger.recordLLMUsage({
        userId: params.userId,
        jobId,
        workspaceId: params.workspaceId,
        bucket: 'included',
        provider: llmResult.provider,
        model: llmResult.model,
        inputTokens: llmResult.usage.inputTokens,
        outputTokens: llmResult.usage.outputTokens,
        cachedInputTokens: llmResult.usage.cachedInputTokens,
        usdCost,
      });

      // 6. 更新 Job 状态
      await this.updateJobStatus(jobId, 'done', { result: repairResult });

      return {
        job: { ...job, status: 'done', result: repairResult } as RepairJob,
        result: repairResult,
      };
    } catch (error: any) {
      console.error('Repair job execution failed:', error);
      await this.updateJobStatus(jobId, 'failed', { error: error.message });
      return {
        job: { ...job, status: 'failed', error: error.message } as RepairJob,
        error: error.message,
      };
    }
  }

  /**
   * 获取 Job 状态
   */
  async getJob(jobId: string): Promise<PlanJob | ImplementJob | RepairJob | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('rtl_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as PlanJob | ImplementJob | RepairJob;
  }

  /**
   * 获取用户的 Job 列表
   */
  async getUserJobs(params: {
    userId: string;
    type?: 'plan' | 'implement' | 'repair';
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Array<PlanJob | ImplementJob | RepairJob>> {
    const supabase = createServiceClient();

    let query = supabase
      .from('rtl_jobs')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false });

    if (params.type) {
      query = query.eq('type', params.type);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get user jobs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 更新 Job 状态
   */
  private async updateJobStatus(
    jobId: string,
    status: 'processing' | 'done' | 'failed',
    data?: { result?: any; error?: string }
  ): Promise<void> {
    const supabase = createServiceClient();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (data?.result) {
      updateData.result = data.result;
    }

    if (data?.error) {
      updateData.error = data.error;
    }

    await supabase.from('rtl_jobs').update(updateData).eq('id', jobId);
  }
}

// 默认实例
export const rtlJobService = new RTLJobService();

export default RTLJobService;
