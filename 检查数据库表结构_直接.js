const https = require('https');

async function apiCall(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && {'Content-Length': Buffer.byteLength(postData)})
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            success: response.success !== undefined ? response.success : res.statusCode < 400,
            message: response.message || '',
            data: response.data || response
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            success: res.statusCode < 400,
            message: responseData,
            data: null
          });
        }
      });
    });

    req.on('error', (error) => reject(error));
    if (postData) req.write(postData);
    req.end();
  });
}

async function checkDatabaseStructure() {
  console.log('🔍 检查数据库表结构...\n');

  try {
    // 1. 先尝试登录获取基本信息
    console.log('1. 尝试登录...');
    const loginResult = await apiCall('POST', '/api/auth?path=login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    console.log(`   登录结果: ${loginResult.status} - ${loginResult.success ? '成功' : '失败'}`);
    if (loginResult.data && loginResult.data.token) {
      console.log(`   Token获取: 成功 (长度: ${loginResult.data.token.length})`);
    }

    // 2. 检查数据库健康状态
    console.log('\n2. 检查数据库健康状态...');
    const healthResult = await apiCall('GET', '/api/admin?path=health');
    
    console.log(`   健康检查: ${healthResult.status} - ${healthResult.success ? '成功' : '失败'}`);
    console.log(`   响应消息: ${healthResult.message}`);

    // 3. 尝试获取表结构信息
    console.log('\n3. 检查表结构（通过update-schema）...');
    const schemaResult = await apiCall('POST', '/api/admin?path=update-schema');
    
    console.log(`   Schema更新: ${schemaResult.status} - ${schemaResult.success ? '成功' : '失败'}`);
    console.log(`   响应消息: ${schemaResult.message}`);
    
    if (schemaResult.data) {
      console.log('   Schema详情:', JSON.stringify(schemaResult.data, null, 2));
    }

    // 4. 简单API测试
    console.log('\n4. 简单API连通性测试...');
    const simpleTests = [
      { path: '/api/auth', desc: '认证API' },
      { path: '/api/admin', desc: '管理员API' },
      { path: '/api/orders', desc: '订单API' },
      { path: '/api/primary-sales', desc: '一级销售API' }
    ];

    for (const test of simpleTests) {
      const result = await apiCall('GET', test.path);
      console.log(`   ${test.desc}: ${result.status} - ${result.message.substring(0, 50)}...`);
    }

    console.log('\n🎉 数据库结构检查完成！');

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

checkDatabaseStructure();