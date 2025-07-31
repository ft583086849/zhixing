const https = require('https');

const BASE_URL = 'https://zhixing-seven.vercel.app';

// 测试函数
function testEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`🔍 测试: ${url}`);
    
    https.get(url, (res) => {
      console.log(`  状态码: ${res.statusCode}`);
      console.log(`  内容类型: ${res.headers['content-type']}`);
      
      if (res.statusCode === expectedStatus) {
        console.log(`  ✅ 通过`);
        resolve(true);
      } else {
        console.log(`  ❌ 失败 - 期望 ${expectedStatus}, 实际 ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`  ❌ 错误: ${err.message}`);
      resolve(false);
    });
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始路由修复验证测试...\n');
  
  const tests = [
    { path: '/', description: '根路径' },
    { path: '/sales', description: '销售页面' },
    { path: '/admin', description: '管理员登录页面' },
    { path: '/purchase/test123', description: '用户购买页面' },
    { path: '/sales-reconciliation', description: '销售对账页面' },
    { path: '/auth-test', description: '认证测试页面' },
    { path: '/api/health', description: '健康检查API' },
    { path: '/api/sales?path=list', description: '销售API' },
    { path: '/nonexistent', description: '不存在的页面' }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`\n📋 ${test.description}:`);
    
    if (test.path.startsWith('/api/')) {
      // API端点应该返回200
      const result = await testEndpoint(test.path, 200);
      if (result) passed++;
    } else {
      // 前端路由应该返回200（HTML页面）
      const result = await testEndpoint(test.path, 200);
      if (result) passed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！路由修复成功！');
  } else {
    console.log('⚠️  部分测试失败，需要进一步检查');
  }
  
  console.log('\n🔗 你可以访问以下链接验证:');
  console.log(`   销售页面: ${BASE_URL}/sales`);
  console.log(`   管理员页面: ${BASE_URL}/admin`);
  console.log(`   健康检查: ${BASE_URL}/api/health`);
}

// 运行测试
runTests().catch(console.error); 