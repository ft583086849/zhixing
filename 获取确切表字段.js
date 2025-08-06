const https = require('https');

async function getTableFields() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      action: 'show_table_structure'
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
          console.log('📋 线上确切表字段结构:');
          
          // 重点检查primary_sales和secondary_sales表
          if (result.success && result.data) {
            console.log('\n🔍 primary_sales表字段:');
            if (result.data.primary_sales) {
              result.data.primary_sales.forEach(field => {
                console.log(`  - ${field.Field}: ${field.Type} ${field.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${field.Key ? `KEY:${field.Key}` : ''}`);
              });
            }
            
            console.log('\n🔍 secondary_sales表字段:');
            if (result.data.secondary_sales) {
              result.data.secondary_sales.forEach(field => {
                console.log(`  - ${field.Field}: ${field.Type} ${field.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${field.Key ? `KEY:${field.Key}` : ''}`);
              });
            }

            console.log('\n🔍 orders表字段:');
            if (result.data.orders) {
              result.data.orders.forEach(field => {
                console.log(`  - ${field.Field}: ${field.Type} ${field.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${field.Key ? `KEY:${field.Key}` : ''}`);
              });
            }
          }
          
          console.log('\n📄 完整响应:');
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
    console.log('🔍 正在获取线上数据库确切字段结构...');
    await getTableFields();
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

main();