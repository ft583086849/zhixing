const https = require('https');

const BASE_URL = 'https://zhixing-seven.vercel.app';

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

// API调用函数
async function apiCall(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          // 不管成功失败都resolve，方便诊断
          resolve({ 
            status: res.statusCode, 
            success: response.success, 
            data: response.data, 
            message: response.message,
            rawResponse: responseData
          });
        } catch (error) {
          resolve({ 
            status: res.statusCode, 
            success: false, 
            error: `响应解析失败: ${error.message}`, 
            rawResponse: responseData 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: `网络错误: ${error.message}` });
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// 诊断独立销售注册问题
async function diagnoseIndependentSalesRegistration() {
  console.log('🔍 开始诊断独立销售注册问题...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 检查数据库表结构
    console.log('2. 检查数据库表结构...');
    const schemaResult = await apiCall('GET', '/api/database-schema', null, token);
    console.log('📋 数据库schema检查结果:');
    console.log(`状态: ${schemaResult.status}, 成功: ${schemaResult.success}`);
    if (schemaResult.message) console.log(`消息: ${schemaResult.message}`);
    console.log('');

    // 3. 检查现有销售数据
    console.log('3. 检查现有销售数据...');
    const salesListResult = await apiCall('GET', '/api/secondary-sales?path=list', null, token);
    console.log('📋 现有二级销售列表:');
    console.log(`状态: ${salesListResult.status}, 成功: ${salesListResult.success}`);
    if (salesListResult.data && Array.isArray(salesListResult.data)) {
      console.log(`现有二级销售数量: ${salesListResult.data.length}`);
      salesListResult.data.forEach((sale, index) => {
        console.log(`  ${index + 1}. 微信号: ${sale.wechat_name}, 一级销售ID: ${sale.primary_sales_id}`);
      });
    }
    console.log('');

    // 4. 尝试注册独立销售（使用唯一的微信号）
    console.log('4. 尝试注册独立销售...');
    const timestamp = Date.now();
    const testData = {
      wechat_name: `test_independent_${timestamp}`,
      payment_method: 'alipay',
      payment_address: `test${timestamp}@qq.com`,
      alipay_surname: '测试',
      independent: true
    };
    
    console.log('📤 发送数据:', JSON.stringify(testData, null, 2));
    const registerResult = await apiCall('POST', '/api/secondary-sales?path=register-independent', testData, token);
    
    console.log('📥 注册结果:');
    console.log(`状态码: ${registerResult.status}`);
    console.log(`成功: ${registerResult.success}`);
    console.log(`消息: ${registerResult.message}`);
    if (registerResult.data) {
      console.log('返回数据:', JSON.stringify(registerResult.data, null, 2));
    }
    if (registerResult.error) {
      console.log(`错误: ${registerResult.error}`);
    }
    console.log('原始响应:', registerResult.rawResponse);
    console.log('');

    // 5. 如果注册失败，尝试更简单的数据
    if (!registerResult.success) {
      console.log('5. 尝试更简单的数据格式...');
      const simpleTestData = {
        wechat_name: `simple_test_${timestamp}`,
        payment_method: 'alipay',
        payment_address: `simple${timestamp}@qq.com`,
        alipay_surname: '测试'
      };
      
      console.log('📤 简化数据:', JSON.stringify(simpleTestData, null, 2));
      const simpleResult = await apiCall('POST', '/api/secondary-sales?path=register-independent', simpleTestData, token);
      
      console.log('📥 简化测试结果:');
      console.log(`状态码: ${simpleResult.status}`);
      console.log(`成功: ${simpleResult.success}`);
      console.log(`消息: ${simpleResult.message}`);
      console.log('原始响应:', simpleResult.rawResponse);
    }

    console.log('\n🎯 诊断总结:');
    if (registerResult.success) {
      console.log('✅ 独立销售注册功能正常');
    } else {
      console.log('❌ 独立销售注册存在问题');
      console.log('可能原因:');
      if (registerResult.status === 400) {
        console.log('  - 数据验证失败（字段缺失或格式错误）');
      } else if (registerResult.status === 500) {
        console.log('  - 数据库约束问题（primary_sales_id不允许NULL）');
        console.log('  - 数据库字段缺失');
        console.log('  - 其他数据库错误');
      }
      console.log('建议: 检查数据库表结构和约束设置');
    }
    
  } catch (error) {
    console.error('❌ 诊断过程失败:', error.message);
  }
}

// 执行诊断
diagnoseIndependentSalesRegistration();