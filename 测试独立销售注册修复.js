const https = require('https');

// 管理员登录获取token
async function getAdminToken() {
  const loginData = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(loginData);
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/auth?path=login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data.token) {
            resolve(response.data.token);
          } else {
            reject(new Error(`登录失败: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`登录响应解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 测试独立销售注册
async function testIndependentSalesRegistration() {
  console.log('🔧 测试独立销售注册修复效果...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 测试独立销售注册（使用正确的字段）
    console.log('2. 测试独立销售注册...');
    const timestamp = Date.now();
    const testData = {
      wechat_name: `test_fix_${timestamp}`,
      payment_method: 'alipay',
      payment_address: `test${timestamp}@qq.com`, // 必需的收款地址
      phone: `1380000${timestamp % 10000}`,
      email: `test${timestamp}@qq.com`,
      independent: true
    };
    
    console.log('📤 发送数据:', JSON.stringify(testData, null, 2));
    
    const result = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(testData);
      
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/secondary-sales?path=register-independent',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              status: res.statusCode,
              success: response.success,
              message: response.message,
              data: response.data,
              debug: response.debug,
              rawResponse: data
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('📥 注册结果:');
    console.log(`状态码: ${result.status}`);
    console.log(`成功: ${result.success}`);
    console.log(`消息: ${result.message}`);
    
    if (result.data) {
      console.log('✅ 注册成功！返回数据:');
      console.log(`  销售ID: ${result.data.secondary_sales_id}`);
      console.log(`  微信号: ${result.data.wechat_name}`);
      console.log(`  销售代码: ${result.data.sales_code}`);
      console.log(`  用户购买链接: ${result.data.user_sales_link}`);
    }
    
    if (result.debug) {
      console.log('🔍 调试信息:');
      console.log(`  错误: ${result.debug.error}`);
      console.log(`  错误码: ${result.debug.code}`);
      console.log(`  SQL状态: ${result.debug.sqlState}`);
    }
    
    console.log('原始响应:', result.rawResponse);

    if (result.success) {
      console.log('\n🎉 独立销售注册功能修复成功！');
      
      // 标记todo完成
      console.log('\n✅ P0任务完成: 独立销售注册链路已通畅');
    } else {
      console.log('\n❌ 独立销售注册仍有问题，需要进一步调试');
    }
    
  } catch (error) {
    console.error('❌ 测试过程失败:', error.message);
  }
}

// 执行测试
testIndependentSalesRegistration();