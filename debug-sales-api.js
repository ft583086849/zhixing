const https = require('https');

const BASE_URL = 'https://zhixing-seven.vercel.app';

// 测试数据库连接
async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');
  
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/api/health`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📊 健康检查结果:', result);
          resolve(result);
        } catch (error) {
          console.log('❌ 解析响应失败:', error.message);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.log('❌ 请求失败:', err.message);
      resolve(null);
    });
  });
}

// 测试销售API创建功能
async function testSalesCreation() {
  console.log('\n🔍 测试销售创建API...');
  
  const testData = {
    wechat_name: '测试微信用户',
    payment_method: 'alipay',
    payment_address: 'test@alipay.com',
    alipay_surname: '张'
  };
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/sales?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 状态码: ${res.statusCode}`);
        console.log(`📊 响应头:`, res.headers);
        
        try {
          const result = JSON.parse(data);
          console.log('📊 响应数据:', result);
          resolve(result);
        } catch (error) {
          console.log('❌ 解析响应失败:', error.message);
          console.log('📄 原始响应:', data);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ 请求失败:', err.message);
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
}

// 测试不同的支付方式
async function testDifferentPaymentMethods() {
  console.log('\n🔍 测试不同支付方式...');
  
  const testCases = [
    {
      name: '支付宝支付',
      data: {
        wechat_name: '支付宝测试',
        payment_method: 'alipay',
        payment_address: 'alipay@test.com',
        alipay_surname: '李'
      }
    },
    {
      name: '加密货币支付',
      data: {
        wechat_name: '加密货币测试',
        payment_method: 'crypto',
        payment_address: 'TRC20地址示例',
        chain_name: 'TRC20'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 测试: ${testCase.name}`);
    
    const result = await new Promise((resolve) => {
      const postData = JSON.stringify(testCase.data);
      
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/sales?path=create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`  状态码: ${res.statusCode}`);
            console.log(`  结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
            console.log(`  消息: ${result.message}`);
            if (result.data) {
              console.log(`  链接: ${result.data.full_link}`);
            }
            resolve(result);
          } catch (error) {
            console.log(`  ❌ 解析失败: ${error.message}`);
            resolve(null);
          }
        });
      });
      
      req.on('error', (err) => {
        console.log(`  ❌ 请求失败: ${err.message}`);
        resolve(null);
      });
      
      req.write(postData);
      req.end();
    });
  }
}

// 主函数
async function main() {
  console.log('🚀 开始销售API调试测试...\n');
  
  // 1. 测试数据库连接
  const healthResult = await testDatabaseConnection();
  
  if (healthResult && healthResult.database && healthResult.database.connected) {
    console.log('✅ 数据库连接正常');
  } else {
    console.log('❌ 数据库连接异常');
    return;
  }
  
  // 2. 测试销售创建
  const createResult = await testSalesCreation();
  
  // 3. 测试不同支付方式
  await testDifferentPaymentMethods();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 调试测试完成');
  
  if (createResult && createResult.success) {
    console.log('🎉 销售创建功能正常！');
  } else {
    console.log('⚠️  销售创建功能有问题，需要进一步检查');
  }
}

// 运行测试
main().catch(console.error); 