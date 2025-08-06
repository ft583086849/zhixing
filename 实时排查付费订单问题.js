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

async function debugPaidOrderIssueNow() {
  console.log('🚨 实时排查付费订单提交问题\n');

  try {
    // 1. 获取当前活跃的销售代码
    console.log('1. 获取当前活跃的销售代码...');
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

    if (!loginResult.data?.success) {
      throw new Error(`管理员登录失败: ${loginResult.data?.message}`);
    }

    const authToken = loginResult.data.data.token;
    console.log('✅ 管理员登录成功');

    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const sales = salesResult.data.data.sales;
    const activeSales = sales.filter(s => s.sales_code && s.wechat_name);
    
    console.log(`✅ 获取到 ${activeSales.length} 个活跃销售`);
    activeSales.forEach((s, i) => {
      console.log(`${i + 1}. ${s.wechat_name} - ${s.sales_code}`);
    });

    // 2. 测试每个销售代码的付费订单创建
    console.log('\n2. 🧪 测试每个销售的付费订单创建...');
    
    for (let i = 0; i < Math.min(3, activeSales.length); i++) {
      const testSales = activeSales[i];
      console.log(`\n   测试销售 ${i + 1}: ${testSales.wechat_name}`);
      console.log(`   销售代码: ${testSales.sales_code}`);

      // 测试付费订单数据（完全模拟前端）
      const paidOrderData = {
        sales_code: testSales.sales_code,
        link_code: testSales.sales_code,
        tradingview_username: `realtest_${Date.now()}_${i}`,
        customer_wechat: `realwechat_${Date.now()}_${i}`,
        duration: '1month',
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate',
        effective_time: null,
        alipay_amount: '1340', // 188 * 7.15
        crypto_amount: null,
        screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };

      console.log('   📝 订单数据:');
      console.log(`   • 用户名: ${paidOrderData.tradingview_username}`);
      console.log(`   • 金额: $${paidOrderData.amount}`);
      console.log(`   • 付款方式: ${paidOrderData.payment_method}`);
      console.log(`   • 实付金额: ¥${paidOrderData.alipay_amount}`);

      console.log('   📤 提交订单...');
      const orderResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/orders?path=create',
        'POST',
        paidOrderData
      );

      console.log(`   📊 结果: 状态码 ${orderResult.status}`);
      console.log(`   📄 响应: ${JSON.stringify(orderResult.data, null, 2)}`);

      if (orderResult.data?.success) {
        console.log(`   ✅ 成功！订单ID: ${orderResult.data.data?.order_id}`);
      } else {
        console.log(`   ❌ 失败！错误: ${orderResult.data?.message || '未知错误'}`);
        
        // 详细分析错误
        if (orderResult.data?.message) {
          const errorMsg = orderResult.data.message;
          console.log(`   🔍 错误分析:`);
          
          if (errorMsg.includes('服务器内部错误')) {
            console.log(`   • 确认是服务器内部错误`);
          }
          if (errorMsg.includes('Unknown column')) {
            console.log(`   • 数据库字段问题: ${errorMsg}`);
          }
          if (errorMsg.includes('销售绑定')) {
            console.log(`   • 重复绑定问题: ${errorMsg}`);
          }
          if (errorMsg.includes('路径不存在')) {
            console.log(`   • API路径问题: ${errorMsg}`);
          }
          if (errorMsg.includes('Data too long')) {
            console.log(`   • 数据过长问题: ${errorMsg}`);
          }
        }
        
        // 如果第一个失败就停止
        if (i === 0) {
          console.log('\n   🚨 第一个销售就失败，进行更详细的诊断...');
          break;
        }
      }

      // 等待一下避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. 测试免费订单是否还能正常工作
    console.log('\n3. 🆓 测试免费订单（对比）...');
    const freeOrderData = {
      sales_code: activeSales[0].sales_code,
      link_code: activeSales[0].sales_code,
      tradingview_username: `freetest_${Date.now()}`,
      customer_wechat: `freewechat_${Date.now()}`,
      duration: '7days',
      amount: 0,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      effective_time: null
    };

    const freeResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      freeOrderData
    );

    console.log(`   免费订单结果: ${freeResult.status}`);
    if (freeResult.data?.success) {
      console.log('   ✅ 免费订单正常工作');
    } else {
      console.log('   ❌ 免费订单也失败');
      console.log(`   错误: ${freeResult.data?.message}`);
    }

    // 4. 检查最近的订单创建情况
    console.log('\n4. 📊 检查最近订单创建情况...');
    const recentOrdersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders&limit=10',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (recentOrdersResult.data?.success) {
      const orders = recentOrdersResult.data.data.orders;
      console.log('最近10个订单:');
      console.log('时间 | 订单ID | 用户名 | 金额 | 状态');
      console.log('-----|--------|--------|------|------');
      
      orders.forEach(order => {
        const time = new Date(order.created_at).toLocaleTimeString('zh-CN');
        const username = order.tradingview_username?.substring(0, 12) || 'N/A';
        const amount = order.amount || '0';
        const status = order.status || 'unknown';
        
        console.log(`${time} | ${order.id.toString().padEnd(6)} | ${username.padEnd(12)} | $${amount.toString().padEnd(4)} | ${status}`);
      });

      // 分析最近付费订单的时间
      const paidOrders = orders.filter(o => parseFloat(o.amount || 0) > 0);
      if (paidOrders.length > 0) {
        const latestPaidOrder = paidOrders[0];
        const timeDiff = Date.now() - new Date(latestPaidOrder.created_at).getTime();
        const minutesAgo = Math.floor(timeDiff / (1000 * 60));
        console.log(`\n   📈 最近的付费订单: ${minutesAgo} 分钟前创建`);
      } else {
        console.log('\n   📉 最近没有付费订单创建成功');
      }
    }

    // 5. 测试API健康状况
    console.log('\n5. 🩺 测试API健康状况...');
    const healthResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/health',
      'GET'
    );

    console.log(`   健康检查: ${healthResult.status}`);
    if (healthResult.data?.success) {
      console.log('   ✅ API服务正常');
    } else {
      console.log('   ❌ API服务异常');
    }

    console.log('\n🔍 问题排查总结:');
    console.log('请检查以下几点:');
    console.log('1. 具体的错误信息（上面显示的）');
    console.log('2. 是否所有销售都有问题');
    console.log('3. 免费订单是否正常');
    console.log('4. 最近成功的付费订单时间');
    console.log('5. 前端浏览器控制台的错误信息');

  } catch (error) {
    console.error('❌ 排查过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

debugPaidOrderIssueNow();