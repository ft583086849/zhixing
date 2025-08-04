const https = require('https');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Primary-Sales-API'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('🔍 原始响应数据:', responseData);
        try {
          const parsed = JSON.parse(responseData);
          console.log('📋 解析后的JSON:', JSON.stringify(parsed, null, 2));
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          console.log('❌ JSON解析失败:', e.message);
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

async function debugPrimarySalesAPI() {
  console.log('🔍 调试一级销售API');
  
  const testData = {
    wechat_name: `调试测试_${Date.now()}`,
    payment_method: 'alipay',
    payment_address: 'debug@example.com',
    alipay_surname: '调'
  };

  console.log('📤 发送数据:', JSON.stringify(testData, null, 2));

  try {
    const result = await makeRequest('https://zhixing-seven.vercel.app/api/primary-sales?path=create', testData);
    
    console.log('📥 响应状态码:', result.status);
    console.log('📥 响应数据类型:', typeof result.data);
    
    if (result.data && typeof result.data === 'object') {
      console.log('🎯 关键字段检查:');
      console.log('  - success:', result.data.success);
      console.log('  - message:', result.data.message);
      console.log('  - data:', result.data.data ? 'exists' : 'missing');
      
      if (result.data.data) {
        console.log('  - secondary_registration_code:', result.data.data.secondary_registration_code);
        console.log('  - user_sales_code:', result.data.data.user_sales_code);
        console.log('  - sales_code:', result.data.data.sales_code);
        console.log('  - secondary_registration_link:', result.data.data.secondary_registration_link);
        console.log('  - user_sales_link:', result.data.data.user_sales_link);
      }
    }
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
}

debugPrimarySalesAPI();