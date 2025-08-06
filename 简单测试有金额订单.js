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

async function testPaidOrder() {
  console.log('💰 简单测试有金额订单创建\n');

  try {
    // 使用已知的销售代码进行测试
    const testOrderData = {
      sales_code: 'prim001', // 使用一个可能存在的销售代码
      tradingview_username: `paid_test_${Date.now()}`,
      customer_wechat: 'paid_test_wechat',
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      purchase_type: 'immediate',
      alipay_amount: '1340.2',
      screenshot_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    console.log('📝 测试数据:');
    console.log(`   销售代码: ${testOrderData.sales_code}`);
    console.log(`   用户名: ${testOrderData.tradingview_username}`);
    console.log(`   金额: $${testOrderData.amount}`);
    console.log(`   支付方式: ${testOrderData.payment_method}`);

    console.log('\n🚀 发送订单创建请求...');
    const startTime = Date.now();
    
    const result = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      testOrderData
    );
    
    const responseTime = Date.now() - startTime;

    console.log(`\n📊 测试结果:`);
    console.log(`   状态码: ${result.status}`);
    console.log(`   响应时间: ${responseTime}ms`);
    console.log(`   Vercel函数ID: ${result.headers['x-vercel-id'] || '未知'}`);

    if (result.data?.success) {
      console.log(`   ✅ 订单创建成功！`);
      console.log(`   订单ID: ${result.data.data?.order_id}`);
      console.log(`   生效时间: ${result.data.data?.effective_time}`);
      console.log(`   过期时间: ${result.data.data?.expiry_time}`);
      console.log(`   佣金金额: $${result.data.data?.commission_amount}`);
      console.log(`   包含截图: ${result.data.data?.has_screenshot ? '是' : '否'}`);
      
      console.log('\n🎉 修复成功！有金额订单可以正常创建了！');
    } else {
      console.log(`   ❌ 订单创建失败:`);
      console.log(`   错误信息: ${result.data?.message || '未知错误'}`);
      
      if (result.data?.error) {
        console.log(`   详细错误: ${result.data.error}`);
      }
      
      console.log(`   完整响应: ${JSON.stringify(result.data)}`);
      
      // 分析可能的原因
      if (result.status === 500) {
        console.log('\n🔍 500错误分析:');
        console.log('   可能原因1: 销售代码不存在 (sales_code: prim001)');
        console.log('   可能原因2: 数据库连接仍有问题');
        console.log('   可能原因3: 字段验证失败');
      }
    }

    // 再尝试一个不同的销售代码
    console.log('\n🔄 尝试不同的销售代码...');
    
    const altOrderData = {
      ...testOrderData,
      sales_code: 'sec001', // 尝试二级销售代码
      tradingview_username: `paid_test_alt_${Date.now()}`
    };

    const altResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/orders?path=create',
      'POST',
      altOrderData
    );

    console.log(`   备选测试: ${altResult.status} ${altResult.data?.success ? '✅' : '❌'}`);
    if (altResult.data?.message) {
      console.log(`   消息: ${altResult.data.message}`);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

testPaidOrder();