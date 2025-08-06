const https = require('https');

async function checkDatabaseStructure() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      action: 'describe_tables'
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
        try {
          const result = JSON.parse(responseData);
          console.log('📊 线上数据库表结构验证结果:');
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.error('❌ 解析响应失败:', error);
          reject(error);
        }
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
    console.log('🔍 正在验证线上数据库确切结构...');
    await checkDatabaseStructure();
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

main();