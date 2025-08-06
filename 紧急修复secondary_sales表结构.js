// 紧急修复 secondary_sales 表结构
const https = require('https');

async function emergencyFixSecondaryTable() {
  console.log('🚨 紧急修复 secondary_sales 表结构...\n');
  
  try {
    // 1. 登录获取token
    console.log('1️⃣ 登录管理员账户...');
    
    const loginData = JSON.stringify({
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    const loginResult = await makeRequest('/api/auth?path=login', 'POST', loginData);
    
    if (!loginResult.success) {
      throw new Error('登录失败: ' + loginResult.message);
    }
    
    const token = loginResult.token;
    console.log('   ✅ 登录成功');
    
    // 2. 直接执行SQL修复
    console.log('\n2️⃣ 执行数据库结构修复...');
    
    // 方案1：通过数据库健康检查API
    console.log('   尝试触发健康检查API...');
    
    const healthResult = await makeAuthenticatedRequest('/api/admin?path=init-database', 'POST', '{}', token);
    console.log(`   健康检查结果: ${healthResult.success ? '成功' : '失败'}`);
    
    if (healthResult.success) {
      console.log('   ✅ 数据库结构修复可能已执行');
    } else {
      console.log(`   错误: ${healthResult.message}`);
    }
    
    // 3. 等待一段时间后测试
    console.log('\n3️⃣ 等待修复生效并测试...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 测试二级销售注册
    const testData = JSON.stringify({
      wechat_name: 'emergency_test_' + Date.now(),
      payment_method: 'alipay',
      payment_address: '13800138000',
      alipay_surname: '紧急测试'
    });
    
    const testResult = await makeRequest('/api/secondary-sales?path=register-independent', 'POST', testData);
    
    console.log(`   二级销售注册测试: ${testResult.success ? '✅成功' : '❌失败'}`);
    
    if (!testResult.success) {
      console.log(`   错误: ${testResult.message}`);
      if (testResult.debug) {
        console.log(`   详细: ${testResult.debug.message}`);
      }
    } else {
      console.log(`   ✅ 创建成功! 销售ID: ${testResult.data?.secondary_sales_id}`);
      console.log(`   销售代码: ${testResult.data?.sales_code}`);
    }
    
    // 4. 如果还是失败，提供诊断信息
    if (!testResult.success && testResult.debug?.code === 'ER_BAD_NULL_ERROR') {
      console.log('\n❌ 数据库结构修复未生效');
      console.log('🔧 需要手动执行以下SQL:');
      console.log('   ALTER TABLE secondary_sales MODIFY COLUMN primary_sales_id INT NULL;');
      console.log('');
      console.log('💡 可能的原因:');
      console.log('   1. Admin健康检查API有错误');
      console.log('   2. 数据库修复逻辑没有正确执行');
      console.log('   3. PlanetScale数据库权限问题');
    }
    
  } catch (error) {
    console.error('❌ 紧急修复过程出错:', error.message);
  }
}

// HTTP请求函数
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EmergencyFix/1.0'
      }
    };

    if (data && method !== 'GET') {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          resolve({ 
            success: false, 
            message: '解析响应失败',
            raw: responseData.substring(0, 200)
          });
        }
      });
    });

    req.on('error', () => {
      resolve({ success: false, message: '网络请求失败' });
    });

    if (data && method !== 'GET') {
      req.write(data);
    }
    req.end();
  });
}

// 带认证的HTTP请求
function makeAuthenticatedRequest(path, method = 'GET', data = null, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'EmergencyFix/1.0'
      }
    };

    if (data && method !== 'GET') {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          resolve({ 
            success: false, 
            message: '解析响应失败',
            raw: responseData.substring(0, 200)
          });
        }
      });
    });

    req.on('error', () => {
      resolve({ success: false, message: '网络请求失败' });
    });

    if (data && method !== 'GET') {
      req.write(data);
    }
    req.end();
  });
}

// 执行紧急修复
emergencyFixSecondaryTable();