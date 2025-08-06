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

// 执行数据库修复
async function fixDatabaseConstraints() {
  console.log('🔧 开始修复数据库约束问题...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 执行数据库schema更新
    console.log('2. 执行数据库schema更新...');
    
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({});
      
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/admin?path=update-schema',
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
            console.log('📋 数据库更新结果:');
            console.log(`状态码: ${res.statusCode}`);
            console.log(`成功: ${response.success}`);
            console.log(`消息: ${response.message}`);
            if (response.data) {
              console.log('详细信息:', JSON.stringify(response.data, null, 2));
            }
            
            if (response.success) {
              console.log('✅ 数据库约束修复成功！\n');
              
              // 3. 验证修复效果 - 尝试创建独立销售
              console.log('3. 验证修复效果...');
              testIndependentSalesRegistration(token).then(() => {
                console.log('\n🎉 数据库约束问题修复完成！');
                resolve();
              }).catch((error) => {
                console.log(`\n⚠️  验证过程有问题: ${error.message}`);
                resolve(); // 仍然resolve，因为主要修复已完成
              });
            } else {
              console.log('❌ 数据库更新失败');
              resolve();
            }
            
          } catch (error) {
            console.log(`❌ 响应解析失败: ${error.message}`);
            console.log('原始响应:', data);
            resolve();
          }
        });
      });

      req.on('error', (error) => {
        console.log(`❌ 请求失败: ${error.message}`);
        resolve();
      });
      
      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.error('❌ 修复过程失败:', error.message);
  }
}

// 测试独立销售注册
async function testIndependentSalesRegistration(token) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const testData = {
      wechat_name: `test_fix_${timestamp}`,
      payment_method: 'alipay',
      payment_address: `testfix${timestamp}@qq.com`,
      alipay_surname: '修复测试',
      independent: true
    };
    
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
          console.log('📋 独立销售注册验证结果:');
          console.log(`状态码: ${res.statusCode}`);
          console.log(`成功: ${response.success}`);
          console.log(`消息: ${response.message}`);
          
          if (response.success) {
            console.log('✅ 独立销售注册功能已恢复正常！');
            console.log(`创建的销售代码: ${response.data?.sales_code}`);
          } else {
            console.log('❌ 独立销售注册仍然有问题');
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 执行修复
fixDatabaseConstraints();