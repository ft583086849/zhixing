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

async function testRenewalFix() {
  console.log('🧪 验证续费功能修复效果 - 部署版本d592092\n');

  try {
    // 1. 登录管理员，获取现有数据
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

    // 2. 获取现有订单和销售数据
    console.log('\n2. 获取现有订单和销售数据...');
    const [ordersResult, salesResult] = await Promise.all([
      makeRequest(
        'zhixing-seven.vercel.app',
        '/api/admin?path=orders',
        'GET',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      ),
      makeRequest(
        'zhixing-seven.vercel.app',
        '/api/admin?path=sales',
        'GET',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      )
    ]);

    const orders = ordersResult.data.data.orders;
    const allSales = salesResult.data.data.sales;
    
    console.log(`✅ 获取到 ${orders.length} 个订单和 ${allSales.length} 个销售`);

    // 3. 分析测试数据
    if (orders.length === 0 || allSales.length < 2) {
      console.log('❌ 数据不足，无法进行完整测试');
      return;
    }

    // 找到一个有订单的用户
    const testOrder = orders[0];
    const existingUser = testOrder.tradingview_username;
    const originalSales = allSales.find(s => s.id === testOrder.primary_sales_id);
    const differentSales = allSales.find(s => s.id !== testOrder.primary_sales_id);

    console.log('\n📋 测试数据准备:');
    console.log(`• 测试用户: ${existingUser}`);
    console.log(`• 原销售: ${originalSales?.wechat_name || '未知'} (ID: ${testOrder.primary_sales_id})`);
    console.log(`• 不同销售: ${differentSales?.wechat_name || '未知'} (ID: ${differentSales?.id || '无'})`);

    // 4. 测试同一销售下的续费（应该成功）
    console.log('\n3. 🔄 测试同一销售下的续费...');
    const renewalData = {
      sales_code: originalSales?.sales_code || 'legacy_primary_sales',
      link_code: originalSales?.sales_code || 'legacy_primary_sales',
      tradingview_username: existingUser,
      customer_wechat: `renewal_test_${Date.now()}`,
      duration: '3months',
      amount: 488,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '488'
    };

    console.log(`   使用销售代码: ${renewalData.sales_code}`);
    const renewalResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders',
      'POST',
      renewalData
    );

    console.log(`   响应状态: ${renewalResult.status}`);
    if (renewalResult.data.success) {
      console.log('✅ 同一销售下续费成功！');
      console.log(`   新订单ID: ${renewalResult.data.data.order_id}`);
      console.log('   ✅ 修复生效：允许同一销售下续费');
    } else {
      console.log('❌ 同一销售下续费失败');
      console.log(`   错误信息: ${renewalResult.data.message}`);
      
      // 分析错误原因
      if (renewalResult.data.message?.includes('跨销售绑定')) {
        console.log('   ⚠️  这可能是匹配逻辑问题，销售关联检测失败');
      } else if (renewalResult.data.message?.includes('已通过销售绑定')) {
        console.log('   ⚠️  旧的重复绑定逻辑仍在生效');
      }
    }

    // 5. 测试跨销售绑定（如果有不同销售）
    if (differentSales) {
      console.log('\n4. 🚫 测试跨销售绑定（应该被禁止）...');
      const crossSalesData = {
        sales_code: differentSales.sales_code || 'different_sales',
        link_code: differentSales.sales_code || 'different_sales',
        tradingview_username: existingUser,
        customer_wechat: `cross_test_${Date.now()}`,
        duration: '1month',
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate',
        alipay_amount: '188'
      };

      console.log(`   使用不同销售代码: ${crossSalesData.sales_code}`);
      const crossSalesResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/orders',
        'POST',
        crossSalesData
      );

      console.log(`   响应状态: ${crossSalesResult.status}`);
      if (!crossSalesResult.data.success) {
        console.log('✅ 跨销售绑定被正确禁止！');
        console.log(`   错误信息: ${crossSalesResult.data.message}`);
        
        if (crossSalesResult.data.message?.includes('跨销售绑定')) {
          console.log('   ✅ 修复生效：正确显示跨销售绑定错误');
        } else if (crossSalesResult.data.message?.includes('下单拥挤')) {
          console.log('   ⚠️  错误信息显示为通用提示，可能需要进一步修复');
        }
      } else {
        console.log('❌ 跨销售绑定没有被禁止（这是bug）');
      }
    }

    // 6. 测试新用户下单（应该正常）
    console.log('\n5. 👤 测试新用户下单...');
    const newUserData = {
      sales_code: originalSales?.sales_code || 'new_user_sales',
      link_code: originalSales?.sales_code || 'new_user_sales',
      tradingview_username: `new_user_${Date.now()}`,
      customer_wechat: `new_wechat_${Date.now()}`,
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

    console.log(`   响应状态: ${newUserResult.status}`);
    if (newUserResult.data.success) {
      console.log('✅ 新用户下单成功！');
      console.log(`   新订单ID: ${newUserResult.data.data.order_id}`);
      console.log('   ✅ 修复不影响正常新用户注册');
    } else {
      console.log('❌ 新用户下单失败');
      console.log(`   错误信息: ${newUserResult.data.message}`);
    }

    // 7. 测试结果总结
    console.log('\n🎉 续费功能修复测试完成！');
    console.log('\n📋 修复效果总结:');
    console.log('🔧 本次修复内容:');
    console.log('• 修改订单重复绑定检查逻辑');
    console.log('• 支持同一销售下用户续费/升级');
    console.log('• 禁止用户跨销售绑定');
    console.log('• 优化错误信息显示（具体错误不显示通用提示）');
    console.log('• 支持多种销售关联匹配方式');
    
    console.log('\n✅ 预期效果:');
    console.log('• 用户可在原销售链接下正常续费');
    console.log('• 用户不能跳转到其他销售下单');
    console.log('• 显示具体的业务错误信息');
    console.log('• 新用户注册不受影响');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

testRenewalFix();