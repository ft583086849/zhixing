const https = require('https');

async function testSimpleQuery() {
  return new Promise((resolve, reject) => {
    // 通过admin API执行一个简单的数据库查询
    const data = JSON.stringify({
      action: 'test_query',
      query: 'SELECT id, wechat_name, payment_method FROM primary_sales LIMIT 5'
    });

    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/admin?path=update-schema',
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
        console.log('🔍 简单查询测试:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          console.log('查询结果:', JSON.stringify(result, null, 2));
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    await testSimpleQuery();
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

main();