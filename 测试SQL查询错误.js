const https = require('https');

async function testDatabaseQuery() {
  return new Promise((resolve, reject) => {
    // 直接通过admin API执行SQL查询来诊断问题
    const data = JSON.stringify({
      action: 'test_query',
      query: 'SELECT * FROM primary_sales LIMIT 1'
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
        console.log('🔍 数据库查询测试结果:');
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
      console.error('❌ 查询测试失败:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testPrimarySalesTable() {
  return new Promise((resolve, reject) => {
    // 测试primary_sales表的具体结构
    const data = JSON.stringify({
      action: 'describe_table_detailed',
      table: 'primary_sales'
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
        console.log('\n🔍 primary_sales表结构详情:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          console.log('表结构:', JSON.stringify(result, null, 2));
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 表结构查询失败:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 开始诊断primary_sales表的SQL查询问题...');
    await testDatabaseQuery();
    await testPrimarySalesTable();
  } catch (error) {
    console.error('❌ 诊断失败:', error);
  }
}

main();