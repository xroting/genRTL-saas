// Usage Ledger - 统一记账系统（LLM + CBB）
// 支持 Cursor 风格的用量明细

import { createClient } from '@supabase/supabase-js';
import type {
  UsageLedgerRecord,
  UsageLedgerKind,
  UsageBucket,
} from './types';

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
 * LLM 使用记录参数
 */
export interface LLMUsageParams {
  userId: string;
  jobId?: string;
  stepId?: string;
  workspaceId?: string;
  bucket: UsageBucket;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  usdCost: number;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

/**
 * CBB 使用记录参数
 */
export interface CBBUsageParams {
  userId: string;
  jobId?: string;
  workspaceId?: string;
  bucket: UsageBucket;
  cbbId: string;
  cbbVersion: string;
  cbbPriceUsd: number;
  receiptId: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

/**
 * 用量汇总
 */
export interface UsageSummary {
  totalUsd: number;
  includedUsd: number;
  onDemandUsd: number;
  llmUsd: number;
  cbbUsd: number;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
  };
  cbbPurchases: number;
}

export class UsageLedger {
  /**
   * 记录 LLM 使用
   */
  static async recordLLMUsage(params: LLMUsageParams): Promise<UsageLedgerRecord | null> {
    const supabase = createServiceClient();

    // 幂等性检查
    if (params.idempotencyKey) {
      const { data: existing } = await supabase
        .from('usage_ledger')
        .select('id')
        .eq('idempotency_key', params.idempotencyKey)
        .single();

      if (existing) {
        console.log('Idempotent LLM usage record already exists:', params.idempotencyKey);
        const { data } = await supabase
          .from('usage_ledger')
          .select('*')
          .eq('idempotency_key', params.idempotencyKey)
          .single();
        return data as UsageLedgerRecord;
      }
    }

    const record = {
      user_id: params.userId,
      kind: 'llm' as UsageLedgerKind,
      bucket: params.bucket,
      job_id: params.jobId,
      step_id: params.stepId,
      workspace_id: params.workspaceId,
      usd_cost: params.usdCost,
      provider: params.provider,
      model: params.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      cached_input_tokens: params.cachedInputTokens,
      idempotency_key: params.idempotencyKey,
      metadata: params.metadata,
    };

    const { data, error } = await supabase
      .from('usage_ledger')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Failed to record LLM usage:', error);
      return null;
    }

    return data as UsageLedgerRecord;
  }

  /**
   * 记录 CBB 使用
   */
  static async recordCBBUsage(params: CBBUsageParams): Promise<UsageLedgerRecord | null> {
    const supabase = createServiceClient();

    // 幂等性检查
    if (params.idempotencyKey) {
      const { data: existing } = await supabase
        .from('usage_ledger')
        .select('id')
        .eq('idempotency_key', params.idempotencyKey)
        .single();

      if (existing) {
        console.log('Idempotent CBB usage record already exists:', params.idempotencyKey);
        const { data } = await supabase
          .from('usage_ledger')
          .select('*')
          .eq('idempotency_key', params.idempotencyKey)
          .single();
        return data as UsageLedgerRecord;
      }
    }

    const record = {
      user_id: params.userId,
      kind: 'cbb' as UsageLedgerKind,
      bucket: params.bucket,
      job_id: params.jobId,
      workspace_id: params.workspaceId,
      usd_cost: params.cbbPriceUsd,
      cbb_id: params.cbbId,
      cbb_version: params.cbbVersion,
      cbb_price_usd: params.cbbPriceUsd,
      receipt_id: params.receiptId,
      idempotency_key: params.idempotencyKey,
      metadata: params.metadata,
    };

    const { data, error } = await supabase
      .from('usage_ledger')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Failed to record CBB usage:', error);
      return null;
    }

    return data as UsageLedgerRecord;
  }

  /**
   * 获取用户的使用记录
   */
  static async getUserUsage(params: {
    userId: string;
    kind?: UsageLedgerKind;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<UsageLedgerRecord[]> {
    const supabase = createServiceClient();

    let query = supabase
      .from('usage_ledger')
      .select('*')
      .eq('user_id', params.userId)
      .order('timestamp', { ascending: false });

    if (params.kind) {
      query = query.eq('kind', params.kind);
    }

    if (params.startDate) {
      query = query.gte('timestamp', params.startDate.toISOString());
    }

    if (params.endDate) {
      query = query.lte('timestamp', params.endDate.toISOString());
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch user usage:', error);
      return [];
    }

    return data as UsageLedgerRecord[];
  }

  /**
   * 获取 Job 的所有使用记录
   */
  static async getJobUsage(jobId: string): Promise<UsageLedgerRecord[]> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('usage_ledger')
      .select('*')
      .eq('job_id', jobId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Failed to fetch job usage:', error);
      return [];
    }

    return data as UsageLedgerRecord[];
  }

  /**
   * 获取用量汇总
   */
  static async getUserSummary(params: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UsageSummary> {
    const records = await this.getUserUsage({
      userId: params.userId,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: 10000, // 获取所有记录用于汇总
    });

    const summary: UsageSummary = {
      totalUsd: 0,
      includedUsd: 0,
      onDemandUsd: 0,
      llmUsd: 0,
      cbbUsd: 0,
      byProvider: {},
      byModel: {},
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
      },
      cbbPurchases: 0,
    };

    for (const record of records) {
      summary.totalUsd += record.usd_cost;

      if (record.bucket === 'included') {
        summary.includedUsd += record.usd_cost;
      } else {
        summary.onDemandUsd += record.usd_cost;
      }

      if (record.kind === 'llm') {
        summary.llmUsd += record.usd_cost;

        if (record.provider) {
          summary.byProvider[record.provider] =
            (summary.byProvider[record.provider] || 0) + record.usd_cost;
        }

        if (record.model) {
          summary.byModel[record.model] =
            (summary.byModel[record.model] || 0) + record.usd_cost;
        }

        summary.tokenUsage.inputTokens += record.input_tokens || 0;
        summary.tokenUsage.outputTokens += record.output_tokens || 0;
        summary.tokenUsage.cachedInputTokens += record.cached_input_tokens || 0;
      } else if (record.kind === 'cbb') {
        summary.cbbUsd += record.usd_cost;
        summary.cbbPurchases += 1;
      }
    }

    return summary;
  }

  /**
   * 获取当前计费周期的用量
   */
  static async getCurrentPeriodUsage(userId: string): Promise<UsageSummary> {
    // 计算当前周期的开始日期（假设按月计费）
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.getUserSummary({
      userId,
      startDate: startOfMonth,
      endDate: now,
    });
  }

  /**
   * 按 Job/Step 归因用量
   */
  static async getJobBreakdown(jobId: string): Promise<{
    totalUsd: number;
    steps: Array<{
      stepId: string;
      kind: UsageLedgerKind;
      usdCost: number;
      details: Record<string, any>;
    }>;
  }> {
    const records = await this.getJobUsage(jobId);

    let totalUsd = 0;
    const steps: Array<{
      stepId: string;
      kind: UsageLedgerKind;
      usdCost: number;
      details: Record<string, any>;
    }> = [];

    for (const record of records) {
      totalUsd += record.usd_cost;

      steps.push({
        stepId: record.step_id || 'default',
        kind: record.kind as UsageLedgerKind,
        usdCost: record.usd_cost,
        details: {
          provider: record.provider,
          model: record.model,
          inputTokens: record.input_tokens,
          outputTokens: record.output_tokens,
          cbbId: record.cbb_id,
          cbbVersion: record.cbb_version,
        },
      });
    }

    return { totalUsd, steps };
  }
}

export default UsageLedger;
