// USD Pool 月度重置定时任务
// 每月1日0点自动重置所有活跃订阅用户的美元池

import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";
import { USDPoolManager, SUBSCRIPTION_PLANS } from "@/lib/cbb";

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
 * USD Pool 月度重置任务
 * 每月1日 UTC 00:00 执行
 */
export const usdPoolMonthlyReset = inngest.createFunction(
  {
    id: "usd-pool-monthly-reset",
    name: "USD Pool Monthly Reset",
  },
  {
    // 每月1日 UTC 00:00 执行
    cron: "0 0 1 * *",
  },
  async ({ event, step }) => {
    console.log("[USD Pool Reset] Starting monthly reset job...");

    // Step 1: 获取所有需要重置的美元池
    const poolsToReset = await step.run("fetch-active-pools", async () => {
      const supabase = createServiceClient();
      const now = new Date();

      // 查找所有 next_reset_at 已过期的美元池
      const { data: pools, error } = await supabase
        .from("usd_pools")
        .select(
          `
          id,
          user_id,
          team_id,
          included_usd_balance,
          included_usd_total,
          on_demand_usd,
          next_reset_at,
          teams (
            id,
            plan_name,
            subscription_status
          )
        `
        )
        .lte("next_reset_at", now.toISOString());

      if (error) {
        console.error("[USD Pool Reset] Error fetching pools:", error);
        return [];
      }

      // 只重置活跃订阅的用户
      const activePools = (pools || []).filter((pool) => {
        const team = Array.isArray(pool.teams) ? pool.teams[0] : pool.teams;
        return (
          team &&
          (team.subscription_status === "active" ||
            team.subscription_status === "trialing")
        );
      });

      console.log(
        `[USD Pool Reset] Found ${activePools.length} active pools to reset`
      );
      return activePools;
    });

    // Step 2: 批量重置美元池
    const resetResults = await step.run("reset-pools", async () => {
      const results: Array<{
        userId: string;
        success: boolean;
        error?: string;
      }> = [];

      for (const pool of poolsToReset) {
        try {
          const team = Array.isArray(pool.teams) ? pool.teams[0] : pool.teams;
          const planName = team?.plan_name || "free";

          const success = await USDPoolManager.resetPeriod({
            userId: pool.user_id,
            planName,
          });

          results.push({
            userId: pool.user_id,
            success,
          });

          if (success) {
            console.log(
              `[USD Pool Reset] Successfully reset pool for user ${pool.user_id} with plan ${planName}`
            );
          } else {
            console.error(
              `[USD Pool Reset] Failed to reset pool for user ${pool.user_id}`
            );
          }
        } catch (error: any) {
          console.error(
            `[USD Pool Reset] Error resetting pool for user ${pool.user_id}:`,
            error
          );
          results.push({
            userId: pool.user_id,
            success: false,
            error: error.message,
          });
        }
      }

      return results;
    });

    // Step 3: 记录统计
    const stats = await step.run("log-stats", async () => {
      const successCount = resetResults.filter((r) => r.success).length;
      const failureCount = resetResults.filter((r) => !r.success).length;

      console.log("[USD Pool Reset] Job completed:");
      console.log(`  - Total pools processed: ${resetResults.length}`);
      console.log(`  - Successful resets: ${successCount}`);
      console.log(`  - Failed resets: ${failureCount}`);

      return {
        total: resetResults.length,
        success: successCount,
        failure: failureCount,
        timestamp: new Date().toISOString(),
      };
    });

    return {
      message: "USD Pool monthly reset completed",
      stats,
    };
  }
);

/**
 * USD Pool 超额阈值告警检查
 * 每天检查用户的 on_demand 使用情况，发送告警
 */
export const usdPoolThresholdCheck = inngest.createFunction(
  {
    id: "usd-pool-threshold-check",
    name: "USD Pool Threshold Check",
  },
  {
    // 每天 UTC 12:00 执行
    cron: "0 12 * * *",
  },
  async ({ event, step }) => {
    console.log("[USD Pool Threshold] Starting daily threshold check...");

    // Step 1: 查找超过阈值的用户
    const alertUsers = await step.run("check-thresholds", async () => {
      const supabase = createServiceClient();

      // 查找 on_demand 使用超过80%限制的用户
      const { data: pools, error } = await supabase
        .from("usd_pools")
        .select(
          `
          id,
          user_id,
          on_demand_usd,
          on_demand_limit,
          profiles (
            email,
            name
          )
        `
        )
        .not("on_demand_limit", "is", null)
        .gt("on_demand_usd", 0);

      if (error) {
        console.error("[USD Pool Threshold] Error fetching pools:", error);
        return [];
      }

      // 筛选超过80%阈值的用户
      const alerts = (pools || []).filter((pool) => {
        if (!pool.on_demand_limit) return false;
        const usagePercent = (pool.on_demand_usd / pool.on_demand_limit) * 100;
        return usagePercent >= 80;
      });

      return alerts.map((pool) => ({
        userId: pool.user_id,
        onDemandUsd: pool.on_demand_usd,
        onDemandLimit: pool.on_demand_limit,
        usagePercent: pool.on_demand_limit
          ? (pool.on_demand_usd / pool.on_demand_limit) * 100
          : 0,
        profile: Array.isArray(pool.profiles)
          ? pool.profiles[0]
          : pool.profiles,
      }));
    });

    // Step 2: 记录告警（实际项目中可以发送邮件/通知）
    const alertStats = await step.run("log-alerts", async () => {
      for (const alert of alertUsers) {
        console.log(
          `[USD Pool Threshold] Alert: User ${alert.userId} has used ${alert.usagePercent.toFixed(1)}% of on-demand limit ($${alert.onDemandUsd}/$${alert.onDemandLimit})`
        );

        // TODO: 这里可以添加发送邮件通知的逻辑
        // await sendThresholdAlertEmail(alert);
      }

      return {
        alertCount: alertUsers.length,
        timestamp: new Date().toISOString(),
      };
    });

    return {
      message: "USD Pool threshold check completed",
      alertStats,
    };
  }
);

export default [usdPoolMonthlyReset, usdPoolThresholdCheck];

