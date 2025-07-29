// Vercel 部署测试脚本
const https = require('https');

// 请将这个 URL 替换为您的实际 Vercel 域名
const VERCEL_DOMAIN = 'zhixing-xxx.vercel.app'; // 请在 Vercel Dashboard 中查看实际域名

const testEndpoints = [
  {
    name: '前端主页',
    path: '/',
    expected: 'React App'
  },
  {
    name: 'API 健康检查',
    path: '/api/health',
    expected: 'status'
  },
  {
    name: 'API 测试接口',
    path: '/api/test-api',
    expected: 'endpoints'
  },
  {
    name: '认证 API',
    path: '/api/auth?path=verify',
    expected: 'success'
  },
  {
    name: '支付配置 API',
    path: '/api/payment-config',
    expected: 'durations'
  }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: VERCEL_DOMAIN,
      path: endpoint.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === 200 && data.includes(endpoint.expected);
        resolve({
          name: endpoint.name,
          path: endpoint.path,
          status: res.statusCode,
          success: success,
          preview: data.substring(0, 100) + '...'
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: endpoint.name,
        path: endpoint.path,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        path: endpoint.path,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 开始测试 Vercel 部署...\n');
  console.log(`测试域名: https://${VERCEL_DOMAIN}\n`);
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    console.log(`测试中: ${endpoint.name}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name} - ${result.status}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  }
  
  console.log('\n📊 测试总结:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`通过: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 所有测试通过！您的 Vercel 部署运行完美！');
  } else {
    console.log('\n⚠️  部分测试失败，但这可能是因为某些 API 需要认证或特定参数。');
  }
  
  console.log('\n🌐 访问您的应用:');
  console.log(`   前端: https://${VERCEL_DOMAIN}`);
  console.log(`   API:  https://${VERCEL_DOMAIN}/api/health`);
  
  return results;
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint }; 