// 简单测试API调用和JSON解析
const https = require('https');

console.log('🔍 测试API调用和JSON解析...\n');

// 简化测试数据
const testData = {
  wechat_name: "简单测试" + Date.now(),
  payment_method: "alipay",
  payment_address: "test@test.com",
  alipay_surname: "测试",
  chain_name: "测试链"
};

console.log('📤 发送数据:', JSON.stringify(testData, null, 2));

const postData = JSON.stringify(testData);

const options = {
  hostname: 'zhixing-seven.vercel.app',
  port: 443,
  path: '/api/primary-sales?path=create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`📥 响应状态: ${res.statusCode}`);
  console.log(`📥 响应头:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 原始响应数据:', data);
    
    try {
      const jsonResponse = JSON.parse(data);
      console.log('📥 解析后的JSON:', JSON.stringify(jsonResponse, null, 2));
    } catch (error) {
      console.log('❌ JSON解析失败:', error.message);
      console.log('📥 响应不是有效的JSON格式');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求错误:', error);
});

console.log('📤 发送请求...');
req.write(postData);
req.end();