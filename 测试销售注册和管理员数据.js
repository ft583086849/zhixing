const https = require('https');

async function makeRequest(hostname, path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
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
            data: response
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSalesCreationAndAdminData() {
  console.log('🧪 测试销售注册和管理员后台数据显示\n');

  try {
    // 1. 创建一级销售
    console.log('1. 创建一级销售...');
    const primarySalesData = {
      wechat_name: `test_primary_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'test_alipay@example.com',
      alipay_surname: '测试'
    };

    const primaryResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/primary-sales?path=create',
      'POST',
      primarySalesData
    );

    console.log(`   创建一级销售: ${primaryResult.status}`);
    console.log(`   响应: ${JSON.stringify(primaryResult.data, null, 2)}`);

    let registrationCode = null;
    if (primaryResult.data.success && primaryResult.data.data.secondary_registration_code) {
      registrationCode = primaryResult.data.data.secondary_registration_code;
      console.log(`   ✅ 一级销售创建成功，注册码: ${registrationCode}`);
    } else {
      console.log(`   ❌ 一级销售创建失败`);
    }

    // 2. 创建关联二级销售（如果有注册码）
    if (registrationCode) {
      console.log('\n2. 创建关联二级销售...');
      const secondarySalesData = {
        wechat_name: `test_secondary_${Date.now()}`,
        payment_method: 'alipay',
        payment_address: 'test_secondary_alipay@example.com',
        alipay_surname: '测试二级',
        registration_code: registrationCode
      };

      const secondaryResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/secondary-sales?path=register',
        'POST',
        secondarySalesData
      );

      console.log(`   创建关联二级销售: ${secondaryResult.status}`);
      console.log(`   响应: ${JSON.stringify(secondaryResult.data, null, 2)}`);
    }

    // 3. 创建独立二级销售
    console.log('\n3. 创建独立二级销售...');
    const independentSalesData = {
      wechat_name: `test_independent_${Date.now()}`,
      payment_method: 'crypto',
      payment_address: '0x123456789abcdef',
      chain_name: 'USDT-TRC20',
      independent: true
    };

    const independentResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/secondary-sales?path=register',
      'POST',
      independentSalesData
    );

    console.log(`   创建独立二级销售: ${independentResult.status}`);
    console.log(`   响应: ${JSON.stringify(independentResult.data, null, 2)}`);

    // 4. 登录管理员
    console.log('\n4. 登录管理员账户...');
    const loginData = {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    };

    const loginResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/auth?path=login',
      'POST',
      loginData
    );

    console.log(`   管理员登录: ${loginResult.status}`);
    let authToken = null;
    if (loginResult.data.success && loginResult.data.data.token) {
      authToken = loginResult.data.data.token;
      console.log(`   ✅ 登录成功，获取token`);
    } else {
      console.log(`   ❌ 登录失败: ${JSON.stringify(loginResult.data)}`);
    }

    // 5. 获取管理员后台销售数据
    if (authToken) {
      console.log('\n5. 获取管理员后台销售数据...');
      
      const salesResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/admin?path=sales',
        'GET',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      console.log(`   获取销售数据: ${salesResult.status}`);
      console.log(`   销售数据响应: ${JSON.stringify(salesResult.data, null, 2)}`);

      if (salesResult.data.success && salesResult.data.data) {
        const salesData = salesResult.data.data;
        console.log(`   📊 销售数据统计:`);
        console.log(`      总销售数量: ${salesData.length || 0}`);
        
        // 按类型分类统计
        const primaryCount = salesData.filter(s => s.sales_type === 'primary').length;
        const secondaryCount = salesData.filter(s => s.sales_type === 'secondary').length;
        const legacyCount = salesData.filter(s => s.sales_type === 'legacy').length;
        
        console.log(`      一级销售: ${primaryCount}`);
        console.log(`      二级销售: ${secondaryCount}`);
        console.log(`      遗留销售: ${legacyCount}`);
        
        // 显示最近创建的销售
        if (salesData.length > 0) {
          console.log(`   📝 最近创建的销售:`);
          salesData.slice(0, 3).forEach((sale, index) => {
            console.log(`      ${index + 1}. ${sale.wechat_name} (${sale.sales_type}) - ${sale.created_at}`);
          });
        }
      } else {
        console.log(`   ❌ 获取销售数据失败或无数据`);
      }

      // 6. 检查数据库表结构（通过统计接口）
      console.log('\n6. 检查数据库统计信息...');
      
      const statsResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/admin?path=stats',
        'GET',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      console.log(`   获取统计数据: ${statsResult.status}`);
      if (statsResult.data.success) {
        console.log(`   📈 系统统计: ${JSON.stringify(statsResult.data.data, null, 2)}`);
      }
    }

    console.log('\n🏁 测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

testSalesCreationAndAdminData();