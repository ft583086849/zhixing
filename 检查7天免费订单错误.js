const https = require('https');

async function test7DayFreeWithDetails() {
  return new Promise((resolve, reject) => {
    // 测试7天免费订单的详细错误
    const orderData = JSON.stringify({
      sales_code: 'ps_2',
      tradingview_username: 'free_debug_' + Date.now(),
      duration: '7days',
      amount: 0,
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
        console.log('🔍 7天免费订单详细错误分析:');
        console.log(`状态码: ${res.statusCode}`);
        console.log('原始响应:', responseData);
        
        try {
          const result = JSON.parse(responseData);
          console.log('解析后的响应:', JSON.stringify(result, null, 2));
        } catch (error) {
          console.log('无法解析JSON响应');
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      resolve();
    });

    req.write(orderData);
    req.end();
  });
}

async function main() {
  console.log('🔍 分析7天免费订单的500错误...');
  await test7DayFreeWithDetails();
  
  console.log('\n📊 当前状况总结:');
  console.log('✅ 有金额订单: 完全正常 (129元订单成功创建)');
  console.log('❌ 7天免费订单: 500错误，需要进一步修复');
  console.log('✅ sales_code查找: 正常工作');
  console.log('✅ 佣金计算: 正常工作 (40%佣金率)');
}

main();