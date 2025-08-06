const https = require('https');

async function testSalesCodeLookup() {
  console.log('🔍 测试sales_code查找问题...');
  
  console.log('\n📋 问题分析:');
  console.log('1. SSMDYCKFXCPT48 不以ps_或ss_开头');
  console.log('2. orders.js使用 WHERE sales_code = ? 查找');
  console.log('3. 但primary_sales/secondary_sales表缺少sales_code字段');
  console.log('4. 查询失败 → 返回"下单拥挤，请等待"');
  
  console.log('\n🧪 测试不同格式的sales_code:');
  
  // 测试1: ps_开头的代码（使用ID查找）
  await testOrderCreate('ps_1', '应该成功 - 使用ID查找');
  
  // 测试2: 不规范格式的代码（使用sales_code字段查找）
  await testOrderCreate('SSMDYCKFXCPT48', '失败 - sales_code字段不存在');
  
  console.log('\n💡 解决方案:');
  console.log('1. 确保ALTER TABLE添加sales_code字段到primary_sales和secondary_sales表');
  console.log('2. 或者在数据库中插入SSMDYCKFXCPT48对应的销售记录');
  console.log('3. 或者修改orders.js的查找逻辑，使用其他字段匹配');
}

async function testOrderCreate(sales_code, description) {
  return new Promise((resolve, reject) => {
    const orderData = JSON.stringify({
      sales_code: sales_code,
      tradingview_username: 'test_user_' + Date.now(),
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
        try {
          const result = JSON.parse(responseData);
          console.log(`\n📊 ${sales_code} (${description}):`);
          console.log(`状态码: ${res.statusCode}`);
          
          if (result.success) {
            console.log('✅ 订单创建成功');
          } else {
            console.log('❌ 失败:', result.message);
            if (result.message.includes('下单拥挤')) {
              console.log('   → 确认: sales_code查找失败');
            }
          }
        } catch (error) {
          console.log('原始响应:', responseData);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      resolve();
    });

    req.write(orderData);
    req.end();
  });
}

testSalesCodeLookup();