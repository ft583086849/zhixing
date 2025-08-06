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

async function correctVerifyRenewalFix() {
  console.log('🔍 正确验证续费功能修复 - 使用正确API路径\n');

  try {
    // 1. 登录管理员
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

    // 2. 获取现有数据
    console.log('\n2. 获取现有数据...');
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
    const testOrder = orders[0];
    const existingUser = testOrder.tradingview_username;
    const originalSales = allSales.find(s => s.id === testOrder.primary_sales_id);
    const differentSales = allSales.find(s => s.id !== testOrder.primary_sales_id);

    console.log('\n📋 测试数据:');
    console.log(`• 现有用户: ${existingUser}`);
    console.log(`• 原销售: ${originalSales?.wechat_name} (ID: ${originalSales?.id})`);
    console.log(`• 原销售代码: ${originalSales?.sales_code}`);
    console.log(`• 不同销售: ${differentSales?.wechat_name} (ID: ${differentSales?.id})`);
    console.log(`• 不同销售代码: ${differentSales?.sales_code}`);

    // 4. 验证场景1: 同一销售下的续费（应该成功）
    console.log('\n🔄 验证场景1: 同一销售下的续费...');
    
    const renewalOrderData = {
      sales_code: originalSales.sales_code,
      tradingview_username: existingUser,
      customer_wechat: `renewal_test_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188'
    };

    console.log(`   使用销售代码: ${renewalOrderData.sales_code}`);
    console.log(`   使用用户名: ${renewalOrderData.tradingview_username}`);
    
    // 使用正确的API路径: /api/orders?path=create
    const renewalResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      renewalOrderData
    );

    console.log(`   状态码: ${renewalResult.status}`);
    if (renewalResult.data?.success) {
      console.log('✅ 场景1成功: 同一销售下续费被允许');
      console.log(`   新订单ID: ${renewalResult.data.data?.order_id}`);
      console.log('   🎉 修复生效: 允许同一销售下续费');
    } else {
      console.log('❌ 场景1失败: 同一销售下续费被拒绝');
      console.log(`   错误信息: ${renewalResult.data?.message || '未知错误'}`);
      
      // 分析失败原因
      if (renewalResult.data?.message?.includes('跨销售绑定')) {
        console.log('   ⚠️  匹配逻辑可能有问题，系统误判为跨销售');
      } else if (renewalResult.data?.message?.includes('已通过销售绑定')) {
        console.log('   ⚠️  旧的重复绑定逻辑仍在生效，修复可能未完全生效');
      } else if (renewalResult.data?.message?.includes('下单拥挤')) {
        console.log('   ⚠️  显示了通用错误信息');
      }
    }

    // 5. 验证场景2: 跨销售绑定（应该被禁止）
    if (differentSales) {
      console.log('\n🚫 验证场景2: 跨销售绑定...');
      
      const crossSalesOrderData = {
        sales_code: differentSales.sales_code,
        tradingview_username: existingUser, // 使用相同用户
        customer_wechat: `cross_test_${Date.now()}`,
        duration: '1month',
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate',
        alipay_amount: '188'
      };

      console.log(`   使用不同销售代码: ${crossSalesOrderData.sales_code}`);
      console.log(`   使用相同用户名: ${crossSalesOrderData.tradingview_username}`);
      
      const crossSalesResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/orders?path=create',
        'POST',
        crossSalesOrderData
      );

      console.log(`   状态码: ${crossSalesResult.status}`);
      if (!crossSalesResult.data?.success) {
        console.log('✅ 场景2成功: 跨销售绑定被正确禁止');
        console.log(`   错误信息: ${crossSalesResult.data?.message}`);
        
        // 检查错误信息是否正确
        if (crossSalesResult.data?.message?.includes('跨销售绑定')) {
          console.log('   ✅ 错误信息正确: 显示跨销售绑定错误');
        } else if (crossSalesResult.data?.message?.includes('下单拥挤')) {
          console.log('   ⚠️  仍显示通用错误信息，前端错误处理可能需要调整');
        } else {
          console.log('   ✅ 显示了具体的业务错误信息');
        }
      } else {
        console.log('❌ 场景2失败: 跨销售绑定没有被禁止');
        console.log(`   这是一个严重bug，订单ID: ${crossSalesResult.data.data?.order_id}`);
        console.log('   📞 需要立即修复！');
      }
    }

    // 6. 验证场景3: 新用户注册（应该正常）
    console.log('\n👤 验证场景3: 新用户注册...');
    
    const newUserOrderData = {
      sales_code: originalSales.sales_code,
      tradingview_username: `new_user_verify_${Date.now()}`,
      customer_wechat: `new_wechat_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188'
    };

    console.log(`   新用户名: ${newUserOrderData.tradingview_username}`);
    
    const newUserResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      newUserOrderData
    );

    console.log(`   状态码: ${newUserResult.status}`);
    if (newUserResult.data?.success) {
      console.log('✅ 场景3成功: 新用户可以正常注册');
      console.log(`   新订单ID: ${newUserResult.data.data?.order_id}`);
      console.log('   ✅ 修复不影响正常新用户注册');
    } else {
      console.log('❌ 场景3失败: 新用户注册失败');
      console.log(`   错误信息: ${newUserResult.data?.message || '未知错误'}`);
      console.log('   📞 这可能表示修复引入了新问题');
    }

    // 7. 总结验证结果
    console.log('\n🎉 续费功能修复验证完成！');
    console.log('\n📊 验证结果总结:');
    
    // 检查实际结果
    const results = {
      renewal_allowed: renewalResult.data?.success,
      cross_sales_blocked: !crossSalesResult.data?.success,
      new_user_works: newUserResult.data?.success
    };
    
    console.log(`✅ 同一销售下续费: ${results.renewal_allowed ? '成功' : '失败'}`);
    console.log(`❌ 跨销售绑定禁止: ${results.cross_sales_blocked ? '成功' : '失败'}`);
    console.log(`✅ 新用户正常注册: ${results.new_user_works ? '成功' : '失败'}`);

    // 最终评估
    if (results.renewal_allowed && results.cross_sales_blocked && results.new_user_works) {
      console.log('\n🎉 修复完全成功！');
      console.log('✅ 所有预期功能都正常工作');
    } else {
      console.log('\n⚠️  修复部分成功，但仍有问题需要解决');
      if (!results.renewal_allowed) {
        console.log('❌ 同一销售下续费仍被禁止');
      }
      if (!results.cross_sales_blocked) {
        console.log('❌ 跨销售绑定没有被阻止');
      }
      if (!results.new_user_works) {
        console.log('❌ 新用户注册受到影响');
      }
    }

    console.log('\n🔧 修复状态确认:');
    console.log('• 部署版本: d592092');
    console.log('• 修改文件: api/orders.js, client/src/pages/PurchasePage.js');
    console.log('• 核心逻辑: 多种销售关联匹配方式');
    console.log('• 错误处理: 具体错误信息优化');

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

correctVerifyRenewalFix();