#!/usr/bin/env node

/**
 * 测试各个页面路由的实际返回内容
 */

const https = require('https');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testRoutes() {
  console.log('🔍 测试各个页面路由');
  console.log('=' .repeat(60));

  const routes = [
    { name: '管理员页面', url: 'https://zhixing-seven.vercel.app/#/admin' },
    { name: '高阶销售注册', url: 'https://zhixing-seven.vercel.app/#/sales' },
    { name: '一级销售订单结算', url: 'https://zhixing-seven.vercel.app/#/sales/commission' },
    { name: '二级销售对账', url: 'https://zhixing-seven.vercel.app/#/sales/settlement' }
  ];

  for (const route of routes) {
    console.log(`\n📋 测试: ${route.name}`);
    console.log(`🔗 URL: ${route.url}`);
    
    try {
      // 由于是单页应用，所有路由都返回同一个HTML
      const result = await makeRequest('https://zhixing-seven.vercel.app/');
      
      // 检查HTML内容中的关键信息
      console.log(`✅ 状态码: ${result.statusCode}`);
      
      // 检查是否包含React Router相关内容
      if (result.body.includes('<div id="root">')) {
        console.log('✅ React应用根元素存在');
      }
      
      if (result.body.includes('/static/js/')) {
        console.log('✅ 包含JS bundle');
      }
      
      // 检查最后修改时间
      const lastModified = result.headers['last-modified'];
      if (lastModified) {
        console.log(`📅 最后修改时间: ${lastModified}`);
      }
      
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
    }
  }

  // 测试API健康状态
  console.log('\n📋 API状态检查');
  try {
    const healthResult = await makeRequest('https://zhixing-seven.vercel.app/api/health');
    if (healthResult.statusCode === 200) {
      const data = JSON.parse(healthResult.body);
      console.log('✅ API正常运行');
      console.log(`⏰ API时间戳: ${data.data.timestamp}`);
    }
  } catch (error) {
    console.log(`❌ API检查失败: ${error.message}`);
  }
}

if (require.main === module) {
  testRoutes()
    .then(() => {
      console.log('\n🎉 路由测试完成');
    })
    .catch(error => {
      console.error('测试出错:', error);
      process.exit(1);
    });
}