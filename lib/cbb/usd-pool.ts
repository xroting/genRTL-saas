// USD Pool Manager - 美元池管理
// 支持 included（订阅内）+ on_demand（超额按量）两种扣费方式

import { createClient } from '@supabase/supabase-js';
import type { USDPoolStatus, SubscriptionPlan } from './types';

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
 * 订阅计划配置
 * genRTL-SaaS: Free ($0) | Basic ($20) | Plus ($100) | Ultra Plus ($200)
 * Included USD 按 1.5:1 映射（月费 × 1.5）
 */
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price_usd: 0,
    included_usd: 0.5,  // Free 档限制额度
    features: {
      plan_enabled: true,
      implement_enabled: true,
      repair_enabled: true,
      cbb_marketplace: false,
      on_demand_allowed: false,  // Free 档不允许超额
      priority_support: false,
    },
    llm_rates: {
      // Claude Haiku 3 费率 (input: $0.00025/1K, output: $0.00125/1K)
      plan_per_1k_tokens: 0.00025,
      implement_per_1k_tokens: 0.00025,
      repair_per_1k_tokens: 0.00025,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price_usd: 20.0,
    included_usd: 30.0,  // 🎯 1.5:1 映射
    features: {
      plan_enabled: true,
      implement_enabled: true,
      repair_enabled: true,
      cbb_marketplace: false,
      on_demand_allowed: true,
      priority_support: false,
    },
    llm_rates: {
      // 标准费率（3x 成本，毛利 67%）
      // Claude Sonnet 4 (input: $0.003/1K, output: $0.015/1K)
      plan_per_1k_tokens: 0.009,        // Plan 任务
      implement_per_1k_tokens: 0.009,   // Implement 任务  
      repair_per_1k_tokens: 0.009,      // Repair 任务
    },
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price_usd: 100.0,
    included_usd: 150.0,  // 🎯 1.5:1 映射
    features: {
      plan_enabled: true,
      implement_enabled: true,
      repair_enabled: true,
      cbb_marketplace: true,
      on_demand_allowed: true,
      priority_support: false,
    },
    llm_rates: {
      // 优惠费率（2.7x 成本，毛利 63%）- 10% 折扣
      plan_per_1k_tokens: 0.0081,
      implement_per_1k_tokens: 0.0081,
      repair_per_1k_tokens: 0.0081,
    },
  },
  ultra_plus: {
    id: 'ultra_plus',
    name: 'Ultra Plus',
    price_usd: 200.0,
    included_usd: 300.0,  // 🎯 1.5:1 映射
    features: {
      plan_enabled: true,
      implement_enabled: true,
      repair_enabled: true,
      cbb_marketplace: true,
      on_demand_allowed: true,
      priority_support: true,
    },
    llm_rates: {
      // 最优惠费率（2.5x 成本，毛利 60%）- 20% 折扣
      plan_per_1k_tokens: 0.0075,
      implement_per_1k_tokens: 0.0075,
      repair_per_1k_tokens: 0.0075,
    },
  },
  // 保留 hobby 用于向后兼容，将自动迁移到 free
  hobby: {
    id: 'hobby',
    name: 'Hobby (Deprecated)',
    price_usd: 0,
    included_usd: 0.5,
    features: {
      plan_enabled: true,
      implement_enabled: true,
      repair_enabled: true,
      cbb_marketplace: false,
      on_demand_allowed: false,
      priority_support: false,
    },
    llm_rates: {
      plan_per_1k_tokens: 0.00025,
      implement_per_1k_tokens: 0.00025,
      repair_per_1k_tokens: 0.00025,
    },
  },
};

/**
 * 扣费结果
 */
export interface ChargeResult {
  success: boolean;
  chargedAmount: number;
  bucket: 'included' | 'on_demand';
  includedCharged: number;
  onDemandCharged: number;
  balanceAfter: USDPoolStatus;
  error?: string;
}

export class USDPoolManager {
  /**
   * 获取用户的美元池状态
   */
  static async getPoolStatus(userId: string): Promise<USDPoolStatus | null> {
    const supabase = createServiceClient();

    // 首先获取用户的团队信息
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .single();

    if (memberError || !teamMember) {
      console.error('Failed to find team for user:', userId);
      return null;
    }

    // 获取美元池状态
    const { data: pool, error: poolError } = await supabase
      .from('usd_pools')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (poolError) {
      // 如果不存在，返回默认状态
      if (poolError.code === 'PGRST116') {
        return {
          user_id: userId,
          team_id: teamMember.team_id,
          included_usd_balance: 0,
          included_usd_total: 0,
          on_demand_usd: 0,
          on_demand_limit: undefined,
          last_reset_at: new Date().toISOString(),
          next_reset_at: this.getNextResetDate().toISOString(),
        };
      }
      console.error('Failed to get USD pool status:', poolError);
      return null;
    }

    return {
      user_id: pool.user_id,
      team_id: pool.team_id,
      included_usd_balance: pool.included_usd_balance,
      included_usd_total: pool.included_usd_total,
      on_demand_usd: pool.on_demand_usd,
      on_demand_limit: pool.on_demand_limit,
      last_reset_at: pool.last_reset_at,
      next_reset_at: pool.next_reset_at,
    };
  }

  /**
   * 初始化用户的美元池（订阅时调用）
   */
  static async initializePool(params: {
    userId: string;
    teamId: number;
    planName: string;
  }): Promise<USDPoolStatus | null> {
    const supabase = createServiceClient();
    const plan = SUBSCRIPTION_PLANS[params.planName];

    if (!plan) {
      console.error('Invalid plan name:', params.planName);
      return null;
    }

    const now = new Date();
    const nextReset = this.getNextResetDate();

    const poolData = {
      user_id: params.userId,
      team_id: params.teamId,
      included_usd_balance: plan.included_usd,
      included_usd_total: plan.included_usd,
      on_demand_usd: 0,
      on_demand_limit: null,
      last_reset_at: now.toISOString(),
      next_reset_at: nextReset.toISOString(),
    };

    const { data, error } = await supabase
      .from('usd_pools')
      .upsert(poolData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to initialize USD pool:', error);
      return null;
    }

    return {
      ...data,
    } as USDPoolStatus;
  }

  /**
   * 扣费操作（优先从 included 扣，不足时进入 on_demand）
   */
  static async charge(params: {
    userId: string;
    amount: number;
    jobId?: string;
    description?: string;
    allowOnDemand?: boolean;
    idempotencyKey?: string;
  }): Promise<ChargeResult> {
    const supabase = createServiceClient();

    // 幂等性检查
    if (params.idempotencyKey) {
      const { data: existing } = await supabase
        .from('usd_pool_transactions')
        .select('*')
        .eq('idempotency_key', params.idempotencyKey)
        .single();

      if (existing) {
        console.log('Idempotent charge already exists:', params.idempotencyKey);
        const pool = await this.getPoolStatus(params.userId);
        return {
          success: true,
          chargedAmount: existing.amount,
          bucket: existing.bucket,
          includedCharged: existing.included_charged,
          onDemandCharged: existing.on_demand_charged,
          balanceAfter: pool!,
        };
      }
    }

    // 获取当前池状态
    const pool = await this.getPoolStatus(params.userId);
    if (!pool) {
      return {
        success: false,
        chargedAmount: 0,
        bucket: 'included',
        includedCharged: 0,
        onDemandCharged: 0,
        balanceAfter: {} as USDPoolStatus,
        error: '无法获取美元池状态',
      };
    }

    // 获取用户的订阅计划
    const { data: team } = await supabase
      .from('teams')
      .select('plan_name')
      .eq('id', pool.team_id)
      .single();

    const planName = team?.plan_name || 'free';
    const plan = SUBSCRIPTION_PLANS[planName];

    let includedCharged = 0;
    let onDemandCharged = 0;
    let bucket: 'included' | 'on_demand' = 'included';

    // 计算扣费分配
    if (pool.included_usd_balance >= params.amount) {
      // 完全从 included 扣除
      includedCharged = params.amount;
      bucket = 'included';
    } else {
      // 部分或全部需要 on_demand
      includedCharged = pool.included_usd_balance;
      const remaining = params.amount - includedCharged;

      // 检查是否允许使用 on_demand（用户设置优先）
      if (!params.allowOnDemand) {
        return {
          success: false,
          chargedAmount: 0,
          bucket: 'included',
          includedCharged: 0,
          onDemandCharged: 0,
          balanceAfter: pool,
          error: '订阅额度不足，您已禁用超额使用（on-demand）',
        };
      }

      // 检查计划是否支持 on_demand
      if (!plan.features.on_demand_allowed) {
        return {
          success: false,
          chargedAmount: 0,
          bucket: 'included',
          includedCharged: 0,
          onDemandCharged: 0,
          balanceAfter: pool,
          error: '订阅额度不足，当前计划不支持超额使用',
        };
      }

      // 检查 on_demand 限制
      if (pool.on_demand_limit !== undefined && pool.on_demand_limit !== null) {
        if (pool.on_demand_usd + remaining > pool.on_demand_limit) {
          return {
            success: false,
            chargedAmount: 0,
            bucket: 'on_demand',
            includedCharged: 0,
            onDemandCharged: 0,
            balanceAfter: pool,
            error: `超额限制已达上限 ($${pool.on_demand_limit})`,
          };
        }
      }

      onDemandCharged = remaining;
      bucket = includedCharged > 0 ? 'included' : 'on_demand';
    }

    // 执行扣费
    const newIncludedBalance = pool.included_usd_balance - includedCharged;
    const newOnDemandUsd = pool.on_demand_usd + onDemandCharged;

    const { error: updateError } = await supabase
      .from('usd_pools')
      .update({
        included_usd_balance: newIncludedBalance,
        on_demand_usd: newOnDemandUsd,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', params.userId);

    if (updateError) {
      console.error('Failed to update USD pool:', updateError);
      return {
        success: false,
        chargedAmount: 0,
        bucket: 'included',
        includedCharged: 0,
        onDemandCharged: 0,
        balanceAfter: pool,
        error: '扣费失败',
      };
    }

    // 记录交易
    await supabase.from('usd_pool_transactions').insert({
      user_id: params.userId,
      team_id: pool.team_id,
      type: 'charge',
      amount: params.amount,
      bucket,
      included_charged: includedCharged,
      on_demand_charged: onDemandCharged,
      job_id: params.jobId,
      description: params.description,
      idempotency_key: params.idempotencyKey,
      balance_before: {
        included: pool.included_usd_balance,
        on_demand: pool.on_demand_usd,
      },
      balance_after: {
        included: newIncludedBalance,
        on_demand: newOnDemandUsd,
      },
    });

    const balanceAfter: USDPoolStatus = {
      ...pool,
      included_usd_balance: newIncludedBalance,
      on_demand_usd: newOnDemandUsd,
    };

    return {
      success: true,
      chargedAmount: params.amount,
      bucket,
      includedCharged,
      onDemandCharged,
      balanceAfter,
    };
  }

  /**
   * 退款操作
   */
  static async refund(params: {
    userId: string;
    amount: number;
    originalBucket: 'included' | 'on_demand';
    jobId?: string;
    description?: string;
  }): Promise<boolean> {
    const supabase = createServiceClient();
    const pool = await this.getPoolStatus(params.userId);

    if (!pool) {
      return false;
    }

    let newIncludedBalance = pool.included_usd_balance;
    let newOnDemandUsd = pool.on_demand_usd;

    if (params.originalBucket === 'included') {
      newIncludedBalance += params.amount;
    } else {
      newOnDemandUsd = Math.max(0, newOnDemandUsd - params.amount);
    }

    const { error } = await supabase
      .from('usd_pools')
      .update({
        included_usd_balance: newIncludedBalance,
        on_demand_usd: newOnDemandUsd,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', params.userId);

    if (error) {
      console.error('Failed to refund USD pool:', error);
      return false;
    }

    // 记录退款交易
    await supabase.from('usd_pool_transactions').insert({
      user_id: params.userId,
      team_id: pool.team_id,
      type: 'refund',
      amount: params.amount,
      bucket: params.originalBucket,
      included_charged: params.originalBucket === 'included' ? -params.amount : 0,
      on_demand_charged: params.originalBucket === 'on_demand' ? -params.amount : 0,
      job_id: params.jobId,
      description: params.description,
      balance_before: {
        included: pool.included_usd_balance,
        on_demand: pool.on_demand_usd,
      },
      balance_after: {
        included: newIncludedBalance,
        on_demand: newOnDemandUsd,
      },
    });

    return true;
  }

  /**
   * 重置订阅周期（每月调用）
   */
  static async resetPeriod(params: {
    userId: string;
    planName: string;
  }): Promise<boolean> {
    const plan = SUBSCRIPTION_PLANS[params.planName];
    if (!plan) {
      return false;
    }

    const supabase = createServiceClient();
    const now = new Date();
    const nextReset = this.getNextResetDate();

    const { error } = await supabase
      .from('usd_pools')
      .update({
        included_usd_balance: plan.included_usd,
        included_usd_total: plan.included_usd,
        on_demand_usd: 0, // 重置超额累计
        last_reset_at: now.toISOString(),
        next_reset_at: nextReset.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', params.userId);

    return !error;
  }

  /**
   * 设置超额限制
   */
  static async setOnDemandLimit(
    userId: string,
    limit: number | null
  ): Promise<boolean> {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('usd_pools')
      .update({
        on_demand_limit: limit,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return !error;
  }

  /**
   * 检查是否有足够余额
   */
  static async hasEnoughBalance(
    userId: string,
    amount: number,
    allowOnDemand: boolean = true
  ): Promise<boolean> {
    const pool = await this.getPoolStatus(userId);
    if (!pool) {
      return false;
    }

    if (pool.included_usd_balance >= amount) {
      return true;
    }

    if (!allowOnDemand) {
      return false;
    }

    // 检查 on_demand 限制
    if (pool.on_demand_limit !== undefined && pool.on_demand_limit !== null) {
      const remaining = pool.on_demand_limit - pool.on_demand_usd;
      const needed = amount - pool.included_usd_balance;
      return remaining >= needed;
    }

    return true; // 无限制则允许
  }

  /**
   * 获取交易历史
   */
  static async getTransactionHistory(params: {
    userId: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const supabase = createServiceClient();

    let query = supabase
      .from('usd_pool_transactions')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false });

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 计算下一个重置日期
   */
  private static getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  /**
   * 根据 LLM 使用计算费用
   */
  static calculateLLMCost(params: {
    planName: string;
    taskType: 'plan' | 'implement' | 'repair';
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens?: number;
  }): number {
    const plan = SUBSCRIPTION_PLANS[params.planName] || SUBSCRIPTION_PLANS.free;

    let ratePerK: number;
    switch (params.taskType) {
      case 'plan':
        ratePerK = plan.llm_rates.plan_per_1k_tokens;
        break;
      case 'implement':
        ratePerK = plan.llm_rates.implement_per_1k_tokens;
        break;
      case 'repair':
        ratePerK = plan.llm_rates.repair_per_1k_tokens;
        break;
    }

    // 缓存的输入 token 有折扣（50%）
    const cachedTokens = params.cachedInputTokens || 0;
    const nonCachedInputTokens = params.inputTokens - cachedTokens;

    const inputCost = (nonCachedInputTokens / 1000) * ratePerK;
    const cachedCost = (cachedTokens / 1000) * ratePerK * 0.5;
    const outputCost = (params.outputTokens / 1000) * ratePerK * 3; // 输出 token 3x 价格

    return inputCost + cachedCost + outputCost;
  }
}

export default USDPoolManager;
