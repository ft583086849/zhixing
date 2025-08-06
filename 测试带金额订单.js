const https = require('https');

async function testPaidOrder() {
  return new Promise((resolve, reject) => {
    // 测试一个带金额的订单
    const orderData = JSON.stringify({
      sales_code: 'SSMDYCKFXCPT48',
      tradingview_username: 'test_paid_user_' + Date.now(),
      duration: '1month',
      amount: 99,
      payment_method: 'alipay',
      payment_time: new Date().toISOString(),
      purchase_type: 'immediate'
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
        console.log('🧪 带金额订单测试结果:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          console.log('响应:', JSON.stringify(result, null, 2));
          
          if (result.message && result.message.includes('下单拥挤')) {
            console.log('\n❌ 问题确认：带金额订单也显示"下单拥挤"');
            console.log('这说明sales_code查找失败，无法找到对应的销售记录');
          }
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 带金额订单测试失败:', error);
      reject(error);
    });

    req.write(orderData);
    req.end();
  });
}

async function testDifferentSalesCode() {
  return new Promise((resolve, reject) => {
    // 尝试一个可能存在的sales_code
    const orderData = JSON.stringify({
      sales_code: 'ps_1', // 测试简单的sales_code
      tradingview_username: 'test_simple_' + Date.now(),
      duration: '1month',
      amount: 99,
      payment_method: 'alipay',
      payment_time: new Date().toISOString(),
      purchase_type: 'immediate'
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
        console.log('\n🧪 简单sales_code测试结果:');
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
      console.error('❌ 简单sales_code测试失败:', error);
      reject(error);
    });

    req.write(orderData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 分析为什么带金额订单显示"下单拥挤"...');
    console.log('原因推测: sales_code查找失败 → 找不到销售记录 → 返回"下单拥挤"');
    
    await testPaidOrder();
    await testDifferentSalesCode();
    
    console.log('\n📋 问题分析总结:');
    console.log('1. 如果都显示"下单拥挤"，说明orders.js无法找到对应的sales_code');
    console.log('2. 这与primary_sales表缺少sales_code字段的问题一致');
    console.log('3. 需要确保数据库中存在有效的sales_code数据');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

main();