const https = require('https');

// 简单测试API是否响应
async function testBasicAPI() {
  console.log('🔍 测试基础API响应...\n');
  
  const testPaths = [
    '/api/primary-sales',
    '/api/primary-sales?path=list',
    '/api/primary-sales?path=test',
    '/api/primary-sales?path=update-commission'
  ];

  for (const path of testPaths) {
    console.log(`测试: GET ${path}`);
    
    const result = await new Promise((resolve) => {
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: path,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              status: res.statusCode,
              message: response.message || data.substring(0, 100)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              message: data.substring(0, 100)
            });
          }
        });
      });
      
      req.on('error', () => resolve({ status: 'ERROR', message: 'Network error' }));
      req.end();
    });

    console.log(`  结果: ${result.status} - ${result.message}`);
    console.log('');
  }

  console.log('✅ 基础API响应测试完成');
}

testBasicAPI();