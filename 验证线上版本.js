const https = require('https');

async function checkOnlineVersion() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/admin?path=health',
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
        try {
          const result = JSON.parse(responseData);
          console.log('🌐 线上Vercel版本状态:');
          console.log(JSON.stringify(result, null, 2));
          
          // 检查是否包含版本信息
          if (result.version || result.commit || result.timestamp) {
            console.log('\n📍 版本信息:');
            console.log(`版本: ${result.version || '未知'}`);
            console.log(`提交: ${result.commit || '未知'}`);
            console.log(`时间: ${result.timestamp || '未知'}`);
          }
          
          resolve(result);
        } catch (error) {
          console.error('❌ 解析响应失败:', error);
          console.log('原始响应:', responseData);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      reject(error);
    });

    req.end();
  });
}

async function checkPrimarySalesAPI() {
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
        console.log('\n🔍 一级销售API状态检查:');
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
      console.error('❌ 一级销售API请求失败:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 验证线上Vercel版本是否真的回滚到d766b71...');
    await checkOnlineVersion();
    await checkPrimarySalesAPI();
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

main();