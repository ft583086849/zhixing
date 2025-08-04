// 通过API测试数据库表结构
const https = require('https');

function testDatabaseStructure() {
  return new Promise((resolve) => {
    console.log('🔍 通过API检查数据库表结构...');
    
    const postData = JSON.stringify({
      action: 'check_schema'
    });
    
    const req = https.request({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Client'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 状态码: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log(`📦 API响应: ${JSON.stringify(response, null, 2)}`);
          
          if (res.statusCode === 200) {
            console.log('✅ API连接正常，数据库应该是可用的');
          } else {
            console.log('❌ API连接异常');
          }
        } catch (error) {
          console.log(`📦 响应解析错误: ${error.message}`);
          console.log(`原始响应: ${data}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ 请求错误: ${error.message}`);
      resolve();
    });
    
    req.setTimeout(10000, () => {
      console.log(`❌ 请求超时`);
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

// 测试一级销售创建，看具体错误
function testPrimarySalesCreation() {
  return new Promise((resolve) => {
    console.log('\n🧪 测试一级销售创建，查看具体错误...');
    
    const testData = {
      wechat_name: 'test_user_' + Date.now(),
      payment_method: 'alipay',
      payment_address: 'test@example.com',
      alipay_surname: '测试用户'
    };
    
    const postData = JSON.stringify(testData);
    
    const req = https.request({
      hostname: 'zhixing-seven.vercel.app',
      path: '/api/primary-sales?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Node.js Test Client'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 状态码: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log(`📦 响应: ${JSON.stringify(response, null, 2)}`);
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
    
    req.setTimeout(15000, () => {
      console.log(`❌ 请求超时`);
      req.destroy();
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  await testDatabaseStructure();
  await testPrimarySalesCreation();
  console.log('\n✅ 测试完成');
}

runTests().catch(console.error);