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

async function debugLivePaidOrderIssue() {
  console.log('🔍 排查线上付费订单问题（早上7点后）\n');

  try {
    // 1. 检查当前部署版本和时间
    console.log('1. 检查当前部署版本和提交历史...');
    
    // 2. 登录管理员查看具体错误
    console.log('\n2. 登录管理员账户...');
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

    // 3. 检查今天早上7点后的订单情况
    console.log('\n3. 检查今天早上7点后的订单情况...');
    const ordersResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=orders&limit=20',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (ordersResult.data?.success) {
      const orders = ordersResult.data.data.orders;
      console.log(`获取到 ${orders.length} 个最近订单`);
      
      // 分析今天的订单
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        return orderDate === today;
      });

      console.log('\n📊 今天的订单分析:');
      console.log('时间 | 订单ID | 用户名 | 金额 | 状态 | 创建结果');
      console.log('-----|--------|--------|------|------|----------');
      
      todayOrders.forEach(order => {
        const time = new Date(order.created_at).toLocaleTimeString('zh-CN');
        const username = order.tradingview_username?.substring(0, 12) || 'N/A';
        const amount = order.amount || '0';
        const status = order.status || 'unknown';
        const isPaid = parseFloat(amount) > 0;
        
        console.log(`${time} | ${order.id.toString().padEnd(6)} | ${username.padEnd(12)} | $${amount.toString().padEnd(4)} | ${status.padEnd(8)} | ${isPaid ? '付费订单✅' : '免费订单'}`);
      });

      // 检查是否有7点后的付费订单
      const morningPaidOrders = todayOrders.filter(order => {
        const orderTime = new Date(order.created_at);
        const hour = orderTime.getHours();
        const amount = parseFloat(order.amount || 0);
        return hour >= 7 && amount > 0;
      });

      console.log(`\n🔍 早上7点后的付费订单数量: ${morningPaidOrders.length}`);
      if (morningPaidOrders.length === 0) {
        console.log('❌ 确认：早上7点后没有付费订单创建成功');
      }
    }

    // 4. 获取销售代码，测试具体的付费订单创建
    console.log('\n4. 获取当前有效的销售代码...');
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    const sales = salesResult.data.data.sales;
    console.log(`✅ 获取到 ${sales.length} 个销售`);
    
    // 选择一个活跃的销售进行测试
    const activeSales = sales.find(s => s.sales_code && s.wechat_name);
    console.log(`测试销售: ${activeSales.wechat_name} - ${activeSales.sales_code}`);

    // 5. 测试当前的付费订单创建（模拟用户操作）
    console.log('\n5. 🧪 测试当前线上付费订单创建...');
    
    const testOrderData = {
      sales_code: activeSales.sales_code,
      tradingview_username: `debug_paid_${Date.now()}`,
      customer_wechat: `debug_wechat_${Date.now()}`,
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '188',
      screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    console.log('   模拟用户提交付费订单...');
    const testResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      testOrderData
    );

    console.log(`   🔍 测试结果 - 状态码: ${testResult.status}`);
    console.log(`   响应数据: ${JSON.stringify(testResult.data, null, 2)}`);

    if (testResult.data?.success) {
      console.log('✅ 当前付费订单创建正常');
    } else {
      console.log('❌ 确认：当前付费订单创建失败');
      console.log(`   具体错误: ${testResult.data?.message || '未知错误'}`);
      
      // 详细分析错误
      if (testResult.data?.message) {
        console.log('\n🔍 错误分析:');
        const errorMsg = testResult.data.message;
        
        if (errorMsg.includes('服务器内部错误')) {
          console.log('• 确认是服务器内部错误');
        }
        if (errorMsg.includes('Unknown column')) {
          console.log('• 数据库字段问题');
        }
        if (errorMsg.includes('销售绑定')) {
          console.log('• 重复绑定检查问题');
        }
        if (errorMsg.includes('路径不存在')) {
          console.log('• API路径问题');
        }
      }
    }

    // 6. 测试销售代码查找
    console.log('\n6. 🔍 测试销售代码查找功能...');
    const salesLookupResult = await makeRequest(
      'zhixing-seven.vercel.app',
      `/api/sales/by-link?sales_code=${activeSales.sales_code}`,
      'GET'
    );

    console.log(`   销售查找状态: ${salesLookupResult.status}`);
    if (salesLookupResult.data?.success) {
      console.log('   ✅ 销售查找正常');
    } else {
      console.log('   ❌ 销售查找失败');
      console.log(`   错误: ${salesLookupResult.data?.message || '未知错误'}`);
    }

    // 7. 检查免费订单是否还能正常创建
    console.log('\n7. 🆓 测试免费订单创建...');
    const freeOrderData = {
      sales_code: activeSales.sales_code,
      tradingview_username: `debug_free_${Date.now()}`,
      customer_wechat: `debug_free_wechat_${Date.now()}`,
      duration: '7days',
      amount: 0,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate'
    };

    const freeTestResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      freeOrderData
    );

    console.log(`   免费订单状态: ${freeTestResult.status}`);
    if (freeTestResult.data?.success) {
      console.log('   ✅ 免费订单创建正常');
    } else {
      console.log('   ❌ 免费订单也失败');
      console.log(`   错误: ${freeTestResult.data?.message}`);
    }

    // 8. 检查最近的Git提交（从命令行获取）
    console.log('\n8. 📋 问题总结和建议:');
    console.log('🔍 发现的问题:');
    console.log('• 早上7点后付费订单无法创建');
    console.log('• 可能与最近的代码部署有关');
    
    console.log('\n💡 需要检查的项目:');
    console.log('1. 最近的Git提交记录');
    console.log('2. Vercel部署日志');
    console.log('3. 数据库表结构变化');
    console.log('4. API路径或参数变化');
    console.log('5. 环境变量配置');

    console.log('\n🔧 建议的解决步骤:');
    console.log('1. 检查最近的提交，找到7点左右的部署');
    console.log('2. 回滚到上一个稳定版本');
    console.log('3. 逐个测试修复的功能');
    console.log('4. 重新部署并验证');

  } catch (error) {
    console.error('❌ 排查过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

debugLivePaidOrderIssue();