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

async function testRenewalLogic() {
  console.log('🧪 测试续费功能修复\n');

  try {
    // 1. 登录管理员，获取现有用户和销售数据
    console.log('1. 登录管理员账户...');
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

    if (!loginResult.data.success) {
      throw new Error(`管理员登录失败: ${loginResult.data.message}`);
    }

    const authToken = loginResult.data.data.token;
    console.log('✅ 管理员登录成功');

    // 2. 获取现有订单
    console.log('\n2. 获取现有订单数据...');
    const ordersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const orders = ordersResult.data.data.orders;
    console.log(`✅ 获取到 ${orders.length} 个订单`);

    // 找一个现有用户和其销售代码
    if (orders.length === 0) {
      console.log('❌ 没有现有订单，无法测试续费功能');
      return;
    }

    const testOrder = orders[0];
    const existingUser = testOrder.tradingview_username;
    const salesCode = testOrder.sales_code || testOrder.link_code;
    
    console.log(`📝 测试用户: ${existingUser}`);
    console.log(`📝 销售代码: ${salesCode}`);

    // 3. 测试同一销售下的续费（应该成功）
    console.log('\n3. 测试同一销售下的续费（应该成功）...');
    const renewalData = {
      sales_code: salesCode,
      link_code: salesCode,
      tradingview_username: existingUser,
      customer_wechat: 'renewal_test_wechat',
      duration: '3months',
      amount: 488,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '488'
    };

    const renewalResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders',
      'POST',
      renewalData
    );

    console.log(`   状态码: ${renewalResult.status}`);
    if (renewalResult.data.success) {
      console.log('✅ 同一销售下续费成功！');
      console.log(`   新订单ID: ${renewalResult.data.data.order_id}`);
    } else {
      console.log('❌ 同一销售下续费失败');
      console.log(`   错误信息: ${renewalResult.data.message}`);
    }

    // 4. 获取不同的销售代码来测试跨销售绑定
    console.log('\n4. 获取销售数据，测试跨销售绑定...');
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const allSales = salesResult.data.data.sales;
    const differentSales = allSales.find(s => s.sales_code !== salesCode);

    if (differentSales) {
      console.log(`📝 使用不同销售代码: ${differentSales.sales_code}`);
      
      // 5. 测试跨销售绑定（应该失败）
      console.log('\n5. 测试跨销售绑定（应该被禁止）...');
      const crossSalesData = {
        sales_code: differentSales.sales_code,
        link_code: differentSales.sales_code,
        tradingview_username: existingUser,
        customer_wechat: 'cross_sales_test_wechat',
        duration: '1month',
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate',
        alipay_amount: '188'
      };

      const crossSalesResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/orders',
        'POST',
        crossSalesData
      );

      console.log(`   状态码: ${crossSalesResult.status}`);
      if (!crossSalesResult.data.success) {
        console.log('✅ 跨销售绑定被正确禁止！');
        console.log(`   错误信息: ${crossSalesResult.data.message}`);
        
        // 检查错误信息是否正确
        if (crossSalesResult.data.message.includes('跨销售绑定')) {
          console.log('✅ 错误信息正确！');
        } else {
          console.log('⚠️  错误信息不是预期的跨销售绑定提示');
        }
      } else {
        console.log('❌ 跨销售绑定没有被禁止（这是bug）');
      }
    } else {
      console.log('⚠️  只有一个销售，无法测试跨销售绑定');
    }

    // 6. 测试新用户下单（应该成功）
    console.log('\n6. 测试新用户下单（应该成功）...');
    const newUserData = {
      sales_code: salesCode,
      link_code: salesCode,
      tradingview_username: `new_user_${Date.now()}`,
      customer_wechat: 'new_user_wechat',
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188'
    };

    const newUserResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders',
      'POST',
      newUserData
    );

    console.log(`   状态码: ${newUserResult.status}`);
    if (newUserResult.data.success) {
      console.log('✅ 新用户下单成功！');
      console.log(`   新订单ID: ${newUserResult.data.data.order_id}`);
    } else {
      console.log('❌ 新用户下单失败');
      console.log(`   错误信息: ${newUserResult.data.message}`);
    }

    console.log('\n🎉 续费功能测试完成！');
    console.log('\n📋 测试总结:');
    console.log('✅ 修复内容:');
    console.log('• 允许同一销售下用户续费/升级');
    console.log('• 禁止用户跨销售绑定');
    console.log('• 具体错误信息不显示通用"下单拥挤"提示');
    console.log('• 新用户正常下单不受影响');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testRenewalLogic();