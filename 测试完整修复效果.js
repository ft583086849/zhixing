const https = require('https');

async function test7DayOrder() {
  return new Promise((resolve, reject) => {
    const orderData = JSON.stringify({
      sales_code: 'SSMDYCKFXCPT48',
      tradingview_username: 'test_user_' + Date.now(),
      duration: '7days',
      amount: 0,
      purchase_type: 'immediate'
      // 7天免费不需要payment_method和payment_time
    });

    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/orders?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': orderData.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('🧪 7天免费订单测试:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          console.log('响应:', JSON.stringify(result, null, 2));
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 7天免费订单测试失败:', error);
      reject(error);
    });

    req.write(orderData);
    req.end();
  });
}

async function testPrimarySalesAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/primary-sales',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('\n🔍 一级销售API测试:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          console.log('数据结构检查:');
          if (result.success && result.data && result.data.length > 0) {
            const firstRecord = result.data[0];
            console.log('字段检查:');
            console.log(`  sales_code: ${firstRecord.sales_code || '❌ 缺失'}`);
            console.log(`  phone: ${firstRecord.phone || '❌ 缺失'}`);
            console.log(`  email: ${firstRecord.email || '❌ 缺失'}`);
            console.log(`  wechat_name: ${firstRecord.wechat_name || '❌ 缺失'}`);
          }
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 一级销售API测试失败:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 测试完整修复效果...');
    await testPrimarySalesAPI();
    await test7DayOrder();
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

main();