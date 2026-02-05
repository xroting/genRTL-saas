/**
 * 安全修复验证脚本
 * 用于测试 webhook 签名验证和调试端点保护
 * 
 * 使用方法:
 * node scripts/verify-security-fixes.js
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3005';

// 测试结果收集
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// 测试工具函数
function logTest(name, passed, message) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testEndpoint(name, url, expectedStatus, options = {}) {
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const passed = response.status === expectedStatus;
    const message = `Expected ${expectedStatus}, got ${response.status}`;
    logTest(name, passed, message);
    
    return { passed, status: response.status, response };
  } catch (error) {
    logTest(name, false, `Error: ${error.message}`);
    return { passed: false, error };
  }
}

// 测试套件
async function runTests() {
  console.log('\n🔒 安全修复验证测试\n');
  console.log('='.repeat(60));
  console.log(`测试目标: ${baseUrl}\n`);

  // 1. 测试调试端点保护
  console.log('\n📋 测试组 1: 调试端点访问控制\n');
  
  await testEndpoint(
    '社区调试端点应该被保护',
    `${baseUrl}/api/community/debug`,
    403
  );
  
  await testEndpoint(
    'Inngest 调试端点应该被保护',
    `${baseUrl}/api/inngest-debug`,
    403
  );
  
  await testEndpoint(
    'Inngest 测试端点应该被禁用',
    `${baseUrl}/api/inngest-test`,
    403
  );
  
  // 2. 测试支付测试端点保护
  console.log('\n📋 测试组 2: 支付测试端点保护\n');
  
  await testEndpoint(
    'Stripe 配置测试端点应该被保护',
    `${baseUrl}/api/test-stripe-config`,
    403
  );
  
  await testEndpoint(
    'Alipay 测试端点应该被保护',
    `${baseUrl}/api/test-alipay`,
    403
  );
  
  // 3. 测试 webhook 端点（应该返回 200 或其他有效响应，而不是崩溃）
  console.log('\n📋 测试组 3: Webhook 端点基本可用性\n');
  
  // 注意: 这些测试只验证端点不会崩溃，实际签名验证需要有效的 JWT
  await testEndpoint(
    'Apple Webhook 端点应该可访问（但会拒绝无效签名）',
    `${baseUrl}/api/webhooks/apple`,
    200, // 期望返回 200 但在日志中记录签名验证失败
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { signedPayload: 'invalid.jwt.token' }
    }
  );
  
  await testEndpoint(
    'Google Play Webhook 端点应该拒绝无 Authorization header 的请求',
    `${baseUrl}/api/webhooks/google-play`,
    401, // 期望返回 401 Unauthorized
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { message: { data: 'test' } }
    }
  );
  
  // 4. 测试正常 API 端点未受影响
  console.log('\n📋 测试组 4: 正常 API 端点可用性\n');
  
  await testEndpoint(
    '认证状态端点应该正常工作',
    `${baseUrl}/api/auth/status`,
    200
  );
  
  // 打印测试结果摘要
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 测试结果摘要\n');
  console.log(`总测试数: ${testResults.passed + testResults.failed}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);
  
  if (testResults.failed > 0) {
    console.log('⚠️  存在失败的测试，请检查上述详情。\n');
    process.exit(1);
  } else {
    console.log('✅ 所有安全修复验证通过！\n');
    process.exit(0);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('\n❌ 测试运行失败:', error);
  process.exit(1);
});
