const https = require('https');

async function describeTable(tableName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      action: 'describe_table',
      table: tableName
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
          console.log(`\n📋 ${tableName}表结构:`);
          if (result.success && result.data) {
            result.data.forEach(field => {
              console.log(`  ${field.Field}: ${field.Type} ${field.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${field.Key ? `[${field.Key}]` : ''} ${field.Default !== null ? `DEFAULT:${field.Default}` : ''}`);
            });
          } else {
            console.log('  ❌ 获取失败:', result.message || '未知错误');
          }
          resolve(result);
        } catch (error) {
          console.error(`❌ 解析${tableName}表结构失败:`, error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ 请求${tableName}表结构失败:`, error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 获取数据库确切表结构...');
    
    // 获取关键表的结构
    await describeTable('primary_sales');
    await describeTable('secondary_sales'); 
    await describeTable('orders');
    await describeTable('sales'); // 也检查遗留的sales表
    
  } catch (error) {
    console.error('❌ 获取表结构失败:', error);
  }
}

main();