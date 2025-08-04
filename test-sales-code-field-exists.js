// 测试数据库表是否真的有sales_code字段
const https = require('https');

function testSalesCodeField() {
  return new Promise((resolve) => {
    console.log('🔍 测试: 尝试直接查询sales_code字段...');
    
    // 创建一个测试数据，然后尝试查询它的sales_code
    const testData = {
      wechat_name: 'field_test_' + Date.now(),
      payment_method: 'alipay', 
      payment_address: 'test@example.com',
      alipay_surname: '字段测试'
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
        try {
          const response = JSON.parse(data);
          console.log(`📊 创建状态码: ${res.statusCode}`);
          
          if (response.success && response.data) {
            const createdId = response.data.primary_sales_id;
            const returnedSalesCode = response.data.sales_code;
            console.log(`✅ 创建成功，ID: ${createdId}, 返回的sales_code: ${returnedSalesCode}`);
            
            // 现在尝试通过一个特殊的查询验证这个sales_code是否真的存储在数据库中
            console.log('📍 如果数据库真的有sales_code字段，那么我的"临时兼容版本"是错误的');
            console.log('📍 如果数据库没有sales_code字段，那么返回的sales_code只是API层生成的虚拟数据');
            
          } else {
            console.log(`❌ 创建失败: ${JSON.stringify(response)}`);
          }
          
        } catch (error) {
          console.log(`❌ 响应解析错误: ${error.message}`);
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

// 基于发现的secondary_sales表，测试它是否有sales_code字段
function testSecondarySalesTable() {
  return new Promise((resolve) => {
    console.log('\n🔍 测试: secondary_sales表是否有sales_code字段...');
    
    // 既然settlement查询中有secondary_sales表，说明这个表存在
    // 我需要检查这个表的结构
    console.log('📍 从API代码中发现secondary_sales表确实存在');
    console.log('📍 这意味着数据库可能已经有完整的sales_code结构');
    console.log('📍 我的"临时兼容版本"可能是完全错误的方向');
    
    resolve();
  });
}

async function runFieldTests() {
  await testSalesCodeField();
  await testSecondarySalesTable();
  
  console.log('\n🎯 结论分析:');
  console.log('1. 如果数据库真的有sales_code字段，我应该立即修复API使用正确的字段');
  console.log('2. 如果数据库没有sales_code字段，那需要先添加字段再修复API');
  console.log('3. 当前的"临时兼容版本"可能是错误的解决方案');
}

runFieldTests();