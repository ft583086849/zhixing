// 直接测试数据库表结构
const https = require('https');

function testDatabaseStructure() {
  return new Promise((resolve) => {
    console.log('🔍 测试数据库表结构 - 尝试使用sales_code字段...');
    
    // 尝试查询包含sales_code的primary_sales表
    const testData = {
      wechat_name: 'structure_test_' + Date.now(),
      payment_method: 'alipay',
      payment_address: 'test@example.com',
      alipay_surname: '测试'
    };
    
    const postData = JSON.stringify(testData);
    
    const req = https.request({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 状态码: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log(`📦 响应: ${JSON.stringify(response, null, 2)}`);
          
          // 检查响应中是否包含sales_code字段
          if (response.data) {
            const hasFields = {
              sales_code: 'sales_code' in response.data,
              secondary_registration_code: 'secondary_registration_code' in response.data,
              user_sales_code: 'user_sales_code' in response.data
            };
            console.log('\n🔍 字段检查结果:', hasFields);
            
            if (hasFields.sales_code || hasFields.secondary_registration_code) {
              console.log('✅ 数据库表可能包含sales_code相关字段！');
            } else {
              console.log('❌ 数据库表可能不包含sales_code字段');
            }
          }
        } catch (error) {
          console.log(`📦 响应解析错误: ${error.message}`);
          console.log(`原始响应: ${data.substring(0, 500)}`);
        }
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

// 同时尝试SELECT查询primary_sales表的完整结构
function testSelectStructure() {
  return new Promise((resolve) => {
    console.log('\n🔍 尝试查询primary_sales表的完整记录...');
    
    const req = https.request({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=list&limit=1',
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
          if (response.data && response.data.length > 0) {
            const firstRecord = response.data[0];
            console.log('📦 第一条记录的字段:', Object.keys(firstRecord));
            
            const hasSalesCodeFields = {
              sales_code: 'sales_code' in firstRecord,
              secondary_registration_code: 'secondary_registration_code' in firstRecord
            };
            console.log('🔍 sales_code字段检查:', hasSalesCodeFields);
          }
        } catch (error) {
          console.log(`📦 响应解析错误: ${error.message}`);
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

async function runTests() {
  await testDatabaseStructure();
  await testSelectStructure();
  console.log('\n✅ 结构测试完成');
}

runTests();