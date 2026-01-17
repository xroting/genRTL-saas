#!/usr/bin/env node

/**
 * Inngest 诊断脚本
 *
 * 用于诊断 Inngest webhook 认证失败的原因
 */

const https = require('https');

console.log('\n🔍 Inngest Webhook 诊断工具\n');
console.log('=' .repeat(60));

// 1. 检查环境变量
console.log('\n📋 步骤 1: 检查本地环境变量\n');

const eventKey = process.env.INNGEST_EVENT_KEY;
const signingKey = process.env.INNGEST_SIGNING_KEY;
const devMode = process.env.INNGEST_DEV || process.env.NEXT_PUBLIC_INNGEST_DEV;

console.log('INNGEST_EVENT_KEY:', eventKey ? `✅ 已设置 (${eventKey.substring(0, 10)}...)` : '❌ 未设置');
console.log('INNGEST_SIGNING_KEY:', signingKey ? `✅ 已设置 (${signingKey.substring(0, 15)}...)` : '❌ 未设置');
console.log('INNGEST_DEV:', devMode ? `⚠️ 已设置为 ${devMode}` : '✅ 未设置（正常）');

// 2. 测试生产环境 webhook
console.log('\n📋 步骤 2: 测试生产环境 Webhook\n');

const webhookUrl = 'https://www.monna.us/api/inngest';

https.get(webhookUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      console.log('Webhook 响应:');
      console.log(JSON.stringify(result, null, 2));
      console.log();

      // 分析结果
      console.log('📊 诊断分析:\n');

      if (result.authentication_succeeded) {
        console.log('✅ 认证成功！');
      } else {
        console.log('❌ 认证失败\n');

        console.log('可能的原因:');

        if (!result.has_event_key) {
          console.log('  - INNGEST_EVENT_KEY 未在 Vercel 环境变量中设置');
        }

        if (!result.has_signing_key) {
          console.log('  - INNGEST_SIGNING_KEY 未在 Vercel 环境变量中设置');
        }

        if (result.has_event_key && result.has_signing_key) {
          console.log('  - Signing Key 可能未激活（在 Inngest Dashboard 中检查密钥状态）');
          console.log('  - Signing Key 的值可能不正确');
          console.log('  - Event Key 的值可能不正确');
          console.log('  - Inngest Dashboard 中的 App 未正确配置');
        }
      }

      console.log();
      console.log('注册的函数数量:', result.function_count);
      console.log('预期函数数量: 3 (generateMedia, cleanupJobs, generateLongVideo)');

      if (result.function_count === 3) {
        console.log('✅ 函数注册正常');
      } else {
        console.log('⚠️ 函数注册数量不匹配');
      }

      console.log();
      console.log('=' .repeat(60));
      console.log();

      if (!result.authentication_succeeded) {
        console.log('🔧 建议的解决步骤:\n');
        console.log('1. 在 Inngest Dashboard → Settings → Keys 中:');
        console.log('   - 检查 Signing Key 的状态（应该是 "Active"，不是 "New"）');
        console.log('   - 如果是 "New" 状态，需要进行密钥轮换激活');
        console.log();
        console.log('2. 在 Vercel Dashboard → Settings → Environment Variables 中:');
        console.log('   - 确认 INNGEST_EVENT_KEY 和 INNGEST_SIGNING_KEY 已设置');
        console.log('   - 确认密钥值与 Inngest Dashboard 中完全一致');
        console.log('   - 确保环境变量应用到所有环境（Production, Preview, Development）');
        console.log();
        console.log('3. 重新部署应用:');
        console.log('   - 在 Vercel Dashboard 手动触发重新部署');
        console.log('   - 或推送新的提交到 Git 仓库');
        console.log();
      }

    } catch (error) {
      console.error('❌ 解析响应失败:', error.message);
      console.log('原始响应:', data);
    }
  });

}).on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
});
