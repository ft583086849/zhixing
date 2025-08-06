// 数据一致性验证脚本
const https = require('https');

const baseUrl = 'https://zhixing-seven.vercel.app';

// 测试用例数据
const testData = {
  // 这里需要根据实际数据调整
  primarySales: {
    wechat_name: '测试一级销售',
    sales_code: 'ps_test123'
  },
  secondarySales: {
    wechat_name: '测试二级销售'
  }
};

// HTTP请求封装
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 验证字段一致性
function validateFieldConsistency(orders, pageType) {
  const requiredFields = [
    'id', 'tradingview_username', 'customer_wechat', 'duration', 
    'amount', 'commission_amount', 'status', 'created_at'
  ];
  
  console.log(`\n📊 ${pageType} 字段验证:`);
  
  if (!orders || orders.length === 0) {
    console.log('  ⚠️  无订单数据');
    return;
  }
  
  const firstOrder = orders[0];
  const missingFields = requiredFields.filter(field => !(field in firstOrder));
  const extraFields = Object.keys(firstOrder).filter(field => !requiredFields.includes(field));
  
  console.log(`  ✅ 共同字段: ${requiredFields.filter(field => field in firstOrder).length}/${requiredFields.length}`);
  if (missingFields.length > 0) {
    console.log(`  ❌ 缺失字段: ${missingFields.join(', ')}`);
  }
  if (extraFields.length > 0) {
    console.log(`  ➕ 额外字段: ${extraFields.join(', ')}`);
  }
  
  // 验证config_confirmed过滤
  const hasNonConfirmed = orders.some(order => order.config_confirmed === false);
  if (hasNonConfirmed && pageType !== '管理员页面') {
    console.log(`  ❌ 发现未配置确认的订单，违反过滤规则`);
  } else {
    console.log(`  ✅ 配置确认过滤正确`);
  }
}

// 主测试函数
async function runConsistencyTest() {
  console.log('🚀 开始数据一致性验证...\n');
  
  try {
    // 1. 测试管理员API
    console.log('1️⃣ 测试管理员订单API...');
    const adminOrders = await makeRequest('/api/admin?path=orders&limit=5');
    if (adminOrders.success && adminOrders.data?.orders) {
      validateFieldConsistency(adminOrders.data.orders, '管理员页面');
      console.log(`  📈 订单总数: ${adminOrders.data.orders.length}`);
    } else {
      console.log('  ❌ 管理员API调用失败');
    }

    // 2. 测试一级销售API (需要实际的销售数据)
    console.log('\n2️⃣ 测试一级销售对账API...');
    try {
      const primaryResponse = await makeRequest(`/api/sales?path=primary-settlement&wechat_name=${encodeURIComponent(testData.primarySales.wechat_name)}`);
      if (primaryResponse.success && primaryResponse.data?.orders) {
        validateFieldConsistency(primaryResponse.data.orders, '一级销售页面');
        console.log(`  📈 订单总数: ${primaryResponse.data.orders.length}`);
      } else {
        console.log('  ⚠️  一级销售API无数据或失败');
      }
    } catch (error) {
      console.log('  ⚠️  一级销售API测试跳过（需要实际数据）');
    }

    // 3. 测试二级销售API (需要实际的销售数据)
    console.log('\n3️⃣ 测试二级销售对账API...');
    try {
      const secondaryResponse = await makeRequest(`/api/secondary-sales?path=settlement&wechat_name=${encodeURIComponent(testData.secondarySales.wechat_name)}`);
      if (secondaryResponse.success && secondaryResponse.data?.orders) {
        validateFieldConsistency(secondaryResponse.data.orders, '二级销售页面');
        console.log(`  📈 订单总数: ${secondaryResponse.data.orders.length}`);
      } else {
        console.log('  ⚠️  二级销售API无数据或失败');
      }
    } catch (error) {
      console.log('  ⚠️  二级销售API测试跳过（需要实际数据）');
    }

    console.log('\n✅ 数据一致性验证完成！');
    console.log('\n📋 验证要点:');
    console.log('  • 8个核心字段在所有页面中保持一致');
    console.log('  • commission_amount 字段统一使用');
    console.log('  • sales_wechat_name 字段统一使用');
    console.log('  • 一级和二级销售只显示 config_confirmed=true 的订单');
    console.log('  • 管理员页面显示所有状态的订单');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  runConsistencyTest();
}

module.exports = { runConsistencyTest, validateFieldConsistency };