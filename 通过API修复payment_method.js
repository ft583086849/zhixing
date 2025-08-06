// 通过Vercel API修复 payment_method 枚举值
const https = require('https');

// 通过 admin API 执行数据库操作
async function executeDbFix() {
  console.log('🔧 通过API修复 payment_method 枚举值...\n');
  
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
    
    // 2. 通过健康检查API执行SQL修复
    console.log('\n2️⃣ 执行 primary_sales 表修复...');
    
    const primaryFixSql = `
      ALTER TABLE primary_sales 
      MODIFY COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
      COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
    `;
    
    const primaryResult = await makeAuthenticatedRequest(
      '/api/admin?path=execute-sql', 
      'POST',
      JSON.stringify({
        sql: primaryFixSql.trim()
      }),
      token
    );
    
    console.log('   primary_sales修复结果:', primaryResult.success ? '✅成功' : '❌失败');
    if (!primaryResult.success) {
      console.log('   错误信息:', primaryResult.message);
    }
    
    // 3. 修复 secondary_sales 表
    console.log('\n3️⃣ 执行 secondary_sales 表修复...');
    
    const secondaryFixSql = `
      ALTER TABLE secondary_sales 
      MODIFY COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
      COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
    `;
    
    const secondaryResult = await makeAuthenticatedRequest(
      '/api/admin?path=execute-sql', 
      'POST',
      JSON.stringify({
        sql: secondaryFixSql.trim()
      }),
      token
    );
    
    console.log('   secondary_sales修复结果:', secondaryResult.success ? '✅成功' : '❌失败');
    if (!secondaryResult.success) {
      console.log('   错误信息:', secondaryResult.message);
    }
    
    // 4. 验证修复结果
    console.log('\n4️⃣ 验证修复结果...');
    
    const verifyResult = await makeAuthenticatedRequest(
      '/api/admin?path=health', 
      'GET',
      null,
      token
    );
    
    if (verifyResult.success) {
      console.log('   ✅ 数据库连接正常');
      console.log('   📊 表状态:', verifyResult.data?.tables_status || '未知');
    } else {
      console.log('   ❌ 验证失败:', verifyResult.message);
    }
    
    // 5. 测试API修复效果
    console.log('\n5️⃣ 测试修复后的API...');
    
    // 测试一级销售创建
    const testPrimaryData = JSON.stringify({
      wechat_name: 'test_primary_' + Date.now(),
      payment_method: 'alipay',
      payment_address: 'test_alipay_address'
    });
    
    const primaryTestResult = await makeRequest('/api/primary-sales?path=create', 'POST', testPrimaryData);
    console.log('   一级销售创建测试:', primaryTestResult.success ? '✅成功' : '❌失败');
    if (!primaryTestResult.success) {
      console.log('   错误:', primaryTestResult.message);
    }
    
    // 测试二级销售独立注册
    const testSecondaryData = JSON.stringify({
      wechat_name: 'test_secondary_' + Date.now(),
      payment_method: 'crypto',
      payment_address: 'test_crypto_address',
      chain_name: 'ETH'
    });
    
    const secondaryTestResult = await makeRequest('/api/secondary-sales?path=register-independent', 'POST', testSecondaryData);
    console.log('   二级销售注册测试:', secondaryTestResult.success ? '✅成功' : '❌失败');
    if (!secondaryTestResult.success) {
      console.log('   错误:', secondaryTestResult.message);
    }
    
    console.log('\n🎉 payment_method 修复和测试完成！');
    
    if (primaryTestResult.success && secondaryTestResult.success) {
      console.log('\n✨ 现在注册功能应该可以正常工作了！');
      console.log('   支持的收款方式：');
      console.log('   - alipay: 支付宝收款');
      console.log('   - crypto: 线上地址码收款');
    }
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error.message);
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
        'User-Agent': 'FixScript/1.0'
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
        'User-Agent': 'FixScript/1.0'
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

// 执行修复
executeDbFix();