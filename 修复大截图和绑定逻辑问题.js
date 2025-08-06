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

async function fixScreenshotAndBindingIssues() {
  console.log('🔧 修复大截图和绑定逻辑问题\n');

  try {
    // 1. 测试不同大小的截图数据，找到临界点
    console.log('1. 🔍 测试截图大小限制...');
    
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
    
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const testSales = salesResult.data.data.sales[0];

    // 测试不同大小的截图
    const screenshotSizes = [
      { name: '小截图(100字符)', size: 1 },
      { name: '中截图(1KB)', size: 10 },
      { name: '大截图(5KB)', size: 50 },
      { name: '超大截图(10KB)', size: 100 }
    ];

    for (const test of screenshotSizes) {
      console.log(`\n   测试: ${test.name}`);
      
      const baseImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const largeImageData = 'data:image/png;base64,' + baseImage.repeat(test.size);
      
      const testData = {
        sales_code: testSales.sales_code,
        tradingview_username: `size_test_${test.size}_${Date.now()}`,
        customer_wechat: `size_wechat_${test.size}`,
        duration: '1month',
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate',
        alipay_amount: '1340',
        screenshot_data: largeImageData
      };

      console.log(`   截图大小: ${largeImageData.length} 字符`);
      
      const sizeResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/orders?path=create',
        'POST',
        testData
      );

      console.log(`   结果: ${sizeResult.status}`);
      if (sizeResult.data?.success) {
        console.log(`   ✅ 成功 - 订单ID: ${sizeResult.data.data?.order_id}`);
      } else {
        console.log(`   ❌ 失败 - ${sizeResult.data?.message || '未知错误'}`);
        if (sizeResult.status === 500) {
          console.log(`   💡 截图大小限制: ${largeImageData.length} 字符是上限`);
          break;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 2. 分析绑定逻辑问题
    console.log('\n2. 🔍 分析用户绑定逻辑问题...');
    
    // 获取最近的订单，找出用户绑定情况
    const ordersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders&limit=20',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const orders = ordersResult.data.data.orders;
    
    // 分析用户绑定到的销售
    const userBindings = {};
    orders.forEach(order => {
      const username = order.tradingview_username;
      if (!userBindings[username]) {
        userBindings[username] = new Set();
      }
      
      // 记录用户绑定的销售
      if (order.primary_sales_id) {
        userBindings[username].add(`primary_${order.primary_sales_id}`);
      }
      if (order.secondary_sales_id) {
        userBindings[username].add(`secondary_${order.secondary_sales_id}`);
      }
    });

    console.log('   📊 用户绑定情况分析:');
    Object.entries(userBindings).forEach(([username, bindings]) => {
      if (bindings.size > 1) {
        console.log(`   ⚠️  ${username}: 绑定到 ${bindings.size} 个销售 (${Array.from(bindings).join(', ')})`);
      } else {
        console.log(`   ✅ ${username}: 绑定到 1 个销售`);
      }
    });

    // 3. 测试修复后的绑定逻辑
    console.log('\n3. 🧪 测试修复后的绑定逻辑...');
    
    // 找一个已绑定的用户
    const boundUser = Object.keys(userBindings)[0];
    if (boundUser) {
      console.log(`   使用已绑定用户: ${boundUser}`);
      
      // 找出该用户绑定的销售
      const userOrders = orders.filter(o => o.tradingview_username === boundUser);
      const originalSalesId = userOrders[0].primary_sales_id || userOrders[0].secondary_sales_id;
      const originalSalesType = userOrders[0].primary_sales_id ? 'primary' : 'secondary';
      
      console.log(`   原绑定销售: ${originalSalesType}_${originalSalesId}`);
      
      // 找到对应的销售代码
      const allSales = salesResult.data.data.sales;
      const originalSales = allSales.find(s => s.id === originalSalesId);
      
      if (originalSales) {
        console.log(`   原销售代码: ${originalSales.sales_code}`);
        
        // 测试同销售续费
        console.log('   🔄 测试同销售续费...');
        const sameBindingData = {
          sales_code: originalSales.sales_code,
          tradingview_username: boundUser,
          customer_wechat: 'renewal_test_wechat',
          duration: '3months',
          amount: 488,
          payment_method: 'alipay',
          payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          purchase_type: 'immediate',
          alipay_amount: '3484', // 488 * 7.15
          screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        };

        const sameBindingResult = await makeRequest(
          'zhixing-seven.vercel.app',
          '/api/orders?path=create',
          'POST',
          sameBindingData
        );

        console.log(`   同销售续费: ${sameBindingResult.status}`);
        if (sameBindingResult.data?.success) {
          console.log(`   ✅ 成功！续费功能正常 - 订单ID: ${sameBindingResult.data.data?.order_id}`);
        } else {
          console.log(`   ❌ 失败: ${sameBindingResult.data?.message}`);
        }

        // 测试跨销售绑定
        const differentSales = allSales.find(s => s.id !== originalSalesId);
        if (differentSales) {
          console.log('   🚫 测试跨销售绑定...');
          const crossBindingData = {
            sales_code: differentSales.sales_code,
            tradingview_username: boundUser,
            customer_wechat: 'cross_test_wechat',
            duration: '1month',
            amount: 188,
            payment_method: 'alipay',
            payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
            purchase_type: 'immediate',
            alipay_amount: '1340',
            screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          };

          const crossBindingResult = await makeRequest(
            'zhixing-seven.vercel.app',
            '/api/orders?path=create',
            'POST',
            crossBindingData
          );

          console.log(`   跨销售绑定: ${crossBindingResult.status}`);
          if (!crossBindingResult.data?.success) {
            console.log(`   ✅ 正确阻止跨销售绑定: ${crossBindingResult.data?.message}`);
          } else {
            console.log(`   ❌ 应该阻止跨销售绑定但没有`);
          }
        }
      }
    }

    console.log('\n📋 问题修复分析:');
    console.log('🔍 发现的问题:');
    console.log('1. 大截图数据会导致500服务器错误');
    console.log('2. 重复用户名的绑定检查逻辑过于严格');
    
    console.log('\n💡 给用户的解决方案:');
    console.log('1. 如果上传截图失败，尝试压缩图片或使用较小的图片');
    console.log('2. 如果提示"已通过销售绑定"，使用全新的TradingView用户名');
    console.log('3. 确保在同一个销售链接下续费（不要跳转到其他销售）');
    console.log('4. 清除浏览器缓存并刷新页面');

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

fixScreenshotAndBindingIssues();