#!/usr/bin/env node

/**
 * 测试脚本：验证 /api/team 接口返回的数据结构
 * 用于确认字段映射修复是否生效
 */

const fetch = require('node-fetch');

async function testTeamAPI() {
  const baseUrl = 'http://localhost:3005';
  
  console.log('🧪 测试 /api/team 接口...\n');
  
  try {
    // 测试不需要身份验证的健康检查
    console.log('1. 测试应用连通性...');
    const healthResponse = await fetch(`${baseUrl}/api/health/app`);
    
    if (!healthResponse.ok) {
      console.log('❌ 应用不可访问，请确保应用正在运行');
      return;
    }
    console.log('✅ 应用运行正常\n');
    
    // 测试团队 API（需要身份验证）
    console.log('2. 测试 /api/team 接口...');
    const teamResponse = await fetch(`${baseUrl}/api/team`);
    
    if (!teamResponse.ok) {
      console.log(`❌ API 调用失败，状态码: ${teamResponse.status}`);
      if (teamResponse.status === 401) {
        console.log('这是正常的，因为需要身份验证');
      }
      return;
    }

    const teamData = await teamResponse.json();
    console.log('✅ API 调用成功\n');
    
    console.log('📊 返回的数据结构:');
    console.log(JSON.stringify(teamData, null, 2));
    
    // 检查关键字段
    console.log('\n🔍 字段检查:');
    console.log(`- id: ${teamData?.id || '未找到'}`);
    console.log(`- name: ${teamData?.name || '未找到'}`);
    console.log(`- planName (驼峰式): ${teamData?.planName || '未找到'}`);
    console.log(`- plan_name (下划线): ${teamData?.plan_name || '未找到'}`);
    console.log(`- subscriptionStatus: ${teamData?.subscriptionStatus || '未找到'}`);
    console.log(`- teamMembers: ${teamData?.teamMembers ? `${teamData.teamMembers.length} 个成员` : '未找到'}`);
    
    // 验证修复
    if (teamData?.planName && !teamData?.plan_name) {
      console.log('\n🎉 字段映射修复成功！使用了驼峰式命名');
    } else if (teamData?.plan_name && !teamData?.planName) {
      console.log('\n⚠️  仍在使用下划线命名，需要进一步检查');
    } else if (teamData?.planName && teamData?.plan_name) {
      console.log('\n✅ 两种命名都存在，兼容性良好');
    } else {
      console.log('\n❓ 无法确定字段映射状态');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testTeamAPI().catch(console.error);
}

module.exports = { testTeamAPI };
