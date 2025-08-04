const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Order'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testOrder() {
  console.log('🧪 测试订单创建 (修复status字段后)...');
  
  // 使用最近创建的销售代码
  const salesCode = '40ba106fc9944ad4';
  
  const orderData = {
    sales_code: salesCode,
    tradingview_username: 'test_fixed_status',
    customer_wechat: 'test_wechat_fixed',
    duration: '1month',
    amount: 188,
    payment_method: 'alipay',
    payment_time: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
    purchase_type: 'immediate'
  };
  
  console.log('📋 订单数据:', orderData);
  
  try {
    const result = await makeRequest('https://zhixing-seven.vercel.app/api/orders?path=create', orderData);
    console.log('✅ 状态码:', result.status);
    console.log('📊 响应:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success) {
      console.log('🎉 订单创建成功！status字段问题已解决！');
      return true;
    } else {
      console.log('❌ 订单创建仍失败:', result.data.message);
      return false;
    }
  } catch (error) {
    console.log('💥 请求失败:', error.message);
    return false;
  }
}

testOrder().then(success => {
  if (success) {
    console.log('\n🔧 现在可以成功创建测试数据了！');
  } else {
    console.log('\n❌ 还需要进一步诊断问题。');
  }
});