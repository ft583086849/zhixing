// 调试一级销售创建失败问题
const https = require('https');

console.log('🔍 调试一级销售创建失败问题...\n');

// 1. 测试数据库表结构
async function testDatabaseSchema() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: 'DESCRIBE primary_sales;'
    });

    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/health',
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
        resolve(JSON.parse(responseData));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// 2. 测试一级销售创建
async function testPrimarySalesCreation() {
  return new Promise((resolve, reject) => {
    const testData = {
      wechat_name: "调试测试用户" + Date.now(),
      payment_method: "alipay",
      payment_address: "debug@test.com",
      alipay_surname: "调试",
      chain_name: "调试渠道"
    };

    const data = JSON.stringify(testData);

    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/primary-sales?path=create',
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
          resolve({
            status: res.statusCode,
            data: result,
            testData: testData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            testData: testData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// 3. 运行测试
async function runDiagnostics() {
  console.log('1️⃣ 测试一级销售创建...');
  
  try {
    const createResult = await testPrimarySalesCreation();
    console.log('📊 创建测试结果:');
    console.log(`   状态码: ${createResult.status}`);
    console.log(`   响应: ${JSON.stringify(createResult.data, null, 2)}`);
    console.log(`   测试数据: ${JSON.stringify(createResult.testData, null, 2)}`);
    
    if (!createResult.data.success) {
      console.log('\n❌ 创建失败！需要检查以下可能原因:');
      console.log('   1. 数据库字段不匹配');
      console.log('   2. sales_code或secondary_registration_code生成问题');
      console.log('   3. 数据库连接问题');
      console.log('   4. commission_rate字段问题');
    } else {
      console.log('\n✅ 创建成功！');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 4. 检查可能的字段问题
console.log('🔧 可能的问题分析:');
console.log('   • sales_code字段是否存在于primary_sales表');
console.log('   • secondary_registration_code字段是否存在');
console.log('   • commission_rate字段默认值问题');
console.log('   • 唯一约束冲突');
console.log('   • UUID生成函数问题\n');

runDiagnostics();