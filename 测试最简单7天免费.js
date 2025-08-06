const https = require('https');

async function testSimplest7Day() {
  return new Promise((resolve, reject) => {
    // 最简单的7天免费订单
    const orderData = JSON.stringify({
      sales_code: 'ps_2',
      tradingview_username: 'simple_free_' + Date.now(),
      duration: '7days',
      amount: 0
      // 只传最必要的字段
    });

    console.log('📤 发送的数据:', orderData);

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
        console.log('\n📥 最简单7天免费订单结果:');
        console.log(`状态码: ${res.statusCode}`);
        console.log('原始响应:', responseData);
        
        if (responseData.includes('Invalid time value')) {
          console.log('\n🔍 还是时间错误！可能的原因:');
          console.log('1. effective_time处理有问题');
          console.log('2. 或者还有其他地方在处理undefined的时间');
          console.log('3. 或者我的修改还没部署生效');
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
  console.log('🧪 测试最简单的7天免费订单...');
  console.log('目标: 排除所有非必要字段，找出Invalid time value的确切原因');
  
  await testSimplest7Day();
}

main();