const https = require('https');

async function createSpecificSalesRecord() {
  return new Promise((resolve, reject) => {
    // 通过admin API创建特定的销售记录
    const data = JSON.stringify({
      action: 'create_sales_record',
      sales_code: 'SSMDYCKFXCPT48',
      wechat_name: 'test_primary_' + Date.now(),
      payment_method: 'alipay',
      payment_address: 'test_address_12345',
      sales_type: 'primary'
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
        console.log('🧪 创建SSMDYCKFXCPT48销售记录结果:');
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
      console.error('❌ 创建销售记录失败:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function directSQLInsert() {
  console.log('🔧 方案：直接通过SQL插入SSMDYCKFXCPT48记录');
  console.log('由于CREATE API还有问题，我们可以：');
  console.log('1. 使用现有的ps_1格式来测试功能');
  console.log('2. 或者等primary_sales CREATE API修复后再创建');
  console.log('3. 或者修改测试链接使用ps_格式');
  
  console.log('\n🧪 测试方案：使用ps_格式的sales_code');
  console.log('让我们创建一个以ps_开头的测试链接...');
  
  // 测试ps_2格式的订单
  await testOrderWithPsFormat();
}

async function testOrderWithPsFormat() {
  return new Promise((resolve, reject) => {
    const orderData = JSON.stringify({
      sales_code: 'ps_2', // 使用ps_格式，通过ID查找
      tradingview_username: 'test_user_ps2_' + Date.now(),
      duration: '1month',
      amount: 99,
      payment_method: 'alipay',
      payment_time: new Date().toISOString(),
      purchase_type: 'immediate'
    });

    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/orders?path=create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': orderData.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('\n📊 ps_2格式测试结果:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          if (result.success) {
            console.log('✅ ps_2订单创建成功！');
            console.log('说明问题不是orders.js逻辑，而是缺少SSMDYCKFXCPT48记录');
          } else {
            console.log('❌ 失败:', result.message);
          }
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ ps_2测试失败:', error);
      resolve();
    });

    req.write(orderData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🎯 目标：解决SSMDYCKFXCPT48显示"下单拥挤"的问题');
    console.log('问题确认：sales_code字段已存在，但没有对应的记录');
    
    await directSQLInsert();
    
    console.log('\n💡 临时解决方案：');
    console.log('1. 使用ps_1, ps_2等格式的销售链接（通过ID查找）');
    console.log('2. 等primary_sales CREATE API修复后，创建正确的sales_code记录');
    console.log('3. 或者在数据库中手动插入SSMDYCKFXCPT48记录');
    
  } catch (error) {
    console.error('❌ 处理失败:', error);
  }
}

main();