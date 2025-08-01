// 简单的测试：直接测试API调用，看看具体的错误信息
const https = require('https');

function makeRequest() {
  const data = JSON.stringify({
    tradingview_username: "test_user_simple",
    customer_wechat: "test_customer_simple", 
    link_code: "b7c61e589f354d32",
    amount: 100,
    duration: "7days",
    payment_method: "alipay",
    payment_time: "2025-08-01T18:00:00Z"
  });

  const options = {
    hostname: 'zhixing-seven.vercel.app',
    port: 443,
    path: '/api/orders?path=create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('响应状态:', res.statusCode);
      console.log('响应头:', res.headers);
      console.log('响应体:', responseData);
      
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log('JSON响应:', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('响应不是JSON格式');
      }
    });
  });

  req.on('error', (error) => {
    console.error('请求错误:', error);
  });

  req.write(data);
  req.end();
}

makeRequest(); 