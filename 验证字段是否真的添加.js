const https = require('https');

async function checkFieldsExist() {
  return new Promise((resolve, reject) => {
    // 创建一个专门测试字段存在性的API调用
    const data = JSON.stringify({
      action: 'check_fields_exist'
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
        console.log('🔍 检查字段存在性结果:');
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
      console.error('❌ 检查字段失败:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function testSimpleQuery() {
  return new Promise((resolve, reject) => {
    // 测试最基础的primary_sales查询
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
        console.log('\n🧪 primary_sales API当前状态:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          
          if (result.error_details) {
            console.log('详细错误:', result.error_details.message);
            
            if (result.error_details.message.includes('Unknown column')) {
              console.log('\n❌ 确认: 字段还没有添加到数据库');
              console.log('需要：手动执行ALTER TABLE或使用不同的方法添加字段');
            }
          } else if (result.success) {
            console.log('✅ API正常工作');
            console.log('字段可能已经添加成功');
          }
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ API测试失败:', error);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 验证数据库字段是否真的添加了...');
    console.log('当前状况: ALTER TABLE语句已添加到admin.js，但可能没有执行');
    
    await checkFieldsExist();
    await testSimpleQuery();
    
    console.log('\n📋 下一步方案:');
    console.log('1. 如果字段没添加：需要重新触发ALTER TABLE');
    console.log('2. 如果权限问题：可能需要手动在PlanetScale执行');
    console.log('3. 临时方案：修改primary_sales.js只使用基础字段');
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

main();