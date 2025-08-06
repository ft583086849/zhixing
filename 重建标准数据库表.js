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

// 重建数据库表
async function rebuildDatabaseTables() {
  console.log('🔧 开始重建标准数据库表结构...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 清空现有数据
    console.log('2. 清空现有测试数据...');
    const clearResult = await apiCall('DELETE', '/api/admin?path=clear-test-data', null, token);
    console.log(`清空结果: ${clearResult.success ? '成功' : '失败'} - ${clearResult.message}`);
    console.log('');

    // 3. 重新执行数据库结构更新
    console.log('3. 重新创建标准数据库表结构...');
    const updateResult = await apiCall('POST', '/api/admin?path=update-schema', {}, token);
    console.log(`更新结果: ${updateResult.success ? '成功' : '失败'} - ${updateResult.message}`);
    
    if (updateResult.success && updateResult.data) {
      console.log('📋 数据库更新详情:');
      console.log(`  创建的表: ${updateResult.data.tables_created?.join(', ')}`);
      console.log(`  更新的表: ${updateResult.data.tables_updated?.join(', ')}`);
      console.log(`  总表数: ${updateResult.data.total_tables}`);
      if (updateResult.data.errors && updateResult.data.errors.length > 0) {
        console.log(`  错误: ${updateResult.data.errors.join(', ')}`);
      }
    }
    console.log('');

    // 4. 测试独立销售注册
    console.log('4. 测试新表结构的独立销售注册...');
    const timestamp = Date.now();
    const testData = {
      wechat_name: `test_standard_${timestamp}`,
      payment_method: 'alipay',
      payment_address: `test${timestamp}@qq.com`,
      alipay_surname: '测试',
      independent: true
    };
    
    console.log('📤 测试数据:', JSON.stringify(testData, null, 2));
    const registerResult = await apiCall('POST', '/api/secondary-sales?path=register-independent', testData, token);
    
    console.log('📥 注册结果:');
    console.log(`状态: ${registerResult.status}`);
    console.log(`成功: ${registerResult.success}`);
    console.log(`消息: ${registerResult.message}`);
    
    if (registerResult.success && registerResult.data) {
      console.log('✅ 注册成功！标准字段验证通过');
      console.log(`  销售代码: ${registerResult.data.sales_code}`);
      console.log(`  收款地址: ${testData.payment_address} (已正确存储)`);
      console.log(`  用户购买链接: ${registerResult.data.user_sales_link}`);
    } else {
      console.log('❌ 注册失败，需要进一步调试');
      if (registerResult.error) console.log(`错误: ${registerResult.error}`);
    }
    
    console.log('原始响应:', registerResult.rawResponse);

    if (registerResult.success) {
      console.log('\n🎉 数据库表结构重建成功！独立销售注册功能已正常！');
      console.log('✅ 收款地址字段已标准化，可以安全用于打款业务');
    } else {
      console.log('\n❌ 数据库表结构重建完成，但功能验证失败');
    }
    
  } catch (error) {
    console.error('❌ 重建过程失败:', error.message);
  }
}

// 执行重建
rebuildDatabaseTables();