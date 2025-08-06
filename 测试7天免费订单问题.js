const https = require('https');

async function test7DayFreeOrder() {
  return new Promise((resolve, reject) => {
    // 模拟7天免费订单提交
    const orderData = JSON.stringify({
      sales_code: 'SSMDYCKFXCPT48', // 测试sales_code  
      duration: '7days',
      purchase_type: 'immediate',
      payment_method: null, // 7天免费不需要payment_method
      path: 'create'
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
        console.log('🧪 7天免费订单测试结果:');
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

async function testPurchasePage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/purchase?sales_code=SSMDYCKFXCPT48',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('\n🌐 购买页面状态:');
        console.log(`状态码: ${res.statusCode}`);
        console.log(`页面大小: ${responseData.length} 字符`);
        
        // 检查是否包含关键元素
        if (responseData.includes('提交订单')) {
          console.log('✅ 发现"提交订单"按钮');
        } else {
          console.log('❌ 未发现"提交订单"按钮');
        }
        
        if (responseData.includes('7天免费')) {
          console.log('✅ 发现"7天免费"选项');
        } else {
          console.log('❌ 未发现"7天免费"选项');
        }
        
        resolve({ statusCode: res.statusCode, size: responseData.length });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 购买页面测试失败:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 测试d766b71版本的7天免费订单功能...');
    await testPurchasePage();
    await test7DayFreeOrder();
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

main();