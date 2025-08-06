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

async function testOrderStatusUpdate() {
  console.log('🧪 测试订单状态更新功能\n');

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

    // 2. 获取一个pending_review状态的订单
    console.log('\n2. 获取订单列表...');
    const ordersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (!ordersResult.data.success) {
      throw new Error(`获取订单失败: ${ordersResult.data.message}`);
    }

    const orders = ordersResult.data.data.orders;
    const pendingOrder = orders.find(o => o.status === 'pending_review');
    
    if (!pendingOrder) {
      console.log('❌ 没有找到pending_review状态的订单');
      return;
    }

    console.log(`✅ 找到测试订单: ID=${pendingOrder.id}, 状态=${pendingOrder.status}, 时长=${pendingOrder.duration}`);

    // 3. 测试状态更新 - 确认付款
    console.log('\n3. 测试状态更新: pending_review → confirmed_payment');
    
    const updateUrl1 = `/api/admin?path=update-order&id=${pendingOrder.id}`;
    console.log(`   请求URL: ${updateUrl1}`);
    console.log(`   请求数据: { status: 'confirmed_payment' }`);
    
    const updateResult1 = await makeRequest(
      'zhixing-seven.vercel.app',
      updateUrl1,
      'PUT',
      { status: 'confirmed_payment' },
      { 'Authorization': `Bearer ${authToken}` }
    );

    console.log(`   响应状态码: ${updateResult1.status}`);
    console.log(`   响应内容: ${JSON.stringify(updateResult1.data, null, 2)}`);

    if (updateResult1.data.success) {
      console.log('✅ 确认付款状态更新成功');
      
      // 4. 测试第二次状态更新 - 进入配置确认
      console.log('\n4. 测试状态更新: confirmed_payment → pending_config');
      
      const updateUrl2 = `/api/admin?path=update-order&id=${pendingOrder.id}`;
      console.log(`   请求URL: ${updateUrl2}`);
      console.log(`   请求数据: { status: 'pending_config' }`);
      
      const updateResult2 = await makeRequest(
        'zhixing-seven.vercel.app',
        updateUrl2,
        'PUT',
        { status: 'pending_config' },
        { 'Authorization': `Bearer ${authToken}` }
      );

      console.log(`   响应状态码: ${updateResult2.status}`);
      console.log(`   响应内容: ${JSON.stringify(updateResult2.data, null, 2)}`);

      if (updateResult2.data.success) {
        console.log('✅ 进入配置确认状态更新成功');
      } else {
        console.log('❌ 进入配置确认状态更新失败');
        console.log(`   错误详情: ${updateResult2.data.message}`);
      }
      
    } else {
      console.log('❌ 确认付款状态更新失败');
      console.log(`   错误详情: ${updateResult1.data.message}`);
    }

    // 5. 验证订单当前状态
    console.log('\n5. 验证订单当前状态...');
    const finalOrdersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (finalOrdersResult.data.success) {
      const finalOrders = finalOrdersResult.data.data.orders;
      const updatedOrder = finalOrders.find(o => o.id === pendingOrder.id);
      
      if (updatedOrder) {
        console.log(`✅ 订单当前状态: ${updatedOrder.status}`);
        console.log(`   更新历史: pending_review → ${updatedOrder.status}`);
      }
    }

    console.log('\n🔍 测试总结:');
    console.log('测试了以下状态转换:');
    console.log('1. pending_review → confirmed_payment (确认付款)');
    console.log('2. confirmed_payment → pending_config (进入配置确认)');
    console.log('');
    console.log('如果状态更新失败，可能的原因:');
    console.log('• API路径不匹配 (前端 vs 后端)');
    console.log('• 参数传递方式不正确');
    console.log('• 数据库字段名不匹配');
    console.log('• 权限验证问题');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

testOrderStatusUpdate();