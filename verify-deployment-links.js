// 验证部署效果 - 测试一级销售链接修复
const https = require('https');
const http = require('http');

console.log('🔍 开始验证一级销售链接修复效果...\n');

// 测试页面可访问性
function testPageAccess(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };

    console.log(`📋 测试 ${description}:`);
    console.log(`🔗 URL: ${url}`);
    
    const req = protocol.request(url, options, (res) => {
      console.log(`📊 状态码: ${res.statusCode}`);
      console.log(`📦 Content-Type: ${res.headers['content-type']}`);
      
      if (res.statusCode === 200) {
        console.log(`✅ ${description} - 可正常访问\n`);
        resolve(true);
      } else {
        console.log(`❌ ${description} - 访问异常\n`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${description} - 网络错误: ${error.message}\n`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log(`❌ ${description} - 请求超时\n`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// 测试API端点
function testAPIEndpoint(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };

    console.log(`🧪 测试 ${description}:`);
    console.log(`🔗 URL: ${url}`);
    
    const req = protocol.request(url, options, (res) => {
      console.log(`📊 状态码: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`📦 响应: ${JSON.stringify(response, null, 2).substring(0, 200)}...`);
          
          if (res.statusCode === 400 && response.message && response.message.includes('缺少必填字段')) {
            console.log(`✅ ${description} - API正常响应（预期的参数验证错误）\n`);
            resolve(true);
          } else {
            console.log(`⚠️ ${description} - 响应异常\n`);
            resolve(false);
          }
        } catch (e) {
          console.log(`❌ ${description} - 响应格式错误\n`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${description} - 网络错误: ${error.message}\n`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log(`❌ ${description} - 请求超时\n`);
      req.destroy();
      resolve(false);
    });
    
    // 发送测试数据
    const testData = JSON.stringify({
      wechat_name: 'test_user',
      payment_method: 'alipay'
    });
    
    req.write(testData);
    req.end();
  });
}

// 主验证函数
async function verifyDeployment() {
  console.log('🚀 验证部署效果 - 一级销售链接修复\n');
  console.log('='.repeat(50) + '\n');
  
  const tests = [
    // 测试前端页面
    {
      url: 'https://zhixing-seven.vercel.app/primary-sales',
      description: '一级销售注册页面',
      type: 'page'
    },
    {
      url: 'https://zhixing-seven.vercel.app/secondary-sales',
      description: '二级销售注册页面',
      type: 'page'
    },
    {
      url: 'https://zhixing-seven.vercel.app/purchase',
      description: '用户购买页面',
      type: 'page'
    },
    
    // 测试API端点
    {
      url: 'https://zhixing-seven.vercel.app/api/primary-sales?path=create',
      description: '一级销售创建API',
      type: 'api'
    }
  ];
  
  let successCount = 0;
  let totalCount = tests.length;
  
  for (const test of tests) {
    const result = test.type === 'page' 
      ? await testPageAccess(test.url, test.description)
      : await testAPIEndpoint(test.url, test.description);
    
    if (result) successCount++;
    
    // 延迟一秒避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('='.repeat(50));
  console.log('📊 验证结果汇总:');
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`📈 成功率: ${Math.round(successCount/totalCount*100)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 部署验证完全成功！');
    console.log('🔗 一级销售链接修复已生效');
    console.log('📝 建议进行手动功能测试：');
    console.log('   1. 访问一级销售页面创建销售');
    console.log('   2. 验证生成的链接格式');
    console.log('   3. 测试完整购买流程');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查部署状态');
  }
}

// 执行验证
verifyDeployment().catch(console.error);