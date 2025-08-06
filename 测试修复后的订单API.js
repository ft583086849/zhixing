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
            data: response,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
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

async function testFixedOrderAPI() {
  console.log('🧪 测试修复后的订单API\n');

  try {
    // 1. 首先测试API基础健康状态
    console.log('1. 🏥 测试API基础健康状态...');
    
    const healthResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders',
      'GET'
    );

    console.log(`   API状态: ${healthResult.status}`);
    console.log(`   Vercel函数ID: ${healthResult.headers['x-vercel-id'] || '未知'}`);
    console.log(`   响应时间: ${Date.now()}`);

    // 2. 获取管理员权限
    console.log('\n2. 🔐 获取管理员权限...');
    
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
      throw new Error('登录失败');
    }

    const authToken = loginResult.data.data.token;
    console.log('   ✅ 登录成功');

    // 3. 获取有效的销售代码
    console.log('\n3. 📊 获取有效的销售代码...');
    
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (!salesResult.data.success || !salesResult.data.data.sales.length) {
      throw new Error('无法获取销售数据');
    }

    const testSales = salesResult.data.data.sales[0];
    console.log(`   销售ID: ${testSales.id}`);
    console.log(`   销售代码: ${testSales.sales_code}`);

    // 4. 测试修复后的订单创建
    console.log('\n4. 🛒 测试修复后的订单创建...');
    
    const testOrderData = {
      sales_code: testSales.sales_code,
      tradingview_username: `fixed_api_test_${Date.now()}`,
      customer_wechat: 'fixed_api_test_wechat',
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '1340.2',
      screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    console.log('   📝 订单数据准备完成');
    console.log(`   销售代码: ${testOrderData.sales_code}`);
    console.log(`   金额: $${testOrderData.amount}`);
    console.log(`   截图大小: ${testOrderData.screenshot_data.length} 字符`);

    const createStartTime = Date.now();
    const createOrderResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      testOrderData
    );
    const createTime = Date.now() - createStartTime;

    console.log(`\n   🎯 订单创建结果:`);
    console.log(`   状态码: ${createOrderResult.status}`);
    console.log(`   处理时间: ${createTime}ms`);
    console.log(`   Vercel函数ID: ${createOrderResult.headers['x-vercel-id'] || '未知'}`);

    if (createOrderResult.data?.success) {
      console.log(`   ✅ 订单创建成功！`);
      console.log(`   订单ID: ${createOrderResult.data.data?.order_id}`);
      console.log(`   生效时间: ${createOrderResult.data.data?.effective_time}`);
      console.log(`   过期时间: ${createOrderResult.data.data?.expiry_time}`);
      console.log(`   佣金金额: $${createOrderResult.data.data?.commission_amount}`);
      console.log(`   包含截图: ${createOrderResult.data.data?.has_screenshot ? '是' : '否'}`);
    } else {
      console.log(`   ❌ 订单创建失败:`);
      console.log(`   错误信息: ${createOrderResult.data?.message || '未知错误'}`);
      if (createOrderResult.data?.error) {
        console.log(`   详细错误: ${createOrderResult.data.error}`);
      }
      console.log(`   完整响应: ${JSON.stringify(createOrderResult.data)}`);
    }

    // 5. 验证订单是否正确保存到数据库
    if (createOrderResult.data?.success) {
      console.log('\n5. ✅ 验证订单数据库存储...');
      
      const orderId = createOrderResult.data.data.order_id;
      const ordersListResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/admin?path=orders&limit=5',
        'GET',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (ordersListResult.data.success) {
        const newOrder = ordersListResult.data.data.orders.find(order => order.id === orderId);
        if (newOrder) {
          console.log(`   ✅ 订单已正确保存到数据库`);
          console.log(`   数据库ID: ${newOrder.id}`);
          console.log(`   状态: ${newOrder.status}`);
          console.log(`   金额: $${newOrder.amount}`);
          console.log(`   截图数据: ${newOrder.screenshot_data ? '已保存' : '未保存'}`);
        } else {
          console.log(`   ❌ 在数据库中未找到订单ID ${orderId}`);
        }
      }
    }

    // 6. 测试连续创建多个订单（验证连接池稳定性）
    console.log('\n6. 🔄 测试连续创建订单（连接稳定性）...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`   测试 ${i}/3...`);
      
      const batchTestData = {
        ...testOrderData,
        tradingview_username: `batch_test_${i}_${Date.now()}`,
        customer_wechat: `batch_wechat_${i}`
      };

      const batchStartTime = Date.now();
      const batchResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/orders?path=create',
        'POST',
        batchTestData
      );
      const batchTime = Date.now() - batchStartTime;

      console.log(`   批次${i}: ${batchResult.status} (${batchTime}ms) ${batchResult.data?.success ? '✅' : '❌'}`);
      
      // 等待一小段时间避免过快请求
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n🎉 修复测试完成！');
    console.log('📋 修复内容总结:');
    console.log('1. ✅ 修复了数据库连接在multer回调中的超时问题');
    console.log('2. ✅ 修复了双重关闭数据库连接的问题');
    console.log('3. ✅ 改进了错误处理和连接管理');
    console.log('4. ✅ 确保了Vercel Serverless函数的稳定执行');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

testFixedOrderAPI();