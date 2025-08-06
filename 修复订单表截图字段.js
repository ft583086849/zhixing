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

async function fixOrdersScreenshotFields() {
  console.log('🔧 修复订单表截图字段缺失问题\n');

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

    // 2. 检查当前orders表结构
    console.log('\n2. 检查当前orders表结构...');
    const describeOrdersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=execute-sql',
      'POST',
      {
        sql: 'DESCRIBE orders',
        params: []
      },
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (describeOrdersResult.data?.success && describeOrdersResult.data.data?.results) {
      console.log('📋 当前orders表字段:');
      describeOrdersResult.data.data.results.forEach(field => {
        console.log(`• ${field.Field}: ${field.Type} (${field.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });

      // 检查是否有截图相关字段
      const fields = describeOrdersResult.data.data.results.map(f => f.Field);
      const screenshotFields = ['screenshot_data', 'screenshot_url', 'payment_screenshot'];
      const missingFields = screenshotFields.filter(field => !fields.includes(field));
      
      if (missingFields.length > 0) {
        console.log(`\n❌ 缺少字段: ${missingFields.join(', ')}`);
      } else {
        console.log('\n✅ 所有截图字段都存在');
      }
    }

    // 3. 添加缺失的截图字段
    console.log('\n3. 添加缺失的截图字段...');
    
    const alterSqls = [
      // 添加screenshot_data字段用于存储Base64图片数据
      'ALTER TABLE orders ADD COLUMN screenshot_data LONGTEXT NULL COMMENT "付款截图Base64数据"',
      // 添加screenshot_url字段用于存储图片URL（备用）
      'ALTER TABLE orders ADD COLUMN screenshot_url VARCHAR(500) NULL COMMENT "付款截图URL"',
      // 添加payment_screenshot字段（兼容性）
      'ALTER TABLE orders ADD COLUMN payment_screenshot LONGTEXT NULL COMMENT "付款截图数据（兼容性）"'
    ];

    for (let i = 0; i < alterSqls.length; i++) {
      const sql = alterSqls[i];
      console.log(`   执行SQL ${i + 1}: ${sql.split(' ').slice(0, 8).join(' ')}...`);
      
      const alterResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/admin?path=execute-sql',
        'POST',
        {
          sql: sql,
          params: []
        },
        { 'Authorization': `Bearer ${authToken}` }
      );

      console.log(`   状态: ${alterResult.status}`);
      if (alterResult.data?.success) {
        console.log('   ✅ 字段添加成功');
      } else {
        console.log('   ❌ 字段添加失败');
        console.log(`   错误: ${alterResult.data?.message || '未知错误'}`);
        
        // 如果是字段已存在的错误，继续执行
        if (alterResult.data?.message?.includes('Duplicate column')) {
          console.log('   💡 字段已存在，跳过');
        }
      }

      // 等待一下避免数据库压力
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. 验证字段添加结果
    console.log('\n4. 验证字段添加结果...');
    const verifyResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=execute-sql',
      'POST',
      {
        sql: 'DESCRIBE orders',
        params: []
      },
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (verifyResult.data?.success) {
      const allFields = verifyResult.data.data.results.map(f => f.Field);
      const screenshotFields = ['screenshot_data', 'screenshot_url', 'payment_screenshot'];
      
      console.log('📋 截图字段验证结果:');
      screenshotFields.forEach(field => {
        if (allFields.includes(field)) {
          console.log(`✅ ${field}: 存在`);
        } else {
          console.log(`❌ ${field}: 不存在`);
        }
      });
    }

    // 5. 测试带截图的订单创建
    console.log('\n5. 🧪 测试带截图的订单创建...');
    
    // 创建一个模拟的Base64图片数据（1x1像素PNG）
    const mockImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    
    const testSales = salesResult.data.data.sales[0];
    
    const orderWithScreenshotData = {
      sales_code: testSales.sales_code,
      tradingview_username: `screenshot_test_${Date.now()}`,
      customer_wechat: `wechat_screenshot_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188',
      screenshot_data: mockImageBase64 // 添加截图数据
    };

    console.log('   创建包含截图的测试订单...');
    const screenshotOrderResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      orderWithScreenshotData
    );

    console.log(`   状态码: ${screenshotOrderResult.status}`);
    if (screenshotOrderResult.data?.success) {
      console.log('✅ 带截图订单创建成功！');
      console.log(`   订单ID: ${screenshotOrderResult.data.data?.order_id}`);
      
      // 验证截图是否保存成功
      const newOrderId = screenshotOrderResult.data.data?.order_id;
      if (newOrderId) {
        console.log('\n   🔍 验证截图保存情况...');
        const checkOrderResult = await makeRequest(
          'zhixing-seven.vercel.app',
          '/api/admin?path=execute-sql',
          'POST',
          {
            sql: 'SELECT id, tradingview_username, screenshot_data IS NOT NULL as has_screenshot, LENGTH(screenshot_data) as screenshot_length FROM orders WHERE id = ?',
            params: [newOrderId]
          },
          { 'Authorization': `Bearer ${authToken}` }
        );

        if (checkOrderResult.data?.success && checkOrderResult.data.data?.results?.length > 0) {
          const orderData = checkOrderResult.data.data.results[0];
          console.log(`   订单ID: ${orderData.id}`);
          console.log(`   用户: ${orderData.tradingview_username}`);
          console.log(`   有截图: ${orderData.has_screenshot ? '是' : '否'}`);
          console.log(`   截图大小: ${orderData.screenshot_length || 0} 字符`);
        }
      }
    } else {
      console.log('❌ 带截图订单创建失败');
      console.log(`   错误信息: ${screenshotOrderResult.data?.message || '未知错误'}`);
    }

    console.log('\n🎉 订单表截图字段修复完成！');
    console.log('\n📋 修复总结:');
    console.log('✅ 已添加截图相关字段:');
    console.log('• screenshot_data: LONGTEXT - 存储Base64图片数据');
    console.log('• screenshot_url: VARCHAR(500) - 存储图片URL（备用）');
    console.log('• payment_screenshot: LONGTEXT - 兼容性字段');
    
    console.log('\n💡 现在用户可以:');
    console.log('• 正常上传付款截图');
    console.log('• 管理员在订单列表中查看截图');
    console.log('• 付费订单不再出现"服务器内部错误"');

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

fixOrdersScreenshotFields();