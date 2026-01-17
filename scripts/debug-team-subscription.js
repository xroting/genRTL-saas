#!/usr/bin/env node

/**
 * 调试脚本：检查团队订阅状态
 * 用于验证支付完成后订阅状态更新是否正确
 */

const { createSupabaseClient } = require('@supabase/supabase-js');

async function debugTeamSubscription() {
  // 这里需要配置你的 Supabase 环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 缺少 Supabase 配置，请检查环境变量:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 查询所有团队的订阅状态...\n');

    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        plan_name,
        subscription_status,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_product_id,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    if (!teams || teams.length === 0) {
      console.log('📝 暂无团队数据');
      return;
    }

    console.log(`📊 找到 ${teams.length} 个团队:\n`);

    teams.forEach((team, index) => {
      console.log(`${index + 1}. 团队: ${team.name || '未命名'} (ID: ${team.id})`);
      console.log(`   计划: ${team.plan_name || 'free'}`);
      console.log(`   状态: ${team.subscription_status || '未设置'}`);
      console.log(`   Stripe 客户ID: ${team.stripe_customer_id || '无'}`);
      console.log(`   Stripe 订阅ID: ${team.stripe_subscription_id || '无'}`);
      console.log(`   Stripe 产品ID: ${team.stripe_product_id || '无'}`);
      console.log(`   创建时间: ${team.created_at}`);
      console.log(`   更新时间: ${team.updated_at}\n`);
    });

    // 检查计划名称分布
    const planStats = {};
    teams.forEach(team => {
      const plan = team.plan_name || 'free';
      planStats[plan] = (planStats[plan] || 0) + 1;
    });

    console.log('📈 计划分布统计:');
    Object.entries(planStats).forEach(([plan, count]) => {
      console.log(`   ${plan}: ${count} 个团队`);
    });

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  debugTeamSubscription().catch(console.error);
}

module.exports = { debugTeamSubscription };
