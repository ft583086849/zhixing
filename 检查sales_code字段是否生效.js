const https = require('https');

async function checkSalesCodeFields() {
  return new Promise((resolve, reject) => {
    // 尝试直接查询sales_code字段
    const data = JSON.stringify({
      action: 'test_sales_code_fields'
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
        console.log('🔍 检查sales_code字段结果:');
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

async function testCreatePrimarySales() {
  return new Promise((resolve, reject) => {
    // 测试创建一级销售，看看是否能生成sales_code
    const salesData = JSON.stringify({
      wechat_name: 'test_primary_' + Date.now(),
      payment_method: 'alipay'
    });

    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/primary-sales?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': salesData.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('\n🧪 创建一级销售测试:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          console.log('响应:', JSON.stringify(result, null, 2));
          
          if (result.success && result.data && result.data.sales_code) {
            console.log('✅ 成功生成sales_code:', result.data.sales_code);
            console.log('可以用这个sales_code测试订单创建');
          }
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve({ statusCode: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => {
      console.error('❌ 创建一级销售失败:', error);
      reject(error);
    });

    req.write(salesData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 检查sales_code字段是否已经添加到数据库...');
    console.log('问题分析: SSMDYCKFXCPT48找不到，可能是因为:');
    console.log('1. sales_code字段还没添加到数据库');
    console.log('2. 或者数据库中没有这个sales_code的记录');
    
    await checkSalesCodeFields();
    await testCreatePrimarySales();
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

main();