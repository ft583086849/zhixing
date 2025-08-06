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

async function fixScreenshotFieldType() {
  console.log('🔧 修复截图字段类型和后端处理问题\n');

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

    // 2. 检查screenshot_path字段的类型
    console.log('\n2. 检查当前screenshot_path字段类型...');
    
    // 由于没有直接的describe接口，我们通过分析数据来推断
    const ordersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders&limit=1',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (ordersResult.data?.success && ordersResult.data.data?.orders?.length > 0) {
      const sampleOrder = ordersResult.data.data.orders[0];
      console.log(`screenshot_path当前值: ${sampleOrder.screenshot_path || 'NULL'}`);
      console.log(`screenshot_path类型: ${typeof sampleOrder.screenshot_path}`);
    }

    // 3. 创建测试订单，检查截图保存情况
    console.log('\n3. 🧪 测试截图保存功能...');
    
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    
    const testSales = salesResult.data.data.sales[0];
    
    // 创建一个小的测试Base64图片
    const smallTestImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const testOrderData = {
      sales_code: testSales.sales_code,
      tradingview_username: `screenshot_type_test_${Date.now()}`,
      customer_wechat: `wechat_type_test_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188',
      screenshot_data: smallTestImage
    };

    console.log('   创建带小截图的测试订单...');
    const testResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      testOrderData
    );

    console.log(`   状态码: ${testResult.status}`);
    if (testResult.data?.success) {
      console.log('✅ 小截图订单创建成功');
      console.log(`   订单ID: ${testResult.data.data?.order_id}`);
      
      // 检查保存的截图数据
      const newOrderId = testResult.data.data?.order_id;
      console.log('\n   🔍 检查保存的截图数据...');
      
      const checkResult = await makeRequest(
        'zhixing-seven.vercel.app',
        `/api/admin?path=orders&limit=10`,
        'GET',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (checkResult.data?.success) {
        const newOrder = checkResult.data.data.orders.find(o => o.id === newOrderId);
        if (newOrder) {
          console.log(`   screenshot_path值: ${newOrder.screenshot_path ? '有数据' : '无数据'}`);
          if (newOrder.screenshot_path) {
            console.log(`   数据长度: ${String(newOrder.screenshot_path).length} 字符`);
            console.log(`   数据类型: ${typeof newOrder.screenshot_path}`);
            
            // 检查是否是完整的Base64
            if (String(newOrder.screenshot_path).startsWith('data:image/')) {
              console.log('   ✅ 截图保存格式正确（Base64）');
            } else {
              console.log('   ⚠️  截图保存格式可能有问题');
            }
          }
        }
      }
    } else {
      console.log('❌ 小截图订单创建失败');
      console.log(`   错误: ${testResult.data?.message}`);
    }

    // 4. 测试大一些的截图（模拟真实情况）
    console.log('\n4. 🧪 测试较大截图保存...');
    
    // 创建一个稍大的测试图片Base64（100x100像素的红色方块）
    const largerTestImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVHic7d1NaBNBFADgNxsT';
    
    const largerOrderData = {
      sales_code: testSales.sales_code,
      tradingview_username: `screenshot_large_test_${Date.now()}`,
      customer_wechat: `wechat_large_test_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188',
      screenshot_data: largerTestImage
    };

    console.log('   创建带较大截图的测试订单...');
    const largerResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      largerOrderData
    );

    console.log(`   状态码: ${largerResult.status}`);
    if (largerResult.data?.success) {
      console.log('✅ 大截图订单创建成功');
    } else {
      console.log('❌ 大截图订单创建失败');
      console.log(`   错误: ${largerResult.data?.message}`);
      
      // 分析错误原因
      if (largerResult.data?.message?.includes('Data too long') || 
          largerResult.data?.message?.includes('截图')) {
        console.log('   🔍 确认：screenshot_path字段类型不支持大数据');
        console.log('   💡 需要将字段类型改为LONGTEXT');
      }
    }

    // 5. 检查管理员页面是否显示截图
    console.log('\n5. 🔍 检查管理员页面截图显示...');
    
    const allOrdersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders&limit=5',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (allOrdersResult.data?.success) {
      console.log('📋 最近5个订单的截图情况:');
      console.log('订单ID | 用户名 | 金额 | 截图状态 | 截图大小');
      console.log('-------|--------|------|----------|----------');
      
      allOrdersResult.data.data.orders.forEach(order => {
        const username = order.tradingview_username?.substring(0, 12) || 'N/A';
        const amount = order.amount || '0';
        const hasScreenshot = order.screenshot_path ? '有截图' : '无截图';
        const screenshotSize = order.screenshot_path ? String(order.screenshot_path).length : 0;
        
        console.log(`${order.id.toString().padEnd(7)} | ${username.padEnd(8)} | $${amount.toString().padEnd(4)} | ${hasScreenshot.padEnd(8)} | ${screenshotSize} 字符`);
      });
    }

    console.log('\n📋 问题诊断结果:');
    console.log('🔍 确认问题:');
    console.log('1. 后端代码试图将Base64数据保存到screenshot_path字段');
    console.log('2. screenshot_path字段可能不是LONGTEXT类型');
    console.log('3. 大的Base64数据可能被截断或无法保存');
    
    console.log('\n💡 解决方案建议:');
    console.log('1. 将screenshot_path字段类型改为LONGTEXT');
    console.log('2. 或者添加新的screenshot_data字段（LONGTEXT类型）');
    console.log('3. 修改后端代码使用正确的字段名');
    console.log('4. 确保管理员页面能正确显示Base64图片');

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

fixScreenshotFieldType();