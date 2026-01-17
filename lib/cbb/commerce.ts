// CBB Commerce - 商品交易管理
// 处理 Checkout（扣费）和 Deliver（发放下载凭证）

import { createClient } from '@supabase/supabase-js';
import { CBBRegistry } from './registry';
import { USDPoolManager } from './usd-pool';
import { UsageLedger } from './usage-ledger';
import type {
  CBBCheckoutRequest,
  CBBCheckoutResponse,
  CBBCheckoutItem,
  CBBChargedItem,
  CBBReceipt,
  CBBDeliverRequest,
  CBBDeliverResponse,
  CBBDeliverItem,
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
 * 签名 URL 有效期（秒）
 */
const SIGNED_URL_EXPIRY = 3600; // 1 小时

export class CBBCommerce {
  /**
   * Checkout - 扣费并生成收据（幂等）
   */
  static async checkout(request: CBBCheckoutRequest): Promise<CBBCheckoutResponse> {
    const supabase = createServiceClient();

    // 1. 幂等性检查
    const { data: existingReceipt } = await supabase
      .from('cbb_receipts')
      .select('*')
      .eq('idempotency_key', request.idempotency_key)
      .single();

    if (existingReceipt) {
      console.log('Idempotent checkout already exists:', request.idempotency_key);
      const pool = await USDPoolManager.getPoolStatus(request.user_id);
      return {
        success: true,
        receipt_id: existingReceipt.id,
        charged: existingReceipt.items as CBBChargedItem[],
        balances_after: {
          included_usd: pool?.included_usd_balance || 0,
          on_demand_usd: pool?.on_demand_usd || 0,
        },
      };
    }

    // 2. 验证订阅状态
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id, teams(plan_name, subscription_status)')
      .eq('user_id', request.user_id)
      .single();

    if (!teamMember) {
      return {
        success: false,
        receipt_id: '',
        charged: [],
        balances_after: { included_usd: 0, on_demand_usd: 0 },
        error: '用户未找到或未加入团队',
      };
    }

    const team = Array.isArray(teamMember.teams)
      ? teamMember.teams[0]
      : teamMember.teams;

    const planName = team?.plan_name || 'free';

    // 3. 获取所有 CBB 信息并计算总价
    const chargedItems: CBBChargedItem[] = [];
    let totalPrice = 0;

    for (const item of request.items) {
      const cbb = await CBBRegistry.getByIdAndVersion(item.cbb_id, item.version);
      if (!cbb) {
        return {
          success: false,
          receipt_id: '',
          charged: [],
          balances_after: { included_usd: 0, on_demand_usd: 0 },
          error: `CBB 不存在: ${item.cbb_id}@${item.version}`,
        };
      }

      const manifest = cbb.manifest as any;
      totalPrice += manifest.price_usd;
    }

    // 4. 检查余额是否足够
    const hasBalance = await USDPoolManager.hasEnoughBalance(
      request.user_id,
      totalPrice,
      planName !== 'free' // 只有付费计划可以使用 on_demand
    );

    if (!hasBalance) {
      return {
        success: false,
        receipt_id: '',
        charged: [],
        balances_after: { included_usd: 0, on_demand_usd: 0 },
        error: '余额不足',
      };
    }

    // 5. 执行扣费
    const chargeResult = await USDPoolManager.charge({
      userId: request.user_id,
      amount: totalPrice,
      jobId: request.job_id,
      description: `CBB 购买: ${request.items.map(i => `${i.cbb_id}@${i.version}`).join(', ')}`,
      allowOnDemand: planName !== 'free',
      idempotencyKey: request.idempotency_key,
    });

    if (!chargeResult.success) {
      return {
        success: false,
        receipt_id: '',
        charged: [],
        balances_after: {
          included_usd: chargeResult.balanceAfter?.included_usd_balance || 0,
          on_demand_usd: chargeResult.balanceAfter?.on_demand_usd || 0,
        },
        error: chargeResult.error,
      };
    }

    // 6. 为每个 CBB 记录扣费详情
    let includedRemaining = chargeResult.includedCharged;
    for (const item of request.items) {
      const cbb = await CBBRegistry.getByIdAndVersion(item.cbb_id, item.version);
      const manifest = cbb!.manifest as any;
      const price = manifest.price_usd;

      let itemBucket: 'included' | 'on_demand';
      if (includedRemaining >= price) {
        itemBucket = 'included';
        includedRemaining -= price;
      } else {
        itemBucket = 'on_demand';
      }

      chargedItems.push({
        cbb_id: item.cbb_id,
        version: item.version,
        bucket: itemBucket,
        price_usd: price,
      });

      // 记录到 Usage Ledger
      await UsageLedger.recordCBBUsage({
        userId: request.user_id,
        jobId: request.job_id,
        workspaceId: request.workspace_id,
        bucket: itemBucket,
        cbbId: item.cbb_id,
        cbbVersion: item.version,
        cbbPriceUsd: price,
        receiptId: '', // 稍后更新
        idempotencyKey: `${request.idempotency_key}_${item.cbb_id}_${item.version}`,
      });
    }

    // 7. 创建收据
    const receiptId = crypto.randomUUID();
    const receipt: Partial<CBBReceipt> = {
      id: receiptId,
      user_id: request.user_id,
      workspace_id: request.workspace_id,
      job_id: request.job_id,
      idempotency_key: request.idempotency_key,
      items: chargedItems,
      total_usd: totalPrice,
      included_charged: chargeResult.includedCharged,
      on_demand_charged: chargeResult.onDemandCharged,
      status: 'completed',
    };

    const { error: receiptError } = await supabase
      .from('cbb_receipts')
      .insert(receipt);

    if (receiptError) {
      console.error('Failed to create receipt:', receiptError);
      // 尝试退款
      await USDPoolManager.refund({
        userId: request.user_id,
        amount: totalPrice,
        originalBucket: chargeResult.bucket,
        jobId: request.job_id,
        description: '收据创建失败，自动退款',
      });

      return {
        success: false,
        receipt_id: '',
        charged: [],
        balances_after: {
          included_usd: chargeResult.balanceAfter?.included_usd_balance || 0,
          on_demand_usd: chargeResult.balanceAfter?.on_demand_usd || 0,
        },
        error: '创建收据失败',
      };
    }

    return {
      success: true,
      receipt_id: receiptId,
      charged: chargedItems,
      balances_after: {
        included_usd: chargeResult.balanceAfter.included_usd_balance,
        on_demand_usd: chargeResult.balanceAfter.on_demand_usd,
      },
    };
  }

  /**
   * Deliver - 发放下载凭证
   */
  static async deliver(request: CBBDeliverRequest): Promise<CBBDeliverResponse> {
    const supabase = createServiceClient();

    // 1. 获取收据
    const { data: receipt, error: receiptError } = await supabase
      .from('cbb_receipts')
      .select('*')
      .eq('id', request.receipt_id)
      .single();

    if (receiptError || !receipt) {
      return {
        success: false,
        receipt_id: request.receipt_id,
        items: [],
        error: '收据不存在',
      };
    }

    if (receipt.status !== 'completed') {
      return {
        success: false,
        receipt_id: request.receipt_id,
        items: [],
        error: `收据状态无效: ${receipt.status}`,
      };
    }

    // 2. 为每个 CBB 生成下载链接
    const deliverItems: CBBDeliverItem[] = [];
    const items = receipt.items as CBBChargedItem[];

    for (const item of items) {
      const cbb = await CBBRegistry.getByIdAndVersion(item.cbb_id, item.version);
      if (!cbb) {
        return {
          success: false,
          receipt_id: request.receipt_id,
          items: [],
          error: `CBB 不存在: ${item.cbb_id}@${item.version}`,
        };
      }

      // 生成签名 URL
      const { data: signedUrl, error: signError } = await supabase.storage
        .from('cbb-packages')
        .createSignedUrl(cbb.storage_path, SIGNED_URL_EXPIRY);

      if (signError || !signedUrl) {
        console.error('Failed to create signed URL:', signError);
        return {
          success: false,
          receipt_id: request.receipt_id,
          items: [],
          error: `无法生成下载链接: ${item.cbb_id}`,
        };
      }

      const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000);

      deliverItems.push({
        cbb_id: item.cbb_id,
        version: item.version,
        download_url: signedUrl.signedUrl,
        sha256: cbb.sha256,
        file_size: cbb.file_size,
        expires_in: SIGNED_URL_EXPIRY,
        expires_at: expiresAt.toISOString(),
      });

      // 增加下载计数
      await CBBRegistry.incrementDownloadCount(item.cbb_id, item.version);
    }

    return {
      success: true,
      receipt_id: request.receipt_id,
      items: deliverItems,
    };
  }

  /**
   * 获取用户的购买历史
   */
  static async getPurchaseHistory(params: {
    userId: string;
    limit?: number;
    offset?: number;
  }): Promise<CBBReceipt[]> {
    const supabase = createServiceClient();

    let query = supabase
      .from('cbb_receipts')
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
      console.error('Failed to get purchase history:', error);
      return [];
    }

    return data as CBBReceipt[];
  }

  /**
   * 获取收据详情
   */
  static async getReceipt(receiptId: string): Promise<CBBReceipt | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('cbb_receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as CBBReceipt;
  }

  /**
   * 退款
   */
  static async refund(receiptId: string, reason?: string): Promise<boolean> {
    const supabase = createServiceClient();
    const receipt = await this.getReceipt(receiptId);

    if (!receipt) {
      return false;
    }

    if (receipt.status === 'refunded') {
      return true; // 已退款
    }

    // 执行退款
    const refundIncluded = receipt.included_charged > 0;
    const refundOnDemand = receipt.on_demand_charged > 0;

    if (refundIncluded) {
      await USDPoolManager.refund({
        userId: receipt.user_id,
        amount: receipt.included_charged,
        originalBucket: 'included',
        jobId: receipt.job_id,
        description: reason || '手动退款',
      });
    }

    if (refundOnDemand) {
      await USDPoolManager.refund({
        userId: receipt.user_id,
        amount: receipt.on_demand_charged,
        originalBucket: 'on_demand',
        jobId: receipt.job_id,
        description: reason || '手动退款',
      });
    }

    // 更新收据状态
    const { error } = await supabase
      .from('cbb_receipts')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', receiptId);

    return !error;
  }
}

export default CBBCommerce;
