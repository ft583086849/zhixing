const https = require('https');

async function diagnose500Error() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/primary-sales',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('🔍 500错误详细信息:');
        console.log(`状态码: ${res.statusCode}`);
        console.log(`响应: ${responseData}`);
        
        // 尝试解析JSON
        try {
          const result = JSON.parse(responseData);
          console.log('解析后的错误:', JSON.stringify(result, null, 2));
        } catch (error) {
          console.log('无法解析JSON，原始响应:', responseData);
        }
        
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    await diagnose500Error();
  } catch (error) {
    console.error('❌ 诊断失败:', error);
  }
}

main();