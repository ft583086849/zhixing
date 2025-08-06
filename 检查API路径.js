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

// 测试API路径
async function testAPIPath() {
  console.log('🔍 测试API路径...\n');
  
  try {
    // 1. 登录获取token
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 测试现有路径
    console.log('2. 测试现有API路径...');
    
    // 测试primary-sales列表
    const testList = new Promise((resolve) => {
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/primary-sales?path=list',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log(`GET /api/primary-sales?path=list: ${res.statusCode}`);
          resolve();
        });
      });
      req.on('error', () => resolve());
      req.end();
    });

    await testList;

    // 3. 测试update-commission路径
    console.log('3. 测试update-commission路径...');
    
    const testUpdate = new Promise((resolve) => {
      const postData = JSON.stringify({ commissionRate: 0.25 });
      
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/primary-sales?path=update-commission&id=2',
        method: 'PUT',
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
          console.log(`PUT /api/primary-sales?path=update-commission&id=2: ${res.statusCode}`);
          try {
            const response = JSON.parse(data);
            console.log(`响应: ${response.message || data}`);
          } catch (e) {
            console.log(`响应: ${data.substring(0, 100)}`);
          }
          resolve();
        });
      });
      
      req.on('error', (err) => {
        console.log(`错误: ${err.message}`);
        resolve();
      });
      
      req.write(postData);
      req.end();
    });

    await testUpdate;

    // 4. 测试不同的路径格式
    console.log('4. 测试其他可能的路径格式...');
    
    // 尝试不带query参数的路径
    const testAlt = new Promise((resolve) => {
      const postData = JSON.stringify({ 
        path: 'update-commission',
        id: 2,
        commissionRate: 0.25 
      });
      
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/primary-sales',
        method: 'PUT',
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
          console.log(`PUT /api/primary-sales (body path): ${res.statusCode}`);
          try {
            const response = JSON.parse(data);
            console.log(`响应: ${response.message || data}`);
          } catch (e) {
            console.log(`响应: ${data.substring(0, 100)}`);
          }
          resolve();
        });
      });
      
      req.on('error', (err) => {
        console.log(`错误: ${err.message}`);
        resolve();
      });
      
      req.write(postData);
      req.end();
    });

    await testAlt;

    console.log('\n✅ API路径测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 执行测试
testAPIPath();