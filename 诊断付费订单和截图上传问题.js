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

async function diagnosePaidOrderIssues() {
  console.log('🔍 诊断付费订单和截图上传问题\n');

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

    // 2. 获取现有数据，分析订单结构
    console.log('\n2. 分析现有订单数据结构...');
    const ordersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const orders = ordersResult.data.data.orders;
    console.log(`✅ 获取到 ${orders.length} 个订单`);

    // 3. 分析订单字段，特别是截图相关字段
    console.log('\n3. 分析订单字段结构（重点检查截图字段）...');
    if (orders.length > 0) {
      const sampleOrder = orders[0];
      const orderFields = Object.keys(sampleOrder);
      
      console.log('📋 订单表字段列表:');
      orderFields.forEach(field => {
        const value = sampleOrder[field];
        const type = typeof value;
        const preview = value ? String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '') : 'NULL';
        console.log(`• ${field}: ${type} - ${preview}`);
      });

      // 重点检查截图相关字段
      console.log('\n🔍 截图相关字段检查:');
      const screenshotFields = ['screenshot_data', 'screenshot_url', 'payment_screenshot', 'screenshot', 'image_data'];
      screenshotFields.forEach(field => {
        if (orderFields.includes(field)) {
          const hasData = sampleOrder[field] && sampleOrder[field] !== null;
          console.log(`✅ ${field}: ${hasData ? '有数据' : '无数据'}`);
        } else {
          console.log(`❌ ${field}: 字段不存在`);
        }
      });
    }

    // 4. 测试付费订单创建（模拟前端请求）
    console.log('\n4. 🧪 测试付费订单创建...');
    
    // 获取一个销售代码用于测试
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    
    const sales = salesResult.data.data.sales;
    const testSales = sales[0];
    
    console.log(`使用测试销售: ${testSales.wechat_name} (${testSales.sales_code})`);

    // 模拟付费订单数据（不包含截图）
    const paidOrderData = {
      sales_code: testSales.sales_code,
      tradingview_username: `test_paid_${Date.now()}`,
      customer_wechat: `wechat_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188'
      // 注意：这里没有包含screenshot_data，模拟无截图提交
    };

    console.log('   测试无截图的付费订单...');
    const paidOrderResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      paidOrderData
    );

    console.log(`   状态码: ${paidOrderResult.status}`);
    if (paidOrderResult.data?.success) {
      console.log('✅ 付费订单创建成功（无截图）');
      console.log(`   订单ID: ${paidOrderResult.data.data?.order_id}`);
    } else {
      console.log('❌ 付费订单创建失败');
      console.log(`   错误信息: ${paidOrderResult.data?.message || '未知错误'}`);
      console.log(`   详细错误: ${JSON.stringify(paidOrderResult.data, null, 2)}`);
      
      // 分析错误原因
      if (paidOrderResult.data?.message?.includes('服务器内部错误')) {
        console.log('\n🔍 服务器内部错误分析:');
        console.log('可能原因:');
        console.log('1. 数据库字段不匹配');
        console.log('2. 必填字段缺失');
        console.log('3. 数据类型转换错误');
        console.log('4. 截图处理逻辑错误');
      }
    }

    // 5. 检查最新订单的截图字段
    console.log('\n5. 🔍 检查最新订单的截图数据...');
    const latestOrdersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders&limit=5',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const latestOrders = latestOrdersResult.data.data.orders;
    console.log('最近5个订单的截图字段分析:');
    console.log('订单ID | TradingView用户 | 截图数据 | 金额 | 状态');
    console.log('-------|----------------|----------|------|------');
    
    latestOrders.forEach(order => {
      const username = order.tradingview_username?.substring(0, 15) || 'N/A';
      const hasScreenshot = order.screenshot_data ? '有截图' : '无截图';
      const amount = order.amount || 0;
      const status = order.status || 'unknown';
      
      console.log(`${order.id.toString().padEnd(7)} | ${username.padEnd(15)} | ${hasScreenshot.padEnd(8)} | $${amount.toString().padEnd(4)} | ${status}`);
      
      // 如果有截图数据，分析其格式
      if (order.screenshot_data) {
        const screenshotLength = String(order.screenshot_data).length;
        const screenshotType = String(order.screenshot_data).startsWith('data:') ? 'Base64' : '其他格式';
        console.log(`       截图详情: ${screenshotType}, 长度: ${screenshotLength} 字符`);
      }
    });

    // 6. 检查前端是否正确处理截图上传
    console.log('\n6. 💡 前端截图上传分析:');
    console.log('前端应该包含的截图处理步骤:');
    console.log('1. 用户选择图片文件');
    console.log('2. 前端将文件转换为Base64');
    console.log('3. 在表单数据中包含screenshot_data字段');
    console.log('4. 提交到 /api/orders?path=create');
    console.log('5. 后端保存到数据库screenshot_data字段');
    console.log('6. 管理员页面显示截图');

    // 7. 检查数据库表结构
    console.log('\n7. 🔍 建议检查项目:');
    console.log('📋 后端检查:');
    console.log('• orders表是否有screenshot_data字段');
    console.log('• 字段类型是否为LONGTEXT（支持大数据）');
    console.log('• API是否正确处理screenshot_data');
    console.log('• 错误日志中的具体错误信息');
    
    console.log('\n📋 前端检查:');
    console.log('• 文件上传组件是否正常工作');
    console.log('• Base64转换是否成功');
    console.log('• 表单提交是否包含截图数据');
    console.log('• 管理员页面是否显示截图字段');

    console.log('\n📋 测试建议:');
    console.log('1. 先测试7天免费订单（无金额，看是否正常）');
    console.log('2. 测试付费订单但不上传截图');
    console.log('3. 测试付费订单并上传截图');
    console.log('4. 检查每步的具体错误信息');

  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

diagnosePaidOrderIssues();