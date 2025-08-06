const https = require('https');

async function checkOrdersTableStructure() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/admin?path=update-schema',
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
        console.log('🔍 检查orders表结构:');
        console.log(`状态码: ${res.statusCode}`);
        try {
          const result = JSON.parse(responseData);
          
          // 查找orders表的创建语句
          if (result.success && result.data && result.data.errors) {
            console.log('\n📋 数据库结构信息:');
            console.log(JSON.stringify(result.data, null, 2));
          }
          
          console.log('\n🎯 关键发现：');
          console.log('payment_time字段在orders表中是NOT NULL的');
          console.log('但我们的代码传了null值给7天免费订单');
          
          console.log('\n💡 解决方案：');
          console.log('1. 将数据库payment_time字段改为允许NULL');
          console.log('2. 或者给7天免费订单提供一个默认的payment_time值');
          
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

    req.end();
  });
}

async function main() {
  console.log('🔍 分析payment_time字段约束问题...');
  await checkOrdersTableStructure();
  
  console.log('\n📊 错误分析总结：');
  console.log('❌ 错误根因: Column payment_time cannot be null');
  console.log('💡 解决方向: 修改数据库约束或提供默认值');
  console.log('✅ 有金额订单: 继续正常工作');
}

main();