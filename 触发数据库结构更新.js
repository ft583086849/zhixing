const https = require('https');

async function updateDatabaseSchema() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      action: 'update_schema'
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
          console.log('🔧 数据库结构更新结果:');
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.error('❌ 解析响应失败:', error);
          console.log('原始响应:', responseData);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 数据库更新请求失败:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 触发数据库结构更新，添加sales_code字段...');
    await updateDatabaseSchema();
  } catch (error) {
    console.error('❌ 更新失败:', error);
  }
}

main();