// 检查数据库是否支持sales_code标准
const https = require('https');

function testDatabaseSchema() {
  return new Promise((resolve) => {
    console.log('🔍 检查数据库表结构...');
    
    const testData = {
      query: 'DESCRIBE primary_sales'
    };
    
    const postData = JSON.stringify(testData);
    
    const req = https.request({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/admin?path=debug',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer test'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 状态码: ${res.statusCode}`);
        console.log(`📦 响应: ${data.substring(0, 800)}`);
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 请求错误: ${error.message}`);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

// 检查primary_sales表是否有sales_code字段
function checkPrimarySalesFields() {
  return new Promise((resolve) => {
    console.log('\n🔍 检查primary_sales表字段...');
    
    const req = https.request({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=list',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 状态码: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log(`📦 primary_sales数据: ${JSON.stringify(response, null, 2)}`);
          
          if (response.data && response.data.length > 0) {
            const firstRecord = response.data[0];
            const hasFields = {
              sales_code: 'sales_code' in firstRecord,
              secondary_registration_code: 'secondary_registration_code' in firstRecord
            };
            console.log('字段检查:', hasFields);
          }
        } catch (error) {
          console.log(`📦 响应: ${data.substring(0, 500)}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 请求错误: ${error.message}`);
      resolve();
    });
    
    req.end();
  });
}

async function runChecks() {
  await testDatabaseSchema();
  await checkPrimarySalesFields();
  console.log('\n✅ 检查完成');
}

runChecks();