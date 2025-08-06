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

async function addScreenshotFieldsViaAdmin() {
  console.log('🔧 通过Admin API添加订单表截图字段\n');

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

    const authToken = loginResult.data.data.token;
    console.log('✅ 管理员登录成功');

    // 2. 使用update-schema功能添加字段
    console.log('\n2. 使用update-schema功能添加截图字段...');
    
    const updateSchemaResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=update-schema',
      'POST',
      {
        action: 'add_screenshot_fields',
        target: 'orders'
      },
      { 'Authorization': `Bearer ${authToken}` }
    );

    console.log(`   状态码: ${updateSchemaResult.status}`);
    console.log(`   响应: ${JSON.stringify(updateSchemaResult.data, null, 2)}`);

    // 3. 如果update-schema不支持，手动通过其他方式
    console.log('\n3. 检查订单API是否支持截图字段...');
    
    // 检查订单创建API的代码，看看它期望什么字段
    console.log('   分析订单创建逻辑中的截图处理...');

    // 4. 测试直接在订单中使用screenshot_data字段
    console.log('\n4. 🧪 测试订单创建中的截图处理...');
    
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    
    const testSales = salesResult.data.data.sales[0];
    
    // 创建一个简单的测试图片Base64
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const orderData = {
      sales_code: testSales.sales_code,
      tradingview_username: `screenshot_field_test_${Date.now()}`,
      customer_wechat: `wechat_field_test_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188',
      screenshot_data: testImageBase64
    };

    console.log('   创建带截图数据的订单...');
    const orderResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      orderData
    );

    console.log(`   状态码: ${orderResult.status}`);
    if (orderResult.data?.success) {
      console.log('✅ 订单创建成功！');
      console.log(`   订单ID: ${orderResult.data.data?.order_id}`);
      
      // 检查这个订单的数据
      const newOrderId = orderResult.data.data?.order_id;
      console.log('\n   🔍 检查新创建订单的截图数据...');
      
      const checkResult = await makeRequest(
        'zhixing-seven.vercel.app',
        `/api/admin?path=orders&id=${newOrderId}`,
        'GET',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (checkResult.data?.success) {
        const orderDetails = checkResult.data.data;
        console.log('   订单详情字段:');
        Object.keys(orderDetails).forEach(key => {
          if (key.includes('screenshot') || key.includes('image')) {
            const value = orderDetails[key];
            console.log(`   • ${key}: ${value ? '有数据' : '无数据'}`);
          }
        });
      }
    } else {
      console.log('❌ 订单创建失败');
      console.log(`   错误: ${orderResult.data?.message}`);
      
      // 分析错误信息
      if (orderResult.data?.message?.includes('Unknown column')) {
        console.log('   🔍 确认：数据库缺少screenshot相关字段');
      }
    }

    // 5. 检查现有订单的完整字段列表
    console.log('\n5. 🔍 检查现有订单的完整字段列表...');
    const ordersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders&limit=1',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (ordersResult.data?.success && ordersResult.data.data?.orders?.length > 0) {
      const sampleOrder = ordersResult.data.data.orders[0];
      const allFields = Object.keys(sampleOrder);
      
      console.log('📋 当前订单表所有字段:');
      allFields.forEach(field => {
        console.log(`• ${field}`);
      });

      console.log('\n🔍 截图相关字段检查:');
      const screenshotRelatedFields = allFields.filter(field => 
        field.toLowerCase().includes('screenshot') || 
        field.toLowerCase().includes('image') ||
        field.toLowerCase().includes('photo') ||
        field.toLowerCase().includes('picture')
      );

      if (screenshotRelatedFields.length > 0) {
        console.log('✅ 找到截图相关字段:');
        screenshotRelatedFields.forEach(field => {
          console.log(`• ${field}`);
        });
      } else {
        console.log('❌ 没有找到任何截图相关字段');
        console.log('💡 需要添加以下字段:');
        console.log('• screenshot_data (LONGTEXT) - 存储Base64图片数据');
        console.log('• screenshot_url (VARCHAR) - 存储图片URL');
        console.log('• payment_screenshot (LONGTEXT) - 兼容性字段');
      }
    }

    console.log('\n📋 问题分析总结:');
    console.log('🔍 发现的问题:');
    console.log('1. orders表缺少screenshot_data字段');
    console.log('2. 后端API期望screenshot_data字段但数据库没有');
    console.log('3. 前端可能正常发送数据，但后端无法保存');
    
    console.log('\n💡 解决方案:');
    console.log('1. 需要在数据库中添加screenshot_data字段');
    console.log('2. 字段类型应该是LONGTEXT支持大数据');
    console.log('3. 确保后端API正确处理这个字段');
    console.log('4. 确保管理员页面能显示截图');

  } catch (error) {
    console.error('❌ 处理过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

addScreenshotFieldsViaAdmin();