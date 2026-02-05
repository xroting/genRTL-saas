/**
 * 安全修复验证脚本 - 第二轮
 * 验证 API费用保护、日志安全与CORS限制
 * 
 * 使用方法:
 * node scripts/verify-security-fixes-round2.js
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
    
    // 返回响应用于额外检查
    return { passed, status: response.status, response };
  } catch (error) {
    logTest(name, false, `Error: ${error.message}`);
    return { passed: false, error };
  }
}

// 测试套件
async function runTests() {
  console.log('\n🔒 安全修复验证测试 - 第二轮\n');
  console.log('='.repeat(60));
  console.log(`测试目标: ${baseUrl}\n`);

  // 1. 测试翻译接口已删除
  console.log('\n📋 测试组 1: 翻译接口删除验证\n');
  
  await testEndpoint(
    '翻译接口应该返回 404',
    `${baseUrl}/api/translate`,
    404,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { text: 'test', targetLanguage: 'zh' }
    }
  );
  
  // 2. 测试环境变量接口保护
  console.log('\n📋 测试组 2: 环境变量接口保护\n');
  
  await testEndpoint(
    '环境变量接口应该被保护',
    `${baseUrl}/api/test-env`,
    403
  );
  
  // 3. 测试CORS配置
  console.log('\n📋 测试组 3: CORS配置限制\n');
  
  // 测试未授权的源
  const unauthorizedOriginTest = await testEndpoint(
    'Chat端点拒绝未授权源（无CORS header）',
    `${baseUrl}/api/chat`,
    401, // 预期401因为无认证,但重点是检查CORS header
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://malicious-site.com'
      },
      body: { 
        messages: [{ role: 'user', content: 'test' }] // 提供有效的消息避免400
      }
    }
  );
  
  // 检查是否有Access-Control-Allow-Origin header
  if (unauthorizedOriginTest.response) {
    const corsHeader = unauthorizedOriginTest.response.headers.get('Access-Control-Allow-Origin');
    const hasCors = corsHeader === 'https://malicious-site.com';
    logTest(
      'Chat端点不应返回未授权源的CORS header',
      !hasCors,
      hasCors ? `Found CORS header: ${corsHeader}` : 'No CORS header for unauthorized origin'
    );
  }
  
  // 测试授权的源
  const authorizedOriginTest = await testEndpoint(
    'Chat端点接受授权源（应有OPTIONS支持）',
    `${baseUrl}/api/chat`,
    200, // OPTIONS请求
    {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    }
  );
  
  if (authorizedOriginTest.response) {
    const corsHeader = authorizedOriginTest.response.headers.get('Access-Control-Allow-Origin');
    const hasCors = corsHeader === 'http://localhost:3000';
    logTest(
      'Chat端点应返回授权源的CORS header',
      hasCors,
      hasCors ? `Correct CORS header: ${corsHeader}` : `Missing or wrong CORS header: ${corsHeader}`
    );
    
    // 检查Vary header
    const varyHeader = authorizedOriginTest.response.headers.get('Vary');
    const hasVary = varyHeader && varyHeader.includes('Origin');
    logTest(
      'Chat端点应包含Vary: Origin header',
      hasVary,
      hasVary ? `Vary header present: ${varyHeader}` : 'Missing Vary: Origin header'
    );
  }
  
  // 4. 测试认证端点CORS
  console.log('\n📋 测试组 4: 认证端点CORS配置\n');
  
  const signupCorsTest = await testEndpoint(
    'Signup端点应支持授权源CORS',
    `${baseUrl}/api/auth/signup`,
    200, // OPTIONS请求
    {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    }
  );
  
  if (signupCorsTest.response) {
    const corsHeader = signupCorsTest.response.headers.get('Access-Control-Allow-Origin');
    const hasCors = corsHeader === 'http://localhost:3000';
    logTest(
      'Signup端点CORS配置正确',
      hasCors,
      `CORS header: ${corsHeader || 'none'}`
    );
  }
  
  // 5. 测试日志安全（需要手动验证）
  console.log('\n📋 测试组 5: 日志安全（需手动验证）\n');
  
  console.log('⚠️  以下需要手动验证:');
  console.log('   1. 检查应用日志是否包含 [requestId] 前缀');
  console.log('   2. 确认日志不包含 Bearer token 前缀');
  console.log('   3. 确认日志不包含完整消息内容');
  console.log('   4. 确认日志仅记录元数据（角色、token数、成本）\n');
  
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
    console.log('✅ 第二轮安全修复验证通过！\n');
    console.log('📝 提醒: 请手动验证日志安全相关项目。\n');
    process.exit(0);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('\n❌ 测试运行失败:', error);
  process.exit(1);
});
